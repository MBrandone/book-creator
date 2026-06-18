import { db } from '@/lib/infrastructure/db';
import { Scene } from '@/lib/domain/scene';
import { SceneRepository } from '../../../domain/scene-repository';

export class SqlSceneRepository implements SceneRepository {
  async save(scene: Scene): Promise<void> {
    try {
      await db
        .insertInto('scenes')
        .values({
          id: scene.id,
          story_id: scene.storyId,
          scene_number: scene.sceneNumber,
          scene_type: scene.sceneType,
          description: scene.description,
          prompt: scene.prompt,
          storage_bucket: scene.storageBucket,
          storage_key: scene.storageKey,
        })
        .onConflict((oc) =>
          oc.columns(['story_id', 'scene_number']).doUpdateSet({
            storage_bucket: scene.storageBucket,
            storage_key: scene.storageKey,
            description: scene.description,
            prompt: scene.prompt,
          })
        )
        .execute();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde de la scène en base de données:', error);
      throw error;
    }
  }
}
