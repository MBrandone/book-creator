import { Story } from "@/lib/domain/aggregates/story";
import type { StoryRepository } from "@/lib/domain/repositories/story-repository";

export type CreateStoryCommand = {
	id: string;
	title: string;
	description: string;
	characters: Array<{
		id: string;
		name: string;
		description: string;
		photo?: { storageBucket: string; storageKey: string };
	}>;
};

export class CreateAStoryCommandHandler {
	constructor(private readonly storyRepository: StoryRepository) {}

	async execute(command: CreateStoryCommand): Promise<void> {
		const story = Story.create({
			id: command.id,
			title: command.title,
			description: command.description,
			characters: command.characters,
		});

		await this.storyRepository.save(story);
	}
}
