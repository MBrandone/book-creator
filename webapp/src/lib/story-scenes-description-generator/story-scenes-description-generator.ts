import type { CharactersTable, SceneType } from '@/lib/db/schema';

import {AISceneResponse} from "@/lib/story-scenes-description-generator/story-scenes-description-prompts";

export interface StoryScenesDescriptionGenerator {
  generateStory(characters: CharactersTable[]): Promise<GeneratedScene[]>;
  isAvailable(): Promise<boolean>;
  readonly name: string;
}

export interface GeneratedScene {
  scene_number: number;
  scene_type: SceneType;
  description: string;
  prompt: string;
}

export interface StoryGeneratorOptions {
  /** Timeout en millisecondes pour la génération */
  timeout?: number;
  /** Température pour la génération (créativité) - 0.0 à 1.0 */
  temperature?: number;
  /** Nombre maximum de tokens à générer */
  maxTokens?: number;
  /** Activer le mode debug (logs détaillés) */
  debug?: boolean;
}

export const DEFAULT_OPTIONS: Required<StoryGeneratorOptions> = {
  timeout: 60000, // 60 secondes
  temperature: 0.7, // Équilibre entre créativité et cohérence
  maxTokens: 2000, // Suffisant pour 4 scènes détaillées
  debug: false,
};

export function convertAIResponseToScenes(
  aiScenes: AISceneResponse[]
): GeneratedScene[] {
  return aiScenes.map((scene) => ({
    scene_number: scene.scene_number,
    scene_type: scene.scene_type,
    description: scene.description,
    prompt: scene.image_prompt,
  }));
}

export class StoryGenerationError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'StoryGenerationError';

    // Maintient la stack trace correcte
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StoryGenerationError);
    }
  }
}

export abstract class BaseStoryGenerator implements StoryScenesDescriptionGenerator {
  protected options: Required<StoryGeneratorOptions>;

  constructor(
    public readonly name: string,
    options: StoryGeneratorOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  abstract generateStory(characters: CharactersTable[]): Promise<GeneratedScene[]>;
  abstract isAvailable(): Promise<boolean>;

  protected log(...args: unknown[]): void {
    console.log(`[${this.name}]`, ...args);
  }

  protected validateCharacters(characters: CharactersTable[]): void {
    if (!Array.isArray(characters) || characters.length === 0) {
      throw new StoryGenerationError(
        'At least one character is required',
        this.name
      );
    }

    if (characters.length > 5) {
      throw new StoryGenerationError(
        'Too many characters (maximum 5)',
        this.name
      );
    }

    for (const char of characters) {
      if (!char.name || char.name.trim().length === 0) {
        throw new StoryGenerationError(
          'Character name is required',
          this.name
        );
      }

      if (!char.description || char.description.trim().length < 10) {
        throw new StoryGenerationError(
          `Character "${char.name}" needs a longer description (minimum 10 characters)`,
          this.name
        );
      }
    }
  }

  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = this.options.timeout
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new StoryGenerationError(
            `Request timeout after ${timeoutMs}ms`,
            this.name
          )
        );
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  protected parseJSONResponse(response: string): unknown {
    try {
      return JSON.parse(response);
    } catch {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          throw new StoryGenerationError(
            'Failed to parse JSON from response',
            this.name
          );
        }
      }
      throw new StoryGenerationError(
        'No valid JSON found in response',
        this.name
      );
    }
  }
}

export class StoryGeneratorFactory {
  private static instance: StoryScenesDescriptionGenerator | null = null;

  static async getGenerator(
    forceProvider?: string
  ): Promise<StoryScenesDescriptionGenerator> {
    if (this.instance && !forceProvider) {
      return this.instance;
    }

    const provider = forceProvider || process.env.STORY_PROVIDER || 'ollama';

    console.log('Story Generator provider : ', provider.toLowerCase())

    switch (provider.toLowerCase()) {
      case 'ollama': {
        const { OllamaStoryGenerator } = await import('@/lib/story-scenes-description-generator/ollama-story-generator');
        this.instance = new OllamaStoryGenerator();
        break;
      }
      default:
        throw new Error(`Unknown story provider: ${provider}`);
    }

    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}
