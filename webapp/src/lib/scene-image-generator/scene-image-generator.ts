export interface ImageGenerationOptions {
  prompt: string;
  seed?: number;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  style?: string;
  steps?: number;
  guidance?: number;
  negativePrompt?: string;
  referenceImages?: Array<{ bucket: string; key: string }>;
}

export interface ImageGenerationResult {
  bucket: string;
  key: string;
  seed?: number;
  prompt: string;
  provider: string;
  metadata?: Record<string, any>;
}

export interface SceneImageGenerator {
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
  readonly name: string;
}
