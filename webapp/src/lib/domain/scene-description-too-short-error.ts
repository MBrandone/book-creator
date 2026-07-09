export class SceneDescriptionTooShortError extends Error {
	constructor() {
		super("La description doit contenir au moins 10 caractères");
		this.name = "SceneDescriptionTooShortError";
	}
}
