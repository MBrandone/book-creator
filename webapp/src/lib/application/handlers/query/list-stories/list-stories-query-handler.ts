import type { StoryListView } from "@/lib/domain/read-models/story-list-view";
import type { StoryReadModel } from "@/lib/domain/read-models/story-read-model";

export class ListStoriesQueryHandler {
	constructor(private readonly storyReadModel: StoryReadModel) {}

	async execute(): Promise<StoryListView> {
		return await this.storyReadModel.listAll();
	}
}
