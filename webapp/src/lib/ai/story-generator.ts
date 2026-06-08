/**
 * Service de génération d'histoire
 * Interface générique pour différents providers d'IA
 */

import type { CharactersTable, ScenesTable, SceneType } from '@/lib/db/schema';
import type { AISceneResponse } from './prompts';

/**
 * Interface générique pour les providers de génération d'histoire
 * Cette interface permet de supporter différents providers (Ollama, Hugging Face, OpenAI, etc.)
 */
export interface StoryGenerator {
  /**
   * Génère une histoire complète basée sur les personnages fournis
   * @param characters - Liste des personnages à inclure dans l'histoire
   * @returns Promise résolue avec les 4 scènes de l'histoire
   * @throws Error si la génération échoue
   */
  generateStory(characters: CharactersTable[]): Promise<GeneratedScene[]>;

  /**
   * Vérifie si le provider est disponible et configuré correctement
   * @returns Promise résolue avec true si le provider est prêt
   */
  isAvailable(): Promise<boolean>;

  /**
   * Nom du provider pour logging et debugging
   */
  readonly name: string;
}

/**
 * Scène générée par l'IA (avant insertion en DB)
 */
export interface GeneratedScene {
  scene_number: number;
  scene_type: SceneType;
  description: string;
  prompt: string; // Le prompt qui sera utilisé pour générer l'image
}

/**
 * Options de configuration pour les generators
 */
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

/**
 * Valeurs par défaut pour les options
 */
export const DEFAULT_OPTIONS: Required<StoryGeneratorOptions> = {
  timeout: 60000, // 60 secondes
  temperature: 0.7, // Équilibre entre créativité et cohérence
  maxTokens: 2000, // Suffisant pour 4 scènes détaillées
  debug: false,
};

/**
 * Convertit une réponse de l'IA en scènes utilisables
 */
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

/**
 * Erreur personnalisée pour les problèmes de génération d'histoire
 */
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

/**
 * Classe de base abstraite pour les story generators
 * Fournit des utilitaires communs pour tous les providers
 */
export abstract class BaseStoryGenerator implements StoryGenerator {
  protected options: Required<StoryGeneratorOptions>;

  constructor(
    public readonly name: string,
    options: StoryGeneratorOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  abstract generateStory(characters: CharactersTable[]): Promise<GeneratedScene[]>;
  abstract isAvailable(): Promise<boolean>;

  /**
   * Log de debug si activé
   */
  protected log(...args: unknown[]): void {
    if (this.options.debug) {
      console.log(`[${this.name}]`, ...args);
    }
  }

  /**
   * Valide que les personnages fournis sont valides
   */
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

  /**
   * Wrapper avec timeout pour les appels API
   */
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

  /**
   * Nettoie et parse une réponse JSON qui pourrait contenir du texte supplémentaire
   */
  protected parseJSONResponse(response: string): unknown {
    // Essayer de parser directement
    try {
      return JSON.parse(response);
    } catch {
      // Si ça échoue, essayer d'extraire le JSON d'un bloc de texte
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

/**
 * Factory pour créer le bon generator selon la configuration
 * Permet de basculer facilement entre providers
 */
export class StoryGeneratorFactory {
  private static instance: StoryGenerator | null = null;

  /**
   * Obtient une instance du generator (singleton)
   * @param forceProvider - Force l'utilisation d'un provider spécifique
   */
  static async getGenerator(
    forceProvider?: string
  ): Promise<StoryGenerator> {
    // Si une instance existe et pas de provider forcé, la retourner
    if (this.instance && !forceProvider) {
      return this.instance;
    }

    // Logique de sélection du provider
    const provider = forceProvider || process.env.STORY_PROVIDER || 'ollama';

    // Créer l'instance selon le provider
    switch (provider.toLowerCase()) {
      case 'ollama': {
        const { OllamaStoryGenerator } = await import('@/lib/providers/ollama');
        this.instance = new OllamaStoryGenerator();
        break;
      }
      // case 'huggingface': {
      //   const { HuggingFaceStoryGenerator } = await import('@/lib/providers/huggingface');
      //   this.instance = new HuggingFaceStoryGenerator();
      //   break;
      // }
      default:
        throw new Error(`Unknown story provider: ${provider}`);
    }

    return this.instance;
  }

  /**
   * Reset l'instance (utile pour les tests)
   */
  static reset(): void {
    this.instance = null;
  }
}
