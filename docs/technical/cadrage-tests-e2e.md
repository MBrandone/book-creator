# Cadrage : Mise en place des tests E2E

## Métadonnées

- **Date** : 2026-07-03
- **Statut** : Proposé
- **Owner** : Brandone

## Contexte

Book Creator est une application Next.js 16.2.9 générant des livres illustrés par IA. Le projet n'a actuellement **aucun test automatisé**.

Le développeur souhaite adopter une approche de **développement agentique** : des agents de code produisent des modifications et doivent pouvoir **valider eux-mêmes leur travail** avant de proposer une intégration. Sans harnais de tests, ces agents ne peuvent pas détecter les régressions, et le développeur devrait tester manuellement chaque proposition — ce qui annule le gain de productivité du développement agentique.

**État actuel :**
- Aucun test (unitaire, intégration ou E2E)
- Stack : Next.js 16.2.9, React 19.2.4, TypeScript 5, Kysely, Postgres 16, MinIO, Replicate
- Services externes : Replicate (images), Ollama/HuggingFace (histoires)
- Docker Compose déjà en place pour Postgres + MinIO
- Développeur unique sur le projet

## Problème résolu

**Douleur principale** : Impossible de faire du développement agentique en confiance sans mécanisme de validation automatisée. Chaque proposition d'agent nécessite un test manuel du parcours complet.

**Conséquences si rien n'est fait :**
- Perte de productivité : test manuel systématique du happy path
- Risque de régression non détectée entre deux itérations agentiques
- Impossible de laisser un agent itérer en autonomie sur un correctif

## Méthodologie & Inspiration

**Testing Trophy de Kent C. Dodds** ([kentcdodds.com/blog/the-testing-trophy-and-testing-classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications))
- Priorité aux **tests d'intégration et E2E** qui simulent l'usage réel
- Un seul test E2E du happy path apporte plus de confiance que 20 tests unitaires isolés
- "Write tests. Not too many. Mostly integration."

**Bonnes pratiques accessibilité (Testing Library philosophy)**
- Sélection des éléments par **noms accessibles** (`getByRole`, `getByLabelText`)
- Pas de sélecteurs fragiles (`.class-name`, `#id`, `data-testid` en dernier recours)
- Les tests documentent l'expérience utilisateur réelle

**Développement agentique**
- Les tests servent de **contrat de validation** pour les agents de code
- Un agent qui propose un changement doit pouvoir lancer `npm run test:e2e` et interpréter le résultat

## Solution proposée

### Outils retenus

| Rôle | Outil | Version | Justification |
|------|-------|---------|---------------|
| Framework E2E | **Playwright** | 1.61.1 (fixe) | Excellent support Next.js, multi-browser, DX moderne, auto-wait, codegen, `page.route` pour contrôle réseau |
| Runner | Playwright Test | inclus | Intégré, parallélisation native |
| Base Postgres test | **Postgres dédié** | 16 | Vraie base isolée, pas de mock |
| Storage test | **MinIO dédié** | latest | Instance MinIO dédiée aux tests (docker-compose.test.yml) |
| Mock génération histoire | Provider `mock` intégré | in-memory | Sélection via `STORY_PROVIDER=mock` |
| Mock génération images | **in-memory-scene-image-generator** | in-memory | Sélection via `IMAGE_GENERATION_PROVIDER=mock` |
| Contrôle réseau (loading) | **Playwright `page.route`** | inclus | Interception client-side, pas d'endpoint serveur |

### Alternatives rejetées

