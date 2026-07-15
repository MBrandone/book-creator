export class StoryDescriptionTooShortError extends Error {
	constructor() {
		super("La description de l'histoire doit contenir au moins 10 caractères");
		this.name = "StoryDescriptionTooShortError";
	}
}
