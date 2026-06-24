# Cadrage : Génération de scénarios d'histoires avec Replicate

## Contexte

Actuellement, l'application utilise deux implémentations pour générer les scénarios d'histoires (4 scènes) :
- **En développement local** : `OllamaStoryGenerator` qui utilise Ollama (llama3.2:3b) lancé via Docker Compose
- **En production** : `InMemorySceneGenerator` qui retourne toujours les mêmes 4 scènes prédéfinies (mock)

Le problème est que **l'implémentation de production ne génère pas de véritables histoires personnalisées**. Les scénarios sont toujours identiques, indépendamment du titre, de la description et des personnages fournis par l'utilisateur.

### Architecture actuelle

L'architecture suit le pattern Strategy avec une factory :
- Interface : `StoryScenesDescriptionGenerator`
- Implémentations : `OllamaStoryGenerator`, `InMemorySceneGenerator`
- Factory : `StoryGeneratorFactory` (basée sur `STORY_PROVIDER`)
- Classe de base : `BaseStoryGenerator` avec validation, timeout, parsing JSON

Le flow de génération :
1. L'utilisateur crée une histoire avec titre, description et personnages
2. Il clique sur "Générer"
3. `StoryGeneratorService.generate()` appelle `scenesGenerator.generateStory(context)`
4. Le générateur produit 4 scènes avec descriptions + prompts d'image
5. Les scènes sont sauvegardées en DB
6. Les images sont générées pour chaque scène via Replicate (Flux Klein)
7. L'histoire est marquée comme "completed"

## Objectifs

1. **Utiliser un vrai modèle de langage en production** pour générer des scénarios personnalisés et variés
2. **Maintenir la flexibilité** dev/prod avec différents providers (ollama, replicate, in-memory)
3. **Assurer la robustesse** avec gestion d'erreurs, retry et fallback
4. **Optimiser les coûts** en choisissant un modèle économique mais performant
5. **Préserver la compatibilité** avec l'architecture existante

## Décisions architecturales

### 1. Choix du provider : Replicate
**Décision** : Utiliser Replicate en production pour la génération de scénarios

