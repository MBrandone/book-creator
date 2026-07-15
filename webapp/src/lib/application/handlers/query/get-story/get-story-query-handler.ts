import type { StoryDetailsView } from "@/lib/domain/read-models/story-details-view";
import type { StoryReadModel } from "@/lib/domain/read-models/story-read-model";
import { StoryNotFoundError } from "@/lib/domain/story-not-found-error";

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
