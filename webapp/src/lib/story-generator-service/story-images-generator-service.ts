import type { Story } from "@/lib/domain/aggregates/story";
import type { StoryRepository } from "@/lib/domain/repositories/story-repository";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import type { Storage } from "@/lib/infrastructure/storage/storage";
import type { SceneImageGenerator } from "@/lib/scene-image-generator/scene-image-generator";

export class StoryImagesGeneratorService {
	constructor(
		private readonly storyRepository: StoryRepository,
		private readonly sceneImageGenerator: SceneImageGenerator,
		private readonly storage: Storage
	) {}

	async generate(storyId: string): Promise<void> {
		const storyLogger = getLogger().child({ storyId });

		const story = await this.storyRepository.get(storyId);

		const referenceImageKeys = story.characters.reduce<
			Array<{ bucket: string; key: string }>
		>((acc, char) => {
			if (char.photoStorageBucket && char.photoStorageKey) {
				acc.push({
					bucket: char.photoStorageBucket,
					key: char.photoStorageKey,
				});
			}
			return acc;
		}, []);

		storyLogger.info("Converting reference photos to data URIs", {
			count: referenceImageKeys.length,
		});

		try {
			const referenceImages = await Promise.all(
				referenceImageKeys.map(async ({ key }) => {
					const dataUri = await this.convertImageToDataUri(key, storyLogger);
					return { dataUri };
				})
			);

			storyLogger.info("Reference photos converted successfully", {
				count: referenceImages.length,
			});

			storyLogger.info("Generating cover image");
			const coverPrompt = this.buildCoverPrompt(story);
			const coverResult = await this.sceneImageGenerator.generateImage({
				prompt: coverPrompt,
				aspectRatio: "1:1",
				referenceImages,
			});
			story.createCover("", coverPrompt, coverResult.bucket, coverResult.key);
			storyLogger.info("Cover image generated successfully");

			const scenesWithoutCover = story.scenes.filter(
				(s) => s.sceneType !== "cover"
			);
			storyLogger.info("Starting image generation for scenes", {
				sceneCount: scenesWithoutCover.length,
			});

			for (const scene of scenesWithoutCover) {
				try {
					const imageResult = await this.sceneImageGenerator.generateImage({
						prompt: scene.prompt,
						aspectRatio: "16:9",
						referenceImages,
					});

					story.setImageToScene(scene.id, imageResult.bucket, imageResult.key);
				} catch (imageError) {
					storyLogger.error("Failed to generate image for scene", {
						sceneNumber: scene.sceneNumber,
						error: String(imageError),
					});
					throw new Error(
						`Failed to generate image for scene ${scene.sceneNumber}: ${imageError instanceof Error ? imageError.message : "Unknown error"}`
					);
				}
			}

			story.markAsCompleted();
			await this.storyRepository.save(story);

			storyLogger.info("Images generated successfully", {
				sceneCount: story.scenes.length,
			});
		} catch (error) {
			storyLogger.error("Image generation failed", {
				message: error instanceof Error ? error.message : "Unknown error",
			});

			try {
				story.markAsFailed();
				await this.storyRepository.save(story);
				storyLogger.info("Story status set to failed");
			} catch (updateError) {
				storyLogger.error("Failed to update story status to failed", {
					error: String(updateError),
				});
			}
		}
	}

	private buildCoverPrompt(story: Story): string {
		const characterDescriptions = story.characters
			.map((c) => `${c.name}: ${c.description}`)
			.join(". ");
		return `Children book cover illustration. Title: "${story.title}". Characters: ${characterDescriptions}. Style: watercolor illustration, vibrant colors, all characters visible together.`;
	}

	private async convertImageToDataUri(
		key: string,
		storyLogger: ReturnType<typeof getLogger>
	): Promise<string> {
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

			storyLogger.info("Image converted to data URI", {
				key,
				bytes: buffer.length,
			});

			return dataUri;
		} catch (error) {
			storyLogger.error("Error converting image to data URI", {
				key,
				error: String(error),
			});
			throw error;
		}
	}
}
