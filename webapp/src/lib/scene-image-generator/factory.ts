import { env } from "@/config/env";
import { ExponentialBackoffRetryStrategy } from "@/lib/infrastructure/http-request-retry-strategy/exponential-backoff/exponential-backoff-retry-strategy";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import type { SceneImageGenerator } from "@/lib/scene-image-generator/scene-image-generator";

let cachedInstance: SceneImageGenerator | null = null;

export async function getSceneImageGenerator(): Promise<SceneImageGenerator> {
	if (cachedInstance) {
		return cachedInstance;
	}

	const provider = env.IMAGE_GENERATION_PROVIDER;

	getLogger().info("Image Generator provider selected", {
		provider: provider.toLowerCase(),
	});

	switch (provider.toLowerCase()) {
		case "replicate": {
			const { ReplicateSceneImageGenerator } = await import(
				"@/lib/scene-image-generator/replicate/replicate-scene-image-generator"
			);
			const retryStrategy = new ExponentialBackoffRetryStrategy();
			cachedInstance = new ReplicateSceneImageGenerator(retryStrategy);
			break;
		}
		default: {
			const { InMemorySceneImageGenerator } = await import(
				"@/lib/scene-image-generator/in-memory/in-memory-scene-image-generator"
			);
			cachedInstance = new InMemorySceneImageGenerator();
			break;
		}
	}

	return cachedInstance;
}
