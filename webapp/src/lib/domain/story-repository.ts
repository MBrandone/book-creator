import type { Story } from "@/lib/domain/story";

export interface StoryRepository {
	save(story: Story): Promise<void>;
	get(storyId: string): Promise<Story>;
}