**Raisons** :
- API simple et fiable (déjà utilisée pour la génération d'images)
- Compte existant avec token API configuré
- Large choix de modèles LLM sans infrastructure à gérer
- Pricing transparent et prévisible
- SDK JavaScript officiel déjà installé (`replicate` v1.4.0)

**Alternatives considérées** :
- OpenAI : Plus cher, nécessite un nouveau compte/token
- Anthropic Claude : Excellent mais plus cher
- Hugging Face Inference API : Moins fiable (cold starts)
- Héberger son propre LLM : Complexité infrastructure

**Contraintes** :
- Nécessite une connexion Internet
- Dépendance à un service tiers
- Coûts variables selon l'usage

### 2. Choix du modèle : Meta Llama 3.1 70B Instruct
**Décision** : Utiliser `meta/meta-llama-3.1-70b-instruct` hardcodé dans le code

**Raisons** :
- **Créativité** : Modèle de 70B paramètres, excellent pour générer des histoires variées
- **Multilingue** : Bon support du français (essentiel pour les histoires)
- **Format structuré** : Capable de produire du JSON complexe de façon fiable
- **Coût acceptable** : ~$0.0025 (0.25 centimes €) par scénario, soit 0.25€ pour 100 histoires
- **Comparaison** : 15-25x moins cher que la génération d'images (coût marginal)

**Alternatives considérées** :
- Llama 3 8B : Moins cher ($0.0002/scénario) mais moins créatif
- Mistral 7B : Prix similaire au 8B, optimisé français, mais moins puissant
- Llama 3.1 405B : Top qualité mais 5-10x plus cher

**Estimation des coûts** :
```
Pour 1 scénario (4 scènes) :
- Input : ~600 tokens (prompt système + contexte)
- Output : ~750 tokens (JSON avec 4 scènes)
- Coût : $0.65/1M tokens input + $2.75/1M tokens output
- Total : ~$0.0025 (0.25 centimes €)

Pour 100 histoires : ~$0.25 (25 centimes €)
Pour 1000 histoires : ~$2.50 (2.50€)
```

**Contraintes** :
- Timeout à surveiller (modèle plus lent que 8B)
- Qualité JSON à valider (peut être moins structuré que plus petits modèles)

### 3. Configuration via STORY_PROVIDER
**Décision** : Ajouter 'replicate' à l'enum `STORY_PROVIDER` existant, hardcoder le modèle

**Raisons** :
- Simplicité de configuration (1 seule variable à changer)
- Cohérence avec le pattern actuel (ollama, openai, huggingface)
- Modèle Llama 3.1 70B testé et validé, pas besoin de le changer souvent
- Si besoin futur : facile d'ajouter `REPLICATE_STORY_MODEL` variable

**Configuration** :
```bash
# Dev local (docker-compose)
STORY_PROVIDER=ollama

# Production
STORY_PROVIDER=replicate
```

**Alternatives considérées** :
- Variables multiples : `REPLICATE_STORY_MODEL`, `REPLICATE_MAX_RETRIES` → Sur-configuration
- Auto-détection : Choisir automatiquement le meilleur modèle → Perte de contrôle
- Hardcoder 'replicate' en prod : Pas de flexibilité dev/test

### 4. Gestion des erreurs : Retry + Fallback
**Décision** : Implémenter un système de retry avec backoff exponentiel (2-3 tentatives) directement dans `ReplicateStoryGenerator`, puis fallback automatique vers in-memory

**Stratégie** :
1. Tentative 1 : Appel direct à Replicate
2. Si échec : Attendre 2s, tentative 2
3. Si échec : Attendre 4s, tentative 3
4. Si échec final : Utiliser automatiquement `InMemorySceneGenerator` (fallback transparent)

**Raisons** :
- **Résilience** : Gère les erreurs temporaires (rate limit, timeout réseau)
- **Expérience utilisateur** : Maximise les chances de succès
- **Dégradation gracieuse** : Mieux vaut une histoire générique qu'une erreur complète
- **Logging** : Tracer les échecs pour monitoring

**Cas d'erreur gérés** :
- Timeout API (>60s par défaut, configurable via `STORY_GENERATION_TIMEOUT`)
- Erreur réseau (connexion, DNS)
- Rate limiting (429)
- Quota dépassé (402)
- Réponse JSON invalide
- Réponse avec mauvais format (!=4 scènes, types invalides)

**Contraintes** :
- Augmente le temps total en cas d'erreurs (jusqu'à 60s x 3 = 3min max)
- Peut masquer des problèmes systémiques si fallback trop utilisé
- Nécessite monitoring pour détecter usage excessif du fallback

### 5. Validation des entrées/sorties
**Décision** : Créer une classe utilitaire `StoryGeneratorValidator` pour centraliser la validation

**Raisons** :
- Séparation des responsabilités (validation vs génération)
- Réutilisable par tous les générateurs (Ollama, Replicate)
- Plus simple que l'héritage via `BaseStoryGenerator`
- Validation input (contexte) et output (JSON du LLM)

**Structure** :
```typescript
export class StoryGeneratorValidator {
  static validateStoryContext(context: StoryContext): void
  static validateAIResponse(response: unknown): AIStoryResponse
  static parseJSONResponse(response: string): unknown
}
```

### 6. Architecture de ReplicateStoryGenerator
**Décision** : `ReplicateStoryGenerator` implémente `StoryScenesDescriptionGenerator` avec retry et fallback intégrés

**Raisons** :
- Autonome : gère ses propres erreurs et fallback
- Pas de wrapper supplémentaire nécessaire
- Simplifie l'architecture (moins de classes)
- Fallback transparent pour l'utilisateur

**Structure** :
```typescript
export class ReplicateStoryGenerator implements StoryScenesDescriptionGenerator {
  private client: Replicate;
  private fallbackGenerator: InMemorySceneGenerator;
  
  async generateStory(context: StoryContext): Promise<GeneratedScene[]>
  async isAvailable(): Promise<boolean>
  private async generateWithRetry(context: StoryContext): Promise<GeneratedScene[]>
}
```

