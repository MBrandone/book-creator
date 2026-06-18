import Replicate from 'replicate';
import type { ImageGenerationOptions, ImageGenerationResult, SceneImageGenerator } from './scene-image-generator';
import { getStorage } from '@/lib/infrastructure/storage/storage-factory';

const FLUX_KLEIN_MODEL = 'black-forest-labs/flux-2-klein-4b';

const DEFAULT_ASPECT_RATIO = '1:1';
const DEFAULT_OUTPUT_MEGAPIXELS = '1';
const DEFAULT_OUTPUT_FORMAT = 'jpg';

export class ReplicateFluxKleinGenerator implements SceneImageGenerator {
  readonly name = 'replicate-flux-klein';
  private client: Replicate;

  constructor(apiToken?: string) {
    const token = apiToken || process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error('REPLICATE_API_TOKEN is required');
    }
    this.client = new Replicate({ auth: token });
  }

  private async convertImageToDataUri(key: string): Promise<string> {
    try {
      const storage = getStorage();
      const buffer = await storage.getImageBuffer(key);
      
      let mimeType = 'image/jpeg';
      if (key.endsWith('.png')) {
        mimeType = 'image/png';
      } else if (key.endsWith('.webp')) {
        mimeType = 'image/webp';
      }
      
      const base64 = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;
      
      console.log(`✅ Image convertie en data URI: ${key} (${buffer.length} bytes -> ${dataUri.length} chars)`);
      
      return dataUri;
    } catch (error) {
      console.error(`❌ Erreur lors de la conversion de l'image ${key} en data URI:`, error);
      throw error;
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const {
      prompt,
      seed,
      aspectRatio = DEFAULT_ASPECT_RATIO,
      referenceImages = [],
    } = options;

    console.log('🎨 Generating image with Replicate Flux Klein...');
    console.log('Prompt:', prompt);
    console.log('Aspect ratio:', aspectRatio);
    console.log('Reference images:', referenceImages.length);
    if (seed) console.log('Seed:', seed);

    try {
      const input: any = {
        prompt,
        aspect_ratio: aspectRatio,
        output_megapixels: DEFAULT_OUTPUT_MEGAPIXELS,
        output_format: DEFAULT_OUTPUT_FORMAT,
        go_fast: true,
      };

      if (referenceImages.length > 0) {
        console.log('🔄 Conversion des images de référence en data URIs...');
        const referenceDataUris = await Promise.all(
          referenceImages.map(img => this.convertImageToDataUri(img.key))
        );
        console.log(`✅ ${referenceDataUris.length} images converties en data URIs`);
        input.images = referenceDataUris;
      }

      if (seed) {
        input.seed = seed;
      }

      const output = await this.client.run(FLUX_KLEIN_MODEL, { input });

      console.log('✅ Image generated successfully');

      const imageUrl = Array.isArray(output) ? output[0] : output;
      
      console.log('📥 Retrieving image from Replicate...');
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      console.log(`✅ Image buffer created (${imageBuffer.length} bytes)`);

      const timestamp = Date.now();
      const filename = `images/generated/${timestamp}-${seed || 'random'}.${DEFAULT_OUTPUT_FORMAT}`;
      
      console.log('📤 Uploading to storage...');
      const storage = getStorage();
      const { bucket, key } = await storage.uploadImage(imageBuffer, filename, {
        'Content-Type': `image/${DEFAULT_OUTPUT_FORMAT}`,
      });
      console.log('✅ Image uploaded to storage');

      return {
        bucket,
        key,
        seed,
        prompt,
        provider: this.name,
        metadata: {
          aspectRatio,
          referenceImagesCount: referenceImages.length,
          filename,
        },
      };
    } catch (error) {
      console.error('❌ Error generating image:', error);
      throw new Error(
        `Failed to generate image with Replicate Flux Klein: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

let _fluxKleinProviderInstance: ReplicateFluxKleinGenerator | null = null;

export function getReplicateFluxKleinGenerator(): ReplicateFluxKleinGenerator {
  if (!_fluxKleinProviderInstance) {
    _fluxKleinProviderInstance = new ReplicateFluxKleinGenerator();
  }
  return _fluxKleinProviderInstance;
}
