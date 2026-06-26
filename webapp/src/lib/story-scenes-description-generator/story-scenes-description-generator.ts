import type {CharactersTable, SceneType} from '@/lib/infrastructure/db/schema';

export interface StoryScenesDescriptionGenerator {
  generateStory(context: StoryContext): Promise<GeneratedScene[]>;
  isAvailable(): Promise<boolean>;
}

export interface StoryContext {
  title: string;
  description: string;
  characters: CharactersTable[];
}

export interface GeneratedScene {
  scene_number: number;
  scene_type: SceneType;
  description: string;
  prompt: string;
}

