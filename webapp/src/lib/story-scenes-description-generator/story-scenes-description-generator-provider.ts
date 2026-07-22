export const STORY_SCENES_DESCRIPTION_GENERATOR_PROVIDERS = [
	"ollama",
	"replicate",
	"mock",
] as const;

export type StoryScenesDescriptionGeneratorProvider =
	(typeof STORY_SCENES_DESCRIPTION_GENERATOR_PROVIDERS)[number];
