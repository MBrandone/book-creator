import type { StoryListView } from "@/lib/domain/story-list-view";
import type { StoryReadModel } from "@/lib/domain/story-read-model";

export class ListStoriesQueryHandler {
	constructor(private readonly storyReadModel: StoryReadModel) {}

	async execute(): Promise<StoryListView> {
		return await this.storyReadModel.listAll();
	}
}
