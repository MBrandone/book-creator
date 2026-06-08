# Providers de Génération (Histoires et Images)

Ce dossier contient les différents providers pour la génération d'histoires et d'images avec IA.

## Providers Disponibles

### Génération d'Histoires

#### Ollama (Local) ✅

Provider pour l'utilisation d'Ollama en local. Recommandé pour le développement et pour éviter les coûts d'API.

**Configuration requise :**

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
STORY_GENERATION_TIMEOUT=60000
```

**Installation d'Ollama :**

1. Télécharger Ollama : https://ollama.ai
2. Installer le modèle :
   ```bash
   ollama pull llama3
   ```
3. Vérifier que le service est actif :
   ```bash
   ollama list
   ```

**Utilisation :**

```typescript
import { createOllamaGenerator } from '@/lib/providers/ollama';

// Créer une instance
const generator = createOllamaGenerator({
  temperature: 0.7,
  maxTokens: 2000,
  debug: true, // Active les logs
});

// Vérifier la disponibilité
const isAvailable = await generator.isAvailable();

// Générer une histoire
const scenes = await generator.generateStory(characters);
```

**Modèles recommandés :**

- `llama3` (8B) - Rapide et efficace, bon équilibre
- `llama3:70b` - Plus précis mais plus lent
- `mistral` - Alternative performante
- `dolphin-mixtral` - Excellent pour les histoires créatives

**Troubleshooting :**

- **Erreur "Cannot connect to Ollama"** : Vérifier qu'Ollama est bien lancé avec `ollama list`
- **Erreur "Model not found"** : Télécharger le modèle avec `ollama pull llama3`
- **Timeout** : Augmenter `STORY_GENERATION_TIMEOUT` ou utiliser un modèle plus petit

#### Hugging Face (API) 🚧

Provider pour l'API Hugging Face Inference (à venir).

#### OpenAI (API) 🚧

Provider pour l'API OpenAI GPT (à venir).

---

### Génération d'Images

#### Replicate SDXL (Cloud) ✅

Provider pour la génération d'images avec Stable Diffusion XL via l'API Replicate. Optimisé pour les illustrations de livres pour enfants.

**Configuration requise :**

```env
REPLICATE_API_TOKEN=your_replicate_token_here
IMAGE_GENERATION_TIMEOUT=90000
```

**Obtenir une clé API Replicate :**

1. Créer un compte sur https://replicate.com
2. Aller dans Account Settings > API Tokens
3. Créer un nouveau token
4. Copier le token dans `.env.local`

**Caractéristiques :**

- ✅ Modèle : Stable Diffusion XL (SDXL)
- ✅ Style par défaut : Illustrations de livres pour enfants
- ✅ Aspect ratios : 1:1, 16:9, 9:16, 4:3
- ✅ Paramètres optimisés : 30 steps, guidance 7.5
- ✅ Upload automatique sur MinIO
- ✅ URLs présignées valides 7 jours
- ✅ Support des seeds pour reproductibilité

**Utilisation :**

```typescript
import { ReplicateImageProvider } from '@/lib/providers/replicate';

// Créer une instance
const provider = new ReplicateImageProvider();

// Générer une image
const result = await provider.generateImage({
  prompt: 'A friendly dragon playing with colorful balloons',
  aspectRatio: '1:1',
  seed: 12345, // Optionnel, pour reproductibilité
  style: 'watercolor painting, soft colors', // Optionnel
  steps: 30, // Optionnel, défaut: 30
  guidance: 7.5, // Optionnel, défaut: 7.5
});

console.log('Image URL:', result.url);
console.log('Seed:', result.seed);
console.log('Metadata:', result.metadata);
```

**Paramètres disponibles :**

- `prompt` (requis) : Description de l'image à générer
- `seed` (optionnel) : Nombre pour reproductibilité
- `aspectRatio` (optionnel) : '1:1' | '16:9' | '9:16' | '4:3' (défaut: '1:1')
- `style` (optionnel) : Style artistique supplémentaire
- `steps` (optionnel) : Nombre d'étapes d'inférence (défaut: 30)
- `guidance` (optionnel) : Force du guidage (défaut: 7.5)
- `negativePrompt` (optionnel) : Éléments à éviter

**Dimensions générées :**

- 1:1 → 1024x1024 (carré, idéal pour couvertures)
- 16:9 → 1024x576 (paysage, idéal pour scènes larges)
- 9:16 → 576x1024 (portrait, idéal pour personnages)
- 4:3 → 1024x768 (standard, bon compromis)

**Performance :**

- ⏱️ Temps de génération : 30-90 secondes (selon charge Replicate)
- 💰 Coût : ~$0.0023 par image (prix Replicate)
- 📦 Stockage : MinIO (upload automatique)
- 🔄 Polling : Géré automatiquement

**Troubleshooting :**

- **Erreur "REPLICATE_API_TOKEN is required"** : Vérifier que le token est dans `.env.local`
- **Erreur "Failed to download image"** : Problème réseau ou quota Replicate dépassé
- **Erreur MinIO** : Vérifier que MinIO est lancé et le bucket existe
- **Timeout** : Augmenter `IMAGE_GENERATION_TIMEOUT` dans `.env.local`
- **Quota dépassé** : Vérifier les crédits sur https://replicate.com/account

**Test du provider :**

```bash
# Tester la génération d'images
npm run test:replicate

