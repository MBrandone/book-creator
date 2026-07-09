import { Character } from "@/lib/domain/character";
import { SceneType } from "@/lib/domain/scene";
import { Story } from "@/lib/domain/story";
import { StoryNotFoundError } from "@/lib/domain/story-not-found-error";
import type { StoryRepository } from "@/lib/domain/story-repository";
import { db } from "@/lib/infrastructure/db";

export class SqlStoryRepository implements StoryRepository {
	async save(story: Story): Promise<void> {
		try {
			await db
				.insertInto("stories")
				.values({
					id: story.id,
					title: story.title,
					description: story.description,
					status: story.status,
					created_at: story.createdAt,
					updated_at: story.updatedAt,
				})
				.onConflict((oc) =>
					oc.column("id").doUpdateSet({
						title: story.title,
						description: story.description,
						status: story.status,
						updated_at: story.updatedAt,
					})
				)
				.execute();

			for (const scene of story.scenes) {
				await db
					.insertInto("scenes")
					.values({
						id: scene.id,
						story_id: scene.storyId,
						scene_number: scene.sceneNumber,
						scene_type: scene.sceneType,
						description: scene.description,
						prompt: scene.prompt,
						storage_bucket: scene.storageBucket,
						storage_key: scene.storageKey,
					})
					.onConflict((oc) =>
						oc.column("id").doUpdateSet({
							description: scene.description,
							prompt: scene.prompt,
							storage_bucket: scene.storageBucket,
							storage_key: scene.storageKey,
						})
					)
					.execute();
			}
		} catch (error: any) {
			console.error("Erreur lors de la sauvegarde en base de données:", error);
			throw error;
		}
	}

	async get(storyId: string): Promise<Story> {
		const storyResult = await db
			.selectFrom("stories")
			.selectAll()
			.where("id", "=", storyId)
			.executeTakeFirst();

		if (!storyResult) {
			throw new StoryNotFoundError(storyId);
		}

		const charactersResult = await db
			.selectFrom("characters")
			.selectAll()
			.where("story_id", "=", storyId)
			.execute();

		const characters = charactersResult.map((char) =>
			Character.create({
				id: char.id,
				storyId: char.story_id,
				name: char.name,
				description: char.description,
				photoStorageBucket: char.photo_storage_bucket,
				photoStorageKey: char.photo_storage_key,
			})
		);

		const scenesResult = await db
			.selectFrom("scenes")
			.selectAll()
			.where("story_id", "=", storyId)
			.orderBy("scene_number", "asc")
			.execute();

		const scenes = scenesResult.map((scene) => ({
			id: scene.id,
			storyId: scene.story_id,
			sceneNumber: scene.scene_number,
			sceneType: scene.scene_type,
			description: scene.description,
			prompt: scene.prompt || "",
			storageBucket: scene.storage_bucket,
			storageKey: scene.storage_key,
		}));

		return Story.hydrate({
			id: storyResult.id,
			title: storyResult.title || "",
			description: storyResult.description || "",
			status: storyResult.status,
			createdAt: storyResult.created_at,
			updatedAt: storyResult.updated_at,
			characters,
			scenes,
		});
	}
}
