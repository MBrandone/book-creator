export class StoryDescriptionTooLongError extends Error {
	constructor() {
		super("La description de l'histoire ne peut pas dépasser 2000 caractères");
		this.name = "StoryDescriptionTooLongError";
	}
}
