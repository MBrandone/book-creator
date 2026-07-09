Principes d'implémentation (issus de tes retours)

🏛 Architecture DDD Tactique

1. Les règles métier vivent dans l'agrégat, pas dans le Command Handler
- Le Command Handler ne fait qu'orchestrer : get l'agrégat → appeler une méthode métier → save.
- Toute vérification de statut, de cardinalité, d'invariant → dans une méthode de l'agrégat (Story.startGeneration(), etc.).
- Exemple vécu : les checks status/characters.length ont migré du handler vers Story.startGeneration().

2. Erreurs domaine précises et dédiées
- Jamais de throw new Error("message") générique pour une règle métier.
- Une classe d'erreur par règle : StoryAlreadyGeneratingError, NoCharactersError, SceneNotFoundInStoryError...
- Ça permet à la route API de mapper vers le bon code HTTP (409, 400, 404).

3. Méthodes de domaine expressives (Ubiquitous Language)
- Nommer d'après l'action métier, pas le champ modifié : createScene(), setImageToScene() — jamais setScenes().
- Une méthode = un usage métier. Si elle sert deux cas, la scinder.
- Muter l'existant plutôt que recréer des entités (setImageToScene modifie la scène en place, ne reconstruit pas d'objet).

4. L'agrégat crée ses entités enfants
- Les services retournent des DTO bruts (GeneratedScene : pas d'ID, pas de référence parent).
- L'agrégat construit l'entité via createX() : génère l'ID, assigne le storyId, met les valeurs par défaut.

⚙️ Générations longues

- Handler → vérifs métier → statut generating + save → lancer la génération sans await (.catch() pour logger) → API renvoie 202 immédiatement.
- Le service persiste et met à jour le statut (completed/failed) en fin de tâche.
- Le front polle le statut puis redirige (pas d'affichage en double sur la page de création).

🧪 Tests E2E


2. Erreurs domaine précises et dédiées
- Jamais de throw new Error("message") générique pour une règle métier.
- Une classe d'erreur par règle : StoryAlreadyGeneratingError, NoCharactersError, SceneNotFoundInStoryError...
- Ça permet à la route API de mapper vers le bon code HTTP (409, 400, 404).

3. Méthodes de domaine expressives (Ubiquitous Language)
- Nommer d'après l'action métier, pas le champ modifié : createScene(), setImageToScene() — jamais setScenes().
- Une méthode = un usage métier. Si elle sert deux cas, la scinder.
- Muter l'existant plutôt que recréer des entités (setImageToScene modifie la scène en place, ne reconstruit pas d'objet).

4. L'agrégat crée ses entités enfants
- Les services retournent des DTO bruts (GeneratedScene : pas d'ID, pas de référence parent).
- L'agrégat construit l'entité via createX() : génère l'ID, assigne le storyId, met les valeurs par défaut.

⚙️ Générations longues

- Handler → vérifs métier → statut generating + save → lancer la génération sans await (.catch() pour logger) → API renvoie 202 immédiatement.
- Le service persiste et met à jour le statut (completed/failed) en fin de tâche.
- Le front polle le statut puis redirige (pas d'affichage en double sur la page de création).

🧪 Tests E2E

- Playwright lance le serveur avec les variables de .env.test (injectées dans webServer.env), pas .env.local.

📝 Style de code (rappel CLAUDE.md)

- Pas de commentaires : variables explicites + extraction de méthodes privées.