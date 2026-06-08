# Service de Génération d'Histoire

Ce module fournit l'infrastructure pour générer des histoires pour enfants en utilisant différents providers d'IA.

## 📁 Structure

```
src/lib/ai/
├── index.ts              # Point d'entrée principal, exports publics
├── story-generator.ts    # Interface et classes de base pour les generators
├── prompts.ts           # Templates de prompts et validation
└── README.md            # Cette documentation
```

## 🎯 Fonctionnalités

### 1. Interface StoryGenerator

Interface générique qui doit être implémentée par tous les providers d'IA :

```typescript
interface StoryGenerator {
  generateStory(characters: CharactersTable[]): Promise<GeneratedScene[]>;
  isAvailable(): Promise<boolean>;
  readonly name: string;
}
```

### 2. Classe de Base BaseStoryGenerator

Classe abstraite fournissant des utilitaires communs :

- ✅ Validation des personnages
- ✅ Gestion des timeouts
- ✅ Parsing robuste des réponses JSON
- ✅ Logging de debug
- ✅ Gestion d'erreurs avec `StoryGenerationError`

### 3. Templates de Prompts

#### Prompt Système
Définit le rôle de l'IA comme écrivain pour enfants de 3-8 ans.

#### Prompt Utilisateur
Généré dynamiquement avec `generateUserPrompt(characters)` :
- Inclut les descriptions de tous les personnages
- Demande une histoire en 4 scènes
- Spécifie le format JSON de réponse

#### Prompts d'Images
- `IMAGE_STYLE_PREFIX` : Style cohérent pour toutes les illustrations
- `generateImagePrompt()` : Crée des prompts adaptés à chaque type de scène

### 4. Validation de Réponse

`validateAIResponse(response)` vérifie :
- ✅ Structure JSON valide
- ✅ Exactement 4 scènes
- ✅ Types de scènes corrects (introduction, conflict, action, resolution)
- ✅ Descriptions et prompts non vides

### 5. Factory Pattern

`StoryGeneratorFactory` permet de créer le bon generator selon la configuration :

```typescript
const generator = await StoryGeneratorFactory.getGenerator();
// Ou forcer un provider spécifique :
const generator = await StoryGeneratorFactory.getGenerator('ollama');
```

## 🚀 Utilisation

### Import

```typescript
import {
  StoryGenerator,
  StoryGeneratorFactory,
  generateUserPrompt,
  validateAIResponse,
} from '@/lib/ai';
```

### Exemple d'Implémentation d'un Provider

```typescript
import { BaseStoryGenerator, GeneratedScene } from '@/lib/ai';
import type { CharactersTable } from '@/lib/db/schema';

export class MyAIProvider extends BaseStoryGenerator {
  constructor() {
    super('MyAI', { timeout: 60000, temperature: 0.7 });
  }

  async generateStory(characters: CharactersTable[]): Promise<GeneratedScene[]> {
    // 1. Valider les personnages
    this.validateCharacters(characters);

    // 2. Créer les prompts
    const systemPrompt = SYSTEM_PROMPT;
    const userPrompt = generateUserPrompt(characters);

    // 3. Appeler l'API avec timeout
    const response = await this.withTimeout(
      this.callMyAI(systemPrompt, userPrompt)
    );

    // 4. Parser et valider la réponse
    const parsed = this.parseJSONResponse(response);
    const validated = validateAIResponse(parsed);

    // 5. Convertir en GeneratedScene[]
    return convertAIResponseToScenes(validated.scenes);
  }

  async isAvailable(): Promise<boolean> {
    // Vérifier que l'API est accessible
    try {
      await this.callMyAI('test', 'test');
      return true;
    } catch {
      return false;
    }
  }
}
```

## 🔧 Configuration

Variables d'environnement à définir :

```bash
# Provider à utiliser (sera implémenté dans Phase 3.2-3.3)
STORY_PROVIDER=ollama  # ou 'huggingface'

# Configuration Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Configuration Hugging Face
HUGGINGFACE_API_KEY=your_api_key_here
```

## 📝 Types

### GeneratedScene

```typescript
interface GeneratedScene {
  scene_number: number;           // 1, 2, 3, ou 4
  scene_type: SceneType;         // 'introduction' | 'conflict' | 'action' | 'resolution'
  description: string;           // Description narrative de la scène
  prompt: string;                // Prompt pour générer l'image
}
```

### StoryGeneratorOptions

```typescript
interface StoryGeneratorOptions {
  timeout?: number;              // Timeout en ms (défaut: 60000)
  temperature?: number;          // 0.0-1.0 (défaut: 0.7)
  maxTokens?: number;           // Tokens max (défaut: 2000)
  debug?: boolean;              // Logs détaillés (défaut: false)
}
```

## 🎨 Prompts de Fallback

En cas d'erreur, `FALLBACK_SCENES` fournit une histoire générique de secours avec 4 scènes pré-définies.

## ⚠️ Gestion d'Erreurs

Toutes les erreurs sont levées avec `StoryGenerationError` qui inclut :
- Message descriptif
- Nom du provider
- Cause originale (si disponible)

```typescript
try {
  const scenes = await generator.generateStory(characters);
} catch (error) {
  if (error instanceof StoryGenerationError) {
    console.error(`Provider ${error.provider} failed: ${error.message}`);
  }
}
```

## 🔜 Prochaines Étapes

Pour compléter l'implémentation selon le PLAN.md :

1. **Phase 3.2** : Implémenter `src/lib/providers/ollama.ts`
2. **Phase 3.3** : Implémenter `src/lib/providers/huggingface.ts`
3. **Phase 3.4-3.5** : Service de génération d'images avec Replicate
4. **Phase 3.6** : Affiner les prompts avec des tests réels

## 📚 Références

- PLAN.md - Plan complet d'implémentation
- src/lib/db/schema.ts - Types de la base de données
- Phase 3 du PLAN.md pour les détails d'implémentation des providers
