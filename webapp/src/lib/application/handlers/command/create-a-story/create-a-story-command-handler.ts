import { StoryRepository } from '@/lib/domain/story-repository';
import { Story } from '@/lib/domain/story';

export type CreateStoryCommand = {
  id: string;
  title: string;
  description: string;
};

export class CreateAStoryCommandHandler {
  constructor(private readonly storyRepository: StoryRepository) {}

  async execute(command: CreateStoryCommand): Promise<void> {
    const story = Story.create({
      id: command.id,
      title: command.title,
      description: command.description,
    });

    await this.storyRepository.save(story);
  }
}
