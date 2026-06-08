/**
 * Image Generator Interface
 * 
 * Interface générique pour les services de génération d'images.
 * Permet de supporter différents providers (Replicate SDXL, DALL-E, etc.)
 */

export interface ImageGenerationOptions {
  prompt: string;
  seed?: number;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  style?: string;
  steps?: number;
  guidance?: number;
  negativePrompt?: string;
}

export interface ImageGenerationResult {
  url: string;
  seed?: number;
  prompt: string;
  provider: string;
  metadata?: Record<string, any>;
}

export interface ImageGenerator {
  /**
   * Génère une image basée sur un prompt
   * @param options Options de génération d'image
   * @returns URL de l'image générée (peut être temporaire ou permanente)
   */
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;

  /**
   * Nom du provider
   */
  readonly name: string;
}

/**
 * Style par défaut pour les illustrations de livres pour enfants
 */
export const DEFAULT_CHILDREN_BOOK_STYLE = 
  "children's book illustration, colorful, friendly, warm lighting, storybook art style, digital painting";

/**
 * Prompt négatif par défaut pour éviter les contenus inappropriés
 */
export const DEFAULT_NEGATIVE_PROMPT = 
  "scary, frightening, dark, violent, inappropriate, photorealistic, blurry, low quality";
