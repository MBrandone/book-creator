# Intégration Replicate SDXL

Documentation complète de l'intégration de Replicate pour la génération d'images avec Stable Diffusion XL.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Installation et Configuration](#installation-et-configuration)
- [Architecture](#architecture)
- [Utilisation](#utilisation)
- [Paramètres et Options](#paramètres-et-options)
- [Workflow de Génération](#workflow-de-génération)
- [Tests](#tests)
- [Coûts et Performance](#coûts-et-performance)
- [Troubleshooting](#troubleshooting)

## Vue d'ensemble

L'intégration Replicate permet de générer des illustrations de haute qualité pour les livres pour enfants en utilisant Stable Diffusion XL (SDXL) via l'API Replicate. Le système gère automatiquement :

- ✅ Génération d'images avec SDXL
- ✅ Polling asynchrone pour attendre les résultats
- ✅ Téléchargement automatique des images
- ✅ Upload sur MinIO avec URLs présignées
- ✅ Gestion des erreurs et timeouts
- ✅ Style optimisé pour livres enfants
- ✅ Support de multiples aspect ratios

## Installation et Configuration

### 1. Installer les dépendances

Le package Replicate est déjà installé :

```bash
npm install replicate
```

### 2. Obtenir une clé API Replicate

1. Créer un compte sur [Replicate](https://replicate.com)
2. Aller dans **Account Settings** > **API Tokens**
3. Créer un nouveau token
4. Copier le token

### 3. Configurer les variables d'environnement

Ajouter dans `.env.local` :

```env
# Replicate API Configuration
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Image Generation Configuration
IMAGE_GENERATION_TIMEOUT=90000  # 90 secondes
```

### 4. Vérifier la configuration

```bash
npm run test:replicate
```

## Architecture

### Structure des fichiers

```
src/lib/
├── ai/
│   ├── image-generator.ts      # Interface générique ImageGenerator
│   └── index.ts                # Exports
├── providers/
│   ├── replicate.ts            # Implémentation Replicate SDXL
│   └── index.ts                # Exports
└── storage/
    └── minio.ts                # Client MinIO pour upload

```

### Interface `ImageGenerator`

```typescript
interface ImageGenerator {
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
  readonly name: string;
}

interface ImageGenerationOptions {
  prompt: string;                    // Requis
  seed?: number;                     // Pour reproductibilité
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  style?: string;                    // Style artistique
  steps?: number;                    // Steps d'inférence (défaut: 30)
  guidance?: number;                 // Guidance scale (défaut: 7.5)
  negativePrompt?: string;           // Éléments à éviter
}

interface ImageGenerationResult {
  url: string;                       // URL MinIO présignée
  seed?: number;                     // Seed utilisé
  prompt: string;                    // Prompt complet
  provider: string;                  // 'replicate-sdxl'
  metadata?: {
    aspectRatio: string;
    dimensions: { width: number; height: number };
    steps: number;
    guidance: number;
    originalUrl: string;             // URL Replicate temporaire
    filename: string;                // Chemin MinIO
  };
}
```

### Classe `ReplicateImageProvider`

Implémentation complète avec :

- **Constructeur** : Initialise le client Replicate avec le token API
- **getDimensions** : Convertit aspect ratio en dimensions (1024x1024, etc.)
- **downloadImage** : Télécharge l'image depuis Replicate
- **uploadToMinio** : Upload sur MinIO avec URL présignée
- **generateImage** : Méthode principale de génération

## Utilisation

### Utilisation basique

```typescript
import { replicateProvider } from '@/lib/providers/replicate';

// Générer une image simple
const result = await replicateProvider.generateImage({
  prompt: 'A friendly dragon playing with colorful balloons in a magical forest',
});

console.log('Image URL:', result.url);
```

### Avec options avancées

```typescript
import { ReplicateImageProvider } from '@/lib/providers/replicate';

const provider = new ReplicateImageProvider();

const result = await provider.generateImage({
  prompt: 'A magical castle floating in the clouds',
  aspectRatio: '16:9',
  seed: 12345,
  style: 'watercolor painting, soft colors, dreamy atmosphere',
  steps: 35,
  guidance: 8.0,
  negativePrompt: 'dark, scary, violent, blurry',
});

console.log('Generated:', result);
// {
//   url: 'https://minio:9000/book-images/images/generated/...',
//   seed: 12345,
//   prompt: 'A magical castle floating in the clouds, watercolor painting...',
//   provider: 'replicate-sdxl',
//   metadata: { ... }
// }
```

### Dans un composant Next.js

```typescript
'use client';

import { useState } from 'react';
import { replicateProvider } from '@/lib/providers/replicate';

export function ImageGenerator() {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const generateImage = async () => {
    setLoading(true);
    try {
      const result = await replicateProvider.generateImage({
        prompt: 'A cute bunny reading a book under a rainbow',
        aspectRatio: '1:1',
      });
      setImageUrl(result.url);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={generateImage} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Image'}
      </button>
      {imageUrl && <img src={imageUrl} alt="Generated" />}
    </div>
  );
}
```

## Paramètres et Options

### Prompt

**Description** : Le texte décrivant l'image à générer

**Requis** : Oui

**Conseils** :
- Être descriptif mais concis
- Mentionner l'atmosphère et les couleurs
- Inclure des détails sur le style si nécessaire
- Le provider ajoute automatiquement "children's book illustration..." si aucun style n'est spécifié

**Exemples** :
```typescript
// Simple
prompt: 'A red dragon flying over a castle'

// Détaillé
prompt: 'A friendly red dragon with big eyes flying gracefully over a medieval stone castle at sunset, warm golden light'
```

### Aspect Ratio

**Description** : Format de l'image générée

**Valeurs** : `'1:1'` | `'16:9'` | `'9:16'` | `'4:3'`

**Défaut** : `'1:1'`

**Dimensions** :
- `1:1` → 1024x1024 (carré, idéal pour couvertures)
- `16:9` → 1024x576 (paysage, scènes panoramiques)
- `9:16` → 576x1024 (portrait, personnages en pied)
- `4:3` → 1024x768 (standard, bon compromis)

### Seed

**Description** : Nombre pour reproductibilité

**Type** : `number`

**Optionnel** : Oui

**Usage** : Utiliser le même seed avec le même prompt produit la même image

```typescript
// Générer la même image deux fois
const result1 = await provider.generateImage({ prompt: 'dragon', seed: 12345 });
const result2 = await provider.generateImage({ prompt: 'dragon', seed: 12345 });
// result1 et result2 auront des images identiques
```

### Style

**Description** : Style artistique supplémentaire

**Type** : `string`

**Optionnel** : Oui (défaut: "children's book illustration...")

**Exemples** :
```typescript
style: 'watercolor painting, soft colors'
style: 'digital art, vibrant colors, detailed'
style: 'cartoon style, simple shapes, bold outlines'
style: 'realistic painting, oil painting style'
```

### Steps

**Description** : Nombre d'étapes d'inférence

**Type** : `number`

**Défaut** : `30`

**Range** : 20-50 (recommandé)

**Impact** :
- Moins de steps (20-25) : Plus rapide, moins détaillé
- Steps moyens (30-35) : Bon équilibre
- Plus de steps (40-50) : Plus lent, plus détaillé

### Guidance

**Description** : Force du guidage par le prompt

**Type** : `number`

**Défaut** : `7.5`

**Range** : 5-15 (recommandé)

**Impact** :
- Faible (5-7) : Plus créatif, moins fidèle au prompt
- Moyen (7-10) : Bon équilibre
- Élevé (10-15) : Très fidèle au prompt, moins créatif

### Negative Prompt

**Description** : Éléments à éviter dans l'image

**Type** : `string`

**Défaut** : "scary, frightening, dark, violent, inappropriate, photorealistic, blurry, low quality"

**Exemples** :
```typescript
negativePrompt: 'text, watermark, signature, blurry'
negativePrompt: 'scary, dark, violent, inappropriate'
```

## Workflow de Génération

### Étape 1 : Préparation du prompt

```typescript
const fullPrompt = style 
  ? `${prompt}, ${style}`
  : `${prompt}, children's book illustration, colorful, friendly, warm lighting...`;
```

### Étape 2 : Configuration des paramètres

```typescript
const dimensions = getDimensions(aspectRatio);
// { width: 1024, height: 1024 } pour '1:1'
```

### Étape 3 : Appel API Replicate

```typescript
const output = await client.run(SDXL_MODEL, {
  input: {
    prompt: fullPrompt,
    negative_prompt: negativePrompt,
    width: dimensions.width,
    height: dimensions.height,
    num_inference_steps: steps,
    guidance_scale: guidance,
    seed: seed,
    scheduler: 'K_EULER',
    refine: 'expert_ensemble_refiner',
    refine_steps: 10,
  },
});
```

**Note** : Le client Replicate gère automatiquement le polling asynchrone

### Étape 4 : Téléchargement de l'image

```typescript
const imageUrl = output[0].url;
const response = await fetch(imageUrl);
const imageBuffer = Buffer.from(await response.arrayBuffer());
```

### Étape 5 : Upload sur MinIO

```typescript
const filename = `images/generated/${timestamp}-${seed || 'random'}.png`;
await minioClient.putObject(BUCKET_NAME, filename, imageBuffer, {
  'Content-Type': 'image/png',
});
```

### Étape 6 : Génération de l'URL présignée

```typescript
const minioUrl = await minioClient.presignedGetObject(
  BUCKET_NAME, 
  filename, 
  7 * 24 * 60 * 60  // 7 jours
);
```

## Tests

### Script de test complet

```bash
npm run test:replicate
```

Le script teste :
1. Génération simple (1:1)
2. Génération paysage (16:9)
3. Génération avec style personnalisé (4:3)

### Test dans l'application

```bash
npm run dev
# Puis utiliser l'interface de génération d'images
```

## Coûts et Performance

### Coûts Replicate

- **Prix par image** : ~$0.0023 (peut varier)
- **Facteurs** :
  - Nombre de steps (plus = plus cher)
  - Résolution (1024x1024 est standard)
  - Modèle utilisé (SDXL est le modèle de base)

### Performance

- **Temps de génération** : 30-90 secondes
  - Dépend de la charge sur Replicate
  - Peut varier selon l'heure de la journée
  - Plus de steps = plus lent

- **Temps de traitement total** :
  - Génération : 30-90s
  - Téléchargement : 1-3s
  - Upload MinIO : 1-2s
  - **Total** : 35-95 secondes

### Limites

- **Quota gratuit** : Crédit initial pour tests
- **Rate limits** : Vérifier sur replicate.com
- **Taille max** : 1536x1536 pixels
- **Timeout** : 90 secondes par défaut

## Troubleshooting

### Erreur : "REPLICATE_API_TOKEN is required"

**Cause** : Token API non configuré

**Solution** :
1. Vérifier `.env.local`
2. Ajouter `REPLICATE_API_TOKEN=r8_xxx...`
3. Redémarrer le serveur

### Erreur : "Failed to generate image"

**Causes possibles** :
- Quota Replicate dépassé
- Problème réseau
- Token invalide

**Solutions** :
1. Vérifier les crédits sur replicate.com/account
2. Vérifier la connexion internet
3. Régénérer le token API

### Erreur : "Failed to download image"

**Cause** : L'URL Replicate a expiré ou est invalide

**Solution** :
- Relancer la génération
- Vérifier les logs Replicate

### Erreur MinIO

**Cause** : MinIO non accessible ou bucket inexistant

**Solutions** :
1. Vérifier que MinIO est lancé : `docker-compose ps`
2. Vérifier que le bucket existe
3. Tester MinIO : `npm run test:minio`

### Timeout

**Cause** : Génération trop longue (>90s)

**Solutions** :
1. Augmenter `IMAGE_GENERATION_TIMEOUT` dans `.env.local`
2. Réduire le nombre de `steps`
3. Réessayer (la charge Replicate varie)

### Images de mauvaise qualité

**Solutions** :
1. Améliorer le prompt (plus descriptif)
2. Augmenter `steps` (35-40)
3. Ajuster `guidance` (8-10)
4. Utiliser un `negativePrompt` plus précis

### Images pas adaptées aux enfants

**Solution** : Le provider inclut automatiquement un style et un negative prompt adaptés, mais vous pouvez les personnaliser :

```typescript
const result = await provider.generateImage({
  prompt: 'A dragon',
  style: 'cute, friendly, colorful, children illustration',
  negativePrompt: 'scary, dark, violent, frightening, realistic, adult content',
});
```

## Modèle SDXL Utilisé

```typescript
const SDXL_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
```

**Caractéristiques** :
- ✅ Haute qualité (1024x1024)
- ✅ Refiner intégré
- ✅ Styles variés
- ✅ Stable et fiable

## Ressources

- [Documentation Replicate](https://replicate.com/docs)
- [Modèle SDXL](https://replicate.com/stability-ai/sdxl)
- [API Reference](https://replicate.com/docs/reference/http)
- [Pricing](https://replicate.com/pricing)
- [Account Dashboard](https://replicate.com/account)

## Roadmap

- [ ] Support d'autres modèles (DALL-E, Midjourney)
- [ ] Cache des images générées
- [ ] Queue de génération pour batch
- [ ] Régénération partielle (inpainting)
- [ ] Variation d'images existantes
- [ ] Export en différents formats
- [ ] Optimisation des coûts
