/**
 * AI Services - Point d'entrée principal
 * Exporte tous les services et utilitaires IA
 */

// Story Generator
export {
  type StoryGenerator,
  type GeneratedScene,
  type StoryGeneratorOptions,
  BaseStoryGenerator,
  StoryGenerationError,
  StoryGeneratorFactory,
  convertAIResponseToScenes,
  DEFAULT_OPTIONS,
} from './story-generator';

// Image Generator
export {
  type ImageGenerator,
  type ImageGenerationOptions,
  type ImageGenerationResult,
  DEFAULT_CHILDREN_BOOK_STYLE,
  DEFAULT_NEGATIVE_PROMPT,
} from './image-generator';

// Prompts
export {
  type AISceneResponse,
  type AIStoryResponse,
  SYSTEM_PROMPT,
  IMAGE_STYLE_PREFIX,
  FALLBACK_SCENES,
  generateUserPrompt,
  generateImagePrompt,
  validateAIResponse,
} from './prompts';
