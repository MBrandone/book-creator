import type { StoryRepository } from "@/lib/domain/repositories/story-repository";

export class GenerateImagesCommandHandler {
	constructor(private readonly storyRepository: StoryRepository) {}

	async execute(storyId: string): Promise<void> {
		const story = await this.storyRepository.get(storyId);
		story.startGeneration();
		await this.storyRepository.save(story);
	}
}
