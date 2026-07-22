import { env } from "@/config/env";
import { ExponentialBackoffRetryStrategy } from "@/lib/infrastructure/http-request-retry-strategy/exponential-backoff/exponential-backoff-retry-strategy";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import { InMemorySceneImageGenerator } from "@/lib/scene-image-generator/in-memory/in-memory-scene-image-generator";
import { ReplicateSceneImageGenerator } from "@/lib/scene-image-generator/replicate/replicate-scene-image-generator";
import type { SceneImageGenerator } from "@/lib/scene-image-generator/scene-image-generator";
import type { SceneImageGeneratorProvider } from "@/lib/scene-image-generator/scene-image-generator-provider";

const providers = {
	replicate: () =>
		new ReplicateSceneImageGenerator(new ExponentialBackoffRetryStrategy()),
	mock: () => new InMemorySceneImageGenerator(),
} satisfies Record<SceneImageGeneratorProvider, () => SceneImageGenerator>;

let cachedInstance: SceneImageGenerator | null = null;

export function getSceneImageGenerator(): SceneImageGenerator {
	if (cachedInstance) {
		return cachedInstance;
	}

	const provider = env.IMAGE_GENERATION_PROVIDER;
	getLogger().info("Scene image generator provider selected", { provider });

	cachedInstance = providers[provider]();
	return cachedInstance;
}
