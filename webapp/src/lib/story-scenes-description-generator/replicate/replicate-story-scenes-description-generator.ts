import Replicate from 'replicate';
import type {
    GeneratedScene,
    StoryContext,
    StoryScenesDescriptionGenerator,
} from '../story-scenes-description-generator';
import {StoryScenesDescriptionGeneratorValidator} from '../validator';
import {InMemorySceneGenerator} from '../in-memory/in-memory-story-generator';
import {env} from '@/config/env';
import {DEFAULT_ART_STYLE, getStylePrefix, StorySceneDescriptionPromptBuilder,} from '../prompts';
import {
    LLAMA_MODEL,
    MAX_TOKENS,
    MODEL_NAME,
    MODEL_OWNER,
    TEMPERATURE
} from "@/lib/story-scenes-description-generator/replicate/config";
import {RetryStrategy} from "@/lib/infrastructure/http-request-retry-strategy/retry-strategy";

export class ReplicateStoryScenesDescriptionGenerator implements StoryScenesDescriptionGenerator {
  private readonly client: Replicate;
  private readonly fallbackGenerator: InMemorySceneGenerator;
  private readonly retryStrategy: RetryStrategy;

  constructor(retryStrategy: RetryStrategy) {
    this.client = new Replicate({ auth: env.REPLICATE_API_TOKEN });
    this.fallbackGenerator = new InMemorySceneGenerator();
    this.retryStrategy = retryStrategy;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.get(MODEL_OWNER, MODEL_NAME);
      return true;
    } catch (error) {
      console.error('[Replicate] Availability check failed:', error);
      return false;
    }
  }

  async generateStory(context: StoryContext): Promise<GeneratedScene[]> {
    console.log('[Replicate] Starting story generation for:', context.title);

    try {
        const prompt = new StorySceneDescriptionPromptBuilder().setUserPrompt(context).getPrompt()
        const output = await this.retryStrategy.execute(() => this.callReplicateAPI(prompt));

        const responseText: string = StoryScenesDescriptionGeneratorValidator.convertDifferentOutputFormatToString(output)
        const parsedResponse = StoryScenesDescriptionGeneratorValidator.parseJSONResponse(responseText);
        const validatedResponse = StoryScenesDescriptionGeneratorValidator.validateAIResponse(parsedResponse);

        const scenes = validatedResponse.scenes.map((scene) => ({
            scene_number: scene.scene_number,
            scene_type: scene.scene_type,
            description: scene.description,
            prompt: getStylePrefix(DEFAULT_ART_STYLE) ? `${(getStylePrefix(DEFAULT_ART_STYLE))}, ${scene.image_prompt}` : scene.image_prompt,
        }));

        console.log('[Replicate] Successfully generated', scenes.length, 'scenes');
        return scenes;
    } catch (error) {
      console.error('[Replicate] Error:', error instanceof Error ? error.message : error);
      return await this.fallbackGenerator.generateStory(context);
    }
  }

  private async callReplicateAPI(prompt: string): Promise<object> {
      return await this.client.run(LLAMA_MODEL, {
        input: {
            prompt,
            max_tokens: MAX_TOKENS,
            temperature: TEMPERATURE,
        },
    });
  }
}
