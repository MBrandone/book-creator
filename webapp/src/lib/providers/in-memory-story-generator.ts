import {GeneratedScene, SceneGenerator} from "@/lib/command-handler/generate-story-book-images/scene-generator";
import {type SceneType} from "@/lib/db";
import {getStylePrefix} from "@/lib/ai/prompts";

export class InMemorySceneGenerator implements SceneGenerator {
    readonly name: string = 'InMemorySceneGenerator';

    generateStory(): Promise<GeneratedScene[]> {
        return Promise.resolve(IN_MEMORY_SCENES);
    }

    isAvailable(): Promise<boolean> {
        return Promise.resolve(true);
    }

}

export const IN_MEMORY_SCENES: GeneratedScene[] = [
    {
        scene_number: 1,
        scene_type: 'introduction' as SceneType,
        description: 'Une belle journée commence pour nos amis qui se rencontrent dans un endroit magique.',
        prompt: getStylePrefix('watercolor') + ', two friends meeting in a magical garden, peaceful and inviting atmosphere',
    },
    {
        scene_number: 2,
        scene_type: 'conflict' as SceneType,
        description: 'Nos héros découvrent un mystère à résoudre ensemble.',
        prompt: getStylePrefix('watercolor') + ', friends discovering something mysterious, slightly curious atmosphere, not scary',
    },
    {
        scene_number: 3,
        scene_type: 'action' as SceneType,
        description: 'Ensemble, ils mettent en place un plan astucieux pour surmonter le défi.',
        prompt: getStylePrefix('watercolor') + ', friends working together with determination, dynamic and exciting',
    },
    {
        scene_number: 4,
        scene_type: 'resolution' as SceneType,
        description: 'Grâce à leur amitié et leur courage, tout finit bien et ils célèbrent leur réussite.',
        prompt: getStylePrefix('watercolor') + ', friends celebrating happily together, warm and joyful atmosphere',
    },
]