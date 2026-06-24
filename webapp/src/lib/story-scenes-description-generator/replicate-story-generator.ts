import Replicate from 'replicate';
import type {
  GeneratedScene,
  StoryScenesDescriptionGenerator,
  StoryContext,
} from './story-scenes-description-generator';
import { convertAIResponseToScenes } from './story-scenes-description-generator';
import { StoryGeneratorValidator } from './story-generator-validator';
import { InMemorySceneGenerator } from './in-memory-story-generator';
import { env } from '@/config/env';
import {
  generateUserPrompt,
  getStylePrefix,
  SYSTEM_PROMPT,
  DEFAULT_ART_STYLE,
} from './story-scenes-description-prompts';
import { withExponentialBackoff } from '../scene-image-generator/replicate-retry-utils';

const MODEL_OWNER = 'meta';
const MODEL_NAME = 'meta-llama-3-8b-instruct';
const LLAMA_MODEL = `${MODEL_OWNER}/${MODEL_NAME}`;

interface ReplicateRunOutput {
  output?: string | string[];
}

export class ReplicateStoryGenerator implements StoryScenesDescriptionGenerator {
  readonly name = 'Replicate';
  private client: Replicate;
  private fallbackGenerator: InMemorySceneGenerator;
  private timeout: number;

  constructor() {
    this.client = new Replicate({ auth: env.REPLICATE_API_TOKEN });
    this.fallbackGenerator = new InMemorySceneGenerator();
    this.timeout = env.STORY_GENERATION_TIMEOUT;
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
    
    StoryGeneratorValidator.validateStoryContext(context);

    try {
      const startTime = Date.now();
      const scenes = await withExponentialBackoff(
        () => this.callReplicateAPI(context),
        {
          maxRetries: 5,
          initialDelayMs: 2000,
          maxDelayMs: 120000,
          backoffMultiplier: 2,
        }
      );
      const duration = Date.now() - startTime;
      console.log(`[Replicate] Story generated in ${duration}ms`);
      return scenes;
    } catch (error) {
      console.error('[Replicate] All retry attempts failed, using fallback generator');
      console.error('[Replicate] Error:', error instanceof Error ? error.message : error);
      return await this.fallbackGenerator.generateStory(context);
    }
  }

  private async callReplicateAPI(context: StoryContext): Promise<GeneratedScene[]> {
    const systemPrompt = SYSTEM_PROMPT;
    const userPrompt = generateUserPrompt(context.title, context.description, context.characters);

    const fullPrompt = `${systemPrompt}

---

${userPrompt}

Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.`;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);
    });

    const generatePromise = this.client.run(LLAMA_MODEL, {
      input: {
        prompt: fullPrompt,
        max_tokens: 2000,
        temperature: 0.7,
      },
    });

    const output = await Promise.race([generatePromise, timeoutPromise]) as unknown;

    let responseText: string;
    if (typeof output === 'string') {
      responseText = output;
    } else if (Array.isArray(output)) {
      responseText = output.join('');
    } else if (output && typeof output === 'object' && 'output' in output) {
      const typedOutput = output as ReplicateRunOutput;
      if (typeof typedOutput.output === 'string') {
        responseText = typedOutput.output;
      } else if (Array.isArray(typedOutput.output)) {
        responseText = typedOutput.output.join('');
      } else {
        throw new Error('Unexpected output format from Replicate');
      }
    } else {
      throw new Error('Unexpected output format from Replicate');
    }

    const parsedResponse = StoryGeneratorValidator.parseJSONResponse(responseText);
    const validatedResponse = StoryGeneratorValidator.validateAIResponse(parsedResponse);

    const stylePrefix = getStylePrefix(DEFAULT_ART_STYLE);
    const scenes = convertAIResponseToScenes(validatedResponse.scenes, stylePrefix);

    console.log('[Replicate] Successfully generated', scenes.length, 'scenes');
    return scenes;
  }
}
