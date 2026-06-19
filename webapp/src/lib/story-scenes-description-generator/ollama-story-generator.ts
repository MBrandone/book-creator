import {
  BaseStoryGenerator,
  convertAIResponseToScenes,
  type GeneratedScene,
  StoryGenerationError,
  type StoryGeneratorOptions,
  type StoryContext,
} from '@/lib/story-scenes-description-generator/story-scenes-description-generator';
import type {CharactersTable} from '@/lib/infrastructure/db/schema';
import {
  generateUserPrompt,
  SYSTEM_PROMPT,
  validateAIResponse,
  getStylePrefix,
  DEFAULT_ART_STYLE
} from "@/lib/story-scenes-description-generator/story-scenes-description-prompts";

interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  format?: 'json';
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaListResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
  }>;
}

export class OllamaStoryGenerator extends BaseStoryGenerator {
  private config: OllamaConfig;

  constructor(options: StoryGeneratorOptions = {}) {
    super('Ollama', options);

    this.config = {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3',
      timeout: parseInt(process.env.STORY_GENERATION_TIMEOUT || '60000', 10),
    };

    this.log('Initialized with config:', this.config);
  }

  async isAvailable(): Promise<boolean> {
    try {
      this.log('Checking Ollama availability...');

      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 secondes pour le health check
      });

      if (!response.ok) {
        this.log('Ollama server not responding:', response.status);
        return false;
      }

      const data = (await response.json()) as OllamaListResponse;
      
      const modelAvailable = data.models.some((m) =>
        m.name.includes(this.config.model)
      );

      if (!modelAvailable) {
        this.log(
          `Model "${this.config.model}" not found. Available models:`,
          data.models.map((m) => m.name)
        );
        return false;
      }

      this.log('Ollama is available with model:', this.config.model);
      return true;
    } catch (error) {
      this.log('Ollama availability check failed:', error);
      return false;
    }
  }

  async generateStory(context: StoryContext): Promise<GeneratedScene[]> {
    this.log('Starting story generation for story:', context.title);
    this.log('Characters:', context.characters.length);

    this.validateStoryContext(context);

    const available = await this.isAvailable();
    if (!available) {
      throw new StoryGenerationError(
        'Ollama is not available. Please ensure Ollama is running and the model is downloaded.',
        this.name
      );
    }

    try {
      const systemPrompt = SYSTEM_PROMPT;
      const userPrompt = generateUserPrompt(context.title, context.description, context.characters);

      const fullPrompt = `${systemPrompt}

---

${userPrompt}

Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.`;

      this.log('Sending request to Ollama...');
      const startTime = Date.now();

      const response = await this.withTimeout(
        this.callOllamaAPI(fullPrompt),
        this.config.timeout
      );

      const duration = Date.now() - startTime;
      this.log(`Story generated in ${duration}ms`);

      const parsedResponse = this.parseJSONResponse(response.response);
      const validatedResponse = validateAIResponse(parsedResponse);

      // Ajouter le préfixe de style watercolor aux prompts d'image
      const stylePrefix = getStylePrefix(DEFAULT_ART_STYLE);
      const scenes = convertAIResponseToScenes(validatedResponse.scenes, stylePrefix);

      this.log('Successfully generated', scenes.length, 'scenes with style:', DEFAULT_ART_STYLE);
      return scenes;
    } catch (error) {
      this.log('Story generation failed:', error);

      if (error instanceof StoryGenerationError) {
        throw error;
      }

      throw new StoryGenerationError(
        `Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        error
      );
    }
  }

  private async callOllamaAPI(prompt: string): Promise<OllamaGenerateResponse> {
    const requestBody: OllamaGenerateRequest = {
      model: this.config.model,
      prompt: prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: this.options.temperature,
        num_predict: this.options.maxTokens,
      },
    };

    this.log('Request body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new StoryGenerationError(
          `Ollama API error (${response.status}): ${errorText}`,
          this.name
        );
      }

      const data = (await response.json()) as OllamaGenerateResponse;

      if (!data.response) {
        throw new StoryGenerationError(
          'Empty response from Ollama API',
          this.name
        );
      }

      this.log('Received response from Ollama:', {
        model: data.model,
        responseLength: data.response.length,
        evalCount: data.eval_count,
        duration: data.total_duration,
      });

      return data;
    } catch (error) {
      if (error instanceof StoryGenerationError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new StoryGenerationError(
          `Cannot connect to Ollama at ${this.config.baseUrl}. Is Ollama running?`,
          this.name,
          error
        );
      }

      throw new StoryGenerationError(
        `Ollama API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        error
      );
    }
  }

}
