# Guide : Logging (Logger port + Sentry)

> Référence d'implémentation issue du cadrage `2026-07-17-logging-strategy.md`.

## Principe

Le logging suit le pattern **Ports & Adapters** déjà en place pour le storage. Le code applicatif ne connaît que l'interface `Logger` — jamais une implémentation concrète. Changer de backend (Sentry → autre) = écrire un adapter + changer `LOG_PROVIDER`.

```
domain / application  ──dépend de──▶  Logger (interface)
                                            ▲
                        ┌───────────────────┼───────────────────┐
                 SentryLogger         ConsoleLogger         NoopLogger
                 (production)         (development)          (test)
```

## Fichiers

| Chemin | Rôle |
|---|---|
| `src/lib/infrastructure/logging/logger.ts` | Interface `Logger` + type `LogAttributes` |
| `src/lib/infrastructure/logging/console-logger.ts` | Adapter dev (sortie formatée lisible) |
| `src/lib/infrastructure/logging/noop-logger.ts` | Adapter test (no-op complet) |
| `src/lib/infrastructure/logging/sentry-logger.ts` | Adapter prod (`Sentry.logger.*`) |
| `src/lib/infrastructure/logging/logger-factory.ts` | Factory + singleton `getLogger()` |
| `sentry.server.config.ts` | Init Sentry serveur (`enableLogs: true`) |
| `instrumentation.ts` | Point d'entrée Next.js pour l'init Sentry |

## Usage

### Dans une route handler (via singleton)

```ts
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";

export async function POST(request: NextRequest) {
  try {
    // ...
  } catch (error) {
    getLogger().error("Description de l'erreur", { error: String(error) });
    return new NextResponse(null, { status: 500 });
  }
}
```

### Dans un service (via injection au constructeur)

```ts
import type { Logger } from "@/lib/infrastructure/logging/logger";

export class MonService {
  constructor(private readonly logger: Logger) {}

  async execute(entityId: string): Promise<void> {
    const entityLogger = this.logger.child({ entityId });
    entityLogger.info("Traitement démarré");
    // ...
    entityLogger.info("Traitement terminé", { result: "ok" });
  }
}
```

La route instancie avec `getLogger()` :

```ts
const service = new MonService(getLogger());
```

### Niveaux disponibles

```ts
logger.debug("Message de debug", { key: "value" });
logger.info("Événement normal", { key: "value" });
logger.warn("Situation anormale non bloquante", { key: "value" });
logger.error("Erreur", { error: String(error) });
```

### Contexte enfant (corrélation)

Plutôt que d'injecter un identifiant manuellement dans chaque message, crée un logger enfant — il propage le contexte à tous les appels suivants :

```ts
const storyLogger = this.logger.child({ storyId: story.id });
storyLogger.info("Génération démarrée");
storyLogger.warn("Scène manquante", { sceneNumber: 2 });
// → tous les logs incluent automatiquement { storyId: "..." }
```

### Attributs structurés

Les attributs sont un `Record<string, string | number | boolean>`. Ils deviennent des champs requêtables dans Sentry.

```ts
logger.info("Image générée", {
  key: "images/generated/abc.webp",
  bytes: 204800,
  durationMs: 3200,
});
```

## Variables d'environnement

| Variable | Valeurs | Par défaut |
|---|---|---|
| `LOG_PROVIDER` | `sentry`, `console`, `noop` | `console` (dev), `sentry` (prod) |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` | `info` |
| `SENTRY_DSN` | URL Sentry | requis en prod |
| `NEXT_PUBLIC_SENTRY_DSN` | URL Sentry (client) | requis en prod (Phase 5) |
| `SENTRY_ORG` | Slug organisation Sentry | pour `withSentryConfig` |
| `SENTRY_PROJECT` | Slug projet Sentry | pour `withSentryConfig` |

En test, `.env.test` impose `LOG_PROVIDER=noop` — les logs sont silencieux automatiquement.

## Règle Biome

`noConsole: "error"` est actif dans `biome.json`. Tout `console.*` dans `src/` fait échouer `npm run lint`, sauf :

- `scripts/**` — scripts CLI (exception actée)
- `src/config/env.ts` — validation au démarrage
- `next.config.ts` — validation de build
- `src/lib/infrastructure/logging/console-logger.ts` — l'adapter lui-même
- `src/components/service-worker-registration.tsx` — migré en Phase 5 (utilise `getBrowserLogger()`)

## Tâches de fond et flush Sentry

Les services qui tournent en fire-and-forget (`StoryGeneratorService`, `StoryImagesGeneratorService`) appellent `await Sentry.flush(2000)` dans un `finally` avant la fin de l'exécution. Sur Vercel Node serverless, les fonctions peuvent être gelées avant que Sentry vide son buffer — ce pattern garantit que les logs arrivent.

```ts
async generate(story: Story): Promise<void> {
  try {
    await this.generateStory(story);
  } finally {
    await Sentry.flush(2000);
  }
}
```

## Règles à respecter

- **Ne jamais importer** `console`, `pino`, `@sentry/nextjs` directement dans le domaine ou l'application — uniquement dans les adapters sous `src/lib/infrastructure/logging/`.
- **Toujours passer les erreurs en attribut** : `{ error: String(error) }`, pas en second argument `console`-style.
- **Préférer l'injection** au constructeur pour les classes qui émettent beaucoup de logs (services, handlers) ; `getLogger()` est acceptable pour les usages ponctuels (routes, factories).
- **Ne jamais utiliser `console.*`** dans `src/` — le lint échoue et bloque le commit.
