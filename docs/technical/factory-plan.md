# Uniformisation des factories + création d'un skill Claude Code

## Context

Le projet possède aujourd'hui **4 factories** qui produisent des adaptateurs sélectionnés selon une variable d'environnement (`env.XXX_PROVIDER`). Elles suivent chacune un pattern légèrement différent : nommage de fichier hétérogène (`factory.ts` vs `xxx-factory.ts`), certaines async avec `await import()` alors que d'autres sont sync, cache singleton géré de 3 façons, gestion du provider inconnu incohérente (throw / fallback silencieux / pas de default), logs à des endroits différents, `.toLowerCase()` défensif redondant avec Zod.

**Intention** : figer une convention unique, migrer les 4 factories dessus, puis créer un skill Claude Code que l'agent invoquera quand il devra créer une nouvelle factory.

## Convention retenue

Pattern uniforme, décidé après recherche des bonnes pratiques TS 2024-2026 (refactoring.guru, Matt Pocock, MDN, Fowler) et arbitrage utilisateur :

```ts
// <domain>-factory.ts
import { env } from "@/config/env";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import { XxxImplA } from "./impl-a";
import { XxxImplB } from "./impl-b";
import type { Xxx } from "./xxx";

type Provider = typeof env.XXX_PROVIDER;

const providers = {
  "impl-a": () => new XxxImplA(),
  "impl-b": () => new XxxImplB(),
} satisfies Record<Provider, () => Xxx>;

let cachedInstance: Xxx | null = null;

export function getXxx(): Xxx {
  if (cachedInstance) {
    return cachedInstance;
  }

  const provider = env.XXX_PROVIDER;
  getLogger().info("Xxx provider selected", { provider });

  cachedInstance = providers[provider]();
  return cachedInstance;
}
```

**Règles :**

| Aspect | Choix |
|---|---|
| Nom fichier | `<domain>-factory.ts` (pas `factory.ts`) |
| Nom fonction publique | `get<Domain>()` |
| Cache singleton | `let cachedInstance: T \| null = null;` module-level |
| Sync/async | **Sync**, retour `T` (pas `Promise<T>`) |
| Imports | **Statiques** en haut du fichier (pas `await import()`) |
| Dispatch | `Record<Provider, () => T> satisfies` |
| Type Provider | `type Provider = typeof env.XXX_PROVIDER;` (déjà `z.enum` côté Zod) |
| Log | 1 seul `logger.info(...)` juste avant le dispatch, avec `{ provider }` |
| Cas inconnu | Non nécessaire : `satisfies` + Zod = exhaustivité build-time. Pas de `default`, pas de fallback silencieux |
| `.toLowerCase()` | Supprimer partout — Zod fixe la casse au parse |
| DI, reset, mocks | Hors scope aujourd'hui (pas de tests) |

