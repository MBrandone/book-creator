export class CharacterDescriptionTooShortError extends Error {
	constructor() {
		super("La description du personnage doit contenir au moins 10 caractères");
		this.name = "CharacterDescriptionTooShortError";
	}
}
