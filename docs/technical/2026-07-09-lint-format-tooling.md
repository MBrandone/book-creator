# Technical Scoping: Outillage Lint & Formatting (ESLint+Prettier vs Biome)

## Metadata
- **Date**: 2026-07-09
- **Status**: Accepted
- **Owner**: Brandone
- **Related**: `webapp/eslint.config.mjs`, `webapp/package.json`

## Problem Statement

Le projet dispose aujourd'hui d'ESLint 9 (flat config via `eslint-config-next`) mais son
intérêt est limité en pratique :

- **Pas de formatter** : aucun Prettier ni équivalent. Le style de code (indentation,
  quotes, virgules) n'est garanti par aucun outil — il dépend de la configuration
  individuelle de chaque éditeur.
- **Lancé rarement** : `npm run lint` (`eslint`) est une commande manuelle. Aucun
  git hook, aucune CI (`.github/workflows` inexistant) ne l'exécute automatiquement.
  Du code non conforme peut donc être commité et poussé sans obstacle.
- **Commande de fix limitée** : `eslint --fix` ne corrige que les problèmes de lint
  auto-fixables ; il ne fait pas de formatting complet du code.

Conséquence : le code ne répond pas « toujours aux mêmes règles ». L'objectif est
d'avoir un outil de lint **et** de formatting, exécuté **automatiquement** avant chaque
commit, et **pérenne** dans le temps.

## Context & Constraints

- **Stack** : Next.js 16, React 19, TypeScript 5, Tailwind CSS 4. ~125 fichiers source
  (`.ts`/`.tsx`/`.js`) dans `webapp/`.
- **Config existante** : ESLint flat config minimaliste (`core-web-vitals` + `typescript`
  de `eslint-config-next`).
- **Pas d'infra d'enforcement** : ni CI, ni git hooks (husky absent) ne sont en place.
- **Scripts** : plusieurs scripts `tsx` (`migrate.ts`, `build-sw.ts`…) et tests Playwright.
- **Contrainte projet** : pas de commentaires dans le code (règle CLAUDE.md) — le style
  privilégie des noms explicites ; le formatter ne doit pas entrer en conflit.

### Priorités de décision (validées avec le porteur)

1. **Pérennité / maturité** — l'outil doit être maintenu durablement.
2. **Simplicité** — idéalement un seul outil pour lint + format.
3. **Vitesse d'exécution** — quasi instantané (crucial pour un pre-commit lancé souvent).

L'enforcement cible retenu est le **pre-commit hook** (git hook automatique).

## Methodology & Inspiration

- **« Fail fast, fail local »** : détecter les écarts de style au plus près du
  développeur (pre-commit) plutôt qu'en review ou en CI, pour réduire le coût de
  correction.
- **Convention over configuration** : privilégier un formatter opinionated (peu de
  réglages, décisions déjà prises) pour éliminer les débats de style — philosophie
  héritée de Prettier, poursuivie par Biome.
- **Toolchain unifiée** : tendance de fond (esbuild, swc, Biome, Oxc) à remplacer les
  chaînes JS multi-outils par des binaires natifs uniques et rapides.
- Références :
  - Biome — philosophie et migration : https://biomejs.dev/
  - Biome domains (2.0) : https://biomejs.dev/linter/domains/
  - Prettier — options philosophy : https://prettier.io/docs/en/option-philosophy.html
  - État des lieux Oxc/Oxlint : https://oxc.rs/

## Proposed Solution

### Tools & Technologies

| Outil | Rôle | Verdict |
|-------|------|---------|
| **Biome 2.x** (`@biomejs/biome`) | Lint + Format, binaire unique (Rust) | **Recommandé** |
| ESLint 9 + Prettier | Lint (ESLint) + Format (Prettier), 2 outils JS | Alternative — rejeté |
| Oxlint / Oxc | Linter Rust ultra-rapide, formatter naissant | Alternative — rejeté (immature) |

