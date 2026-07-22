export const SCENE_IMAGE_GENERATOR_PROVIDERS = ["replicate", "mock"] as const;

export type SceneImageGeneratorProvider =
	(typeof SCENE_IMAGE_GENERATOR_PROVIDERS)[number];
