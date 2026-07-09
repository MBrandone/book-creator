export class MaxCharactersReachedError extends Error {
	constructor() {
		super("Cette story a déjà atteint le maximum de 2 personnages");
		this.name = "MaxCharactersReachedError";
	}
}
