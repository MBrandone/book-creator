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
  bucket: string;
  key: string;
  seed?: number;
  prompt: string;
  provider: string;
  metadata?: Record<string, any>;
}

export interface ImageGenerator {
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
  readonly name: string;
}

export const DEFAULT_CHILDREN_BOOK_STYLE =
  "children's book illustration, colorful, friendly, warm lighting, storybook art style, digital painting";

export const DEFAULT_NEGATIVE_PROMPT =
  "scary, frightening, dark, violent, inappropriate, photorealistic, blurry, low quality";