**Exception `logger-factory`** : ne loggue pas le provider (chicken/egg — le logger n'est pas encore initialisé). Toutes les autres factories loggent.

## Fichiers à modifier

### 1. Renommer & réécrire les 2 factories `factory.ts`

- `webapp/src/lib/scene-image-generator/factory.ts` → `webapp/src/lib/scene-image-generator/scene-image-generator-factory.ts`
  - Supprimer `await import()`, importer statiquement `ReplicateSceneImageGenerator` et `InMemorySceneImageGenerator`
  - Supprimer `.toLowerCase()`
  - Passer en sync : `getSceneImageGenerator(): SceneImageGenerator`
  - La `ExponentialBackoffRetryStrategy` reste instanciée à l'intérieur du callback `replicate`
  - Provider `"mock"` doit correspondre à `InMemorySceneImageGenerator` (aujourd'hui atteint via `default`)
- `webapp/src/lib/story-scenes-description-generator/factory.ts` → `webapp/src/lib/story-scenes-description-generator/story-scenes-description-generator-factory.ts`
  - Idem : imports statiques, sync, sans `toLowerCase`
  - **Bug latent à corriger** : aujourd'hui `env.STORY_PROVIDER = "mock"` tombe dans le `default`, pas dans un case explicite. Le nouveau `Record` a une clé `mock: () => new InMemorySceneGenerator()` explicite
  - Envisager de renommer la classe `InMemorySceneGenerator` en `InMemoryStoryScenesDescriptionGenerator` pour cohérence — **optionnel**, à valider

### 2. Réécrire les 2 factories déjà en `<domain>-factory.ts`

- `webapp/src/lib/infrastructure/storage/storage-factory.ts`
  - Supprimer l'export `createStorage()` (garder uniquement `getStorage()`)
  - Passer du `switch` au `Record`
  - Déplacer le `logger.info(...)` **avant** le dispatch (aujourd'hui dans chaque `case`)
  - Retirer le `throw` du `default` — devenu inaccessible avec `Record + satisfies`
- `webapp/src/lib/infrastructure/logging/logger-factory.ts`
  - Passer du `switch` au `Record`
  - Garder l'absence de log (chicken/egg)
  - Structure finale minimaliste, cohérente avec les 3 autres factories

### 3. Mettre à jour les callers

Grep déjà fait — les usages à corriger pour les factories renommées :
- `webapp/src/app/api/stories/[id]/images-generation/route.ts:41` (`await getSceneImageGenerator()` → `getSceneImageGenerator()`, import path)
- `webapp/src/app/api/stories/[id]/scenario-generation/route.ts:40` (`await getStoryScenesDescriptionGenerator()` → `getStoryScenesDescriptionGenerator()`, import path)
- Chercher tous les usages de `createStorage` pour valider qu'il n'est appelé nulle part (sinon les migrer sur `getStorage`)

## Skill à créer

**Emplacement** : `webapp/.claude/skills/factory-pattern/SKILL.md`

Aligné sur le format des skills existants (frontmatter YAML + sections `## Overview`, `## When to Apply`, `## Requirements`, `## Convention`, `## Template`, `## Verification Checklist`, `## Common Anti-Patterns`), à l'image de `webapp/.claude/skills/shadcn/SKILL.md`.

**Contenu clé** :
- **Triggers** : "créer une factory", "nouvelle factory", "factory pattern", "adapter selon env"
- **When to apply** : dès qu'il faut sélectionner une implémentation d'interface parmi plusieurs selon `env.XXX_PROVIDER`
- **Template de fichier** copiable-collable (voir bloc code ci-dessus)
- **Convention de nommage** (fichier, fonction, type Provider)
- **Ordre du code** dans le fichier (imports, type Provider, providers Record, cache, fonction get)
- **Emplacement conventionnel** : à côté de l'interface qu'elle produit (même dossier que `<domain>.ts`)
- **Exceptions documentées** :
  - Pas de log dans `logger-factory` (chicken/egg)
  - Injection de deps dans le callback du Record si construction non triviale (ex : `ExponentialBackoffRetryStrategy` pour Replicate)
- **Checklist de vérification** avant de terminer
- **Anti-patterns à éviter** : `factory.ts` court, `await import()`, `.toLowerCase()`, fallback silencieux, `createXxx` + `getXxx` exposés en double

## Vérification

1. **Type-check** : `cd webapp && npm run check` doit passer sans erreur
2. **Lint** : `cd webapp && npm run lint` sans erreur
3. **Build** : `cd webapp && npm run build` doit passer sans erreur
4. **Grep de non-régression** :
   - `grep -r "await getSceneImageGenerator\|await getStoryScenesDescriptionGenerator" webapp/src` → aucun résultat (le `await` est mort)
   - `grep -r "createStorage" webapp/src` → aucun résultat hors du fichier lui-même (fonction supprimée)
   - `grep -r "toLowerCase()" webapp/src/lib` → aucun résultat dans les factories
   - `grep -rn "from.*scene-image-generator/factory\|from.*story-scenes-description-generator/factory" webapp/src` → aucun résultat (anciens chemins)
5. **Boot en dev** : `cd webapp && npm run dev`, vérifier que les logs `"Xxx provider selected"` apparaissent bien pour chaque provider, une fois au premier appel
6. **Test manuel end-to-end** : lancer une génération de story puis d'image sur `/stories/[id]`, vérifier que les singletons se comportent bien (2 requêtes successives → même instance)
7. **Skill utilisable** : depuis Claude Code, taper `/factory-pattern` (ou équivalent) et vérifier que le skill se charge, propose le template