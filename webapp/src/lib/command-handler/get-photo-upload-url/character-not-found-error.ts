export class CharacterNotFoundError extends Error {
  constructor(characterId: string) {
    super(`Character with ID ${characterId} not found`);
    this.name = 'CharacterNotFoundError';
  }
}
