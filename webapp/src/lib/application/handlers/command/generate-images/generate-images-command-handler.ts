import type { StoryRepository } from "@/lib/domain/repositories/story-repository";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import type { StoryImagesGeneratorService } from "@/lib/story-generator-service/story-images-generator-service";

export class GenerateImagesCommandHandler {
	constructor(
		private readonly storyRepository: StoryRepository,
		private readonly storyImagesGeneratorService: StoryImagesGeneratorService
	) {}

	async execute(storyId: string): Promise<void> {
		const story = await this.storyRepository.get(storyId);

		story.startGeneration();
		await this.storyRepository.save(story);

		this.storyImagesGeneratorService.generate(story).catch((error) => {
			getLogger().error("Unhandled error in background image generation", {
				storyId,
				error: String(error),
			});
		});
	}
}