---

## Spécifications fonctionnelles

### Cas d'utilisation nominal

**Given** (Contexte) :
- Un utilisateur a créé une histoire avec titre, description et personnages
- La configuration production utilise `STORY_PROVIDER=replicate`
- Le token Replicate est valide

**When** (Action) :
- L'utilisateur clique sur "Générer l'histoire"

**Then** (Résultat attendu) :
- Le système envoie une requête à Replicate avec le modèle Llama 3.1 70B
- Replicate génère un scénario personnalisé en 4 scènes basé sur le contexte
- Chaque scène contient :
  - Un numéro de scène (1-4)
  - Un type (introduction, conflict, action, resolution)
  - Une description narrative en français (2-4 phrases)
  - Un prompt pour générer l'illustration
- Le scénario est unique et adapté au titre, description et personnages fournis
- Les 4 scènes sont sauvegardées en base de données
- La génération d'images démarre avec ces scènes
- L'utilisateur voit les images s'afficher au fur et à mesure

### Cas d'utilisation : Erreur temporaire avec retry réussi

**Given** :
- Le service Replicate a un problème temporaire (rate limit)
- Configuration avec retry activé (3 tentatives max)

**When** :
- L'utilisateur clique sur "Générer l'histoire"
- Le 1er appel échoue avec erreur 429 (rate limit)
- Le système attend 2s et retente
- Le 2ème appel réussit

**Then** :
- L'histoire est générée avec succès
- Le délai total est augmenté (~2-5s de plus)
- Un log warning indique qu'un retry a été nécessaire
- L'utilisateur n'est pas conscient de l'erreur (transparence)

### Cas d'utilisation : Échec total avec fallback

**Given** :
- Replicate est indisponible (timeout après 3 tentatives)
- Le fallback in-memory est configuré

**When** :
- L'utilisateur clique sur "Générer l'histoire"
- Les 3 tentatives Replicate échouent (timeout)
- Le système bascule automatiquement sur InMemorySceneGenerator

**Then** :
- L'histoire est générée avec les 4 scènes génériques in-memory
- Un log error indique l'échec Replicate + utilisation du fallback
- L'utilisateur reçoit son histoire (scénario générique non personnalisé)

---

## Spécifications techniques

### 1. Modifications du schéma de variables d'environnement

#### Fichier : `webapp/src/config/env.schema.ts`

```typescript
STORY_PROVIDER: z.enum(['ollama', 'replicate']),
```

#### Fichier : `webapp/.env.prod`

```bash
STORY_PROVIDER=replicate
```

### 2. Classe utilitaire de validation

#### Fichier : `webapp/src/lib/story-scenes-description-generator/story-generator-validator.ts` (nouveau)

```typescript
export class StoryGeneratorValidator {
  static validateStoryContext(context: StoryContext): void {
    // Validation titre, description, personnages (1-5)
  }
  
  static validateAIResponse(response: unknown): AIStoryResponse {
    // Validation JSON, 4 scènes, types valides
  }
  
  static parseJSONResponse(response: string): unknown {
    // Extraction du JSON depuis la réponse texte
  }
}
```

### 3. Implémentation ReplicateStoryGenerator avec fallback intégré

#### Fichier : `webapp/src/lib/story-scenes-description-generator/replicate-story-generator.ts`

```typescript
export class ReplicateStoryGenerator implements StoryScenesDescriptionGenerator {
  private client: Replicate;
  private fallbackGenerator: InMemorySceneGenerator;
  
  async generateStory(context: StoryContext): Promise<GeneratedScene[]> {
    // Validation input
    StoryGeneratorValidator.validateStoryContext(context);
    
    try {
      // Retry avec backoff (3 tentatives)
      return await this.generateWithRetry(context);
    } catch (error) {
      // Fallback automatique vers in-memory
      console.warn('Replicate failed, using fallback');
      return await this.fallbackGenerator.generateStory(context);
    }
  }
  
  private async generateWithRetry(context: StoryContext): Promise<GeneratedScene[]> {
    // Logique retry avec backoff exponentiel (2s, 4s, 8s)
  }
}
```

