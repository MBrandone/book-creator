import { StoryReadModel } from '@/lib/read-model/story-read-model';
import { StoryDetailsView } from '@/lib/read-model/story-details-view';
import { StoryNotFoundError } from '@/lib/domain/story-not-found-error';

export class GetStoryQueryHandler {
  constructor(private readonly storyReadModel: StoryReadModel) {}

  async execute(storyId: string): Promise<StoryDetailsView> {
    const storyDetails = await this.storyReadModel.viewDetails(storyId);

    if (!storyDetails) {
      throw new StoryNotFoundError(storyId);
    }

    return storyDetails;
  }
}
