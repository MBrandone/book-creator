import type { StoryStatus } from "./story";

export class GenerationCannotBeStartedError extends Error {
	constructor(status: StoryStatus) {
		super(
			`La génération ne peut pas être démarrée. Le statut actuel est "${status}".`
		);
		this.name = "GenerationCannotBeStartedError";
	}
}
