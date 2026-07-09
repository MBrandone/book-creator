import type { StoryDetailsView } from "@/lib/domain/story-details-view";
import { StoryNotFoundError } from "@/lib/domain/story-not-found-error";
import type { StoryReadModel } from "@/lib/domain/story-read-model";

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
