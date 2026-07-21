# Technical Scoping: Stratégie de logging (interface abstraite + Sentry)

## Metadata
- **Date**: 2026-07-17
- **Status**: Accepted
- **Owner**: Brandone
- **Related**: `docs/technical/2026-07-09-lint-format-tooling.md`, mémoire projet `long-running-generation-background.md`, `e2e-tests-use-env-test.md`

## Problem Statement

Le logging actuel est ad hoc et non industrialisable :

- **135 appels `console.*`** dispersés dans le code (services, handlers, repositories, routes API, factories, scripts). Aucune stratégie, aucun niveau de log cohérent.
- **Aucune abstraction ni injection** : le code dépend directement de `console`. Conséquence directe — les logs polluent la sortie des tests automatisés (E2E Playwright), et il est impossible de basculer de backend de log sans toucher tout le code.
- **Pas de format structuré** : les logs mélangent messages texte, emojis et corrélation manuelle (`[${story.id}]`). Ils ne sont pas requêtables.
- **Aucune visibilité en production** : sur Vercel, les `console.*` finissent dans les logs éphémères de la plateforme, sans exploration, sans alerting, sans rétention.

Ce qui se passe si on ne fait rien : les incidents de génération (le cœur métier, cf. `StoryGeneratorService`) restent indébogables en production, et la dette de couplage à `console` grandit avec chaque nouvelle route.

## Context & Constraints

- **Stack** : Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, architecture DDD (`domain` / `application` / `infrastructure`), Kysely + Postgres, Biome.
- **Hébergement** : **Vercel**, runtime **Node serverless** (pas Edge). Contrainte forte exprimée : *la solution doit rester facile à changer de plateforme*.
- **Wiring** : pas de conteneur DI. L'instanciation est manuelle dans chaque route handler (ex. `new StoryGeneratorService(...)`). Il existe déjà un modèle de port + factory + singleton : `Storage` / `storage-factory.ts` / `getStorage()`.
- **Tests** : Playwright E2E lance un vrai serveur Next (`.env.test`, `NEXT_DIST_DIR=.next.test`). Les logs doivent y être silencieux.
- **Contrainte métier clé** : les générations (`StoryGeneratorService.generate`, `StoryImagesGeneratorService`) tournent en **tâche de fond fire-and-forget** (réponse 202 immédiate + polling, cf. mémoire projet). Sur Vercel serverless, cela impacte le *flush* des logs (voir Risques).
- **Convention projet** : pas de commentaires dans le code ; noms explicites et extraction de fonctions (CLAUDE.md).

## Methodology & Inspiration

- **Ports & Adapters / Hexagonal Architecture** (Alistair Cockburn) : le logging est un *port* de sortie. Le domaine et l'application dépendent d'une **interface `Logger`**, jamais d'une implémentation concrète. C'est la demande explicite du cadrage et l'alignement naturel avec le DDD déjà en place (`Storage` suit déjà ce modèle).
- **Structured logging / "logs as events"** (Honeycomb, Charity Majors) : un log = un événement avec des attributs typés et requêtables, pas une chaîne de texte.
- **The Twelve-Factor App (Factor XI — Logs)** : l'application écrit sur stdout ; le routage/rétention est une préoccupation d'infrastructure. Principe conservé même avec Sentry (le SDK devient un adapter, stdout reste le fallback).
- **Documentation de référence vérifiée (2026)** : docs officielles Sentry (`@sentry/nextjs`, Structured Logs, MCP `mcp.sentry.dev`), Pino (`getpino.io`, bundling & serverless), LogTape (`logtape.org`).

## Proposed Solution

### Principe directeur

Le code applicatif ne connaît **qu'une interface `Logger`** (un port dans `src/lib/domain` ou `src/lib/infrastructure/logging`). On fournit **plusieurs adapters interchangeables** derrière une factory, exactement comme `Storage` :