#### Analyse comparative

**Critère 1 — Pérennité / maturité**

- **ESLint + Prettier** : l'étalon historique, écosystème massif, maintenance assurée.
  Risque faible sur la pérennité. C'est la référence en matière de longévité.
- **Biome** : projet issu de Rome, actif, financé (Open Collective), rythme de release
  soutenu. Biome **2.x** est stable et adopté en production par de nombreux projets.
  Maturité désormais suffisante pour un usage sérieux — le principal risque « jeunesse »
  s'est fortement réduit depuis la 1.0.
- **Oxc/Oxlint** : très prometteur et extrêmement rapide, mais le **formatter est encore
  jeune** et l'écosystème de règles moins complet. **Rejeté** sur le critère de pérennité :
  trop tôt pour en dépendre.

**Critère 2 — Simplicité (un seul outil)**

- **ESLint + Prettier** : **deux** outils, deux configs, et il faut gérer leur coexistence
  (historiquement `eslint-config-prettier` pour désactiver les règles de style d'ESLint qui
  entrent en conflit avec Prettier). Plus de surface de configuration.
- **Biome** : **un seul binaire** pour lint + format, une seule config (`biome.json`),
  zéro conflit lint/format par conception. **Gagnant net** sur ce critère, qui est une
  priorité explicite.

**Critère 3 — Vitesse**

- **ESLint + Prettier** : outils Node.js. ESLint est notoirement lent sur les gros repos ;
  acceptable ici (~125 fichiers) mais reste le maillon lent d'un pre-commit.
- **Biome** : écrit en Rust, multithread, **10 à 100× plus rapide** que la combinaison
  ESLint+Prettier selon les benchmarks. Idéal pour un pre-commit exécuté à chaque commit.
  **Gagnant net.**

**Critère transverse — Couverture des règles Next.js (point à trancher)**

C'est le seul avantage historique d'ESLint : `eslint-config-next` fournit des règles
spécifiques à Next.js (`next/core-web-vitals`) — ex. `no-html-link-for-pages`,
`no-img-element`, `no-sync-scripts`, `google-font-display`, `no-head-import-in-document`.

Point déterminant : **Biome 2.0 a introduit la notion de _domains_** (`biomejs.dev/linter/domains`),
dont un domaine **`next`** (et un domaine `react`). Activer le domaine `next` active un
ensemble de règles portées depuis `eslint-plugin-next` (ex. `useImgElement`,
`noHeadImportInDocument`, `useGoogleFontDisplay`…). La majeure partie de la valeur de
`eslint-config-next` est donc désormais couverte nativement par Biome.

**Nuance honnête** : la parité n'est pas garantie à 100 %. Quelques règles Next très
spécifiques peuvent manquer ou différer, et surtout Biome (analyse principalement
per-fichier) ne reproduit pas toutes les analyses cross-fichiers de certaines règles
Next/`eslint-plugin-react-hooks` avancées. Pour ce projet (application relativement
standard, priorité forte à la simplicité et à la vitesse), cette perte marginale est
**acceptable**.

#### Décision sur la stratégie Next.js

**→ Option retenue : Tout Biome, domaine `next` + `react` activés, ESLint retiré.**

Justification :
- Les priorités validées (pérennité, **simplicité un seul outil**, vitesse) pointent
  toutes vers un outil unique. Conserver ESLint « juste pour quelques règles Next » (option
  hybride) trahit la priorité n°2 (simplicité) : on garderait deux outils, deux configs,
  la lenteur d'ESLint dans le pre-commit, et la complexité de coordination.
- Le domaine `next` de Biome 2.x couvre l'essentiel des règles qui apportaient de la valeur.
- **Filet de sécurité** : les Core Web Vitals et bonnes pratiques Next restent vérifiées
  par `next build` (qui exécute ses propres checks) et par l'observabilité runtime. La perte
  n'est pas totale.
