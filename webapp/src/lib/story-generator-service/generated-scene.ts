import { SceneType } from "@/lib/domain/scene";

export type GeneratedScene = {
  scene_number: number;
  scene_type: SceneType;
  description: string;
  prompt: string;
};