- **Cypress** — rejeté : moins bon support multi-onglet, plus lent, DX inférieure à Playwright sur Next.js
- **Puppeteer** — rejeté : trop bas niveau, pas de runner intégré
- **Vitest + Testing Library (composants isolés)** — rejeté pour cette phase : ne couvre pas le flow complet demandé (Testing Trophy dit E2E d'abord pour le happy path)
- **Mock MinIO avec nock** — rejeté : le SDK AWS S3 a des subtilités (URLs pré-signées, multipart) qu'un mock nock reproduit mal. MinIO local est déjà disponible via Docker Compose.
- **Mock Postgres (pg-mem)** — rejeté : divergences de comportement avec le vrai Postgres, risque de faux positifs sur les migrations Kysely
- **Appels réels à Replicate** — rejeté : coût ($0.01/histoire × N tests), lenteur (30-60s), flakiness

### Architecture des mocks

Pas d'interface `AIProvider` générique. Uniquement des **implémentations mock ciblées** sélectionnées via variables d'environnement.

**Variables d'environnement :**

| Variable | Valeurs possibles | Effet |
|----------|-------------------|-------|
| `STORY_PROVIDER` | `mock`, `ollama`, `huggingface` | `mock` → utilise l'implémentation mock intégrée pour la génération d'histoire |
| `IMAGE_GENERATION_PROVIDER` | `mock`, `replicate` | `mock` → utilise `in-memory-scene-image-generator` |

**Nouvelle implémentation à créer :**

```
webapp/src/lib/ai/
└── in-memory-scene-image-generator.ts   # Mock pour génération d'images
```

Le mock existant côté histoire (si absent, à créer) suit la même convention de nommage.

**Retours déterministes :**
- Histoires : structure JSON identique à la production, contenu fixe par input
- Images : URLs pointant vers des fixtures locales dans `webapp/public/test-fixtures/`

### Contrôle déterministe des états de chargement

**Contrainte** : les tests doivent pouvoir **déclencher manuellement** la résolution des requêtes réseau pour tester les états `pending` → `resolved`.

**Approche retenue** : interception côté navigateur avec `page.route` de Playwright + Promise résolue manuellement depuis le test.

Pas d'endpoint serveur `/api/__test__/*`. Le contrôle vit **côté test**.

**Pattern à réutiliser (helper de test)** :

```typescript
async function mockStoryGenerationRequest(page: Page) {
  let resolveRoute: (() => void) | null = null
  const pending = new Promise<void>((resolve) => {
    resolveRoute = resolve
  })

  await page.route('**/api/generate-story', async (route) => {
    await pending
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        scenes: [
          { title: 'Présentation', text: '...' },
          { title: 'Élément perturbateur', text: '...' },
          { title: 'Action', text: '...' },
          { title: 'Situation finale', text: '...' },
        ],
      }),
    })
  })

  return resolveRoute
}
```

**Usage dans un test** :

```typescript
const resolveStory = await mockStoryGenerationRequest(page)
const resolveImages = await mockSceneImagesRequest(page)

await page.getByRole('button', { name: 'Générer l\'histoire' }).click()

// Assertion sur l'état loading — les requêtes sont bloquées
await expect(page.getByRole('status', { name: /génération en cours/i })).toBeVisible()

// Résolution manuelle depuis le test
resolveStory!()
resolveImages!()

// Assertion sur l'état final
await expect(page.getByRole('img', { name: /scène 1/i })).toBeVisible()
```

**Avantages** :
- Aucun code de test dans le bundle applicatif
- Pas d'endpoint interne à sécuriser
- Contrôle total depuis le test (chaque test définit ses propres mocks/résolutions)

### Isolation de l'infrastructure

**Fichier Docker Compose dédié aux tests** : `docker-compose.test.yml`

Un fichier séparé du `docker-compose.yml` de développement pour éviter que des conteneurs de test tournent inutilement pendant le développement local.

Services inclus :
- Postgres 16 (port différent, ex. `5433`) → base `bookcreator_test`
- MinIO (ports différents, ex. `9010`/`9011`) → bucket `book-images-test`

Commandes :
```bash
docker compose -f docker-compose.test.yml up -d   # démarrage services test
docker compose -f docker-compose.test.yml down    # arrêt services test
```

**Base Postgres test** :
- Migrations Kysely rejouées avant chaque run (`db:migrate` avec `DATABASE_URL` pointant sur la base test)
- **Pas de truncate entre tests** pour cette itération : chaque run repart d'une base migrée, l'état résiduel entre tests est accepté tant que le happy path reste vert
- Si flakiness observée plus tard → introduire un reset

**Bucket MinIO test** :
- Créé automatiquement au setup Playwright
- Pas de nettoyage entre tests pour l'instant (même raisonnement)

### Bonnes pratiques imposées

**Sélecteurs accessibles uniquement** :
- ✅ `getByRole('button', { name: 'Créer une histoire' })`
- ✅ `getByLabelText('Nom du personnage')`
- ✅ `getByText('Générer l\'histoire')`
- ❌ `page.locator('.btn-primary')`
- ❌ `page.locator('#submit-btn')`
- ⚠️ `getByTestId('story-form')` — en dernier recours uniquement

**Bénéfice secondaire** : force l'application à respecter les standards d'accessibilité (labels ARIA, rôles sémantiques).

## Parcours à tester (Happy Path)

Un seul test E2E principal couvrant le flow complet :

1. Landing page → clic sur "Créer une histoire"
2. Page création histoire → saisie nom + description → clic "Créer l'histoire"
3. Page personnage 1 → saisie nom + description + upload photo → clic "Créer le personnage"
4. Page personnage 2 → saisie nom + description **sans photo** → clic "Créer le personnage"
5. Clic sur "Générer l'histoire"
6. Assertion : page de loading visible
7. Résolution manuelle des requêtes fake (histoire + images)
8. Assertion : page résultat affiche 4 images

## Analyse d'impact

### Impact équipe
- **Courbe d'apprentissage** : Faible (dev confortable avec les tests automatisés)
- **Compétences requises** : Playwright, patterns d'injection de dépendances pour les providers IA
- **Disruption estimée** : ~2-3 jours pour setup + premier test complet

### Impact technique
- **Nouveau fichier** : `webapp/src/lib/ai/in-memory-scene-image-generator.ts`
- **Nouvelles variables d'env** : `STORY_PROVIDER`, `IMAGE_GENERATION_PROVIDER`
- **Câblage sélection provider** : lecture des variables d'env au démarrage pour choisir l'implémentation
- **Nouveau fichier Docker** : `docker-compose.test.yml` (Postgres + MinIO sur ports dédiés)
- **Nouveau dossier** : `webapp/tests/e2e/` + `webapp/tests/e2e/helpers/` pour les fonctions de mock réseau
- **Fixtures** : `webapp/public/test-fixtures/` (images de test)
- **Nouvelles dépendances** : `@playwright/test@1.61.1`

## Critères de succès

- [ ] `npm run test:e2e` passe en < 1 minute
- [ ] 0% de flakiness : 10 runs consécutifs → 10 succès
- [ ] Le test couvre le happy path complet (landing → résultat)
- [ ] Aucune pollution : la base `bookcreator` de dev n'est jamais modifiée par les tests
- [ ] Aucun appel réseau vers Replicate ou Ollama pendant les tests
- [ ] Un agent de code peut lancer le test et interpréter un échec via le rapport Playwright
- [ ] Les sélecteurs utilisés sont tous accessibles (audit manuel du code de test)

## Risques et mitigation

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Flakiness des tests (races conditions loading) | Moyenne | Élevé | Contrôle déterministe via `page.route` + Promise, pas de `waitForTimeout` |
| Divergence mock vs vrai Replicate | Moyenne | Moyen | Contrat de retour identique + audit manuel à chaque évolution du provider |
| État résiduel Postgres/MinIO entre tests | Faible | Moyen | Un seul test pour l'instant, à surveiller ; ajouter reset si flakiness |
| Migrations non rejouées sur base test | Moyenne | Moyen | Automatiser via `globalSetup` Playwright |
| Conteneurs de test qui tournent en dev | Faible | Faible | `docker-compose.test.yml` séparé, arrêtés par défaut |
| Test trop lent (> 1min) | Faible | Faible | Parallélisation Playwright, mocks IA instantanés |

## Plan de rollback

Si l'approche ne fonctionne pas :
1. Supprimer le dossier `webapp/tests/e2e/`
2. Retirer `@playwright/test` de `package.json`
3. Supprimer `docker-compose.test.yml`
4. **Conserver** `in-memory-scene-image-generator.ts` (utile pour développement local sans Replicate)
5. **Conserver** les variables `STORY_PROVIDER` / `IMAGE_GENERATION_PROVIDER` (utiles pour développement local)

Temps de rollback estimé : < 30 minutes.

## Coûts

**Coût d'adoption :**
- Setup initial : ~1 jour (Playwright + docker-compose.test.yml + mocks)
- Premier test E2E : ~1 jour (parcours complet + helpers `page.route`)
- Câblage sélection provider via env : ~0.25 jour

**Coût du statu quo :**
- Test manuel systématique du happy path à chaque itération agentique (~5 min × N itérations)
- Impossibilité de scaler le développement agentique
- Risque de régression silencieuse

**Break-even** : dès ~10 itérations agentiques (soit ~1 semaine de développement).

## Timeline

- **Phase 1 — Mocks IA (0.5j)** : `in-memory-scene-image-generator`, mock générateur d'histoire, sélection via `STORY_PROVIDER` / `IMAGE_GENERATION_PROVIDER`
- **Phase 2 — Infrastructure test (0.5j)** : `docker-compose.test.yml` (Postgres + MinIO), `globalSetup` Playwright (migrations + bucket)
- **Phase 3 — Helpers réseau (0.25j)** : fonctions `mockStoryGenerationRequest`, `mockSceneImagesRequest` réutilisables
- **Phase 4 — Premier test E2E (1j)** : happy path complet avec contrôle des états loading via `page.route`
- **Phase 5 — Documentation (0.25j)** : README section "Tests", commande pour agents

**Durée totale** : ~2.5 jours

## Décisions complémentaires

### Simulation d'échecs réseau — **Reporté**

Le fake provider n'expose qu'une méthode `resolve` (pas de `reject`) pour cette première itération. Les cas d'erreur seront couverts plus tard, une fois le happy path stabilisé.

### Traces et screenshots Playwright — **Ephémères uniquement**

- **Session courante** : traces + screenshots + vidéos disponibles pour debug (via `--trace on-first-retry` et `--screenshot only-on-failure`)
- **Pas de persistance long terme** : les artefacts sont écrits dans `webapp/test-results/` (déjà présent dans `.gitignore` ou à ajouter)
- **Pas de reporter HTML persisté** : rapport disponible pendant la session, jeté ensuite

### CI — **Reportée mais structure préparée**

La CI n'est pas mise en place maintenant, mais les choix suivants la rendent triviale à activer plus tard :

- **Fichier `docker-compose.test.yml` autonome** : lancé via `docker compose -f docker-compose.test.yml up -d`, aucune dépendance à des chemins locaux
- **Variables d'env centralisées** : `.env.test` versionné (sans secrets) — utilisable tel quel en CI
- **Playwright config CI-ready** : `retries: process.env.CI ? 2 : 0`, workers configurés
- **Pas de dépendance à un `.env` local** : le runner Playwright charge son propre env
- **Script atomique** : `npm run test:e2e` démarre les services + rejoue les migrations + lance Playwright sans intervention manuelle

## Décision

**À valider par le développeur.**

---

## Post-cadrage : actions

Une fois ce document validé :
1. Créer les tâches d'implémentation dans `docs/TODO.md` selon la timeline
2. Mettre à jour `CLAUDE.md` (racine ou `webapp/`) avec les conventions de tests (sélecteurs accessibles, `page.route` pour le contrôle du loading, mocks via env vars)
