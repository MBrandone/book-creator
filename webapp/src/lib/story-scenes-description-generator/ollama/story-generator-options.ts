export interface StoryGeneratorOptions {
    timeout?: number;
    temperature?: number;
    maxTokens?: number;
    debug?: boolean;
}

export const DEFAULT_OPTIONS: Required<StoryGeneratorOptions> = {
    timeout: 60000,
    temperature: 0.7,
    maxTokens: 2000,
    debug: false,
};