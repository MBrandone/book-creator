import { db } from '@/lib/db';
import { Story } from '@/lib/domain/story';
import { Character } from '@/lib/domain/character';
import { StoryRepository } from '../../domain/story-repository';
import { DuplicateStoryError } from '@/lib/command-handler/create-a-story/duplicate-story-error';
import {StoryNotFoundError} from "@/lib/domain/story-not-found-error";

export class SqlStoryRepository implements StoryRepository {
  async save(story: Story): Promise<void> {
    try {
      await db
        .insertInto('stories')
        .values({
          id: story.id,
          title: story.title,
          description: story.description,
          status: story.status,
          created_at: story.createdAt,
          updated_at: story.updatedAt,
        })
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            title: story.title,
            description: story.description,
            status: story.status,
            updated_at: story.updatedAt,
          })
        )
        .execute();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde en base de données:', error);
      throw error;
    }
  }

  async get(storyId: string): Promise<Story> {
    const storyResult = await db
      .selectFrom('stories')
      .selectAll()
      .where('id', '=', storyId)
      .executeTakeFirst();

    if (!storyResult) {
      throw new StoryNotFoundError(storyId);
    }

    const charactersResult = await db
      .selectFrom('characters')
      .selectAll()
      .where('story_id', '=', storyId)
      .execute();

    const characters = charactersResult.map(char =>
      Character.create({
        id: char.id,
        storyId: char.story_id,
        name: char.name,
        description: char.description,
        photoStorageBucket: char.photo_storage_bucket,
        photoStorageKey: char.photo_storage_key,
      })
    );

    return Story.hydrate({
      id: storyResult.id,
      title: storyResult.title || '',
      description: storyResult.description || '',
      status: storyResult.status,
      createdAt: storyResult.created_at,
      updatedAt: storyResult.updated_at,
      characters,
    });
  }

  private isDuplicateKeyError(error: any): boolean {
    return error.code === '23505';
  }
}
