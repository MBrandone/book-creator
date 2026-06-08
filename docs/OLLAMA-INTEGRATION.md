# Intégration Ollama - Provider de Génération d'Histoires

✅ **Implémentation terminée** - Le provider Ollama est prêt à être utilisé !

## 📋 Ce qui a été implémenté

### 1. Provider Ollama (`src/lib/providers/ollama.ts`)

✅ **Client HTTP Ollama complet** :
- Communication avec l'API Ollama locale
- Support des modèles LLM locaux (llama3, mistral, etc.)
- Gestion des requêtes et réponses JSON

✅ **Méthodes principales** :
- `generateStory(characters)` - Génère une histoire complète en 4 scènes
- `isAvailable()` - Vérifie la disponibilité d'Ollama et du modèle
- `testConnection()` - Test rapide de connexion
- `generateFallbackStory()` - Scènes de secours en cas d'erreur

✅ **Prompts pour les 4 scènes** :
- **Prompt système** : Contexte narratif et règles pour histoires enfants
- **Prompt utilisateur** : Descriptions des personnages
- **Format de réponse** : JSON structuré avec 4 scènes typées

✅ **Gestion complète des erreurs et timeouts** :
- Validation des personnages (minimum 1, maximum 5)
- Timeout configurable (défaut: 60 secondes)
- Messages d'erreurs détaillés avec contexte
- Parsing JSON robuste (supporte le texte supplémentaire)
- Classe `StoryGenerationError` avec provider et cause

### 2. Architecture mise à jour

✅ **StoryGeneratorFactory** (`src/lib/ai/story-generator.ts`) :
- Intégration du provider Ollama
- Sélection automatique via `STORY_PROVIDER`
- Pattern singleton pour performance

✅ **Point d'entrée providers** (`src/lib/providers/index.ts`) :
- Export centralisé des providers
- Types partagés

### 3. Tests et Documentation

✅ **Script de test complet** (`scripts/test-ollama.ts`) :
- Test de connexion à Ollama
- Vérification de disponibilité du modèle
- Test de génération d'histoire réelle
- Test des scènes de fallback
- Output formaté avec couleurs

✅ **Documentation** :
- README détaillé dans `/src/lib/providers/README.md`
- Guide d'installation Ollama
- Exemples d'utilisation
- Troubleshooting

### 4. Configuration

✅ **Variables d'environnement** (`.env.local`) :
```env
STORY_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
STORY_GENERATION_TIMEOUT=60000
```

✅ **Script NPM** (`package.json`) :
```bash
npm run test:ollama
```

## 🚀 Comment utiliser

### Installation d'Ollama

1. **Télécharger Ollama** : https://ollama.ai
2. **Installer un modèle** :
   ```bash
   ollama pull llama3
   ```
3. **Vérifier l'installation** :
   ```bash
   ollama list
   ```

### Utilisation dans le code

#### Méthode 1 : Via le Factory (recommandé)

```typescript
import { StoryGeneratorFactory } from '@/lib/ai';

// Utilise automatiquement le provider configuré dans .env
const generator = await StoryGeneratorFactory.getGenerator();

// Vérifier la disponibilité
const isReady = await generator.isAvailable();

// Générer une histoire
const scenes = await generator.generateStory(characters);
```

#### Méthode 2 : Directement

```typescript
import { createOllamaGenerator } from '@/lib/providers/ollama';

const generator = createOllamaGenerator({
  temperature: 0.7,    // Créativité
  maxTokens: 2000,     // Longueur max
  timeout: 60000,      // Timeout
  debug: true,         // Logs détaillés
});

const scenes = await generator.generateStory(characters);
```

### Format des scènes générées

```typescript
interface GeneratedScene {
  scene_number: number;        // 1, 2, 3, 4
  scene_type: SceneType;       // 'introduction' | 'conflict' | 'action' | 'resolution'
  description: string;         // Description narrative (2-4 phrases)
  prompt: string;              // Prompt pour générer l'illustration
}
```

### Exemple de réponse

```json
{
  "scenes": [
    {
      "scene_number": 1,
      "scene_type": "introduction",
      "description": "Luna la lapine et Pixel l'écureuil se rencontrent dans une clairière magique...",
      "prompt": "Children's book illustration, watercolor style, cute rabbit and squirrel..."
    },
    // ... 3 autres scènes
  ]
}
```

## 🧪 Tester l'implémentation

### Test automatisé

```bash
npm run test:ollama
```

Ce script teste :
1. ✅ Connexion à Ollama
2. ✅ Disponibilité du modèle
3. ✅ Génération d'une histoire complète
4. ✅ Scènes de fallback

### Test manuel en console

```typescript
// Dans un fichier de test ou la console Node
import { createOllamaGenerator } from './src/lib/providers/ollama';

const generator = createOllamaGenerator({ debug: true });

// Test simple
const testChars = [
  { name: 'Luna', description: 'Une lapine courageuse', ... }
];

const scenes = await generator.generateStory(testChars);
console.log(scenes);
```

