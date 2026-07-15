import type { Story } from "@/lib/domain/aggregates/story";
import type { SceneRepository } from "@/lib/domain/repositories/scene-repository";
import type { StoryRepository } from "@/lib/domain/repositories/story-repository";
import type { Scene } from "@/lib/domain/scene";
import type { Storage } from "@/lib/infrastructure/storage/storage";
import type { SceneImageGenerator } from "@/lib/scene-image-generator/scene-image-generator";
import type { StoryScenesDescriptionGenerator } from "@/lib/story-scenes-description-generator/story-scenes-description-generator";

export class StoryGeneratorService {
	private readonly SECONDS_TO_WAIT = 2;

	constructor(
		private readonly storyRepository: StoryRepository,
		private readonly scenesGenerator: StoryScenesDescriptionGenerator,
		private readonly sceneImageGenerator: SceneImageGenerator,
		private readonly sceneRepository: SceneRepository,
		private readonly storage: Storage
	) {}

	async generate(story: Story): Promise<void> {
		try {
			const isAvailable = await this.scenesGenerator.isAvailable();

			if (!isAvailable) {
				throw new Error(`Story generator is not available`);
			}

			const charactersForGenerator = story.characters.map((character) => ({
				id: character.id,
				story_id: character.storyId,
				name: character.name,
				description: character.description,
				photo_storage_bucket: character.photoStorageBucket,
				photo_storage_key: character.photoStorageKey,
			}));

			const storyContext = {
				title: story.title,
				description: story.description,
				characters: charactersForGenerator,
			};

			const generatedScenes =
				await this.scenesGenerator.generateStory(storyContext);

			if (generatedScenes.length !== 4) {
				throw new Error(`Expected 4 scenes, got ${generatedScenes.length}`);
			}

			for (const generatedScene of generatedScenes) {
				const scene: Scene = {
					id: crypto.randomUUID(),
					storyId: story.id,
					sceneNumber: generatedScene.scene_number,
					sceneType: generatedScene.scene_type,
					description: generatedScene.description,
					prompt: generatedScene.prompt,
					storageBucket: null,
					storageKey: null,
				};

				await this.sceneRepository.save(scene);
			}

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
				`[${story.id}] 🖼️  Starting image generation for ${generatedScenes.length} scenes...`
			);

			for (const generatedScene of generatedScenes) {
				try {
					const imageResult = await this.sceneImageGenerator.generateImage({
						prompt: generatedScene.prompt,
						aspectRatio: "16:9",
						referenceImages,
					});

					const sceneWithImage: Scene = {
						id: crypto.randomUUID(),
						storyId: story.id,
						sceneNumber: generatedScene.scene_number,
						sceneType: generatedScene.scene_type,
						description: generatedScene.description,
						prompt: generatedScene.prompt,
						storageBucket: imageResult.bucket,
						storageKey: imageResult.key,
					};

					await this.sceneRepository.save(sceneWithImage);

					await new Promise((resolve) =>
						setTimeout(resolve, this.SECONDS_TO_WAIT * 1000)
					);
				} catch (imageError) {
					console.error(
						`[${story.id}] ❌ Failed to generate image for scene ${generatedScene.scene_number}:`,
						imageError
					);
					throw new Error(
						`Failed to generate image for scene ${generatedScene.scene_number}: ${imageError instanceof Error ? imageError.message : "Unknown error"}`
					);
				}
			}

			story.markAsCompleted();
			await this.storyRepository.save(story);
		} catch (error) {
			console.error(`[${story.id}] ❌ Generation failed:`, error);
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