```
domain/application  ──dépend de──▶  interface Logger (port)
                                          ▲
                     ┌────────────────────┼────────────────────┐
              SentryLogger          PinoLogger           ConsoleLogger / NoopLogger
              (@sentry/nextjs)      (stdout JSON)         (dev pretty / tests silencieux)
```

Basculer de plateforme = écrire un nouvel adapter + changer une variable d'env. Le reste du code ne bouge pas. **C'est ce qui satisfait la contrainte "facile à changer".**

### Tools & Technologies

**Retenu — plateforme d'observabilité : Sentry** (`@sentry/nextjs`)
- Une seule plateforme couvre les trois besoins exprimés : exploration des logs (Sentry Structured Logs, requêtable), erreurs/traces, et **serveur MCP officiel** (`https://mcp.sentry.dev/mcp`) pour l'agent de code.
- API structurée native `Sentry.logger.info/warn/error(msg, { attributs })`, activée par `enableLogs: true` (option stable et top-level, **pas** `_experiments`). Fonctionne côté serveur ET navigateur.
- Version épinglée : **`@sentry/nextjs` 10.66** (dernière stable).

**Retenu — implémentation par défaut derrière le port : `SentryLogger`** en production, `ConsoleLogger` (pretty) en dev, `NoopLogger` en test.

**Alternatives d'implémentation explorées (toutes réalisables comme adapter du port) :**

| Lib | Rôle envisagé | Décision | Raison |
|---|---|---|---|
| **SDK Sentry** (`@sentry/nextjs`) | Adapter prod par défaut | **Retenu** | Couvre logs + erreurs + MCP en une lib ; isomorphe serveur/navigateur ; `enableLogs` GA. |
| **Pino** | Adapter alternatif (JSON stdout haute perf) | **Gardé en réserve** | Excellent en Node, mais **caveat Vercel** : ses `transport` tournent en worker threads, non bundlables par Next/Turbopack (pas de plugin officiel Next.js). Utilisable **uniquement en JSON brut sur stdout, sans `transport`**. Peu adapté au navigateur (`pino/browser` bridé). Reste un bon adapter serveur si on quitte Sentry. |
| **LogTape** (`@logtape/logtape`) | Façade isomorphe + sinks | **Gardé en réserve (option forte)** | Zéro dépendance, **vraiment isomorphe** (même API navigateur + serverless), tree-shakable (~5.3 KB), sinks officiels `@logtape/sentry` et `@logtape/otel`. Intéressant si on veut une **façade neutre** qui route vers Sentry aujourd'hui et ailleurs demain sans changer les call-sites. Plus jeune, bus-factor (mainteneur unique). |

> Note d'architecture : notre **interface `Logger` maison** joue déjà le rôle de façade neutre. LogTape ferait double emploi avec elle. On garde donc LogTape comme *plan B d'implémentation* et non comme couche supplémentaire, pour éviter deux abstractions superposées.

**Alternatives de plateforme rejetées** : Better Stack / Grafana Loki / Axiom — rejetées car aucune n'offre le combo *logs explorables + erreurs + MCP mûr pour agent* en une seule intégration ; Sentry était le choix initial et le mieux outillé pour l'agent de code.

### Implementation Approach