# OU
npx ts-node scripts/test-replicate.ts
```

#### DALL-E (OpenAI) 🚧

Provider pour DALL-E 3 via OpenAI API (à venir).

---

## Architecture

### Interface `StoryGenerator`

Tous les providers implémentent cette interface commune :

```typescript
interface StoryGenerator {
  generateStory(characters: CharactersTable[]): Promise<GeneratedScene[]>;
  isAvailable(): Promise<boolean>;
  readonly name: string;
}
```

### Classe de Base `BaseStoryGenerator`

Fournit des utilitaires communs :

- ✅ Validation des personnages
- ✅ Gestion des timeouts
- ✅ Parsing JSON robuste
- ✅ Logging de debug
- ✅ Gestion d'erreurs

### Factory Pattern

Utiliser `StoryGeneratorFactory` pour obtenir automatiquement le bon provider :

```typescript
import { StoryGeneratorFactory } from '@/lib/ai';

// Utilise le provider configuré dans .env (STORY_PROVIDER)
const generator = await StoryGeneratorFactory.getGenerator();

// Ou force un provider spécifique
const ollamaGenerator = await StoryGeneratorFactory.getGenerator('ollama');
```

## Ajouter un Nouveau Provider

1. **Créer le fichier** `src/lib/providers/mon-provider.ts`

2. **Implémenter la classe** en étendant `BaseStoryGenerator` :

```typescript
import { BaseStoryGenerator, type GeneratedScene } from '@/lib/ai/story-generator';

export class MonProvider extends BaseStoryGenerator {
  constructor(options = {}) {
    super('MonProvider', options);
  }

  async isAvailable(): Promise<boolean> {
    // Vérifier la disponibilité du service
  }

  async generateStory(characters: CharactersTable[]): Promise<GeneratedScene[]> {
    // Valider les personnages
    this.validateCharacters(characters);

    // Appeler l'API avec timeout
    const response = await this.withTimeout(
      this.callAPI(characters),
      this.options.timeout
    );

    // Parser et valider
    const parsed = this.parseJSONResponse(response);
    const validated = validateAIResponse(parsed);

    return convertAIResponseToScenes(validated.scenes);
  }
}
```

3. **Exporter depuis `index.ts`**

4. **Ajouter au `StoryGeneratorFactory`** dans `story-generator.ts`

5. **Mettre à jour ce README**

## Tests

Chaque provider doit avoir un script de test :

```bash
# Test Ollama
npm run test:ollama

# Test tous les providers
npm run test:providers
```

## Format de Réponse Attendu

Tous les providers doivent retourner ce format JSON :

```json
{
  "scenes": [
    {
      "scene_number": 1,
      "scene_type": "introduction",
      "description": "Description narrative de la scène...",
      "image_prompt": "Prompt détaillé pour l'illustration..."
    },
    {
      "scene_number": 2,
      "scene_type": "conflict",
      "description": "...",
      "image_prompt": "..."
    },
    {
      "scene_number": 3,
      "scene_type": "action",
      "description": "...",
      "image_prompt": "..."
    },
    {
      "scene_number": 4,
      "scene_type": "resolution",
      "description": "...",
      "image_prompt": "..."
    }
  ]
}
```

## Gestion d'Erreurs

Les providers lancent `StoryGenerationError` en cas de problème :

```typescript
try {
  const scenes = await generator.generateStory(characters);
} catch (error) {
  if (error instanceof StoryGenerationError) {
    console.error(`Error from ${error.provider}:`, error.message);
    console.error('Cause:', error.cause);
  }
}
```

## Performance

### Ollama (Local)

- **Temps moyen** : 5-15 secondes (selon le modèle)
- **Coût** : Gratuit
- **Limite** : Dépend du matériel

### Recommandations

- Utiliser Ollama pour le développement
- Configurer un fallback vers une API cloud pour la production
- Implémenter un cache pour les histoires similaires
- Considérer un système de queue pour les générations multiples

## Variables d'Environnement

```env
# Provider à utiliser (ollama, huggingface, openai)
STORY_PROVIDER=ollama

# Configuration Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Configuration Hugging Face (à venir)
HUGGINGFACE_API_TOKEN=your_token_here
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# Configuration OpenAI (à venir)
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4

# Paramètres généraux
STORY_GENERATION_TIMEOUT=60000
```
