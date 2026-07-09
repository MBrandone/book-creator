import type { StoryDetailsView } from "./story-details-view";
import type { StoryListView } from "./story-list-view";
import type { StoryStatusView } from "./story-status-view";

export interface StoryReadModel {
	viewDetails(storyId: string): Promise<StoryDetailsView | null>;
	viewStatus(storyId: string): Promise<StoryStatusView | null>;
	listAll(): Promise<StoryListView>;
}
