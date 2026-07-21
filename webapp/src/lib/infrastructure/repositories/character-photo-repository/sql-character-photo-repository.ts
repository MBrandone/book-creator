import type {
	CharacterPhoto,
	CharacterPhotoRepository,
} from "@/lib/domain/repositories/character-photo-repository";
import { db } from "@/lib/infrastructure/db";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import type { Storage } from "@/lib/infrastructure/storage/storage";

export class SqlCharacterPhotoRepository implements CharacterPhotoRepository {
	constructor(private readonly storage: Storage) {}

	async hasPhoto(characterId: string): Promise<boolean> {
		const result = await db
			.selectFrom("characters")
			.select("photo_storage_key")
			.where("id", "=", characterId)
			.executeTakeFirst();

		return (
			result?.photo_storage_key !== null &&
			result?.photo_storage_key !== undefined
		);
	}

	async updatePhoto(characterId: string, photo: CharacterPhoto): Promise<void> {
		const existingPhoto = await db
			.selectFrom("characters")
			.select(["photo_storage_key"])
			.where("id", "=", characterId)
			.executeTakeFirst();

		if (existingPhoto?.photo_storage_key) {
			try {
				await this.storage.deleteImages([existingPhoto.photo_storage_key]);
				getLogger().info("Ancienne photo supprimée", {
					key: existingPhoto.photo_storage_key,
				});
			} catch (error) {
				getLogger().error("Erreur lors de la suppression de l'ancienne photo", {
					error: String(error),
				});
			}
		}

		await db
			.updateTable("characters")
			.set({
				photo_storage_bucket: photo.storageBucket,
				photo_storage_key: photo.storageKey,
			})
			.where("id", "=", characterId)
			.execute();
	}
}
