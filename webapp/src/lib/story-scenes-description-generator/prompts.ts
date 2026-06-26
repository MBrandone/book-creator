import type {CharactersTable} from "@/lib/infrastructure/db";
import {StoryContext} from "@/lib/story-scenes-description-generator/story-scenes-description-generator";

export class StorySceneDescriptionPromptBuilder {
    private userPrompt = ""

    constructor() {
        return this
    }

    setUserPrompt(context : StoryContext) {
        const characterDescriptions = context.characters
            .map((char, index) => {
                return `Personnage ${index + 1} : ${char.name}
Description : ${char.description}`;
            })
            .join('\n\n');

        this.userPrompt = `Crée une histoire pour enfants avec les informations suivantes :

TITRE : ${context.title}
THÈME/CONTEXTE : ${context.description}

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
}`
        return this
    }

    getPrompt() {
        return `${SYSTEM_PROMPT}
---
${this.userPrompt}

Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.`;
    }
}

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
