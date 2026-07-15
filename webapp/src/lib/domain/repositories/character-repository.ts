import type { Character } from "@/lib/domain/entities/character";

export interface CharacterRepository {
	save(character: Character): Promise<void>;
	existsById(characterId: string): Promise<boolean>;
}