## 📊 Performance

### Temps de génération typiques

| Modèle | Taille | Temps moyen | Qualité |
|--------|--------|-------------|---------|
| `llama3` | 8B | 10-15s | ⭐⭐⭐⭐ |
| `llama3:70b` | 70B | 30-60s | ⭐⭐⭐⭐⭐ |
| `mistral` | 7B | 8-12s | ⭐⭐⭐⭐ |
| `dolphin-mixtral` | 8x7B | 15-25s | ⭐⭐⭐⭐⭐ |

### Recommandations

- **Développement** : `llama3` (bon équilibre vitesse/qualité)
- **Production** : `llama3:70b` ou API cloud en fallback
- **Tests** : `mistral` (plus rapide)

## 🔧 Troubleshooting

### Erreur "Cannot connect to Ollama"

**Cause** : Ollama n'est pas lancé

**Solution** :
```bash
# Vérifier qu'Ollama est actif
ollama list

# Si pas lancé, démarrer Ollama (se lance automatiquement au démarrage)
# Ou redémarrer l'application Ollama
```

### Erreur "Model not found"

**Cause** : Le modèle n'est pas téléchargé

**Solution** :
```bash
# Télécharger le modèle
ollama pull llama3

# Vérifier les modèles disponibles
ollama list
```

### Timeout

**Cause** : Le modèle est trop lent ou complexe

**Solutions** :
1. Augmenter le timeout dans `.env.local` :
   ```env
   STORY_GENERATION_TIMEOUT=120000  # 2 minutes
   ```
2. Utiliser un modèle plus petit :
   ```env
   OLLAMA_MODEL=mistral
   ```

### Qualité des histoires insuffisante

**Solutions** :
1. Utiliser un modèle plus puissant :
   ```bash
   ollama pull llama3:70b
   ```
2. Ajuster la température (créativité) :
   ```typescript
   const generator = createOllamaGenerator({
     temperature: 0.8  // Plus créatif (0.0 - 1.0)
   });
   ```

### JSON invalide dans la réponse

**Cause** : Le modèle a ajouté du texte autour du JSON

**Solution** : Le provider gère automatiquement ce cas avec `parseJSONResponse()` qui extrait le JSON du texte.

## 🔄 Prochaines étapes

### Intégration dans l'application

Pour utiliser le provider dans votre application Next.js :

1. **Créer une API route** (`app/api/stories/generate/route.ts`) :
```typescript
import { StoryGeneratorFactory } from '@/lib/ai';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const { bookId } = await request.json();
  
  // Récupérer les personnages du livre
  const characters = await db
    .selectFrom('characters')
    .where('book_id', '=', bookId)
    .selectAll()
    .execute();
  
  // Générer l'histoire
  const generator = await StoryGeneratorFactory.getGenerator();
  const scenes = await generator.generateStory(characters);
  
  // Insérer les scènes en DB
  for (const scene of scenes) {
    await db.insertInto('scenes')
      .values({
        book_id: bookId,
        scene_number: scene.scene_number,
        scene_type: scene.scene_type,
        description: scene.description,
        prompt: scene.prompt,
      })
      .execute();
  }
  
  return Response.json({ success: true, scenes });
}
```

2. **Appeler depuis le frontend** :
```typescript
const generateStory = async (bookId: string) => {
  const response = await fetch('/api/stories/generate', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  });
  
  return response.json();
};
```

### Améliorations futures

- [ ] Ajouter le provider Hugging Face (cloud)
- [ ] Système de cache pour histoires similaires
- [ ] Queue de génération pour requêtes multiples
- [ ] Régénération de scènes individuelles
- [ ] Support du streaming pour progression en temps réel
- [ ] Variantes d'histoires (même personnages, histoire différente)

## 📚 Références

- **Documentation Ollama** : https://github.com/ollama/ollama/blob/main/docs/api.md
- **Modèles disponibles** : https://ollama.ai/library
- **Prompts pour enfants** : `/src/lib/ai/prompts.ts`
- **Architecture** : `/src/lib/ai/README.md`

## ✅ Checklist de validation

- [x] Client HTTP Ollama implémenté
- [x] Méthode `generateStory()` fonctionnelle
- [x] Méthode `isAvailable()` fonctionnelle
- [x] Prompts système et utilisateur créés
- [x] Format JSON validé et typé
- [x] Gestion des erreurs complète
- [x] Timeouts configurables
- [x] StoryGeneratorFactory mis à jour
- [x] Script de test créé
- [x] Documentation complète
- [x] Variables d'environnement configurées
- [x] Scènes de fallback implémentées

**🎉 L'implémentation du provider Ollama est complète et prête pour utilisation !**
