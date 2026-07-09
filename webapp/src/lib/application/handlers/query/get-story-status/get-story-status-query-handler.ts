import { StoryNotFoundError } from "@/lib/domain/story-not-found-error";
import type { StoryReadModel } from "@/lib/domain/story-read-model";
import type { StoryStatusView } from "@/lib/domain/story-status-view";

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
