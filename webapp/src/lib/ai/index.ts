export {
  type SceneGenerator,
  type GeneratedScene,
  type StoryGeneratorOptions,
  BaseStoryGenerator,
  StoryGenerationError,
  StoryGeneratorFactory,
  convertAIResponseToScenes,
  DEFAULT_OPTIONS,
} from '../command-handler/generate-story-book-images/scene-generator';

// Image Generator
export {
  type ImageGenerator,
  type ImageGenerationOptions,
  type ImageGenerationResult,
  DEFAULT_CHILDREN_BOOK_STYLE,
  DEFAULT_NEGATIVE_PROMPT,
} from '../command-handler/generate-story-book-images/image-generator';

// Prompts
export {
  type AISceneResponse,
  type AIStoryResponse,
  SYSTEM_PROMPT,
  FALLBACK_SCENES,
  generateUserPrompt,
  generateImagePrompt,
  validateAIResponse,
} from './prompts';
