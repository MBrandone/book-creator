# Plan : Déplacer `Sentry.flush` hors du service applicatif via `after()`

## Contexte

`StoryImagesGeneratorService.generate()` contient un `Sentry.flush(2000)` dans un `finally`. Ce flush est nécessaire parce que le command handler lance la génération en fire-and-forget (sans `await`), puis la route renvoie un 202 immédiatement. Sans flush, les événements Sentry capturés pendant la génération background risquent de ne jamais être envoyés si le runtime coupe le contexte.

Le problème : ce `Sentry.flush` est une préoccupation d'infrastructure liée au cycle de vie du runtime. Il n'a pas sa place dans un service applicatif en architecture hexagonale.

## Approche : utiliser `after()` de Next.js

Next.js 15+ (le projet est en 16.2) fournit `after()` qui garantit que le travail s'exécute après l'envoi de la réponse tout en maintenant le runtime vivant.

## Modifications

### 1. Route `src/app/api/stories/[id]/images-generation/route.ts`

- Importer `after` depuis `next/server`
- Le command handler garde sa signature `Promise<void>` — il fait `startGeneration()` + save
- Après le `await commandHandler.execute(storyId)`, utiliser `after()` pour lancer la génération en background :
  ```
  await commandHandler.execute(storyId)   // startGeneration + save
  after(() => storyImagesGeneratorService.generate(storyId))
  return 202
  ```
- C'est la route (adaptateur driving) qui décide du modèle d'exécution background

### 2. Command handler `src/lib/application/handlers/command/generate-images/generate-images-command-handler.ts`

- Retirer le fire-and-forget (`this.storyImagesGeneratorService.generate(story).catch(...)`)
- Retirer la dépendance à `StoryImagesGeneratorService` (plus besoin)
- `execute()` ne fait que : fetch story → `startGeneration()` → save
- Signature inchangée : `async execute(storyId: string): Promise<void>`

### 3. Service `src/lib/story-generator-service/story-images-generator-service.ts`

- Retirer le `try/finally` avec `Sentry.flush` dans `generate()`
- Modifier la signature de `generate()` pour prendre un `storyId: string` au lieu d'un `Story`
- `generate()` charge l'agrégat via `this.storyRepository.get(storyId)`, vérifie que le statut est "generating", puis lance `generateImages()`
- `generate()` appelle directement `generateImages()` — plus besoin de l'enrobage try/finally

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/app/api/stories/[id]/images-generation/route.ts` | Ajouter `after()`, appeler `generate(storyId)` dedans |
| `src/lib/application/handlers/command/generate-images/generate-images-command-handler.ts` | Retirer fire-and-forget et la dépendance au service de génération |
| `src/lib/story-generator-service/story-images-generator-service.ts` | Retirer `Sentry.flush`, changer signature pour `storyId`, charger l'agrégat et vérifier le statut |

## Vérification

1. Lancer `npm run build` — vérifier que ça compile
2. Tester manuellement : lancer une génération d'images, vérifier que :
   - La réponse 202 arrive immédiatement
   - Les images sont bien générées (status passe à `completed`)
   - En cas d'erreur, le status passe à `failed`
3. Vérifier dans Sentry qu'une erreur provoquée volontairement remonte bien
