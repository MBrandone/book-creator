import type { StoryRepository } from "@/lib/domain/repositories/story-repository";

export class UpdateSceneDescriptionCommandHandler {
	constructor(private readonly storyRepository: StoryRepository) {}

	async execute(
		storyId: string,
		sceneId: string,
		description: string
	): Promise<void> {
		const story = await this.storyRepository.get(storyId);

		story.updateSceneDescription(sceneId, description);

		await this.storyRepository.save(story);
	}
}
