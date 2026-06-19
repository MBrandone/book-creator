import { StoryDetailsView } from './story-details-view';
import { StoryStatusView } from './story-status-view';
import { StoryListView } from './story-list-view';

export interface StoryReadModel {
  viewDetails(storyId: string): Promise<StoryDetailsView | null>;
  viewStatus(storyId: string): Promise<StoryStatusView | null>;
  listAll(): Promise<StoryListView>;
}
