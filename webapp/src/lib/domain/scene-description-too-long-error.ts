export class SceneDescriptionTooLongError extends Error {
	constructor() {
		super("La description ne peut pas dépasser 500 caractères");
		this.name = "SceneDescriptionTooLongError";
	}
}
