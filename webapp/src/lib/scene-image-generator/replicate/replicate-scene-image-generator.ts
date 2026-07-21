import Replicate from "replicate";
import { env } from "@/config/env";
import type { RetryStrategy } from "@/lib/infrastructure/http-request-retry-strategy/retry-strategy";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import { getStorage } from "@/lib/infrastructure/storage/storage-factory";
import {
	DEFAULT_ASPECT_RATIO,
	DEFAULT_OUTPUT_FORMAT,
	DEFAULT_OUTPUT_MEGAPIXELS,
	FLUX_KLEIN_MODEL,
} from "@/lib/scene-image-generator/replicate/config";
import type {
	ImageGenerationOptions,
	ImageGenerationResult,
	SceneImageGenerator,
} from "../scene-image-generator";

export class ReplicateSceneImageGenerator implements SceneImageGenerator {
	readonly name = "replicate-flux-klein";
	private readonly client: Replicate;
	private readonly retryStrategy: RetryStrategy;

	constructor(retryStrategy: RetryStrategy) {
		this.client = new Replicate({ auth: env.REPLICATE_API_TOKEN });
		this.retryStrategy = retryStrategy;
	}

	async generateImage(
		options: ImageGenerationOptions
	): Promise<ImageGenerationResult> {
		const {
			prompt,
			seed,
			aspectRatio = DEFAULT_ASPECT_RATIO,
			referenceImages = [],
		} = options;

		getLogger().info("Generating image with Replicate Flux Klein", {
			aspectRatio,
			referenceImagesCount: referenceImages.length,
		});

		try {
			const input: any = {
				prompt,
				aspect_ratio: aspectRatio,
				output_megapixels: DEFAULT_OUTPUT_MEGAPIXELS,
				output_format: DEFAULT_OUTPUT_FORMAT,
				go_fast: true,
			};

			if (referenceImages.length > 0) {
				input.images = referenceImages.map((img) => img.dataUri);
			}

			if (seed) {
				input.seed = seed;
			}

			const output = await this.retryStrategy.execute(() =>
				this.client.run(FLUX_KLEIN_MODEL, { input })
			);

			getLogger().info("Image generated, retrieving from Replicate");

			const imageUrl = Array.isArray(output) ? output[0] : output;

			const response = await fetch(imageUrl);
			const arrayBuffer = await response.arrayBuffer();
			const imageBuffer = Buffer.from(arrayBuffer);

			const timestamp = Date.now();
			const filename = `images/generated/${timestamp}-${seed || "random"}.${DEFAULT_OUTPUT_FORMAT}`;

			const storage = getStorage();
			const { bucket, key } = await storage.uploadImage(imageBuffer, filename, {
				"Content-Type": `image/${DEFAULT_OUTPUT_FORMAT}`,
			});
			getLogger().info("Image uploaded to storage", {
				key,
				bytes: imageBuffer.length,
			});

			return {
				bucket,
				key,
				seed,
				prompt,
				provider: this.name,
				metadata: {
					aspectRatio,
					referenceImagesCount: referenceImages.length,
					filename,
				},
			};
		} catch (error) {
			getLogger().error("Error generating image", { error: String(error) });
			throw new Error(
				`Failed to generate image with Replicate Flux Klein: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}
}