- Réversibilité : si une règle Next manquante s'avère critique, on pourra réintroduire
  ESLint **de façon ciblée** (approche hybride) sans revenir en arrière sur Biome pour le
  formatting. Le choix « tout Biome » n'est donc pas un cul-de-sac.

### Règles de lint retenues

Le porteur n'ayant configuré **quasiment aucune règle ESLint spécifique** (config
`eslint-config-next` par défaut, sans surcharge), on ne cherche pas à reproduire un
jeu de règles sur-mesure. On part des **règles `recommended` de Biome** (règles de lint
basiques, éprouvées) comme socle, enrichies par des **domaines** activés de façon ciblée
(voir ci-dessous). Aucune règle exotique ni configuration fine au démarrage — on ajuste
ultérieurement si un besoin réel émerge.

### Domaines Biome activés

Biome 2.x regroupe les règles par **domaines** (opt-in). Domaines retenus :

| Domaine | Valeur | Pourquoi |
|---------|--------|----------|
| `next` | `recommended` | Règles spécifiques Next.js (remplace l'essentiel de `eslint-config-next`) |
| `react` | `recommended` | Bonnes pratiques React 19 / hooks |
| `test` | `recommended` | Règles pour le code de test (`no-focused-tests`, structure des tests…) |
| `project` | `recommended` | Analyse au niveau projet (imports, dépendances) |

**Domaines écartés** :
- `types` — écarté car il **requiert l'inférence de types** (analyse plus coûteuse et plus
  lente), en tension avec la priorité « pre-commit quasi instantané ». On garde le lint
  rapide et léger.
- `playwright` — écarté ; le domaine `test` couvre déjà l'essentiel des bonnes pratiques
  de test pour les fichiers e2e.

### Implementation Approach

1. Installer Biome, générer `biome.json`, migrer automatiquement la config ESLint existante.
2. Partir des règles `recommended`, activer les domaines `next`, `react`, `test`, `project`,
   aligner le formatting sur le style actuel du repo.
3. Passer une première fois `biome check --write` sur tout le repo (commit de reformatting
   isolé).
4. Mettre en place l'enforcement : git hook pre-commit + lint-staged (formatage/lint des
   seuls fichiers stagés). **Pas de CI pour le moment.**
5. Retirer ESLint et ses dépendances, mettre à jour les scripts npm et la doc.

### Dependencies & Prerequisites

- Node/npm déjà en place (projet `webapp`).
- Git (pour le hook pre-commit).
- Aucun husky/lint-staged actuellement → à installer.

## Implementation Tasks

### Phase 1: Préparation & installation
- [ ] **T1.1** — Installer Biome en version exacte : `npm i -D -E @biomejs/biome` dans `webapp/` — *Dépend de: -*
  - Critère de complétion : `npx biome --version` renvoie une version 2.x ; entrée présente dans `devDependencies`.
- [ ] **T1.2** — Générer et committer la config initiale `biome.json` (`npx biome init`) — *Dépend de: T1.1*
  - Fichiers/zones : `webapp/biome.json`
  - Critère de complétion : `biome.json` versionné avec le `$schema` renseigné.
- [ ] **T1.3** — Migrer automatiquement les règles ESLint existantes : `npx biome migrate eslint --write` — *Dépend de: T1.2*
  - Critère de complétion : le rapport de migration est lu ; les règles non migrables (plugins inconnus) sont listées dans ce document (section Open Questions).

### Phase 2: Configuration Biome
- [ ] **T2.1** — Activer les domaines dans `biome.json` (`linter.domains`) : `next`, `react`, `test`, `project` (tous en `recommended`) — *Dépend de: T1.2*
  - Critère de complétion : `biome.json` contient `"domains": { "next": "recommended", "react": "recommended", "test": "recommended", "project": "recommended" }` (pas de `types` ni `playwright`).
