import { StoryRepository } from "@/lib/domain/story-repository";
import { StoryImagesGeneratorService } from "@/lib/story-generator-service/story-images-generator-service";

export class GenerateImagesCommandHandler {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyImagesGeneratorService: StoryImagesGeneratorService,
  ) {}

  async execute(storyId: string): Promise<void> {
    const story = await this.storyRepository.get(storyId);

    story.startGeneration();
    await this.storyRepository.save(story);

    this.storyImagesGeneratorService.generate(story).catch((error) => {
      console.error(`[${storyId}] Unhandled error in background process:`, error);
    });
  }
}
