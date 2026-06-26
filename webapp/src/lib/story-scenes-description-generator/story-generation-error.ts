export class StoryGenerationError extends Error {
    constructor(
        message: string,
        public readonly provider: string,
    ) {
        super(`[${provider}] ${message}`);
        this.name = 'StoryGenerationError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, StoryGenerationError);
        }
    }
}