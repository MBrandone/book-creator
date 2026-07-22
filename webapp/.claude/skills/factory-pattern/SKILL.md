---
name: factory-pattern
description: Crée une factory TypeScript qui sélectionne une implémentation d'interface parmi plusieurs en fonction d'une variable d'environnement. Fournit le template unique du projet — dépendance inversée (la factory déclare la liste des providers, env s'y aligne), sync, static imports, Record<Provider, () => T> satisfies, singleton module-level, log info avant dispatch, pas de fallback silencieux. Applique quand tu ajoutes un nouvel adaptateur (nouveau provider LLM, storage, logger, etc.) qui doit se sélectionner au runtime.
user-invocable: true
triggers:
  - "créer une factory"
  - "nouvelle factory"
  - "factory pattern"
  - "adapter selon env"
  - "sélectionner un provider"
---

# Factory Pattern (book-creator)

## Overview

Ce projet utilise **un seul pattern** de factory pour choisir entre plusieurs implémentations d'une même interface à partir d'une variable d'environnement. Toute factory nouvellement créée DOIT suivre ce pattern à la lettre.

**Principe clé — dépendance inversée** : la source de vérité des valeurs autorisées est **à côté de la factory** (fichier `<domain>-provider.ts`), pas dans `env.schema.ts`. Le schéma Zod importe cette liste. Ajouter un provider = modifier **un seul** endroit dans le domaine, le schéma se met à jour automatiquement.

## When to Apply

**Utilise ce skill quand :**
- Tu ajoutes une nouvelle interface avec 2+ implémentations sélectionnables par variable d'environnement
- Tu ajoutes un nouveau provider à une factory existante (ex : ajouter `openai` à `scene-image-generator-factory.ts`)
- Tu vois du code qui devrait être une factory mais ne l'est pas (switch/if-else dans les callers pour choisir une implémentation)

**N'utilise pas ce skill pour :**
- Créer une classe simple sans polymorphisme au runtime
- Créer un builder pattern (construction en plusieurs étapes)
- Créer un helper de test qui produit des fixtures

## Convention

### Deux fichiers par factory

| Fichier | Rôle | Exemple |
|---|---|---|
| `<domain>-provider.ts` | Liste `as const` des providers + type dérivé. **N'importe rien du domaine ni de `env`** | `scene-image-generator-provider.ts` |
| `<domain>-factory.ts` | Dispatch runtime, imports des implémentations, cache singleton, log | `scene-image-generator-factory.ts` |

Cette séparation empêche les cycles d'import (env.schema → provider ← factory → env).

### Règles de nommage

| Élément | Règle | Exemple |
|---|---|---|
| Fichier provider | `<domain>-provider.ts` | `storage-provider.ts` |
| Fichier factory | `<domain>-factory.ts` | `storage-factory.ts` |
| Constante des valeurs | `SCREAMING_SNAKE_CASE` en `... as const` | `STORAGE_PROVIDERS` |
| Type dérivé | `PascalCaseProvider` | `StorageProvider` |
| Fonction exportée | `get<Domain>()` | `getStorage()` |
| Cache (privé) | `let cachedInstance: T \| null = null;` | — |

### Comportement de la factory

- **Sync uniquement** — la fonction retourne `T`, pas `Promise<T>`
- **Imports statiques uniquement** — jamais de `await import(...)`
- **Singleton module-level** — cache la première instance construite
- **Log `info` avant le dispatch** avec `{ provider }` (une seule fois grâce au cache)
- **Aucun `default`, aucun `throw` de fallback** — `satisfies` garantit l'exhaustivité à la compilation, Zod garantit la validité au boot
- **Pas de `.toLowerCase()` sur `env.XXX`** — Zod (`z.enum(...)`) fixe déjà la casse

## Template

### 1. Fichier `<domain>-provider.ts`

```ts
export const XXX_PROVIDERS = ["impl-a", "impl-b"] as const;

export type XxxProvider = (typeof XXX_PROVIDERS)[number];
```

### 2. Fichier `<domain>-factory.ts`

```ts
import { env } from "@/config/env";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import { XxxImplA } from "./impl-a/xxx-impl-a";
import { XxxImplB } from "./impl-b/xxx-impl-b";
import type { Xxx } from "./xxx";
import type { XxxProvider } from "./xxx-provider";

const providers = {
	"impl-a": () => new XxxImplA(),
	"impl-b": () => new XxxImplB(),
} satisfies Record<XxxProvider, () => Xxx>;

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

### 3. Câblage dans `env.schema.ts`

**Important** : les imports vers les fichiers `-provider.ts` dans `env.schema.ts` DOIVENT être relatifs (`../lib/...`), pas alias `@/lib/...`. Next.js compile `next.config.ts` en CJS et ne résout pas les alias transitifs à ce moment-là.

```ts
import { XXX_PROVIDERS } from "../lib/<domain>/xxx-provider";

