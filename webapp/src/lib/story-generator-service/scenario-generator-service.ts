import type { Story } from "@/lib/domain/aggregates/story";
import type { StoryScenesDescriptionGenerator } from "@/lib/story-scenes-description-generator/story-scenes-description-generator";
import type { GeneratedScene } from "./generated-scene";

export class ScenarioGeneratorService {
	constructor(
		private readonly scenesGenerator: StoryScenesDescriptionGenerator
	) {}

	async generateScenario(story: Story): Promise<GeneratedScene[]> {
		const isAvailable = await this.scenesGenerator.isAvailable();

		if (!isAvailable) {
			throw new Error(`Story generator is not available`);
		}

		const charactersForGenerator = story.characters.map((character) => ({
			id: character.id,
			story_id: character.storyId,
			name: character.name,
			description: character.description,
			photo_storage_bucket: character.photoStorageBucket,
			photo_storage_key: character.photoStorageKey,
		}));

		const storyContext = {
			title: story.title,
			description: story.description,
			characters: charactersForGenerator,
		};

		const generatedScenes =
			await this.scenesGenerator.generateStory(storyContext);

		if (generatedScenes.length !== 4) {
			throw new Error(`Expected 4 scenes, got ${generatedScenes.length}`);
		}

		return generatedScenes;
	}
}