### 4. Modification de la Factory

#### Fichier : `webapp/src/lib/story-scenes-description-generator/story-scenes-description-generator.ts`

```typescript
export class StoryGeneratorFactory {
  static async getGenerator(): Promise<StoryScenesDescriptionGenerator> {
    switch (env.STORY_PROVIDER) {
      case 'ollama':
        return new OllamaStoryGenerator();
      case 'replicate':
        return new ReplicateStoryGenerator();
      default:
        return new InMemorySceneGenerator();
    }
  }
}
```

---

## Sécurité et considérations

### Sécurité

1. **Protection du token API** :
   - Le `REPLICATE_API_TOKEN` ne doit JAMAIS être exposé côté client
   - Stocké uniquement en variable d'environnement serveur
   - Validé au démarrage via `env.schema.ts`

2. **Validation des entrées** :
   - Le contexte utilisateur (titre, description, personnages) est validé par `BaseStoryGenerator.validateStoryContext()`
   - Limite de 5 personnages maximum
   - Descriptions minimales (10 caractères)

3. **Validation des sorties** :
   - La réponse JSON est strictement validée par `validateAIResponse()`
   - Types de scènes limités à : introduction, conflict, action, resolution
   - Exactement 4 scènes requises
   - Descriptions et prompts minimaux

4. **Rate limiting** :
   - Replicate a ses propres limites de rate (gérées par leur API)
   - Le retry avec backoff évite de spammer en cas de 429
   - Pas de rate limiting côté application (à considérer si abus)

### Performance

1. **Latence** :
   - Llama 3.1 70B : ~15-30 secondes par génération (modèle lourd)
   - Timeout configuré à 60s par défaut (via `STORY_GENERATION_TIMEOUT`)
   - En cas de retry : peut aller jusqu'à 3min max (3 x 60s)
   - Considérer: Afficher un loader avec estimation du temps

2. **Coûts** :
   - ~$0.0025 par scénario généré avec Llama 3.1 70B
   - Pour 1000 utilisateurs/jour : ~$2.50/jour = $75/mois
   - Images restent le coût principal (~$0.012 pour 4 images)
   - Total par histoire : ~$0.015 (1.5 centimes)

3. **Cache** :
   - Pas de cache implémenté (chaque histoire est unique)
   - Ne pas cacher : chaque génération doit être différente
   - Les scènes générées sont stockées en DB pour ne pas régénérer

### Logs

- Chaque génération log : provider, durée, succès/échec, retry
- Exemple : `[Replicate] Story generated in 18450ms`
- En cas de fallback : `[Replicate] Failed after 3 attempts, using InMemorySceneGenerator`

### Nettoyage des données

Aucun nettoyage spécifique nécessaire :
- Les scènes générées sont stockées en DB (table `scenes`)
- Pas de données temporaires ou de cache
- Si suppression d'une histoire → cascade delete des scènes (déjà implémenté)

---

## Plan de déploiement

### Phase 1 : Développement et tests (Sprint actuel)

**Backend**
- [ ] Créer `StoryGeneratorValidator` classe utilitaire
- [ ] Créer `ReplicateStoryGenerator` avec retry et fallback intégrés
- [ ] Modifier `StoryGeneratorFactory` pour supporter 'replicate'
- [ ] Modifier `env.schema.ts` pour ajouter 'replicate' à l'enum
- [ ] Supprimer ou refactoriser `BaseStoryGenerator` (optionnel)

**Tests locaux**
- [ ] Tester Replicate avec token de dev :
  ```bash
  STORY_PROVIDER=replicate npm run dev
  ```
- [ ] Vérifier la génération d'histoires variées (5-10 tests différents)
- [ ] Tester le retry : simuler timeout (débrancher réseau temporairement)
- [ ] Tester le fallback : désactiver Replicate, vérifier basculement vers Ollama
- [ ] Vérifier les logs et messages d'erreur


