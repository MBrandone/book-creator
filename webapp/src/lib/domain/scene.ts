export type SceneType =
	| "cover"
	| "introduction"
	| "conflict"
	| "action"
	| "resolution";

export type Scene = {
	id: string;
	storyId: string;
	sceneNumber: number;
	sceneType: SceneType;
	description: string;
	prompt: string;
	storageBucket: string | null;
	storageKey: string | null;
};
