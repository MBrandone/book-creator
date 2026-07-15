export class CharacterNameTooShortError extends Error {
	constructor() {
		super("Le nom du personnage doit contenir au moins 3 caractères");
		this.name = "CharacterNameTooShortError";
	}
}
