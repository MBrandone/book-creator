import { env } from "@/config/env";
import { ExponentialBackoffRetryStrategy } from "@/lib/infrastructure/http-request-retry-strategy/exponential-backoff/exponential-backoff-retry-strategy";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import type { StoryScenesDescriptionGenerator } from "@/lib/story-scenes-description-generator/story-scenes-description-generator";

let cachedInstance: StoryScenesDescriptionGenerator | null = null;

export async function getStoryScenesDescriptionGenerator(): Promise<StoryScenesDescriptionGenerator> {
	if (cachedInstance) {
		return cachedInstance;
	}

	const provider = env.STORY_PROVIDER;

	getLogger().info("Story Generator provider selected", {
		provider: provider.toLowerCase(),
	});

	switch (provider.toLowerCase()) {
		case "ollama": {
			const { OllamaStoryGenerator } = await import(
				"@/lib/story-scenes-description-generator/ollama/ollama-story-generator"
			);
			cachedInstance = new OllamaStoryGenerator();
			break;
		}
		case "replicate": {
			const { ReplicateStoryScenesDescriptionGenerator } = await import(
				"@/lib/story-scenes-description-generator/replicate/replicate-story-scenes-description-generator"
			);
			const retryStrategy = new ExponentialBackoffRetryStrategy();
			cachedInstance = new ReplicateStoryScenesDescriptionGenerator(
				retryStrategy
			);
			break;
		}
		default: {
			const { InMemorySceneGenerator } = await import(
				"@/lib/story-scenes-description-generator/in-memory/in-memory-story-generator"
			);
			cachedInstance = new InMemorySceneGenerator();
			break;
		}
	}

	return cachedInstance;
}
