export class SceneNotFoundInStoryError extends Error {
  constructor(sceneId: string) {
    super(`La scène avec l'ID "${sceneId}" n'existe pas dans cette histoire.`);
    this.name = 'SceneNotFoundInStoryError';
  }
}
