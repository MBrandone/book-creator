import { Scene } from '@/lib/domain/scene';

export interface SceneRepository {
  save(scene: Scene): Promise<void>;
}
