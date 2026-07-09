import { env } from "@/config/env";
import { ExponentialBackoffRetryStrategy } from "@/lib/infrastructure/http-request-retry-strategy/exponential-backoff/exponential-backoff-retry-strategy";
import type { StoryScenesDescriptionGenerator } from "@/lib/story-scenes-description-generator/story-scenes-description-generator";

export class StoryScenesDescriptionGeneratorFactory {
	private static instance: StoryScenesDescriptionGenerator | null = null;

	static async getGenerator(): Promise<StoryScenesDescriptionGenerator> {
		if (StoryScenesDescriptionGeneratorFactory.instance) {
			return StoryScenesDescriptionGeneratorFactory.instance;
		}

		const provider = env.STORY_PROVIDER;

		console.log("Story Generator provider : ", provider.toLowerCase());

		switch (provider.toLowerCase()) {
			case "ollama": {
				const { OllamaStoryGenerator } = await import(
					"@/lib/story-scenes-description-generator/ollama/ollama-story-generator"
				);
				StoryScenesDescriptionGeneratorFactory.instance =
					new OllamaStoryGenerator();
				break;
			}
			case "replicate": {
				const { ReplicateStoryScenesDescriptionGenerator } = await import(
					"@/lib/story-scenes-description-generator/replicate/replicate-story-scenes-description-generator"
				);
				const retryStrategy = new ExponentialBackoffRetryStrategy();
				StoryScenesDescriptionGeneratorFactory.instance =
					new ReplicateStoryScenesDescriptionGenerator(retryStrategy);
				break;
			}
			default: {
				const { InMemorySceneGenerator } = await import(
					"@/lib/story-scenes-description-generator/in-memory/in-memory-story-generator"
				);
				StoryScenesDescriptionGeneratorFactory.instance =
					new InMemorySceneGenerator();
				break;
			}
		}

		return StoryScenesDescriptionGeneratorFactory.instance;
	}
}
