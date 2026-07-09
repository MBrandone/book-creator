import type { Story } from "@/lib/domain/story";
import type { StoryRepository } from "@/lib/domain/story-repository";
import type { Storage } from "@/lib/infrastructure/storage/storage";
import type { SceneImageGenerator } from "@/lib/scene-image-generator/scene-image-generator";

export class StoryImagesGeneratorService {
	private readonly SECONDS_TO_WAIT = 2;

	constructor(
		private readonly storyRepository: StoryRepository,
		private readonly sceneImageGenerator: SceneImageGenerator,
		private readonly storage: Storage
	) {}

	async generate(story: Story): Promise<void> {
		try {
			const referenceImageKeys = story.characters
				.filter((char) => char.photoStorageBucket && char.photoStorageKey)
				.map((char) => ({
					bucket: char.photoStorageBucket!,
					key: char.photoStorageKey!,
				}));

			console.log(
				`[${story.id}] 📸 Converting ${referenceImageKeys.length} reference photos to data URIs...`
			);

			const referenceImages = await Promise.all(
				referenceImageKeys.map(async ({ key }) => {
					const dataUri = await this.convertImageToDataUri(key);
					return { dataUri };
				})
			);

			console.log(
				`[${story.id}] ✅ ${referenceImages.length} reference photos converted successfully`
			);
			console.log(
				`[${story.id}] 🖼️  Starting image generation for ${story.scenes.length} scenes...`
			);

			for (const scene of story.scenes) {
				try {
					const imageResult = await this.sceneImageGenerator.generateImage({
						prompt: scene.prompt,
						aspectRatio: "16:9",
						referenceImages,
					});

					story.setImageToScene(scene.id, imageResult.bucket, imageResult.key);

					await new Promise((resolve) =>
						setTimeout(resolve, this.SECONDS_TO_WAIT * 1000)
					);
				} catch (imageError) {
					console.error(
						`[${story.id}] ❌ Failed to generate image for scene ${scene.sceneNumber}:`,
						imageError
					);
					throw new Error(
						`Failed to generate image for scene ${scene.sceneNumber}: ${imageError instanceof Error ? imageError.message : "Unknown error"}`
					);
				}
			}

			story.markAsCompleted();
			await this.storyRepository.save(story);

			console.log(
				`[${story.id}] ✅ Images generated successfully for ${story.scenes.length} scenes`
			);
		} catch (error) {
			console.error(`[${story.id}] ❌ Image generation failed:`, error);
			console.error(`[${story.id}] Error details:`, {
				message: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			});

			try {
				story.markAsFailed();
				await this.storyRepository.save(story);

				console.log(`[${story.id}] ℹ️  Story status set to 'failed'`);
			} catch (updateError) {
				console.error(
					`[${story.id}] ❌ Failed to update story status to 'failed':`,
					updateError
				);
			}
		}
	}

	private async convertImageToDataUri(key: string): Promise<string> {
		try {
			const buffer = await this.storage.getImageBuffer(key);

			let mimeType = "image/jpeg";
			if (key.endsWith(".png")) {
				mimeType = "image/png";
			} else if (key.endsWith(".webp")) {
				mimeType = "image/webp";
			}

			const base64 = buffer.toString("base64");
			const dataUri = `data:${mimeType};base64,${base64}`;

			console.log(
				`✅ Image converted to data URI: ${key} (${buffer.length} bytes -> ${dataUri.length} chars)`
			);

			return dataUri;
		} catch (error) {
			console.error(`❌ Error converting image ${key} to data URI:`, error);
			throw error;
		}
	}
}
