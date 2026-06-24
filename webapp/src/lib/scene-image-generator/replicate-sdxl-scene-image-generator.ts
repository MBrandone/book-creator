/**
 * Replicate Provider
 * 
 * Implémente la génération d'images avec Stable Diffusion XL via Replicate API.
 * Gère le polling asynchrone et l'upload vers le storage provider configuré.
 */

import Replicate from 'replicate';
import type {ImageGenerationOptions, ImageGenerationResult, SceneImageGenerator,} from './scene-image-generator';
import {getStorage} from '@/lib/infrastructure/storage/storage-factory';
import { env } from '@/config/env';
//import { withExponentialBackoff } from './replicate-retry-utils';

const SDXL_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

// Paramètres par défaut optimisés pour les illustrations de livres enfants
const DEFAULT_STEPS = 30;
const DEFAULT_GUIDANCE = 7.5;

interface SDXLOutput {
  url?: string;
}

export class ReplicateSdxlSceneImageGenerator implements SceneImageGenerator {
  readonly name = 'replicate-sdxl';
  private client: Replicate;

  constructor() {
    this.client = new Replicate({ auth: env.REPLICATE_API_TOKEN });
  }

  private getDimensions(aspectRatio: string): { width: number; height: number } {
    const ratios: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1024, height: 576 },
      '9:16': { width: 576, height: 1024 },
      '4:3': { width: 1024, height: 768 },
    };
    return ratios[aspectRatio] || ratios['1:1'];
  }

  private async uploadToStorage(imageBuffer: Buffer, filename: string): Promise<{ bucket: string; key: string }> {
    const storage = getStorage();

    return await storage.uploadImage(imageBuffer, filename, {
      'Content-Type': 'image/png',
    });
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const {
      prompt,
      seed,
      aspectRatio = '1:1',
      style,
      steps = DEFAULT_STEPS,
      guidance = DEFAULT_GUIDANCE,
      negativePrompt,
    } = options;

    const fullPrompt = style
      ? `${prompt}, ${style}`
      : `${prompt}, children's book illustration, colorful, friendly, warm lighting, storybook art style, digital painting`;

    const dimensions = this.getDimensions(aspectRatio);

    console.log('🎨 Generating image with Replicate SDXL...');
    console.log('Prompt:', fullPrompt);
    console.log('Dimensions:', dimensions);
    console.log('Steps:', steps);
    console.log('Guidance:', guidance);
    if (seed) console.log('Seed:', seed);

    try {
      // Lancer la génération d'image
      // @ts-ignore
      const [output] = await this.client.run(SDXL_MODEL, {
        input: {
          prompt: fullPrompt,
          negative_prompt: negativePrompt || 
            'scary, frightening, dark, violent, inappropriate, photorealistic, blurry, low quality',
          width: dimensions.width,
          height: dimensions.height,
          num_inference_steps: steps,
          guidance_scale: guidance,
          ...(seed ? { seed } : {}),
          scheduler: 'K_EULER',
          refine: 'expert_ensemble_refiner',
          refine_steps: 10,
        },
      });

      console.log('✅ Image generated successfully');


      console.log('📥 Retrieving image blob from Replicate...');
      const blob = await output.blob();
      console.log(`✅ Blob retrieved (${blob.size} bytes, type: ${blob.type})`);
      
      const arrayBuffer = await blob.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      console.log(`✅ Image buffer created (${imageBuffer.length} bytes)`);

      const timestamp = Date.now();
      const filename = `images/generated/${timestamp}-${seed || 'random'}.png`;
      
      console.log('📤 Uploading to storage...');
      const { bucket, key } = await this.uploadToStorage(imageBuffer, filename);
      console.log('✅ Image uploaded to storage');

      return {
        bucket,
        key,
        seed,
        prompt: fullPrompt,
        provider: this.name,
        metadata: {
          aspectRatio,
          dimensions,
          steps,
          guidance,
          filename,
        },
      };
    } catch (error) {
      console.error('❌ Error generating image:', error);
      throw new Error(
        `Failed to generate image with Replicate: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

let _replicateProviderInstance: ReplicateSdxlSceneImageGenerator | null = null;

export function getReplicateProvider(): ReplicateSdxlSceneImageGenerator {
  if (!_replicateProviderInstance) {
    _replicateProviderInstance = new ReplicateSdxlSceneImageGenerator();
  }
  return _replicateProviderInstance;
}
