import { Story } from "@/lib/domain/story";
import { StoryScenesDescriptionGenerator } from "@/lib/story-scenes-description-generator/story-scenes-description-generator";
import { StoryRepository } from "@/lib/domain/story-repository";
import { SceneImageGenerator } from "@/lib/scene-image-generator/scene-image-generator";
import { SceneRepository } from "@/lib/domain/scene-repository";
import { Scene } from "@/lib/domain/scene";

export class StoryGeneratorService {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly scenesGenerator: StoryScenesDescriptionGenerator,
    private readonly sceneImageGenerator: SceneImageGenerator,
    private readonly sceneRepository: SceneRepository
  ) {}

  async generate(story: Story): Promise<void> {
    try {
      const isAvailable = await this.scenesGenerator.isAvailable();

      if (!isAvailable) {
        throw new Error(`Story generator ${this.scenesGenerator.name} is not available`);
      }

      const charactersForGenerator = story.characters.map(char => ({
        id: char.id,
        story_id: char.storyId,
        name: char.name,
        description: char.description,
      }));

      const generatedScenes = await this.scenesGenerator.generateStory(charactersForGenerator);

      if (generatedScenes.length !== 4) {
        throw new Error(`Expected 4 scenes, got ${generatedScenes.length}`);
      }

      for (const generatedScene of generatedScenes) {
        const scene: Scene = {
          id: crypto.randomUUID(),
          storyId: story.id,
          sceneNumber: generatedScene.scene_number,
          sceneType: generatedScene.scene_type,
          description: generatedScene.description,
          prompt: generatedScene.prompt,
          storageBucket: null,
          storageKey: null,
        };
        
        await this.sceneRepository.save(scene);
      }

      for (const generatedScene of generatedScenes) {
        try {
          const imageResult = await this.sceneImageGenerator.generateImage({
            prompt: generatedScene.prompt,
            aspectRatio: '16:9',
          });

          const sceneWithImage: Scene = {
            id: crypto.randomUUID(),
            storyId: story.id,
            sceneNumber: generatedScene.scene_number,
            sceneType: generatedScene.scene_type,
            description: generatedScene.description,
            prompt: generatedScene.prompt,
            storageBucket: imageResult.bucket,
            storageKey: imageResult.key,
          };

          await this.sceneRepository.save(sceneWithImage);

          const seconds_to_wait = 10;
          await new Promise(resolve => setTimeout(resolve, seconds_to_wait * 1000));

        } catch (imageError) {
          console.error(`[${story.id}] ❌ Failed to generate image for scene ${generatedScene.scene_number}:`, imageError);
          throw new Error(`Failed to generate image for scene ${generatedScene.scene_number}: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
        }
      }

      story.markAsCompleted();
      await this.storyRepository.save(story);

    } catch (error) {
      console.error(`[${story.id}] ❌ Generation failed:`, error);
      console.error(`[${story.id}] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      try {
        story.markAsFailed();
        await this.storyRepository.save(story);

        console.log(`[${story.id}] ℹ️  Story status set to 'failed'`);
      } catch (updateError) {
        console.error(`[${story.id}] ❌ Failed to update story status to 'failed':`, updateError);
      }
    }
  }
}
