import { env } from "@/config/env";
import { ExponentialBackoffRetryStrategy } from "@/lib/infrastructure/http-request-retry-strategy/exponential-backoff/exponential-backoff-retry-strategy";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import { InMemorySceneGenerator } from "@/lib/story-scenes-description-generator/in-memory/in-memory-story-generator";
import { OllamaStoryGenerator } from "@/lib/story-scenes-description-generator/ollama/ollama-story-generator";
import { ReplicateStoryScenesDescriptionGenerator } from "@/lib/story-scenes-description-generator/replicate/replicate-story-scenes-description-generator";
import type { StoryScenesDescriptionGenerator } from "@/lib/story-scenes-description-generator/story-scenes-description-generator";
import type { StoryScenesDescriptionGeneratorProvider } from "@/lib/story-scenes-description-generator/story-scenes-description-generator-provider";

const providers = {
	ollama: () => new OllamaStoryGenerator(),
	replicate: () =>
		new ReplicateStoryScenesDescriptionGenerator(
			new ExponentialBackoffRetryStrategy()
		),
	mock: () => new InMemorySceneGenerator(),
} satisfies Record<
	StoryScenesDescriptionGeneratorProvider,
	() => StoryScenesDescriptionGenerator
>;

let cachedInstance: StoryScenesDescriptionGenerator | null = null;

export function getStoryScenesDescriptionGenerator(): StoryScenesDescriptionGenerator {
	if (cachedInstance) {
		return cachedInstance;
	}

	const provider = env.STORY_PROVIDER;
	getLogger().info("Story scenes description generator provider selected", {
		provider,
	});

	cachedInstance = providers[provider]();
	return cachedInstance;
}