- [ ] **T2.2** — Aligner les options de `formatter` sur le style actuel du repo (indent, quotes, semicolons, trailing commas) pour minimiser le diff de reformatting — *Dépend de: T1.2*
  - Critère de complétion : un `biome format` à blanc sur 3-4 fichiers représentatifs produit un diff jugé minimal/attendu.
- [ ] **T2.3** — Configurer les `files.includes`/ignore pour exclure `.next/`, `out/`, `build/`, artefacts et migrations générées — *Dépend de: T1.2*
  - Critère de complétion : `biome check` n'analyse pas les dossiers générés.
- [ ] **T2.4** — Générer/committer `.vscode/settings.json` et l'extension recommandée pour le format-on-save via Biome (confort dev, non bloquant) — *Dépend de: T2.2*
  - Fichiers/zones : `webapp/.vscode/`

### Phase 3: Scripts & premier passage
- [ ] **T3.1** — Ajouter les scripts npm : `format` (`biome format --write`), `lint` (`biome lint`), `check` (`biome check --write`) — *Dépend de: T2.1, T2.2*
  - Fichiers/zones : `webapp/package.json`
  - Critère de complétion : `npm run check` s'exécute sans erreur d'outillage.
- [ ] **T3.2** — Reformater tout le repo en un commit isolé dédié : `npm run check` puis commit « style: format via Biome » — *Dépend de: T3.1, T2.3*
  - Critère de complétion : `biome check` ne remonte plus d'erreur de format sur le repo.

### Phase 4: Enforcement (pre-commit)
- [ ] **T4.1** — Installer et initialiser husky (`npm i -D husky && npx husky init`) — *Dépend de: T3.2*
  - Fichiers/zones : `webapp/.husky/`
- [ ] **T4.2** — Installer lint-staged et le configurer pour lancer `biome check --write --no-errors-on-unmatched` sur les fichiers stagés — *Dépend de: T4.1*
  - Fichiers/zones : `webapp/package.json` (clé `lint-staged`), `webapp/.husky/pre-commit`
  - Critère de complétion : un commit contenant un fichier mal formaté est automatiquement corrigé (ou bloqué si erreur de lint non fixable).
- [ ] **T4.3** — Tester le hook de bout en bout : introduire volontairement un écart de style, committer, vérifier la correction automatique — *Dépend de: T4.2*
  - Critère de complétion : le fichier est reformaté et re-stagé avant le commit.

### Phase 5: Nettoyage & documentation
- [ ] **T5.1** — Retirer ESLint : supprimer `eslint.config.mjs`, désinstaller `eslint` + `eslint-config-next` — *Dépend de: T3.2*
  - Fichiers/zones : `webapp/eslint.config.mjs`, `webapp/package.json`
  - Critère de complétion : plus aucune référence à eslint dans `package.json`/repo (hors historique git).
- [ ] **T5.2** — Mettre à jour le `README.md` et le `CLAUDE.md` projet : outil de lint/format = Biome, commandes, hook pre-commit — *Dépend de: T4.3, T5.1*
- [ ] **T5.3** — Vérifier les critères de succès (voir section Success Criteria) — *Dépend de: T4.3, T5.1*

## Impact Analysis

### Team Impact
- **Learning curve** : Low. Biome se pilote avec 3 commandes (`format`, `lint`, `check`) ;
  config JSON unique auto-générée.
- **Skills required** : aucun nouveau ; connaissance basique de git hooks.
- **Estimated disruption** : quelques heures (setup + commit de reformatting global).
- **Training needed** : non. Un paragraphe dans le README suffit.

### Technical Impact
- **Performance (DX)** : lint+format quasi instantané (Rust) → pre-commit non pénalisant.
- **Maintainability** : une config au lieu de deux, moins de dépendances devDeps.
- **Code changes** : un gros diff de reformatting **ponctuel** (à isoler dans un commit
  dédié pour ne pas polluer les futures reviews / `git blame`).
