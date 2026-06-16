import { StoryReadModel } from '@/lib/read-model/story-read-model';
import { StoryStatusView } from '@/lib/read-model/story-status-view';
import { StoryNotFoundError } from '@/lib/domain/story-not-found-error';

export class GetStoryStatusQueryHandler {
  constructor(private readonly storyReadModel: StoryReadModel) {}

  async execute(storyId: string): Promise<StoryStatusView> {
    const storyStatus = await this.storyReadModel.viewStatus(storyId);

    if (!storyStatus) {
      throw new StoryNotFoundError(storyId);
    }

    return storyStatus;
  }
}
