export class StoryNotFoundError extends Error {
	constructor(storyId: string) {
		super(`Story with id ${storyId} not found`);
		this.name = "StoryNotFoundError";
	}
}
