// Types pour le schéma de base de données

export type StoryStatus = "pending" | "generating" | "completed" | "failed";
export type SceneType =
	| "cover"
	| "introduction"
	| "conflict"
	| "action"
	| "resolution";

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
	photo_storage_bucket: string | null;
	photo_storage_key: string | null;
}

export interface ScenesTable {
	id: string;
	story_id: string;
	scene_number: number;
	scene_type: SceneType;
	description: string;
	storage_bucket: string | null;
	storage_key: string | null;
	prompt: string | null;
}

// Interface du schéma complet de la base de données
export interface Database {
	stories: StoriesTable;
	characters: CharactersTable;
	scenes: ScenesTable;
}
