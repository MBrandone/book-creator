/**
 * Replicate Provider
 * 
 * Implémente la génération d'images avec Stable Diffusion XL via Replicate API.
 * Gère le polling asynchrone et l'upload sur MinIO.
 */

import Replicate from 'replicate';
import type {
  ImageGenerator,
  ImageGenerationOptions,
  ImageGenerationResult,
} from '../ai/image-generator';
import { minioClient, bucketName } from '../storage/minio';

// Configuration du modèle SDXL
const SDXL_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

// Paramètres par défaut optimisés pour les illustrations de livres enfants
const DEFAULT_STEPS = 30;
const DEFAULT_GUIDANCE = 7.5;

interface SDXLOutput {
  url?: string;
}

export class ReplicateImageProvider implements ImageGenerator {
  readonly name = 'replicate-sdxl';
  private client: Replicate;

  constructor(apiToken?: string) {
    const token = apiToken || process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error('REPLICATE_API_TOKEN is required');
    }
    this.client = new Replicate({ auth: token });
  }

  /**
   * Convertit l'aspect ratio en dimensions
   */
  private getDimensions(aspectRatio: string): { width: number; height: number } {
    const ratios: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1024, height: 576 },
      '9:16': { width: 576, height: 1024 },
      '4:3': { width: 1024, height: 768 },
    };
    return ratios[aspectRatio] || ratios['1:1'];
  }

  /**
   * Upload l'image sur MinIO et retourne l'URL publique
   */
  private async uploadToMinio(imageBuffer: Buffer, filename: string): Promise<string> {
    await minioClient.putObject(
      bucketName,
      filename,
      imageBuffer,
      imageBuffer.length,
      {
        'Content-Type': 'image/png',
      }
    );

    // Générer l'URL publique (présignée pour 7 jours)
    const url = await minioClient.presignedGetObject(bucketName, filename, 7 * 24 * 60 * 60);
    return url;
  }

  /**
   * Génère une image avec SDXL via Replicate
   */
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

    // Construire le prompt complet avec le style
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


      // Use blob() method as recommended by Replicate documentation
      console.log('📥 Retrieving image blob from Replicate...');
      const blob = await output.blob();
      console.log(`✅ Blob retrieved (${blob.size} bytes, type: ${blob.type})`);
      
      // Convert blob to buffer for MinIO upload
      const arrayBuffer = await blob.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      console.log(`✅ Image buffer created (${imageBuffer.length} bytes)`);

      // Upload sur MinIO
      const timestamp = Date.now();
      const filename = `images/generated/${timestamp}-${seed || 'random'}.png`;
      
      console.log('📤 Uploading to MinIO...');
      const minioUrl = await this.uploadToMinio(imageBuffer, filename);
      console.log('✅ Image uploaded to MinIO');

      return {
        url: minioUrl,
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

/**
 * Factory function pour créer une instance du provider Replicate
 * Permet de différer la création jusqu'à ce que les variables d'environnement soient chargées
 */
export function createReplicateProvider(apiToken?: string): ReplicateImageProvider {
  return new ReplicateImageProvider(apiToken);
}

/**
 * Instance par défaut du provider Replicate (lazy)
 * Note: Sera créée à la première utilisation pour permettre le chargement des env vars
 */
let _replicateProviderInstance: ReplicateImageProvider | null = null;

export function getReplicateProvider(): ReplicateImageProvider {
  if (!_replicateProviderInstance) {
    _replicateProviderInstance = new ReplicateImageProvider();
  }
  return _replicateProviderInstance;
}

/**
 * @deprecated Utilisez getReplicateProvider() à la place pour lazy loading
 */
export const replicateProvider = {
  get instance() {
    return getReplicateProvider();
  }
};
