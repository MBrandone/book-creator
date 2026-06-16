import { StoryRepository } from "@/lib/domain/story-repository";
import { StoryAlreadyGeneratingError } from "./story-already-generating-error";
import { NoCharactersFoundError } from "./no-characters-found-error";
import { StoryGeneratorService } from "@/lib/service/story-generator-service";

export class GenerateStoryBookImagesCommandHandler {
    constructor(
        private readonly storyRepository: StoryRepository,
        private readonly storyGeneratorService: StoryGeneratorService,
    ) {
    }

    async execute(storyId: string): Promise<void> {
        const story = await this.storyRepository.get(storyId);

        if (story.status !== 'pending') {
            throw new StoryAlreadyGeneratingError(story.status);
        }

        if (story.characters.length === 0) {
            throw new NoCharactersFoundError();
        }

        story.startGeneration();
        await this.storyRepository.save(story);

        this.storyGeneratorService.generate(story).catch((error) => {
            console.error(`[${storyId}] Unhandled error in background process:`, error);
        });
    }
}

