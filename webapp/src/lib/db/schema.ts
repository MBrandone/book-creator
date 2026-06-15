// Types pour le schéma de base de données

export type StoryStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type SceneType = 'introduction' | 'conflict' | 'action' | 'resolution';

export interface StoriesTable {
  id: string;
  title?: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  status: StoryStatus;
}

export interface CharactersTable {
  id: string;
  story_id: string;
  name: string;
  description: string;
  image_url: string | null;
}

export interface ScenesTable {
  id: string;
  story_id: string;
  scene_number: number;
  scene_type: SceneType;
  description: string;
  image_url: string | null;
  prompt: string | null;
}

export interface UploadedPhotosTable {
  id: string;
  url: string;
  character_id: string;
}

export interface GeneratedImagesTable {
  id: string;
  scene_id: string;
  url: string;
}

// Interface du schéma complet de la base de données
export interface Database {
  stories: StoriesTable;
  characters: CharactersTable;
  scenes: ScenesTable;
  uploaded_photos: UploadedPhotosTable;
  generated_images: GeneratedImagesTable;
}