- **Scalability** : Biome tient la charge bien au-delà de la taille actuelle du repo.

## Success Criteria

- [ ] Un seul outil (`@biomejs/biome`) gère lint **et** format ; ESLint/Prettier absents des dépendances.
- [ ] `biome check` passe à 0 erreur sur l'ensemble du repo.
- [ ] Un commit contenant du code mal formaté est **automatiquement** corrigé par le pre-commit hook (le problème « lancé rarement » est résolu).
- [ ] Le temps d'exécution du hook sur un commit typique est < 2 s.
- [ ] Les domaines `next`, `react`, `test`, `project` sont activés et documentés.
- [ ] README/CLAUDE.md à jour.

## Risks & Mitigation

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Perte de règles Next spécifiques non couvertes par le domaine `next` | Moyenne | Faible/Moyen | Auditer le rapport de migration ; réintroduire ESLint de façon ciblée (hybride) si une règle critique manque ; `next build` reste un filet |
| Gros diff de reformatting qui pollue l'historique / les reviews | Élevée | Faible | Isoler dans un commit dédié « style: format via Biome » ; ajouter le commit à `.git-blame-ignore-revs` |
| Divergence formatter éditeur vs pre-commit | Faible | Faible | Versionner `.vscode/settings.json` + config Biome unique = source de vérité partagée |
| Adoption Biome ralentit à long terme | Faible | Moyen | Config standard et migrable ; `biome migrate` inverse possible ; ESLint réintroductible ; choix réversible |
| Pre-commit contourné (`--no-verify`) | Moyenne | Faible | Pas de CI pour le moment (choix assumé) ; la vérification repose sur le hook local et le format-on-save éditeur |

## Rollback Plan

Le choix est réversible :
1. Réinstaller `eslint` + `eslint-config-next`, restaurer `eslint.config.mjs` (disponible dans l'historique git).
2. Restaurer le script `"lint": "eslint"` dans `package.json`.
3. Désinstaller `@biomejs/biome`, supprimer `biome.json` et la config lint-staged Biome.
4. Optionnel : conserver husky/lint-staged en les pointant vers ESLint+Prettier.
- **Temps de retour arrière estimé** : < 1 h.

## Cost Analysis

- **Coût d'adoption** : quelques heures (setup + reformatting + hook). Learning curve faible.
- **Coût du statu quo** : style de code non garanti, lint jamais lancé automatiquement,
  dette de cohérence qui s'accumule, friction en review sur des détails de style.
- **Break-even** : quasi immédiat — dès le premier commit, le formatting est garanti sans
  effort manuel.

## Timeline

- Research & validation : fait (ce document).
- Implémentation : ~0,5 jour.
- Migration (commit de reformatting) : ~1 h.
- Stabilisation : quelques jours d'usage pour confirmer l'absence de règle Next manquante critique.

## Open Questions

- [ ] Quelles règles remonte exactement `biome migrate eslint` comme non migrables ? (à compléter après T1.3)
- [x] ~~Job CI ?~~ **Tranché : pas de CI pour le moment.** Enforcement = pre-commit hook uniquement.
- [x] ~~Domaines supplémentaires ?~~ **Tranché : `next`, `react`, `test`, `project`.** Domaines `types` et `playwright` **écartés** (`types` trop lent pour le pre-commit ; `test` couvre déjà les fichiers Playwright).

## Decision

**Accepted** — 2026-07-09

Rationale : Biome retenu comme outil unique lint+format pour la simplicité et la
vitesse. Socle = règles `recommended` (aucune règle sur-mesure côté ESLint à reproduire),
enrichi des domaines `next`, `react`, `test`, `project` (`types` et `playwright` écartés
pour garder un lint rapide). ESLint retiré, avec réintroduction ciblée possible en cas de
manque. Enforcement via pre-commit hook uniquement (pas de CI pour le moment).
