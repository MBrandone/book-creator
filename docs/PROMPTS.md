# 🎨 Guide du système de Prompts Engineering

Ce guide explique comment utiliser le système de génération de prompts optimisés pour créer des illustrations de qualité professionnelle pour les livres pour enfants.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Styles artistiques](#styles-artistiques)
3. [Génération de prompts](#génération-de-prompts)
4. [Options avancées](#options-avancées)
5. [Bonnes pratiques](#bonnes-pratiques)
6. [Exemples](#exemples)

---

## Vue d'ensemble

Le système de prompts est conçu pour générer des descriptions détaillées et cohérentes pour la génération d'images. Chaque prompt est optimisé pour :

- ✅ Maintenir un style visuel cohérent à travers toutes les scènes
- ✅ Intégrer les descriptions des personnages pour la continuité
- ✅ Adapter l'atmosphère selon le type de scène
- ✅ Garantir un contenu approprié pour les enfants de 3 à 8 ans
- ✅ Maximiser la qualité des illustrations générées

### Architecture du système

```
Prompt complet = Style + Scène + Personnages + Atmosphère + Composition + Qualité
```

Chaque prompt est construit en plusieurs couches :

1. **Style artistique** : watercolor, digital-painting, soft-pastel, storybook-classic
2. **Description de la scène** : Ce qui se passe dans l'histoire
3. **Personnages** : Descriptions visuelles détaillées
4. **Atmosphère & Mood** : Ambiance adaptée au type de scène
5. **Composition & Éclairage** : Structure visuelle et lumière
6. **Spécifications** : Approprié pour enfants, qualité professionnelle

---

## Styles artistiques

Le système propose 4 styles artistiques prédéfinis :

### 🎨 Watercolor (Aquarelle) - **Par défaut**

Style doux et fluide, parfait pour les histoires poétiques et rêveuses.

```typescript
import { generateImagePrompt } from '@/lib/ai/prompts';

const prompt = generateImagePrompt(
  "Luna découvre un jardin magique",
  characters,
  'introduction',
  'watercolor'
);
```

**Caractéristiques :**
- Coups de pinceau doux et fluides
- Couleurs pastel et tons chauds
- Palette harmonieuse
- Éclairage doux

**Idéal pour :** Histoires douces, contes de fées, ambiances rêveuses

---

### 🖌️ Digital Painting (Peinture digitale)

Style vibrant et moderne avec des couleurs éclatantes.

```typescript
const prompt = generateImagePrompt(
  description,
  characters,
  sceneType,
  'digital-painting'
);
```

**Caractéristiques :**
- Rendu lisse et professionnel
- Couleurs riches et vibrantes
- Style d'illustration moderne
- Saturation équilibrée

**Idéal pour :** Histoires dynamiques, aventures, scènes colorées

---

### 🌈 Soft Pastel (Pastel doux)

Style tendre et apaisant pour des atmosphères calmes.

```typescript
const prompt = generateImagePrompt(
  description,
  characters,
  sceneType,
  'soft-pastel'
);
```

**Caractéristiques :**
- Textures douces
- Couleurs pastels mutées
- Atmosphère onirique
- Tons chauds et accueillants

**Idéal pour :** Histoires du soir, moments tendres, ambiances calmes

---

### 📚 Storybook Classic (Conte classique)

Style traditionnel rappelant les grands classiques de la littérature enfantine.

```typescript
const prompt = generateImagePrompt(
  description,
  characters,
  sceneType,
  'storybook-classic'
);
```

**Caractéristiques :**
- Illustration traditionnelle
- Palette classique équilibrée
- Style intemporel
- Nostalgie et chaleur

**Idéal pour :** Contes traditionnels, histoires classiques, ambiance vintage

---

## Génération de prompts

### Fonction de base : `generateImagePrompt()`

```typescript
import { generateImagePrompt } from '@/lib/ai/prompts';
import type { CharactersTable, SceneType } from '@/lib/db/schema';

const characters: CharactersTable[] = [
  {
    name: 'Luna',
    description: 'une petite licorne blanche avec une crinière arc-en-ciel',
    // ... autres champs
  },
  {
    name: 'Oscar',
    description: 'un renard roux malicieux avec un foulard bleu',
    // ... autres champs
  }
];

const prompt = generateImagePrompt(
  "Luna et Oscar découvrent un trésor caché dans la forêt",
  characters,
  'action',
  'watercolor'
);

// Résultat : un prompt optimisé de ~500-700 caractères
```

### Anatomie d'un prompt généré

```
watercolor illustration for children's book, soft brush strokes, fluid colors, 
gentle textures, pastel colors, warm tones, harmonious palette, soft lighting, 
professional illustration, high detail, storybook quality, award-winning, 

Scene: Luna et Oscar découvrent un trésor caché dans la forêt, 

Characters: Luna (une petite licorne blanche avec une crinière arc-en-ciel) 
and Oscar (un renard roux malicieux avec un foulard bleu), 

dynamic and exciting, showing movement and energy, energetic, determined, 
adventurous, working together, dynamic composition, sense of movement, 
action-oriented, vibrant lighting, highlighting action, dynamic shadows, 

suitable for children ages 3-8, child-friendly, storybook illustration, 
highly detailed, perfect for a published children's book, professional quality
```

---

## Options avancées

### Fonction avancée : `generateAdvancedImagePrompt()`

Pour un contrôle plus précis, utilisez la version avancée avec des options supplémentaires.

```typescript
import { generateAdvancedImagePrompt } from '@/lib/ai/prompts';
import type { AdvancedPromptOptions } from '@/lib/ai/prompts';

const options: AdvancedPromptOptions = {
  artStyle: 'watercolor',
  emphasizeCharacters: true,
  timeOfDay: 'morning',
  weather: 'sunny',
  customModifiers: ['magical atmosphere', 'sparkles of light']
};

const prompt = generateAdvancedImagePrompt(
  "Luna et Oscar dansent sous les étoiles",
  characters,
  'resolution',
  options
);
```

### Options disponibles

| Option | Type | Description | Valeurs possibles |
|--------|------|-------------|-------------------|
| `artStyle` | `ArtStyle` | Style artistique | `'watercolor'`, `'digital-painting'`, `'soft-pastel'`, `'storybook-classic'` |
| `emphasizeCharacters` | `boolean` | Mettre l'accent sur les personnages | `true` / `false` (défaut: `true`) |
| `timeOfDay` | `string` | Moment de la journée | `'morning'`, `'afternoon'`, `'evening'`, `'night'` |
| `weather` | `string` | Conditions météo | `'sunny'`, `'cloudy'`, `'rainy'`, `'snowy'` |
| `customModifiers` | `string[]` | Modificateurs personnalisés | Tableau de strings |

### Moments de la journée

```typescript
// Matin
timeOfDay: 'morning'
// → "morning light, dawn atmosphere, fresh and bright"

// Après-midi
timeOfDay: 'afternoon'
// → "afternoon light, midday brightness, clear visibility"

// Soirée
timeOfDay: 'evening'
// → "evening light, golden hour, warm sunset tones"

// Nuit (adaptée pour enfants)
timeOfDay: 'night'
// → "nighttime scene, moonlight, starry sky, gentle night lighting (not dark or scary)"
```

### Conditions météo

```typescript
// Ensoleillé
weather: 'sunny'
// → "sunny weather, clear sky, bright and cheerful"

// Nuageux
weather: 'cloudy'
// → "cloudy sky, soft diffused light, gentle atmosphere"

// Pluvieux (doux)
weather: 'rainy'
// → "light rain, gentle raindrops, not stormy, peaceful rain scene"

// Neigeux (magique)
weather: 'snowy'
// → "gentle snowfall, winter wonderland, soft snow, magical winter scene"
```

---

## Bonnes pratiques

### ✅ DO - À faire

1. **Descriptions claires des personnages**
   ```typescript
   // ✅ Bon
   description: "un lapin blanc aux longues oreilles avec un gilet rouge à pois"
   
   // ❌ Éviter
   description: "un lapin"
   ```

2. **Scènes descriptives**
   ```typescript
   // ✅ Bon
   "Luna saute joyeusement dans les flaques d'eau colorées du jardin magique"
   
   // ❌ Éviter
   "Luna est dans le jardin"
   ```

3. **Cohérence du style**
   ```typescript
   // Utilisez le même style pour toutes les scènes d'un livre
   const bookStyle: ArtStyle = 'watercolor';
   
   scenes.forEach(scene => {
     const prompt = generateImagePrompt(
       scene.description,
       characters,
       scene.type,
       bookStyle // Toujours le même
     );
   });
   ```

### ❌ DON'T - À éviter

1. **Mélanger les styles** entre les scènes d'un même livre
2. **Descriptions vagues** des personnages ou scènes
3. **Thèmes inappropriés** (effrayant, violent, etc.)
4. **Prompts trop longs** (> 1000 caractères)
5. **Ignorer les types de scènes** (chaque type a une atmosphère spécifique)

---

## Exemples

### Exemple 1 : Histoire simple (2 personnages)

```typescript
import { generateImagePrompt } from '@/lib/ai/prompts';

const characters = [
  {
    name: 'Léo',
    description: 'un petit lion aux cheveux bouclés avec une cape de super-héros bleue',
    order: 1
  },
  {
    name: 'Sophie',
    description: 'une souris grise avec des lunettes rondes et un sac à dos rouge',
    order: 2
  }
];

// Scène 1 : Introduction
const scene1 = generateImagePrompt(
  "Léo et Sophie se rencontrent dans le parc ensoleillé, entourés de papillons colorés",
  characters,
  'introduction',
  'watercolor'
);

// Scène 2 : Conflit
const scene2 = generateImagePrompt(
  "Ils découvrent que la balançoire magique a disparu et laissent des traces mystérieuses",
  characters,
  'conflict',
  'watercolor'
);

// Scène 3 : Action
const scene3 = generateImagePrompt(
  "Léo et Sophie suivent les traces à travers la forêt enchantée, déterminés à résoudre le mystère",
  characters,
  'action',
  'watercolor'
);

// Scène 4 : Résolution
const scene4 = generateImagePrompt(
  "Ils retrouvent la balançoire et célèbrent leur victoire en se balançant ensemble sous un arc-en-ciel",
  characters,
  'resolution',
  'watercolor'
);
```

### Exemple 2 : Options avancées pour une ambiance spécifique

```typescript
import { generateAdvancedImagePrompt } from '@/lib/ai/prompts';

// Scène de nuit magique avec neige
const nightScene = generateAdvancedImagePrompt(
  "Les personnages admirent les étoiles filantes depuis une colline enneigée",
  characters,
  'resolution',
  {
    artStyle: 'soft-pastel',
    timeOfDay: 'night',
    weather: 'snowy',
    emphasizeCharacters: true,
    customModifiers: [
      'magical starlight',
      'twinkling stars',
      'peaceful winter night'
    ]
  }
);

// Scène d'action dynamique en plein jour
const actionScene = generateAdvancedImagePrompt(
  "Les héros courent à travers un champ de fleurs géantes sous le soleil",
  characters,
  'action',
  {
    artStyle: 'digital-painting',
    timeOfDay: 'afternoon',
    weather: 'sunny',
    emphasizeCharacters: true,
    customModifiers: [
      'sense of speed',
      'joyful energy',
      'wind in their hair'
    ]
  }
);
```

### Exemple 3 : Utilisation des styles

```typescript
// Comparer les différents styles pour la même scène
const description = "Les amis partagent un pique-nique dans une clairière magique";

const styles: ArtStyle[] = ['watercolor', 'digital-painting', 'soft-pastel', 'storybook-classic'];

styles.forEach(style => {
  const prompt = generateImagePrompt(
    description,
    characters,
    'introduction',
    style
  );
  
  console.log(`Style ${style}:`);
  console.log(prompt);
  console.log('\n---\n');
});
```

---

## Prompt négatif

Le système inclut automatiquement un prompt négatif optimisé pour éviter les contenus inappropriés :

```typescript
import { NEGATIVE_PROMPT } from '@/lib/ai/prompts';

console.log(NEGATIVE_PROMPT);
// Output: "scary, frightening, horror, dark themes, violent, aggressive, 
//          inappropriate, adult content, disturbing, blurry, low quality, 
//          pixelated, distorted, deformed, amateur, poorly drawn, bad anatomy, 
//          ugly, photorealistic, realistic photo, 3d render, anime, manga, 
//          comic book style, text, watermark, signature, logo, cropped, 
//          cut off, out of frame"
```

Utilisez ce prompt négatif lors de la génération d'images pour garantir des résultats appropriés.

## API Reference

### Types

```typescript
// Style artistique
type ArtStyle = 'watercolor' | 'digital-painting' | 'soft-pastel' | 'storybook-classic';

// Type de scène
type SceneType = 'introduction' | 'conflict' | 'action' | 'resolution';

// Options avancées
interface AdvancedPromptOptions {
  artStyle?: ArtStyle;
  emphasizeCharacters?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  customModifiers?: string[];
}
```

### Fonctions principales

```typescript
// Générer un prompt de base
function generateImagePrompt(
  sceneDescription: string,
  characters: CharactersTable[],
  sceneType: SceneType,
  artStyle?: ArtStyle
): string

// Générer un prompt avancé
function generateAdvancedImagePrompt(
  sceneDescription: string,
  characters: CharactersTable[],
  sceneType: SceneType,
  options?: AdvancedPromptOptions
): string

// Obtenir le préfixe de style
function getStylePrefix(style?: ArtStyle): string

// Générer la description des personnages
function generateCharacterDescription(characters: CharactersTable[]): string
```

---

## Support et ressources

- 📖 Documentation complète : `book-creator/src/lib/ai/README.md`
- 💡 Exemples : Voir section [Exemples](#exemples) ci-dessus

Pour toute question ou suggestion d'amélioration, consultez le fichier `CLAUDE.md` à la racine du projet.

---

**Version :** 1.0.0  
**Dernière mise à jour :** Juin 2026
