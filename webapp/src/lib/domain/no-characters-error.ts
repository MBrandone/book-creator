export class NoCharactersError extends Error {
	constructor() {
		super("Impossible de générer une histoire sans personnages.");
		this.name = "NoCharactersError";
	}
}
