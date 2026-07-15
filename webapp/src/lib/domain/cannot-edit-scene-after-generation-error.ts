import type { StoryStatus } from "./aggregates/story";

export class CannotEditSceneAfterGenerationError extends Error {
	constructor(status: StoryStatus) {
		super(
			`Impossible de modifier le scénario. L'histoire est en statut "${status}".`
		);
		this.name = "CannotEditSceneAfterGenerationError";
	}
}
