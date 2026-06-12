export class Story {
}

export interface StoryRepository {
    get(id: string): Promise<Story>
}