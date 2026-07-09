import { env } from "@/config/env";
import type {
	ImageGenerationOptions,
	ImageGenerationResult,
	SceneImageGenerator,
} from "@/lib/scene-image-generator/scene-image-generator";

export class InMemorySceneImageGenerator implements SceneImageGenerator {
	readonly name = "InMemorySceneImageGenerator";

	async generateImage(
		options: ImageGenerationOptions
	): Promise<ImageGenerationResult> {
		const imageKey = `test-fixtures/scene.png`;

		return {
			bucket: env.STORAGE_BUCKET,
			key: imageKey,
			seed: options.seed || 42,
			prompt: options.prompt,
			provider: "mock",
			metadata: {
				aspectRatio: options.aspectRatio || "1:1",
				style: options.style || "watercolor",
			},
		};
	}
}
