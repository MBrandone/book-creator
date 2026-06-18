import { db } from '@/lib/infrastructure/db';
import { StoryReadModel } from '../../domain/story-read-model';
import { StoryDetailsView } from '../../domain/story-details-view';
import { StoryStatusView } from '../../domain/story-status-view';

export class SqlStoryReadModel implements StoryReadModel {
  constructor(private readonly publicBaseUrl: string) {}

  async viewDetails(storyId: string): Promise<StoryDetailsView | null> {
    const [story, characters, scenes] = await Promise.all([
      db
        .selectFrom('stories')
        .select(['id', 'title', 'description', 'status', 'created_at', 'updated_at'])
        .where('id', '=', storyId)
        .executeTakeFirst(),
      
      db
        .selectFrom('characters')
        .select(['id', 'name', 'description', 'photo_storage_bucket', 'photo_storage_key'])
        .where('story_id', '=', storyId)
        .execute(),
      
      db
        .selectFrom('scenes')
        .select(['id', 'scene_number', 'scene_type', 'description', 'storage_bucket', 'storage_key', 'prompt'])
        .where('story_id', '=', storyId)
        .orderBy('scene_number', 'asc')
        .execute(),
    ]);

    if (!story) {
      return null;
    }

    return {
      story: {
        id: story.id,
        title: story.title,
        description: story.description,
        status: story.status,
        created_at: story.created_at.toISOString(),
        updated_at: story.updated_at.toISOString(),
      },
      characters: characters.map(character => ({
        id: character.id,
        name: character.name,
        description: character.description,
      })),
      scenes: scenes.map(scene => ({
        id: scene.id,
        scene_number: scene.scene_number,
        scene_type: scene.scene_type,
        description: scene.description,
        image_url: scene.storage_bucket && scene.storage_key 
          ? `${this.publicBaseUrl}/${scene.storage_bucket}/${scene.storage_key}`
          : null,
        prompt: scene.prompt,
      })),
    };
  }

  async viewStatus(storyId: string): Promise<StoryStatusView | null> {
    const story = await db
      .selectFrom('stories')
      .select('status')
      .where('id', '=', storyId)
      .executeTakeFirst();

    if (!story) {
      return null;
    }

    return {
      status: story.status,
    };
  }
}
