# Spécification Technique : Édition de Scénario

## 1. Objectif

Permettre à l'utilisateur de **modifier manuellement le texte des scènes** générées par l'IA avant le lancement de la génération d'images. Cette fonctionnalité s'intègre dans le flux de création d'histoire existant, entre la génération du scénario et la génération des images.

### Utilisateurs Cibles
- Parents souhaitant personnaliser les histoires pour leurs enfants
- Éducateurs adaptant les récits à des contextes pédagogiques spécifiques
- Tout utilisateur voulant affiner les descriptions avant visualisation

### Valeur Ajoutée
- **Contrôle créatif** : l'utilisateur peut corriger ou enrichir les descriptions
- **Personnalisation** : adapter le vocabulaire, le ton, ou les détails narratifs
- **Qualité** : corriger d'éventuelles incohérences de l'IA avant la génération d'images

## 2. Flux Utilisateur

### 2.1 Positionnement dans le Parcours

**Flux actuel** :
1. Création de l'histoire (titre + description)
2. Ajout des personnages (nom + description + photo optionnelle)
3. Clic sur "Générer l'histoire" → **génération des scènes + images**
4. Affichage du résultat final

**Nouveau flux** :
1. Création de l'histoire (titre + description)
2. Ajout des personnages (nom + description + photo optionnelle)
3. Clic sur "Générer le scénario" → **génération des scènes uniquement**
4. **[NOUVEAU]** Affichage des scènes avec possibilité d'édition
5. **[NOUVEAU]** Validation du scénario → génération des images
6. Affichage du résultat final

### 2.2 États de l'Édition

#### État 1 : Affichage du Scénario (Mode Lecture)
- Toutes les scènes sont affichées en lecture seule
- Chaque scène affiche :
  - Numéro de scène (1-4)
  - Type de scène (introduction, conflict, action, resolution)
  - Texte de description (plain text)
  - Bouton "Éditer" (1 par scène)
- Bouton global "Générer les images" (en bas)

#### État 2 : Édition d'une Scène (Mode Édition)
- Le texte de la scène devient éditable (Textarea shadcn avec validation HTML native)
- Affichage :
  - Compteur de caractères : `X / 500` (en temps réel via JavaScript)
  - Validation HTML native via `minlength="10"` et `maxlength="500"`
  - Bouton "Enregistrer" (sauvegarde les modifications)
  - Bouton "Annuler" (revient à la version avant édition)
- Les autres scènes restent en mode lecture

