import { StoryReadModel } from '@/lib/domain/story-read-model';
import { StoryListView } from '@/lib/domain/story-list-view';

export class ListStoriesQueryHandler {
  constructor(private readonly storyReadModel: StoryReadModel) {}

  async execute(): Promise<StoryListView> {
    return await this.storyReadModel.listAll();
  }
}
