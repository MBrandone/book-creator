import { NoCharactersError } from "@/lib/domain/no-characters-error";
import type { StoryRepository } from "@/lib/domain/repositories/story-repository";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import type { ScenarioGeneratorService } from "@/lib/story-generator-service/scenario-generator-service";

export class GenerateScenarioCommandHandler {
	constructor(
		private readonly storyRepository: StoryRepository,
		private readonly scenarioGeneratorService: ScenarioGeneratorService
	) {}

	async execute(storyId: string): Promise<void> {
		const story = await this.storyRepository.get(storyId);

		if (story.status !== "pending") {
			throw new Error(
				`Cannot generate scenario for story in status "${story.status}"`
			);
		}

		if (story.characters.length === 0) {
			throw new NoCharactersError();
		}

		const storyLogger = getLogger().child({ storyId });

		try {
			const generatedScenes =
				await this.scenarioGeneratorService.generateScenario(story);

			for (const generatedScene of generatedScenes) {
				story.createScene(
					generatedScene.scene_number,
					generatedScene.scene_type,
					generatedScene.description,
					generatedScene.prompt
				);
			}

			await this.storyRepository.save(story);

			storyLogger.info("Scenario saved successfully", {
				sceneCount: generatedScenes.length,
			});
		} catch (error) {
			storyLogger.error("Scenario generation failed", { error: String(error) });
			throw error;
		}
	}
}