### Phase 2 : Déploiement en staging (Sprint actuel ou suivant)

**Configuration staging**
- [ ] Ajouter `STORY_PROVIDER=replicate` dans l'environnement staging
- [ ] Vérifier que `REPLICATE_API_TOKEN` est configuré
- [ ] Déployer le code

**Tests staging**
- [ ] Smoke test : Créer une histoire complète de bout en bout
- [ ] Vérifier le fallback (simuler panne Replicate → doit utiliser in-memory)
- [ ] Monitorer les logs pour détecter des erreurs
- [ ] Mesurer la latence réelle (devrait être ~15-30s)
- [ ] Vérifier les coûts dans le dashboard Replicate

### Phase 3 : Déploiement en production (Sprint suivant)

**Pré-déploiement**
- [ ] Vérifier les quotas et limites Replicate
- [ ] Préparer un plan de rollback (retour à in-memory si problème)

**Déploiement**
- [ ] Mettre à jour `.env.prod` : `STORY_PROVIDER=replicate`
- [ ] Déployer en production
- [ ] Faire un test manuel immédiat après déploiement

**Post-déploiement**
- [ ] Monitorer les premières générations (24h)
- [ ] Vérifier les coûts réels vs estimés
- [ ] Collecter du feedback utilisateur sur la qualité des histoires
- [ ] Ajuster le timeout si nécessaire
- [ ] Documenter les incidents éventuels

### Phase 4 : Optimisations futures (Si nécessaire)

**Optimisations coûts**
- [ ] Évaluer un switch vers Llama 3 8B si créativité suffisante (économie 10x)
- [ ] Implémenter un système de A/B testing 70B vs 8B

**Optimisations performance**
- [ ] Réduire le timeout si les générations sont systématiquement < 30s
- [ ] Implémenter un système de queue si volume important

**Amélioration qualité**
- [ ] Collecter les histoires générées et analyser la qualité
- [ ] Affiner les prompts si nécessaire
- [ ] Tester d'autres styles artistiques

---

## Métriques de succès

### Fonctionnelles
- ✅ **100% des histoires sont uniques** (pas de duplication des scènes in-memory)
- ✅ **95%+ de taux de succès** de génération (avec retry + fallback)
- ✅ **<1% d'utilisation du fallback** en conditions normales
- ✅ **Histoires cohérentes** avec le contexte fourni (titre, description, personnages)

### Techniques
- ✅ **Latence moyenne < 30s** pour la génération de scénario
- ✅ **Timeout < 5%** des générations (objectif: quasi 0%)
- ✅ **100% des réponses JSON valides** (après retry)
- ✅ **Zero breaking change** sur l'API existante

### Business
- ✅ **Coût < $0.01 par histoire générée** (scénario + images)
- ✅ **Satisfaction utilisateur** : histoires créatives et variées
- ✅ **Scalabilité** : peut gérer 1000+ générations/jour

### Monitoring
- ✅ **Logs structurés** pour toutes les générations
- ✅ **Traçabilité** des échecs et retry

---


---

## Références

### Documentation technique
- [Replicate API Documentation](https://replicate.com/docs)
- [Replicate JavaScript Client](https://github.com/replicate/replicate-javascript)
- [Meta Llama 3.1 70B Model](https://replicate.com/meta/meta-llama-3.1-70b-instruct)
- [Replicate Pricing](https://replicate.com/pricing)

### Code existant
- `webapp/src/lib/story-scenes-description-generator/ollama-story-generator.ts` : Implémentation de référence
- `webapp/src/lib/scene-image-generator/replicate-flux-klein-scene-image-generator.ts` : Utilisation du client Replicate
- `webapp/src/lib/story-scenes-description-generator/story-scenes-description-prompts.ts` : Prompts et validation

### Décisions architecturales
- Pattern Strategy avec Factory
- Retry avec backoff exponentiel
- Fallback automatique transparent
- Configuration via variables d'environnement