#### État 3 : Sauvegarde
- Après "Enregistrer" : retour en mode lecture
- Aucune indication visuelle spécifique (pas de badge "Modifiée")
- Texte mis à jour dans la base de données (écrase l'ancienne valeur)

### 2.3 Règles Métier

#### Contraintes de Timing
- ✅ Édition possible **après** génération du scénario
- ✅ Édition possible **avant** génération des images
- ❌ Édition **impossible** après génération des images (immutabilité)

#### Contraintes de Validation
- **Longueur** : 10 à 500 caractères (validation côté client + serveur)
- **Format** : plain text uniquement (pas de Markdown, HTML, etc.)
- **Nombre de scènes** : fixe (4 scènes), pas d'ajout/suppression

#### Contraintes de Persistance
- **Pas d'historique** : la version originale est écrasée lors de la sauvegarde (pas de colonne `is_edited`)
- **Sauvegarde explicite** : l'utilisateur doit cliquer sur "Enregistrer"
- **Annulation** : le bouton "Annuler" restaure le texte avant édition locale (pas de sauvegarde en base)

## 3. Architecture et Structure

### 3.1 Modification du Schéma de Données

#### Pas de Migration Nécessaire

**Aucune colonne ajoutée** : le schéma actuel de `scenes` est suffisant. La modification du scénario écrase simplement le champ `description` existant. 
Pas de distinction entre "généré par IA" et "modifié par l'utilisateur".

#### Statut de Story Inchangé

**Pas de nouveau statut** : le statut `pending` couvre toute la phase de création, incluant la génération et l'édition du scénario.

**Transitions existantes** :
- `pending` → `generating` : après clic sur "Générer les images"
- `generating` → `completed` : après génération réussie
- `generating` → `failed` : en cas d'erreur

### 3.2 Nouvelle API Route et Architecture

#### `PATCH /api/stories/{storyId}/scenes/{sceneId}`

**Architecture respectée (DDD Tactique)** :
- L'endpoint appelle un **Command Handler** : `UpdateSceneDescriptionCommandHandler`
- Le Command Handler récupère l'**agrégat Story** (agrégat root)
- La validation métier se fait dans le **domaine** (méthode `Story.updateSceneDescription()`)
- Story contient les Scenes (entités enfants de l'agrégat)
- `StoryRepository.save(story)` persiste la story ET ses scènes

**Requête** :
```typescript
{
  description: string; // 10-500 caractères
}
```

**Validation Zod (API)** :
```typescript
const schema = z.object({
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .trim()
});
```

**Validation Domaine (Story aggregate root)** :
```typescript
class Story {
  private scenes: Scene[];
  
  updateSceneDescription(sceneId: string, newDescription: string): void {
    if (this.status !== 'pending') {
      throw new CannotEditSceneAfterGenerationError(this.status);
    }
    
    const scene = this.scenes.find(s => s.id === sceneId);
    if (!scene) {
      throw new SceneNotFoundInStoryError(sceneId);
    }
    
    const trimmed = newDescription.trim();
    
    if (trimmed.length < 10) {
      throw new SceneDescriptionTooShortError();
    }
    
    if (trimmed.length > 500) {
      throw new SceneDescriptionTooLongError();
    }
    
    scene.description = newDescription;
  }
}
```

**Réponse Success (202)** :
```
HTTP 202 Accepted
(pas de body)
```

**Réponse Erreur (400)** :
```typescript
{
  error: 'Validation échouée';
  details: [
    { path: 'description', message: 'La description doit contenir au moins 10 caractères' }
  ]
}
```

**Réponse Erreur (409)** :
```typescript
{
  error: 'Modification impossible';
  message: 'Les images ont déjà été générées. Impossible de modifier le scénario.';
}
```

**Logique métier (Command Handler)** :
```typescript
class UpdateSceneDescriptionCommandHandler {
  constructor(private readonly storyRepository: StoryRepository) {}
  
  async execute(storyId: string, sceneId: string, description: string): Promise<void> {
    const story = await this.storyRepository.get(storyId);
    
    story.updateSceneDescription(sceneId, description);
    
    await this.storyRepository.save(story);
  }
}
```

**Pattern d'Agrégat DDD** :
- **Story** = Agrégat Root (contient les Scenes)
- **Scene** = Entité enfant de l'agrégat
- `StoryRepository.get(storyId)` charge la story **avec toutes ses scènes**
- `StoryRepository.save(story)` persiste la story **et toutes ses scènes**
- La modification d'une scène passe par l'agrégat root (Story)

### 3.3 Séparation de la Génération

#### Actuel : `/api/stories/{id}/generate` (génère scénario + images)

**Nouvelle architecture** :

1. **`POST /api/stories/{id}/scenario-generation`** : génère uniquement le scénario
   - Statut initial requis : `pending`
   - Appelle `GenerateScenarioCommandHandler`
   - Le handler appelle un nouveau service : `ScenarioGeneratorService` (extrait de `StoryGeneratorService`)
   - Génère les 4 scènes et les persiste (statut reste `pending`)
   - Retourne `{ status: 202, message: 'Scenario generation started' }`

2. **`POST /api/stories/{id}/images-generation`** : génère uniquement les images
   - Statut initial requis : `pending` + scènes déjà générées
   - **Validation métier** : vérifier que les 4 scènes existent dans la base (sinon erreur 400)
   - Appelle `GenerateImagesCommandHandler`
   - Change le statut vers `generating` puis `completed`
   - Utilise les descriptions de scènes existantes (modifiées ou non)
   - Retourne `{ status: 202, message: 'Image generation started' }`

3. **Refactoring de `StoryGeneratorService`** :
   - Séparer en deux services : `ScenarioGeneratorService` et `ImageGeneratorService`
   - `ScenarioGeneratorService` : génère les descriptions de scènes uniquement
   - `ImageGeneratorService` : génère les images à partir des scènes existantes

4. **Conservation de l'ancien endpoint** :
   - **Garder** `/api/stories/{id}/generate` pour éviter de casser les PWA installées
   - Cet endpoint appelle séquentiellement `/scenario-generation` puis `/images-generation`
   - **Non utilisé par le nouveau frontend** (utilise les 2 nouveaux endpoints séparément)

### 3.4 Composants React

#### Structure de Fichiers

```
webapp/src/
├── app/
│   ├── create-story/
│   │   └── page.tsx                                      [MODIFIÉ] Nouveau flux
│   ├── _app-http-requests/
│   │   ├── generate-scenario.ts                          [NOUVEAU]
│   │   ├── generate-images.ts                            [NOUVEAU]
│   │   └── update-scene.ts                               [NOUVEAU]
│   └── api/
│       └── stories/
│           └── [id]/
│               ├── generate/
│               │   └── route.ts                          [EXISTANT] Conservé pour PWA
│               ├── scenario-generation/
│               │   └── route.ts                          [NOUVEAU]
│               ├── images-generation/
│               │   └── route.ts                          [NOUVEAU]
│               └── scenes/
│                   └── [sceneId]/
│                       └── route.ts                      [NOUVEAU] PATCH endpoint
├── components/
│   ├── scenario-editor/
│   │   ├── scenario-viewer.tsx                           [NOUVEAU] Affichage read-only
│   │   ├── scene-card.tsx                                [NOUVEAU] Carte d'une scène
│   │   └── scene-editor.tsx                              [NOUVEAU] Édition d'une scène
│   └── shadcn-ui/
│       └── textarea.tsx                                   [EXISTANT]
├── lib/
│   ├── application/
│   │   └── handlers/
│   │       └── command/
│   │           ├── generate-scenario/
│   │           │   └── generate-scenario-command-handler.ts    [NOUVEAU]
│   │           ├── generate-images/
│   │           │   └── generate-images-command-handler.ts      [NOUVEAU]
│   │           └── update-scene-description/
│   │               └── update-scene-description-command-handler.ts [NOUVEAU]
│   ├── domain/
│   │   ├── story.ts                                      [MODIFIÉ] Ajouter updateSceneDescription()
│   │   ├── scene.ts                                      [INCHANGÉ] Entité simple
│   │   ├── scene-description-too-short-error.ts         [NOUVEAU]
│   │   ├── scene-description-too-long-error.ts          [NOUVEAU]
│   │   ├── cannot-edit-scene-after-generation-error.ts  [NOUVEAU]
│   │   └── scene-not-found-in-story-error.ts            [NOUVEAU]
│   └── story-generator-service/
│       ├── scenario-generator-service.ts                 [NOUVEAU] Extrait de story-generator-service
│       └── image-generator-service.ts                    [NOUVEAU] Extrait de story-generator-service
```

#### Composant `ScenarioViewer`

**Props** :
```typescript
type ScenarioViewerProps = {
  storyId: string;
  scenes: Array<{
    id: string;
    scene_number: number;
    scene_type: string;
    description: string;
  }>;
  onScenesUpdated: () => void;  // Callback après modification
};
```

**Comportement** :
- Affiche les 4 scènes via `SceneCard`
- Gère l'état "quelle scène est en édition" (1 seule à la fois)
- Bouton "Générer les images" en bas (lance `/api/stories/{id}/images-generation`)
- Pas d'indicateur visuel "Modifiée" (pas de badge)
- **Utilise directement `useMutation` et `useQuery`** (pas de hooks personnalisés)

#### Composant `SceneCard`

**Props** :
```typescript
type SceneCardProps = {
  scene: {
    id: string;
    scene_number: number;
    scene_type: string;
    description: string;
  };
  isEditing: boolean;
  onEditClick: () => void;
  onSaveClick: (newDescription: string) => Promise<void>;
  onCancelClick: () => void;
};
```

**Mode Lecture** :
```tsx
<Card>
  <CardHeader>
    <CardTitle>Scène {scene_number}</CardTitle>
    <CardDescription>{scene_type}</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm">{description}</p>
    <Button onClick={onEditClick} variant="outline">Éditer</Button>
  </CardContent>
</Card>
```

**Mode Édition** :
```tsx
<Card>
  <CardHeader>
    <CardTitle>Scène {scene_number}</CardTitle>
    <CardDescription>{scene_type}</CardDescription>
  </CardHeader>
  <CardContent>
    <Textarea 
      value={localDescription}
      onChange={(e) => setLocalDescription(e.target.value)}
      minLength={10}
      maxLength={500}
      required
      className="min-h-[150px]"
    />
    <p className="text-xs text-muted-foreground mt-1">
      {localDescription.length} / 500 caractères
    </p>
    <div className="flex gap-2 mt-4">
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
      <Button onClick={onCancelClick} variant="outline">Annuler</Button>
    </div>
  </CardContent>
</Card>
```

**Note** : Utilisation de `minLength` et `maxLength` HTML natifs sur le Textarea. 
La validation JavaScript côté client est complémentaire (compteur de caractères), mais la validation principale se fait via les attributs HTML.

#### Pas de Composant `SceneEditor` Séparé

**Décision** : Garder la logique d'édition dans `SceneCard` directement, avec `useMutation` de react-query.

```typescript
const updateSceneMutation = useMutation({
  mutationFn: ({ storyId, sceneId, description }: { 
    storyId: string; 
    sceneId: string; 
    description: string 
  }) => updateScene(storyId, sceneId, description),
  onSuccess: () => {
    setIsEditing(false);
    onScenesUpdated();
  }
});
```

**Pas de hooks personnalisés** comme `useSceneEditor` ou `useScenarioStatus` : utiliser directement les hooks de react-query.

## 4. Style de Code

### 4.1 Conventions TypeScript

#### Nommage
- **Composants** : PascalCase (`ScenarioViewer`, `SceneCard`)
- **Types** : PascalCase (`SceneData`, `ScenarioViewerProps`)
- **Fonctions** : camelCase (`updateScene`, `generateScenario`)
- **Pas de hooks personnalisés** : utiliser directement `useMutation`, `useQuery` de react-query

#### Extraction de Méthodes
```typescript
function SceneCard({ scene, isEditing }: SceneCardProps) {
  const validateDescription = (text: string): string | null => {
    if (text.trim().length < 10) {
      return 'La description doit contenir au moins 10 caractères';
    }
    if (text.length > 500) {
      return 'La description ne peut pas dépasser 500 caractères';
    }
    return null;
  };

  const handleSave = async () => {
    const error = validateDescription(localDescription);
    if (error) {
      setError(error);
      return;
    }
    await onSaveClick(localDescription);
  };

  // ...
}
```

#### Gestion d'État
- **Local** : `useState` pour l'état d'édition d'une scène
- **Server** : `useMutation` (React Query) pour les appels API
- **Pas de Redux/Zustand** : garder la simplicité avec React Query

### 4.2 Composants shadcn/ui Utilisés

- `<Textarea />` : édition du texte
- `<Button />` : actions (Éditer, Enregistrer, Annuler)
- `<Card />`, `<CardHeader />`, `<CardContent />` : structure visuelle
- `<Badge />` : indicateur "Modifiée"
- `<Label />` : accessibilité (si ajout de labels)

### 4.3 Pas de Commentaires

## 5. Stratégie de Tests

### 5.1 Tests E2E (Playwright)

#### Fichier : `webapp/tests/e2e/create-a-story.spec.ts` [MODIFIÉ]

**Mise à jour du test existant** : Intégrer l'édition de scénario dans le parcours complet.

**Ajout au test existant** :

```typescript
test('should create a complete story with 2 characters and generate images', async ({ page }) => {
  // ... (début du test existant : création histoire + personnages)
  
  // Clic sur "Générer le scénario"
  await expect(page.getByRole('button', { name: /Générer le scénario/i })).toBeVisible();
  await page.getByRole('button', { name: /Générer le scénario/i }).click();

  await expect(page.getByText(/Génération du scénario en cours/i)).toBeVisible();
  
  await page.waitForTimeout(15000);

  // Attendre l'affichage des scènes
  await expect(page.getByText(/Scénario généré avec succès/i)).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('heading', { name: /Scène 1/i })).toBeVisible();
  
  // [NOUVEAU] Éditer la scène 1
  const editButtons = page.getByRole('button', { name: /Éditer/i });
  await editButtons.first().click();
  
  const textarea = page.getByRole('textbox').first();
  await textarea.clear();
  await textarea.fill('Une description personnalisée pour la première scène de notre histoire.');
  
  const saveButton = page.getByRole('button', { name: /Enregistrer/i }).first();
  await saveButton.click();
  
  await expect(page.getByText('Une description personnalisée')).toBeVisible();
  
  // [NOUVEAU] Éditer la scène 4
  await page.getByRole('button', { name: /Éditer/i }).nth(3).click();
  
  const textareaScene4 = page.getByRole('textbox').first();
  await textareaScene4.clear();
  await textareaScene4.fill('Une conclusion modifiée pour terminer cette belle aventure.');
  
  await page.getByRole('button', { name: /Enregistrer/i }).first().click();
  
  await expect(page.getByText('Une conclusion modifiée')).toBeVisible();
  
  // Clic sur "Générer les images"
  await expect(page.getByRole('button', { name: /Générer les images/i })).toBeVisible();
  await page.getByRole('button', { name: /Générer les images/i }).click();

  await expect(page.getByText(/Génération en cours/i)).toBeVisible();

  await page.waitForTimeout(15000);

  await expect(page.getByText(/Histoire générée avec succès/i)).toBeVisible({ timeout: 15000 });

  // Vérifier que les descriptions modifiées sont présentes dans le résultat final
  await expect(page.getByText('Une description personnalisée')).toBeVisible();
  await expect(page.getByText('Une conclusion modifiée')).toBeVisible();

  // ... (fin du test existant : vérification images)
});
```

**Pas de nouveaux fichiers de test** : le test existant est étendu pour couvrir l'édition de scénario.

### 5.2 Pas de Tests Unitaires ni Tests API pour l'instant

**Décision** : Se concentrer sur le test E2E qui couvre le flux complet. Les tests unitaires et tests d'API seront ajoutés ultérieurement si nécessaire.

## 6. Boundaries (Limites et Règles)

### 6.1 Always Do (Toujours Faire)

1. **Valider côté client ET serveur** : la longueur 10-500 caractères
2. **Vérifier le statut de la story** avant toute modification
3. **Utiliser des sélecteurs accessibles** dans les tests E2E (role, label, text)
4. **Extraire des méthodes** plutôt que des commentaires pour clarifier le code
5. **Tester le flux complet** : édition → sauvegarde → génération d'images

### 6.2 Never Do (Ne Jamais Faire)

1. **Ne jamais permettre l'édition après `status = completed`** : immutabilité garantie
2. **Ne jamais autoriser HTML/scripts** dans les descriptions : risque XSS
3. **Ne jamais skip les tests E2E** : régression facile sur ce flux complexe
4. **Ne jamais utiliser de sélecteurs CSS** dans les tests Playwright : forcer l'accessibilité
5. **Ne jamais sauvegarder automatiquement** sans bouton explicite : perte de contrôle utilisateur

## 7. Critères d'Acceptation

### Feature Complète Si

- ✅ L'utilisateur peut éditer le texte de chaque scène (1-4) séparément
- ✅ Les modifications sont validées (10-500 caractères) via HTML natif + domaine
- ✅ Les modifications écrasent le texte original (pas d'historique)
- ✅ L'édition est impossible après génération d'images (erreur 409)
- ✅ Les images générées utilisent le texte édité (intégration au prompt)
- ✅ Le test E2E existant est mis à jour pour valider le flux complet
- ✅ L'ancien endpoint `/generate` est conservé pour les PWA
- ✅ La validation métier est implémentée dans le domaine (`Story.updateSceneDescription()`)
- ✅ L'architecture respecte le pattern DDD Tactique : Story = Agrégat Root, Scene = Entité enfant
- ✅ Le Command Handler récupère uniquement Story (pas Scene séparément)
- ✅ L'API retourne `202 Accepted` sans body pour l'édition de scène

## 8. Étapes d'Implémentation Suggérées

### Phase 1 : Domaine et Validation Métier (DDD Tactique)
1. Modifier `Story` (agrégat root) pour qu'elle contienne `scenes: Scene[]`
2. Ajouter la méthode `Story.updateSceneDescription(sceneId, description)` avec validation métier
3. Créer les erreurs domaine :
   - `SceneDescriptionTooShortError`
   - `SceneDescriptionTooLongError`
   - `CannotEditSceneAfterGenerationError`
   - `SceneNotFoundInStoryError`
4. Modifier `StoryRepository.get(storyId)` pour charger la story **avec toutes ses scènes**
5. Modifier `StoryRepository.save(story)` pour persister la story **et toutes ses scènes**

### Phase 2 : Refactoring du Service de Génération
4. Extraire `ScenarioGeneratorService` de `StoryGeneratorService` (génération scènes uniquement)
5. Extraire `ImageGeneratorService` de `StoryGeneratorService` (génération images uniquement)
6. Créer `GenerateScenarioCommandHandler` dans `application/handlers/command/generate-scenario/`
7. Créer `GenerateImagesCommandHandler` dans `application/handlers/command/generate-images/`
8. Ajouter la validation métier dans `GenerateImagesCommandHandler` : vérifier que les 4 scènes existent

### Phase 3 : Nouvelle Route d'Édition
9. Créer `UpdateSceneDescriptionCommandHandler` dans `application/handlers/command/update-scene-description/`
   - Le handler récupère uniquement la Story (pas la Scene séparément)
   - Appelle `story.updateSceneDescription(sceneId, description)`
   - Sauvegarde via `storyRepository.save(story)`
10. Créer la route `PATCH /api/stories/{id}/scenes/{sceneId}` avec validation Zod + appel au handler
    - Retourne `202 Accepted` sans body
11. Créer les routes `POST /api/stories/{id}/scenario-generation` et `POST /api/stories/{id}/images-generation`

### Phase 4 : Frontend et Composants
12. Créer `SceneCard` (mode lecture + édition avec Textarea HTML natif `minLength`/`maxLength`)
    - Utiliser directement `useMutation` de react-query (pas de hooks personnalisés)
13. Créer `ScenarioViewer` (orchestration des 4 scènes)
14. Intégrer dans `create-story/page.tsx` (nouveau flux : scénario → édition → images)
15. Ajouter les appels API (`update-scene.ts`, `generate-scenario.ts`, `generate-images.ts`)
    - `update-scene.ts` attend une réponse `202` sans body

### Phase 5 : Tests E2E
16. Mettre à jour `webapp/tests/e2e/create-a-story.spec.ts` pour inclure l'édition des scènes 1 et 4
17. Valider le flux complet dans le test existant

### Phase 6 : Conservation de l'Ancien Endpoint
18. Garder `/api/stories/{id}/generate` qui appelle séquentiellement `/scenario-generation` puis `/images-generation`
19. Ajouter un commentaire indiquant que cet endpoint est conservé pour les PWA

## 9. Risques et Mitigations

### Risque 1 : PWA Installées Cassées
- **Impact** : Les PWA déjà installées appellent l'ancien endpoint `/generate` qui pourrait être supprimé
- **Mitigation** : **Conserver l'ancien endpoint** `/generate` qui appelle séquentiellement les 2 nouveaux

### Risque 2 : Génération d'Images sans Scénario
- **Impact** : L'utilisateur tente de générer des images avant d'avoir généré le scénario
- **Mitigation** : Validation métier dans `GenerateImagesCommandHandler` : vérifier que les 4 scènes existent (erreur 400)

### Risque 3 : Validation Côté Client Contournée
- **Impact** : Données invalides insérées en base
- **Mitigation** : Triple validation (HTML natif, Zod API, domaine `Scene.updateDescription()`)

### Risque 4 : Édition après Génération d'Images
- **Impact** : L'utilisateur modifie le scénario après que les images soient générées
- **Mitigation** : Vérification du statut dans `UpdateSceneDescriptionCommandHandler` (erreur 409 si `status !== 'pending'`)

## 10. Métriques de Succès

- **Taux d'édition** : % d'histoires où au moins 1 scène est modifiée
- **Temps d'édition moyen** : durée entre affichage du scénario et clic sur "Générer les images"
- **Taux d'abandon** : % d'utilisateurs quittant après voir le scénario sans générer d'images
- **Erreurs de validation** : nombre d'erreurs 400/409 sur l'endpoint PATCH

---

## Notes Finales

Cette spécification couvre :
- ✅ Le flux utilisateur complet (quand, comment, pourquoi)
- ✅ L'architecture technique (base de données, API, composants)
- ✅ Le style de code (conventions TypeScript, extraction de méthodes)
- ✅ La stratégie de tests (E2E, API, unitaires)
- ✅ Les limites claires (always/ask/never)

**Prochaines Étapes** :
1. Valider cette spec avec l'équipe/client
2. Créer les tâches Jira/GitHub Issues à partir des phases d'implémentation
3. Commencer par la Phase 1 (backend) pour dérisquer l'architecture

**Durée Estimée** : 5-8 jours développeur (avec tests complets)