1. **Définir le port `Logger`** (interface) + types d'attributs structurés + niveaux (`debug/info/warn/error`).
2. **Écrire les adapters** : `ConsoleLogger` (dev, lisible), `NoopLogger` (test), `SentryLogger` (prod).
3. **Factory `logger-factory.ts`** + singleton `getLogger()` sur le modèle de `getStorage()`, pilotée par `NODE_ENV` / `LOG_PROVIDER`.
4. **Injecter le logger** dans les services/handlers via constructeur (comme les autres dépendances), avec un logger enfant contextualisé (`storyId`) plutôt que la corrélation manuelle `[${story.id}]`.
5. **Installer et configurer `@sentry/nextjs`** (fichiers `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `withSentryConfig`).
6. **Gérer le flush en tâche de fond** (`await Sentry.flush(2000)` dans les générations fire-and-forget).
7. **Migrer les 135 `console.*`** vers le logger injecté / `getLogger()`.
8. **Brancher le MCP Sentry** sur l'agent de code.
9. **Rendre les tests silencieux** et vérifier.

### Dependencies & Prerequisites

- Compte Sentry + projet créé ; DSN et `SENTRY_AUTH_TOKEN` disponibles.
- Variables d'env ajoutées au schéma Zod (`env.schema.ts`) : `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `LOG_PROVIDER`, `LOG_LEVEL`.
- Accès Vercel pour configurer les variables d'environnement de prod.

## Implementation Tasks

### Phase 1 : Fondations — le port et les adapters

- [ ] **T1.1** — Définir l'interface `Logger` (port) — *Dépend de : -*
  - Critère : interface avec `debug/info/warn/error(message, attributes?)` + `child(context)` retournant un `Logger`, typée pour attributs structurés (`Record<string, string | number | boolean>`).
  - Fichiers : `src/lib/infrastructure/logging/logger.ts`
- [ ] **T1.2** — Implémenter `ConsoleLogger` (dev, lisible) — *Dépend de : T1.1*
  - Critère : formate niveau + message + attributs + contexte enfant de façon lisible ; utilisé quand `NODE_ENV=development`.
  - Fichiers : `src/lib/infrastructure/logging/console-logger.ts`
- [ ] **T1.3** — Implémenter `NoopLogger` (silencieux) — *Dépend de : T1.1*
  - Critère : toutes les méthodes sont des no-ops ; `child()` se retourne lui-même.
  - Fichiers : `src/lib/infrastructure/logging/noop-logger.ts`
- [ ] **T1.4** — Créer `logger-factory.ts` + singleton `getLogger()` — *Dépend de : T1.2, T1.3*
  - Critère : `getLogger()` renvoie l'adapter selon `LOG_PROVIDER`/`NODE_ENV` (`test`→Noop, `development`→Console, `production`→Sentry) ; modèle calqué sur `storage-factory.ts`.
  - Fichiers : `src/lib/infrastructure/logging/logger-factory.ts`
- [ ] **T1.5** — Ajouter les variables d'env au schéma Zod — *Dépend de : -*
  - Critère : `env.schema.ts` valide `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `LOG_PROVIDER`, `LOG_LEVEL` (optionnels en dev/test) ; `.env.example` mis à jour.
  - Fichiers : `src/config/env.schema.ts`, `.env.example`, `.env.test`

### Phase 2 : Intégration Sentry

- [ ] **T2.1** — Installer et initialiser `@sentry/nextjs` **10.66** (serveur) — *Dépend de : T1.5*
  - Critère : `instrumentation.ts` et `sentry.server.config.ts` créés ; `next.config.ts` enveloppé par `withSentryConfig` ; `enableLogs: true` côté serveur ; `app/global-error.tsx` en place. Build passe. (Init client `instrumentation-client.ts` reporté en Phase 5.)
  - Fichiers : racine `webapp/`, `next.config.ts`, `src/app/global-error.tsx`
- [ ] **T2.2** — Implémenter `SentryLogger` (adapter prod) — *Dépend de : T2.1, T1.1*
  - Critère : mappe `debug/info/warn/error` sur `Sentry.logger.*`, propage les attributs, `child(context)` fusionne le contexte dans les attributs.
  - Fichiers : `src/lib/infrastructure/logging/sentry-logger.ts`
- [ ] **T2.3** — Garantir le flush des logs en tâche de fond — *Dépend de : T2.2*
  - Critère : les chemins fire-and-forget (`StoryGeneratorService.generate`, `StoryImagesGeneratorService`) `await Sentry.flush(2000)` avant la fin de l'exécution serverless ; documenté dans le doc de cadrage.
  - Fichiers : services de génération + `sentry-logger.ts`

### Phase 3 : Migration des `console.*`

- [ ] **T3.1** — Migrer les services de génération (prioritaire) — *Dépend de : T2.2*
  - Critère : `story-generator-service.ts`, `story-images-generator-service.ts`, `scenario-generator-service.ts` reçoivent un `Logger` injecté au constructeur ; corrélation `[${story.id}]` remplacée par `logger.child({ storyId })`. Aucun `console.*` restant dans ces fichiers.
- [ ] **T3.2** — Migrer les route handlers API — *Dépend de : T1.4*
  - Critère : les `console.error` des `catch` de `src/app/api/**/route.ts` passent par `getLogger()` avec attributs (route, statut). Aucun `console.*` restant.
- [ ] **T3.3** — Migrer handlers, repositories, factories et infrastructure — *Dépend de : T1.4*
  - Critère : `console.*` restants dans `src/lib/**` migrés (handlers command/query, repositories SQL, `storage-factory`, générateurs Replicate/Ollama).
- [ ] **T3.4** — Laisser les scripts CLI sous `console.*` — *Dépend de : T1.4*
  - Critère : les scripts CLI (`scripts/*.ts`) **conservent** `console.*` (décision actée) ; le seul `console.*` client (`service-worker-registration.tsx`) est laissé en l'état, traité en Phase 5.
- [ ] **T3.5** — Ajouter un garde anti-`console` via Biome — *Dépend de : T3.1, T3.2, T3.3*
  - Critère : règle `noConsole` activée dans `biome.json` (avec exceptions ciblées pour `scripts/`) ; `npm run lint` échoue sur tout nouveau `console.*` non autorisé.
  - Fichiers : `biome.json`

### Phase 4 : Agent MCP & validation

- [ ] **T4.1** — Brancher le serveur MCP Sentry sur l'agent de code — *Dépend de : T2.1*
  - Critère : configuration MCP (`mcp.sentry.dev/mcp` OAuth, ou `@sentry/mcp-server` en stdio) ; l'agent liste les tools et exécute une recherche d'événements de test.
- [ ] **T4.2** — Vérifier le silence des logs en test E2E — *Dépend de : T3.1, T3.2, T3.3*
  - Critère : `npm run test:e2e` ne produit aucun log applicatif parasite ; `NoopLogger` bien sélectionné sous `.env.test`.
- [ ] **T4.3** — Vérifier l'arrivée des logs structurés dans Sentry — *Dépend de : T2.3, T3.1*
  - Critère : un cycle de génération émet des logs structurés (avec `storyId`) visibles et filtrables dans Sentry ; un incident déclenche une erreur corrélée.
- [ ] **T4.4** — Mettre à jour la doc — *Dépend de : T3.5*
  - Critère : `README.md` + CLAUDE.md documentent l'usage de `getLogger()`/injection et l'interdiction de `console.*` ; ADR créée si besoin.

### Phase 5 : Logs navigateur (second temps, non bloquant)

- [ ] **T5.1** — Initialiser Sentry côté client — *Dépend de : T2.1*
  - Critère : `instrumentation-client.ts` créé avec `Sentry.init({ enableLogs: true })` + `onRouterTransitionStart` ; erreurs React et logs client remontent dans Sentry.
  - Fichiers : `instrumentation-client.ts`
- [ ] **T5.2** — Fournir un adapter `Logger` client — *Dépend de : T5.1, T1.1*
  - Critère : le port `Logger` est utilisable côté navigateur (adapter Sentry client ou console en dev) ; `service-worker-registration.tsx` migré.
  - Fichiers : `src/lib/infrastructure/logging/`, `src/components/service-worker-registration.tsx`

## Impact Analysis

### Team Impact
- Learning curve : **Low** — le pattern port+factory est déjà connu (`Storage`) ; l'API `logger.info(msg, attrs)` est simple.
- Skills required : Sentry SDK, notions de structured logging.
- Estimated disruption : ~2–4 jours (migration des 135 call-sites incluse).
- Training needed : non ; une section README suffit.

### Technical Impact
- Performance : négligeable côté app ; le flush background ajoute jusqu'à 2 s en fin de tâche de génération (déjà longue) — acceptable.
- Maintainability : forte hausse — découplage total de `console`, logs requêtables, changement de backend trivial.
- Code changes : large en nombre de fichiers (135 sites) mais mécanique et à faible risque.

## Success Criteria

- [ ] **0** appel `console.*` dans `src/**` hors exceptions tracées (vérifié par la règle Biome `noConsole`).
- [ ] Le domaine et l'application ne dépendent que de l'interface `Logger` (aucun `import` Sentry/Pino hors adapters).
- [ ] Les logs de production sont structurés (JSON/attributs) et filtrables par `storyId` dans Sentry.
- [ ] `npm run test:e2e` : aucune sortie de log applicatif.
- [ ] L'agent de code interroge Sentry via MCP et récupère événements/erreurs.
- [ ] Changer de backend = écrire un adapter + une variable d'env, sans toucher les call-sites.

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Logs des tâches fire-and-forget perdus (function Vercel gelée avant flush) | Med | High | `await Sentry.flush(2000)` avant fin des générations ; vérifié en T4.3. |
| Pino inutilisable tel quel sur Vercel (worker threads non bundlables) | — | Med | Choix par défaut = Sentry, pas Pino ; si Pino un jour, JSON stdout **sans** `transport`. Tracé. |
| `enableLogs` / `setAttribute` dépendants de la version SDK | Low | Med | Version épinglée **10.66** (`enableLogs` GA, `setAttribute` disponible depuis 10.61). |
| Migration massive introduit des régressions | Med | Med | Migration par phases (services critiques d'abord) ; E2E en garde-fou ; règle Biome en fin. |
| Deux abstractions superposées (port maison + LogTape) | Low | Med | Décision actée : LogTape = plan B d'implémentation, pas une couche en plus. |
| Fuite de données sensibles dans les attributs de log | Low | High | `beforeSendLog` pour filtrer ; ne jamais logguer secrets/PII ; revue lors de la migration. |

## Rollback Plan

1. `LOG_PROVIDER=console` (ou `NODE_ENV`) rebascule sur `ConsoleLogger` sans redéploiement de code.
2. Retirer `withSentryConfig` de `next.config.ts` et les fichiers `sentry.*` / `instrumentation*` pour désactiver totalement Sentry.
3. L'interface `Logger` restant en place, aucun call-site n'est à retoucher.
4. Temps de récupération estimé : < 1 h.

## Cost Analysis

- **Coût d'adoption** : ~2–4 j de dev + coût du plan Sentry (free tier possible au début).
- **Coût du statu quo** : incidents de génération indébogables en prod, dette de couplage à `console` croissante, pollution des tests.
- **Break-even** : dès le premier incident de production diagnostiqué via logs structurés + MCP.

## Timeline

- Fondations (Phase 1) : 0,5 j
- Intégration Sentry (Phase 2) : 0,5–1 j
- Migration (Phase 3) : 1–2 j
- MCP & validation (Phase 4) : 0,5 j

## Résolutions (2026-07-17)

- [x] **Version SDK** : épingler `@sentry/nextjs` **10.66** (dernière stable ; `enableLogs` GA, `setAttribute` disponible).
- [x] **`consoleLoggingIntegration`** : **non utilisé**. Migration directe vers le logger, sans filet de capture automatique des `console.*`.
- [x] **Scripts CLI** (`scripts/*.ts`) : **conservent `console.*`** (hors runtime serveur/tests). Exception tracée dans la règle Biome `noConsole`.
- [x] **Périmètre** : **serveur d'abord**, navigateur dans un second temps. La Phase 5 (client) est planifiée mais non bloquante pour la livraison serveur.

## Decision

**Accepted** (2026-07-17)

Rationale : approche port + adapters validée (alignée sur le pattern `Storage` existant), Sentry retenu comme plateforme unique (logs + erreurs + MCP), SDK épinglé 10.66, migration serveur d'abord puis navigateur. Les 18 tâches d'implémentation (T1.1 → T5.2) sont créées dans Claude Code.
