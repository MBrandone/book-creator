/**
 * Provider Ollama pour la génération d'histoires
 * Utilise Ollama en local pour générer des histoires en 4 scènes
 */

import {
  BaseStoryGenerator,
  StoryGenerationError,
  convertAIResponseToScenes,
  type GeneratedScene,
  type StoryGeneratorOptions,
} from '@/lib/ai/story-generator';
import {
  SYSTEM_PROMPT,
  generateUserPrompt,
  validateAIResponse,
  FALLBACK_SCENES,
} from '@/lib/ai/prompts';
import type { CharactersTable } from '@/lib/db/schema';

/**
 * Configuration Ollama depuis les variables d'environnement
 */
interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;
}

/**
 * Format de requête pour l'API Ollama
 */
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

/**
 * Format de réponse pour l'API Ollama
 */
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

/**
 * Format pour vérifier les modèles disponibles
 */
interface OllamaListResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
  }>;
}

/**
 * Provider Ollama pour la génération d'histoires
 * Communique avec une instance locale d'Ollama via HTTP
 */
export class OllamaStoryGenerator extends BaseStoryGenerator {
  private config: OllamaConfig;

  constructor(options: StoryGeneratorOptions = {}) {
    super('Ollama', options);

    // Configuration depuis les variables d'environnement
    this.config = {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3',
      timeout: parseInt(process.env.STORY_GENERATION_TIMEOUT || '60000', 10),
    };

    this.log('Initialized with config:', this.config);
  }

  /**
   * Vérifie si Ollama est disponible et configuré correctement
   */
  async isAvailable(): Promise<boolean> {
    try {
      this.log('Checking Ollama availability...');

      // Vérifier que le serveur Ollama répond
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
      
      // Vérifier que le modèle configuré est disponible
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

  /**
   * Génère une histoire complète avec 4 scènes
   */
  async generateStory(characters: CharactersTable[]): Promise<GeneratedScene[]> {
    this.log('Starting story generation for', characters.length, 'character(s)');

    // Valider les personnages
    this.validateCharacters(characters);

    // Vérifier que Ollama est disponible
    const available = await this.isAvailable();
    if (!available) {
      throw new StoryGenerationError(
        'Ollama is not available. Please ensure Ollama is running and the model is downloaded.',
        this.name
      );
    }

    try {
      // Construire les prompts
      const systemPrompt = SYSTEM_PROMPT;
      const userPrompt = generateUserPrompt(characters);

      // Combiner les prompts (Ollama n'a pas de système de messages séparés)
      const fullPrompt = `${systemPrompt}

---

${userPrompt}

Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.`;

      this.log('Sending request to Ollama...');
      const startTime = Date.now();

      // Appeler l'API Ollama avec timeout
      const response = await this.withTimeout(
        this.callOllamaAPI(fullPrompt),
        this.config.timeout
      );

      const duration = Date.now() - startTime;
      this.log(`Story generated in ${duration}ms`);

      // Parser et valider la réponse
      const parsedResponse = this.parseJSONResponse(response.response);
      const validatedResponse = validateAIResponse(parsedResponse);

      // Convertir en scènes utilisables
      const scenes = convertAIResponseToScenes(validatedResponse.scenes);

      this.log('Successfully generated', scenes.length, 'scenes');
      return scenes;
    } catch (error) {
      // Log l'erreur et relancer avec plus d'informations
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

  /**
   * Appelle l'API Ollama pour générer du texte
   */
  private async callOllamaAPI(prompt: string): Promise<OllamaGenerateResponse> {
    const requestBody: OllamaGenerateRequest = {
      model: this.config.model,
      prompt: prompt,
      stream: false, // Pas de streaming pour simplifier
      format: 'json', // Demander explicitement du JSON
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

      // Erreur réseau ou autre
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

  /**
   * Génère une histoire de fallback en cas d'erreur
   * Utilise les scènes prédéfinies
   */
  generateFallbackStory(characters: CharactersTable[]): GeneratedScene[] {
    this.log('Using fallback scenes');

    return FALLBACK_SCENES.map((scene) => ({
      scene_number: scene.scene_number,
      scene_type: scene.scene_type,
      description: scene.description,
      prompt: scene.image_prompt,
    }));
  }

  /**
   * Test rapide de connexion à Ollama
   */
  async testConnection(): Promise<{
    connected: boolean;
    model: string;
    version?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        return {
          connected: false,
          model: this.config.model,
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        connected: true,
        model: this.config.model,
        version: data.version || 'unknown',
      };
    } catch (error) {
      return {
        connected: false,
        model: this.config.model,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Factory helper pour créer une instance d'OllamaStoryGenerator
 */
export function createOllamaGenerator(
  options?: StoryGeneratorOptions
): OllamaStoryGenerator {
  return new OllamaStoryGenerator(options);
}