// dans le schéma
XXX_PROVIDER: z.enum(XXX_PROVIDERS),
```

### Étapes pour créer une nouvelle factory

1. **Créer `<domain>-provider.ts`** avec la liste `as const` et le type dérivé
2. **Créer `<domain>-factory.ts`** en copiant le template
3. **Câbler `env.schema.ts`** — import relatif du provider + `z.enum(XXX_PROVIDERS)`
4. **Documenter la variable** dans `.env.example` avec les valeurs possibles
5. **Vérifier l'exhaustivité** — TypeScript doit refuser de compiler si une clé de l'enum manque du `Record`
6. **Utiliser depuis les callers** — appel sync direct : `const x = getXxx()` (pas de `await`)

### Étapes pour ajouter un nouveau provider à une factory existante

1. Étendre la liste dans le fichier `-provider.ts` : `["impl-a", "impl-b", "impl-c"] as const`
2. Créer la classe d'implémentation (ex : `xxx-impl-c.ts`)
3. Ajouter la clé au `providers` de la factory — le compilateur exige de couvrir l'exhaustivité
4. Documenter la nouvelle valeur dans `.env.example`

## Exceptions documentées

- **`logger-factory.ts`** ne loggue pas le provider — chicken/egg, le logger n'est pas encore initialisé. Toutes les autres factories doivent logguer.
- **`logger-provider.ts`** exporte 3 listes (`SENTRY_LOGGER_PROVIDER`, `NON_SENTRY_LOGGER_PROVIDERS`, `LOGGER_PROVIDERS`) car le schéma Zod utilise une union discriminée sur `LOGS_PROVIDER` (Sentry impose des vars additionnelles). C'est l'unique cas ; les autres factories exposent une seule liste.
- **Injection de dépendances dans le callback** : si la construction n'est pas triviale, instancie les dépendances directement dans le callback du `Record`. Exemple depuis `scene-image-generator-factory.ts` :
  ```ts
  replicate: () =>
      new ReplicateSceneImageGenerator(new ExponentialBackoffRetryStrategy()),
  ```
  Le callback reste une simple fonction `() => T` — pas de paramètres.

## Verification Checklist

Avant de considérer la factory terminée :

- [ ] Deux fichiers créés : `<domain>-provider.ts` + `<domain>-factory.ts`
- [ ] `<domain>-provider.ts` **n'importe rien** de `env`, ni du domaine (juste `as const` + type)
- [ ] `env.schema.ts` importe la liste avec un chemin relatif (`../lib/...`), pas un alias
- [ ] Le schéma Zod utilise `z.enum(XXX_PROVIDERS)` (pas de duplication de la liste)
- [ ] Fonction exportée `get<Domain>(): T` (sync, pas `Promise<T>`)
- [ ] Tous les imports de la factory sont statiques (pas de `await import(...)`)
- [ ] `providers` typé avec `satisfies Record<XxxProvider, () => T>`
- [ ] Cache singleton `let cachedInstance: T | null = null;` présent
- [ ] Log `getLogger().info("... provider selected", { provider })` **avant** le dispatch (sauf logger-factory)
- [ ] Aucun `switch`, `default`, `throw`, `.toLowerCase()`, `if (!provider)`
- [ ] Le compilo TS refuse de compiler si une clé de l'enum manque du `Record`
- [ ] `npm run check` + `npm run lint` + `npm run build` passent depuis `webapp/`
- [ ] Les callers appellent la factory **sans `await`**

## Common Anti-Patterns

| Anti-Pattern | Pourquoi c'est un problème | Correction |
|---|---|---|
| Enum TypeScript (`enum XxxProvider { ... }`) | Génère du code runtime, tree-shaking dégradé, incompatible `erasableSyntaxOnly` | Tableau `as const` + type dérivé |
| Liste dupliquée dans `env.schema.ts` (`z.enum(["a", "b"])`) | Source de vérité éclatée, dérive silencieuse | Importer `XXX_PROVIDERS` depuis `-provider.ts` |
| Import alias `@/lib/...` dans `env.schema.ts` | Casse le build : Next.js compile `next.config.ts` en CJS sans résoudre les alias transitifs | Import relatif `../lib/...` |
| Fusion `-provider.ts` et `-factory.ts` en un seul fichier | Crée un cycle `env.schema → factory → env` → build cassé | Deux fichiers séparés |
| `factory.ts` (nom court) | Collision d'onglets IDE quand plusieurs factories cohabitent | `<domain>-factory.ts` |
| `async function getXxx()` + `await import(...)` | Contamine tous les callers avec `await`, casse tree-shaking et mocks | Sync + imports statiques |
| `switch (provider) { case ... default: ... }` | Verbeux, ouvre la porte au fallback silencieux | `Record<XxxProvider, () => T> satisfies` |
| `provider.toLowerCase()` | Défense morte : Zod fixe déjà la casse au parse | Supprimer |
| `default: return new InMemoryXxx()` | Fallback silencieux = bug fantôme en prod si config invalide | Zod + `satisfies` = exhaustivité build-time |
| `throw new Error("Unknown provider")` runtime | Mort : Zod bloque déjà au boot, `satisfies` bloque à la compilation | Supprimer |
| Exporter `createXxx()` **et** `getXxx()` | Sémantique brouillée (nouvelle instance vs singleton) | Un seul verbe : `getXxx()` |
| `logger-factory` avec `getLogger().info(...)` dans lui-même | Récursion / logger non-initialisé | `logger-factory` ne loggue pas — c'est l'unique exception |

## Références

- 4 factories du projet qui suivent ce pattern :
  - `webapp/src/lib/scene-image-generator/scene-image-generator-provider.ts` + `-factory.ts`
  - `webapp/src/lib/story-scenes-description-generator/story-scenes-description-generator-provider.ts` + `-factory.ts`
  - `webapp/src/lib/infrastructure/storage/storage-provider.ts` + `storage-factory.ts`
  - `webapp/src/lib/infrastructure/logging/logger-provider.ts` + `logger-factory.ts`
- Câblage dans `webapp/src/config/env.schema.ts`
- Justification technique : `docs/technical/factory-plan.md`
