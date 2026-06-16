import { db } from '@/lib/db';
import { Character } from '@/lib/domain/character';
import { CharacterRepository } from '../../domain/character-repository';

export class SqlCharacterRepository implements CharacterRepository {
  async save(character: Character): Promise<void> {
    try {
      await db
        .insertInto('characters')
        .values({
          id: character.id,
          story_id: character.storyId,
          name: character.name,
          description: character.description,
        })
        .execute();
    } catch (error: any) {
      if (this.isDuplicateKeyError(error)) {
        throw new DuplicateCharacterError();
      }

      console.error('Erreur lors de l\'insertion du personnage en base de données:', error);
      throw error;
    }
  }

  private isDuplicateKeyError(error: any): boolean {
    return error.code === '23505';
  }
}

export class DuplicateCharacterError extends Error {
  constructor() {
    super('Duplicate character');
    this.name = 'DuplicateCharacterError';
  }
}
