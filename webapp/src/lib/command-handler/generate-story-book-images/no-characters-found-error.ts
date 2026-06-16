export class NoCharactersFoundError extends Error {
  constructor() {
    super('La story doit avoir au moins un personnage avant de lancer la génération.');
    this.name = 'NoCharactersFoundError';
  }
}
