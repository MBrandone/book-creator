import { env } from "@/config/env";
import { ExponentialBackoffRetryStrategy } from "@/lib/infrastructure/http-request-retry-strategy/exponential-backoff/exponential-backoff-retry-strategy";
import type { SceneImageGenerator } from "@/lib/scene-image-generator/scene-image-generator";

export class SceneImageGeneratorFactory {
	private static instance: SceneImageGenerator | null = null;

	static async getGenerator(): Promise<SceneImageGenerator> {
		if (SceneImageGeneratorFactory.instance) {
			return SceneImageGeneratorFactory.instance;
		}

		const provider = env.IMAGE_GENERATION_PROVIDER;

		console.log("Image Generator provider:", provider.toLowerCase());

		switch (provider.toLowerCase()) {
			case "replicate": {
				const { ReplicateSceneImageGenerator } = await import(
					"@/lib/scene-image-generator/replicate/replicate-scene-image-generator"
				);
				const retryStrategy = new ExponentialBackoffRetryStrategy();
				SceneImageGeneratorFactory.instance = new ReplicateSceneImageGenerator(
					retryStrategy
				);
				break;
			}
			case "mock":
			default: {
				const { InMemorySceneImageGenerator } = await import(
					"@/lib/scene-image-generator/in-memory/in-memory-scene-image-generator"
				);
				SceneImageGeneratorFactory.instance = new InMemorySceneImageGenerator();
				break;
			}
		}

		return SceneImageGeneratorFactory.instance;
	}
}
