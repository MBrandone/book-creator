export class StoryAlreadyGeneratingError extends Error {
	constructor(public readonly currentStatus: string) {
		super(
			`La génération a déjà été lancée pour cette story. Le statut actuel est "${currentStatus}".`
		);
		this.name = "StoryAlreadyGeneratingError";
	}
}
