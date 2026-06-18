import { StoryDetailsView } from './story-details-view';
import { StoryStatusView } from './story-status-view';

export interface StoryReadModel {
  viewDetails(storyId: string): Promise<StoryDetailsView | null>;
  viewStatus(storyId: string): Promise<StoryStatusView | null>;
}
