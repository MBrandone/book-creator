import type {CharactersTable, SceneType} from "@/lib/infrastructure/db";

/**
 * Prompt système définissant le contexte et le rôle de l'IA
 */
export const SYSTEM_PROMPT = `Tu es un écrivain créatif spécialisé dans les histoires pour enfants de 3 à 8 ans.
Ton rôle est de créer des histoires captivantes, imaginatives et adaptées à l'âge des enfants.

Règles importantes :
- Les histoires doivent être positives et encourageantes
- Éviter les thèmes effrayants ou violents
- Utiliser un langage simple et accessible
- Incorporer des valeurs éducatives (amitié, courage, entraide, etc.)
- Créer une structure narrative claire : introduction, conflit, action, résolution
- Les histoires doivent impliquer les personnages fournis par l'utilisateur

Tu dois générer exactement 4 scènes pour chaque histoire :
1. Introduction : Présentation des personnages et du cadre
2. Conflit : Un problème ou défi apparaît
3. Action : Les personnages tentent de résoudre le problème
4. Résolution : Le problème est résolu, fin heureuse`;

/**
 * Génère le prompt utilisateur avec le contexte de l'histoire
 */
export function generateUserPrompt(title: string, description: string, characters: CharactersTable[]): string {
    const characterDescriptions = characters
        .map((char, index) => {
            return `Personnage ${index + 1} : ${char.name}
Description : ${char.description}`;
        })
        .join('\n\n');

    return `Crée une histoire pour enfants avec les informations suivantes :

TITRE : ${title}
THÈME/CONTEXTE : ${description}

PERSONNAGES :
${characterDescriptions}

L'histoire doit :
- Respecter le thème/contexte défini ci-dessus
- Être divisée en exactement 4 scènes
- Durer environ 2-3 minutes de lecture
- Être adaptée aux enfants de 3 à 8 ans
- Inclure tous les personnages de manière équilibrée
- Avoir une morale ou un message positif

Pour chaque scène, fournis :
1. Le type de scène (choisir parmi ces 4 chaines de caractères : introduction, conflict, action, ou resolution).
2. Une description détaillée de la scène (2-4 phrases)
3. Un prompt visuel pour générer une illustration (description détaillée de ce qui devrait apparaître dans l'image)

Réponds au format JSON suivant :
{
  "scenes": [
    {
      "scene_number": 1,
      "scene_type": "introduction",
      "description": "Description narrative de la scène",
      "image_prompt": "Prompt détaillé pour l'illustration"
    },
    ...
  ]
}`;
}

export type ArtStyle = 'watercolor' | 'digital-painting' | 'soft-pastel' | 'storybook-classic';
export const ART_STYLES: Record<ArtStyle, {
    name: string;
    description: string;
    basePrompt: string;
    qualityModifiers: string;
    colorPalette: string;
}> = {
    'watercolor': {
        name: 'Aquarelle',
        description: 'Style aquarelle doux et fluide, parfait pour les histoires poétiques',
        basePrompt: "watercolor illustration for children's book, soft brush strokes, fluid colors, gentle textures",
        qualityModifiers: 'professional illustration, high detail, storybook quality, award-winning',
        colorPalette: 'pastel colors, warm tones, harmonious palette, soft lighting',
    },
    'digital-painting': {
        name: 'Peinture digitale',
        description: 'Peinture numérique vibrante et moderne',
        basePrompt: "digital painting for children's book, smooth rendering, vibrant colors, modern illustration style",
        qualityModifiers: 'professional digital art, detailed, polished, high quality render',
        colorPalette: 'rich vibrant colors, balanced saturation, beautiful lighting, colorful',
    },
    'soft-pastel': {
        name: 'Pastel doux',
        description: 'Style pastel tendre et apaisant',
        basePrompt: "soft pastel illustration for children's book, gentle textures, dreamy atmosphere",
        qualityModifiers: 'professional illustration, delicate details, storybook quality',
        colorPalette: 'soft pastel colors, muted tones, gentle hues, warm and inviting',
    },
    'storybook-classic': {
        name: 'Conte classique',
        description: 'Style conte traditionnel, rappelant les grands classiques',
        basePrompt: "classic storybook illustration, traditional children's book art, timeless style",
        qualityModifiers: 'professional book illustration, detailed, refined, classic quality',
        colorPalette: 'balanced colors, classic palette, nostalgic feel, warm and welcoming',
    },
};
export const DEFAULT_ART_STYLE: ArtStyle = 'watercolor';

export function getStylePrefix(style: ArtStyle = DEFAULT_ART_STYLE): string {
    const styleConfig = ART_STYLES[style];
    return `${styleConfig.basePrompt}, ${styleConfig.colorPalette}, ${styleConfig.qualityModifiers}`;
}

/**
 * Normalise une chaîne en supprimant les accents
 */
function removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Normalise le scene_type en enlevant les accents et en le mettant en minuscules
 */
function normalizeSceneType(sceneType: string): string {
    return removeAccents(sceneType.toLowerCase().trim());
}

export function validateAIResponse(response: unknown): AIStoryResponse {
    if (!response || typeof response !== 'object') {
        throw new Error('Invalid AI response: not an object');
    }

    const data = response as Record<string, unknown>;
    console.log("AI response for scenes : \n", data)

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

        // Normaliser le scene_type en enlevant les accents
        if (typeof sceneObj.scene_type === 'string') {
            const normalizedType = normalizeSceneType(sceneObj.scene_type);

            // Vérifier si le type normalisé est valide
            if (!validSceneTypes.includes(normalizedType as SceneType)) {
                throw new Error(`Invalid scene at index ${i}: invalid scene_type '${sceneObj.scene_type}' (normalized: '${normalizedType}')`);
            }

            // Remplacer par le type normalisé
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

export interface AISceneResponse {
    scene_number: number;
    scene_type: SceneType;
    description: string;
    image_prompt: string;
}

export interface AIStoryResponse {
    scenes: AISceneResponse[];
}