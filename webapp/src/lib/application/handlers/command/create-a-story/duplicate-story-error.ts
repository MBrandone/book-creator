export class DuplicateStoryError extends Error {
    constructor() {
        super('Duplicate story');
        this.name = 'DuplicateStoryError';
    }
}