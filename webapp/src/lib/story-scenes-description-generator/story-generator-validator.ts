import { z } from 'zod';
import type { StoryContext } from './story-scenes-description-generator';
import type { SceneType } from '@/lib/infrastructure/db/schema';
import type { AIStoryResponse } from './story-scenes-description-prompts';

const characterSchema = z.object({
  name: z.string().min(1, 'Character name is required'),
  description: z.string().min(10, 'Character description needs to be at least 10 characters'),
}).passthrough();

const storyContextSchema = z.object({
  title: z.string().min(1, 'Story title is required'),
  description: z.string().min(10, 'Story description needs to be at least 10 characters'),
  characters: z.array(characterSchema)
    .min(1, 'At least one character is required')
    .max(5, 'Too many characters (maximum 5)'),
});

export class StoryGeneratorValidator {
  static validateStoryContext(context: StoryContext): void {
    storyContextSchema.parse(context);
  }

  static validateAIResponse(response: unknown): AIStoryResponse {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid AI response: not an object');
    }

    const data = response as Record<string, unknown>;
    console.log("AI response for scenes : \n", data);

    if (!Array.isArray(data.scenes)) {
      throw new Error('Invalid AI response: scenes is not an array');
    }

    if (data.scenes.length !== 4) {
      throw new Error(`Invalid AI response: expected 4 scenes, got ${data.scenes.length}`);
    }

    const validSceneTypes: SceneType[] = ['introduction', 'conflict', 'action', 'resolution'];

    for (let i = 0; i < data.scenes.length; i++) {
      const scene = data.scenes[i];

      if (!scene || typeof scene !== 'object') {
        throw new Error(`Invalid scene at index ${i}: not an object`);
      }

      const sceneObj = scene as Record<string, unknown>;

      if (typeof sceneObj.scene_number !== 'number') {
        throw new Error(`Invalid scene at index ${i}: scene_number is not a number`);
      }

      if (typeof sceneObj.scene_type === 'string') {
        const normalizedType = this.normalizeSceneType(sceneObj.scene_type);

        if (!validSceneTypes.includes(normalizedType as SceneType)) {
          throw new Error(`Invalid scene at index ${i}: invalid scene_type '${sceneObj.scene_type}' (normalized: '${normalizedType}')`);
        }

        sceneObj.scene_type = normalizedType;
      } else {
        throw new Error(`Invalid scene at index ${i}: scene_type is not a string`);
      }

      if (typeof sceneObj.description !== 'string' || sceneObj.description.length < 10) {
        throw new Error(`Invalid scene at index ${i}: description is invalid`);
      }

      if (typeof sceneObj.image_prompt !== 'string' || sceneObj.image_prompt.length < 10) {
        throw new Error(`Invalid scene at index ${i}: image_prompt is invalid`);
      }
    }

    return data as unknown as AIStoryResponse;
  }

  private static normalizeSceneType(sceneType: string): string {
    return this.removeAccents(sceneType.toLowerCase().trim());
  }

  private static removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  static parseJSONResponse(response: string): unknown {
    try {
      return JSON.parse(response);
    } catch {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error('Failed to parse JSON from response');
        }
      }
      throw new Error('No valid JSON found in response');
    }
  }
}
