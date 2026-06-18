import { db } from '@/lib/db';
import { CharacterRepository } from '@/lib/domain/character-repository';
import { Storage } from '@/lib/storage/storage';
import { CharacterNotFoundError } from '../get-photo-upload-url/character-not-found-error';

export interface DeleteCharacterPhotoCommand {
  characterId: string;
}

export class DeleteCharacterPhotoCommandHandler {
  constructor(
    private readonly characterRepository: CharacterRepository,
    private readonly storage: Storage
  ) {}

  async execute(command: DeleteCharacterPhotoCommand): Promise<void> {
    const characterExists = await this.characterRepository.existsById(command.characterId);
    if (!characterExists) {
      throw new CharacterNotFoundError(command.characterId);
    }

    const character = await db
      .selectFrom('characters')
      .select(['photo_storage_key'])
      .where('id', '=', command.characterId)
      .executeTakeFirst();

    if (character?.photo_storage_key) {
      try {
        await this.storage.deleteImages([character.photo_storage_key]);
        console.log(`✅ Photo supprimée: ${character.photo_storage_key}`);
      } catch (error) {
        console.error('⚠️ Erreur lors de la suppression de la photo:', error);
      }
    }

    await db
      .updateTable('characters')
      .set({
        photo_storage_bucket: null,
        photo_storage_key: null,
      })
      .where('id', '=', command.characterId)
      .execute();
  }
}
