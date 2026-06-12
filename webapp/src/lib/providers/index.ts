/**
 * Providers pour la génération d'histoires et d'images
 * Point d'entrée centralisé pour tous les providers AI
 */

// Ollama Provider (Story Generation)
export {
  OllamaStoryGenerator,
  createOllamaGenerator,
} from './ollama-story-generator';

// Replicate Provider (Image Generation)
export {
  ReplicateImageProvider,
  createReplicateProvider,
  getReplicateProvider,
  replicateProvider,
} from './replicate';

// Export des types communs pour les providers
export type { SceneGenerator, GeneratedScene, StoryGeneratorOptions } from '@/lib/command-handler/generate-story-book-images/scene-generator';
export type { ImageGenerator, ImageGenerationOptions, ImageGenerationResult } from '@/lib/command-handler/generate-story-book-images/image-generator';
