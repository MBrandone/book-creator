/**
 * Templates de prompts pour la génération d'histoires
 * Ces prompts sont optimisés pour créer des histoires pour enfants en 4 scènes
 */

import type { CharactersTable, SceneType } from '@/lib/db/schema';

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
 * Génère le prompt utilisateur avec les descriptions des personnages
 */
export function generateUserPrompt(characters: CharactersTable[]): string {
  const characterDescriptions = characters
    .map((char, index) => {
      return `Personnage ${index + 1} : ${char.name}
Description : ${char.description}`;
    })
    .join('\n\n');

  return `Crée une histoire pour enfants mettant en scène ces personnages :

${characterDescriptions}

L'histoire doit :
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

/**
 * Styles artistiques disponibles pour les illustrations
 */
export type ArtStyle = 'watercolor' | 'digital-painting' | 'soft-pastel' | 'storybook-classic';

/**
 * Configuration des styles artistiques avec leurs paramètres spécifiques
 */
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

/**
 * Template de prompt par défaut (watercolor)
 */
export const DEFAULT_ART_STYLE: ArtStyle = 'watercolor';

/**
 * Obtenir le préfixe de style complet pour un style donné
 */
export function getStylePrefix(style: ArtStyle = DEFAULT_ART_STYLE): string {
  const styleConfig = ART_STYLES[style];
  return `${styleConfig.basePrompt}, ${styleConfig.colorPalette}, ${styleConfig.qualityModifiers}`;
}

/**
 * Mots-clés de composition selon le type de scène
 */
const SCENE_COMPOSITION: Record<SceneType, {
  atmosphere: string;
  composition: string;
  mood: string;
  lighting: string;
}> = {
  introduction: {
    atmosphere: 'peaceful and inviting atmosphere, welcoming scene',
    composition: 'balanced composition, establishing shot, clear view of environment',
    mood: 'friendly, warm, safe, comfortable',
    lighting: 'soft natural lighting, bright and cheerful, morning light',
  },
  conflict: {
    atmosphere: 'slightly tense but not scary, showing the challenge clearly',
    composition: 'focused composition, emphasizing the problem, clear focal point',
    mood: 'concerned but hopeful, determined, facing a challenge',
    lighting: 'dramatic but gentle lighting, creating mild tension, afternoon light',
  },
  action: {
    atmosphere: 'dynamic and exciting, showing movement and energy',
    composition: 'dynamic composition, sense of movement, action-oriented',
    mood: 'energetic, determined, adventurous, working together',
    lighting: 'vibrant lighting, highlighting action, dynamic shadows',
  },
  resolution: {
    atmosphere: 'happy and celebratory, warm and comforting, peaceful conclusion',
    composition: 'harmonious composition, characters together, celebrating success',
    mood: 'joyful, satisfied, proud, triumphant, content',
    lighting: 'warm golden lighting, sunset glow, magical light, celebratory atmosphere',
  },
};

/**
 * Prompt négatif optimisé pour éviter les contenus inappropriés
 */
export const NEGATIVE_PROMPT = [
  // Contenu inapproprié
  'scary, frightening, horror, dark themes, violent, aggressive',
  'inappropriate, adult content, disturbing',
  // Qualité
  'blurry, low quality, pixelated, distorted, deformed',
  'amateur, poorly drawn, bad anatomy, ugly',
  // Style inapproprié
  'photorealistic, realistic photo, 3d render',
  'anime, manga, comic book style',
  // Éléments indésirables
  'text, watermark, signature, logo',
  'cropped, cut off, out of frame',
].join(', ');

/**
 * Génère une description détaillée des personnages pour cohérence visuelle
 */
export function generateCharacterDescription(characters: CharactersTable[]): string {
  if (characters.length === 0) return '';
  
  const descriptions = characters
    .map((char) => {
      // Extraire les caractéristiques visuelles clés de la description
      const visualFeatures = char.description;
      return `${char.name} (${visualFeatures})`;
    });
  
  if (descriptions.length === 1) {
    return `Character: ${descriptions[0]}`;
  } else if (descriptions.length === 2) {
    return `Characters: ${descriptions[0]} and ${descriptions[1]}`;
  } else {
    const lastChar = descriptions.pop();
    return `Characters: ${descriptions.join(', ')}, and ${lastChar}`;
  }
}

/**
 * Génère un prompt d'image complet et optimisé pour une scène
 */
export function generateImagePrompt(
  sceneDescription: string,
  characters: CharactersTable[],
  sceneType: SceneType,
  artStyle: ArtStyle = DEFAULT_ART_STYLE
): string {
  const stylePrefix = getStylePrefix(artStyle);
  const sceneConfig = SCENE_COMPOSITION[sceneType];
  const characterDetails = generateCharacterDescription(characters);
  
  // Construction du prompt optimisé
  const promptParts = [
    // 1. Style artistique de base
    stylePrefix,
    
    // 2. Description de la scène
    `Scene: ${sceneDescription}`,
    
    // 3. Personnages avec détails
    characterDetails,
    
    // 4. Atmosphère et mood
    sceneConfig.atmosphere,
    sceneConfig.mood,
    
    // 5. Composition et éclairage
    sceneConfig.composition,
    sceneConfig.lighting,
    
    // 6. Spécifications pour enfants
    "suitable for children ages 3-8, child-friendly, storybook illustration",
    
    // 7. Qualité finale
    "highly detailed, perfect for a published children's book, professional quality",
  ];
  
  return promptParts.filter(Boolean).join(', ');
}

/**
 * Génère un prompt optimisé avec des options avancées
 */
export interface AdvancedPromptOptions {
  artStyle?: ArtStyle;
  emphasizeCharacters?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  customModifiers?: string[];
}

export function generateAdvancedImagePrompt(
  sceneDescription: string,
  characters: CharactersTable[],
  sceneType: SceneType,
  options: AdvancedPromptOptions = {}
): string {
  const {
    artStyle = DEFAULT_ART_STYLE,
    emphasizeCharacters = true,
    timeOfDay,
    weather,
    customModifiers = [],
  } = options;
  
  let prompt = generateImagePrompt(sceneDescription, characters, sceneType, artStyle);
  
  // Ajouter l'emphase sur les personnages si demandé
  if (emphasizeCharacters && characters.length > 0) {
    prompt += ', characters are clearly visible and well-defined, character-focused illustration';
  }
  
  // Ajouter le moment de la journée
  if (timeOfDay) {
    const timeOfDayMap = {
      morning: 'morning light, dawn atmosphere, fresh and bright',
      afternoon: 'afternoon light, midday brightness, clear visibility',
      evening: 'evening light, golden hour, warm sunset tones',
      night: 'nighttime scene, moonlight, starry sky, gentle night lighting (not dark or scary)',
    };
    prompt += `, ${timeOfDayMap[timeOfDay]}`;
  }
  
  // Ajouter la météo
  if (weather) {
    const weatherMap = {
      sunny: 'sunny weather, clear sky, bright and cheerful',
      cloudy: 'cloudy sky, soft diffused light, gentle atmosphere',
      rainy: 'light rain, gentle raindrops, not stormy, peaceful rain scene',
      snowy: 'gentle snowfall, winter wonderland, soft snow, magical winter scene',
    };
    prompt += `, ${weatherMap[weather]}`;
  }
  
  // Ajouter les modificateurs personnalisés
  if (customModifiers.length > 0) {
    prompt += ', ' + customModifiers.join(', ');
  }
  
  return prompt;
}

/**
 * Prompts de fallback en cas d'erreur
 */
export const FALLBACK_SCENES = [
  {
    scene_number: 1,
    scene_type: 'introduction' as SceneType,
    description: 'Une belle journée commence pour nos amis qui se rencontrent dans un endroit magique.',
    image_prompt: getStylePrefix('watercolor') + ', two friends meeting in a magical garden, peaceful and inviting atmosphere',
  },
  {
    scene_number: 2,
    scene_type: 'conflict' as SceneType,
    description: 'Nos héros découvrent un mystère à résoudre ensemble.',
    image_prompt: getStylePrefix('watercolor') + ', friends discovering something mysterious, slightly curious atmosphere, not scary',
  },
  {
    scene_number: 3,
    scene_type: 'action' as SceneType,
    description: 'Ensemble, ils mettent en place un plan astucieux pour surmonter le défi.',
    image_prompt: getStylePrefix('watercolor') + ', friends working together with determination, dynamic and exciting',
  },
  {
    scene_number: 4,
    scene_type: 'resolution' as SceneType,
    description: 'Grâce à leur amitié et leur courage, tout finit bien et ils célèbrent leur réussite.',
    image_prompt: getStylePrefix('watercolor') + ', friends celebrating happily together, warm and joyful atmosphere',
  },
];

/**
 * Validation du format de réponse de l'IA
 */
export interface AISceneResponse {
  scene_number: number;
  scene_type: SceneType;
  description: string;
  image_prompt: string;
}

export interface AIStoryResponse {
  scenes: AISceneResponse[];
}

/**
 * Valide que la réponse de l'IA est au bon format
 */
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

    if (!validSceneTypes.includes(sceneObj.scene_type as SceneType)) {
      throw new Error(`Invalid scene at index ${i}: invalid scene_type`);
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
