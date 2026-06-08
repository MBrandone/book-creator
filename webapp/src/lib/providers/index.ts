/**
 * Providers pour la génération d'histoires et d'images
 * Point d'entrée centralisé pour tous les providers AI
 */

// Ollama Provider (Story Generation)
export {
  OllamaStoryGenerator,
  createOllamaGenerator,
} from './ollama';

// Replicate Provider (Image Generation)
export {
  ReplicateImageProvider,
  createReplicateProvider,
  getReplicateProvider,
  replicateProvider,
} from './replicate';

// Export des types communs pour les providers
export type { StoryGenerator, GeneratedScene, StoryGeneratorOptions } from '@/lib/ai/story-generator';
export type { ImageGenerator, ImageGenerationOptions, ImageGenerationResult } from '@/lib/ai/image-generator';
