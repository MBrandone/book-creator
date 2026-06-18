import { db } from '@/lib/db';
import { CharacterPhoto, CharacterPhotoRepository } from '@/lib/domain/character-photo-repository';
import { Storage } from '@/lib/storage/storage';

export class SqlCharacterPhotoRepository implements CharacterPhotoRepository {
  constructor(private readonly storage: Storage) {}

  async hasPhoto(characterId: string): Promise<boolean> {
    const result = await db
      .selectFrom('characters')
      .select('photo_storage_key')
      .where('id', '=', characterId)
      .executeTakeFirst();

    return result?.photo_storage_key !== null && result?.photo_storage_key !== undefined;
  }

  async updatePhoto(characterId: string, photo: CharacterPhoto): Promise<void> {
    const existingPhoto = await db
      .selectFrom('characters')
      .select(['photo_storage_key'])
      .where('id', '=', characterId)
      .executeTakeFirst();

    if (existingPhoto?.photo_storage_key) {
      try {
        await this.storage.deleteImages([existingPhoto.photo_storage_key]);
        console.log(`✅ Ancienne photo supprimée: ${existingPhoto.photo_storage_key}`);
      } catch (error) {
        console.error('⚠️ Erreur lors de la suppression de l\'ancienne photo:', error);
      }
    }

    await db
      .updateTable('characters')
      .set({
        photo_storage_bucket: photo.storageBucket,
        photo_storage_key: photo.storageKey,
      })
      .where('id', '=', characterId)
      .execute();
  }
}
