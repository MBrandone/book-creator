import { Character } from '@/lib/domain/character';

export interface CharacterRepository {
  save(character: Character): Promise<void>;
}
