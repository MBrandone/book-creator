# Spécification Technique : Parcours de création guidé (personnages → description assistée → titre)

> Statut : **Implémenté**
> Discovery associée : [`docs/discovery/guidage-inputs-visuels.md`](../discovery/guidage-inputs-visuels.md)

## 1. Objectif

- **Quoi** : Réordonner le parcours de création d'histoire (personnages d'abord, puis description, puis titre — le tout sur une seule page) et ajouter un bouton « Aidez-moi à décrire mon histoire » qui insère dans le textarea de description un template de phrases à compléter.
- **Pourquoi** : Les descriptions fournies aujourd'hui sont trop génériques, ce qui produit des scénarios et des images peu différenciés. En saisissant les personnages d'abord puis en guidant l'écriture de la description, on obtient des inputs plus riches et personnalisés.
- **Pour qui** : Les parents qui créent une histoire illustrée pour leur enfant, sans compétence de rédaction ni de direction artistique.
- **Valeur ajoutée** : Descriptions plus riches → scénarios et images plus uniques ; réduction du sentiment « je ne sais pas quoi écrire » ; le template s'appuie sur les personnages déjà saisis pour être concret.

## 2. Flux Utilisateur

### 2.1 Positionnement dans le Parcours

**Flux actuel** (`webapp/src/app/create-story/page.tsx`) :
1. Titre + Description (un seul formulaire) → `POST /api/stories` crée immédiatement la Story
2. Personnages (exactement 2, un par un) → `POST /api/stories/[id]/characters`
3. Bouton « Générer le scénario » (visible seulement à 2 personnages)
4. Édition du scénario (`ScenarioViewer`)
5. Génération des images → redirection `/stories/{id}`

**Nouveau flux** (toujours sur la seule page `create-story`) :
1. **Personnages d'abord** — l'utilisateur ajoute **1 ou 2 personnages** (nom, description, photo optionnelle). Rien n'est persisté côté serveur à ce stade (hors upload de photo). Les personnages vivent en state React.
2. **Description assistée** — textarea de description avec un bouton **« Aidez-moi à décrire mon histoire »** qui insère le template (voir §2.4). Le template intègre les noms des personnages saisis.
3. **Titre** — champ titre affiché en 3e position, une fois la description renseignée.
4. **Création atomique** — un seul `POST /api/stories` envoie `{ id, title, description, characters[] }`. L'agrégat `Story` crée ses personnages ; tout est persisté en une transaction.
5. **La suite est inchangée** : génération du scénario → édition → génération des images → redirection `/stories/{id}`.

> Décision d'architecture : **création atomique en fin de parcours** (pas de story « draft » en base). Cohérent avec la règle DDD « l'agrégat crée ses enfants » ([[ddd-aggregate-creates-children]]).

### 2.2 États de la page

La page reste un flux vertical piloté par le state React (pas de routes séparées). États successifs :

| État | Condition d'affichage | Contenu |
|---|---|---|
| `collecting` | `!storyId` | Bloc personnages + bloc description (avec bouton d'aide) + bloc titre + bouton « Créer l'histoire » |
| `overwrite-confirm` | clic sur le bouton d'aide alors que le textarea contient du texte | Dialog de confirmation avant d'écraser |
| `generating-scenario` | après `POST /api/stories` puis `POST /scenario-generation` | Écran d'attente + polling (inchangé) |
| `editing-scenario` | 4 scènes générées, pas d'images | `ScenarioViewer` (inchangé) |
| `generating-images` | après `POST /images-generation` | Écran d'attente + polling (inchangé) |

Le bouton « Créer l'histoire » (qui déclenchait l'étape 1 aujourd'hui) est remplacé par un bouton final qui crée la story **et** enchaîne directement sur la génération du scénario (voir §2.3).

### 2.3 Règles Métier

- **Personnages** : 1 à 2 personnages (décision produit — l'UI actuelle force 2, on assouplit à « au moins 1 »). Le domaine autorise déjà ≥1 (`Story.startGeneration` ne rejette que 0 personnage, `story.ts:81`). Le plafond de 2 reste (`canAddMoreCharacters`, `story.ts:72`).
- **Champs personnage** (inchangés) : `name` (min 3), `description` (min 10), photo optionnelle. **Pas de notion de rôle héros/méchant** (décision produit — YAGNI).
- **Description** : min 10 caractères (inchangé), **max 2000 caractères** (nouveau). Un compteur du nombre de caractères saisis s'affiche sous le textarea.
- **Titre** : min 3 caractères (inchangé).
- **Bouton d'aide** :
  - textarea vide → insertion directe du template ;
  - textarea non vide → **dialog de confirmation** avant écrasement (éviter la perte de saisie).
- **Ordre imposé côté UI** : le bouton « Créer l'histoire » n'est activable que si ≥1 personnage + description valide + titre valide.
- **Enchaînement** : le clic sur « Créer l'histoire » déclenche `POST /api/stories` puis, en cas de succès, **immédiatement** `POST /scenario-generation` (pas d'étape intermédiaire).
- **Immutabilité** : `title`/`description` restent immuables après création (`readonly`, `story.ts:14-15`) — pas de changement, on crée tout d'un coup.

### 2.4 Template « Aidez-moi à décrire mon histoire »

Texte statique inséré dans le textarea. Les `[Personnage N]` sont remplacés par les noms réellement saisis ; si aucun nom, on garde un placeholder générique (« le premier personnage »).

```
🌍 L'histoire se passe à/dans .......... (le lieu : une forêt enchantée, une ville, sous l'océan...).

🎭 L'ambiance générale est .......... (joyeuse, mystérieuse, apaisante, aventureuse...).

🎨 Les couleurs dominantes sont .......... (2 ou 3 couleurs qui reviennent partout).

✨ La toute première chose que l'on voit en ouvrant le livre, c'est ..........

🦸 [Personnage 1] est .......... (son caractère, sa personnalité). Il/elle a toujours avec lui/elle .......... (un objet important).

🐾 [Personnage 2] est .......... (son caractère). Il/elle possède .......... (son objet).

🔍 Les détails à ne surtout pas oublier : .......... (vêtements, accessoires, éléments du décor).
```

- Si **1 seul personnage** : n'inclure que la ligne 🦸 avec son nom (supprimer la ligne 🐾).
- Couvre les 7 axes demandés : lieu, ambiance, couleurs, détails importants, objets des personnages, chose à voir en premier, caractère des personnages.
- Le template est une constante côté frontend (pas d'appel réseau, pas de coût API — cohérent avec la discovery).

### 2.5 Cas d'erreur

- Échec `POST /api/stories` (409 doublon / 400 validation / 500) → message d'erreur, le state React (personnages, description, titre) est **conservé** pour permettre un nouvel essai.
- Photo : l'upload échoue déjà silencieusement côté composant (state réinitialisé) — comportement inchangé.

## 3. Architecture et Structure

### 3.1 Agrégats (DDD Tactique)

- **Agrégat Root : `Story`** (`webapp/src/lib/domain/story.ts`).
  - Nouvelle méthode de fabrique enrichie : `Story.create` accepte désormais une liste de descriptions de personnages et **construit lui-même les entités `Character`** (l'agrégat crée ses enfants, [[ddd-aggregate-creates-children]]).
  - Invariant à faire respecter par l'agrégat : **1 à 2 personnages** à la création (nouvelle erreur domaine si 0 ou >2).
- **Entité enfant : `Character`** (`webapp/src/lib/domain/character.ts`) — inchangée.
- **Repository** : `SqlStoryRepository.save()` (`sql-story-repository.ts`) doit désormais **persister aussi les personnages** de l'agrégat, dans une **transaction** (aujourd'hui il ne sauve que story + scènes ; les personnages passaient par `characterRepository.save`).

```typescript
// story.ts — création atomique avec personnages
static create(data: {
  id: string;
  title: string;
  description: string;
  characters: Array<{ id: string; name: string; description: string; photo?: { storageBucket: string; storageKey: string } }>;
}): Story {
  if (data.characters.length < 1 || data.characters.length > 2) {
    throw new InvalidCharacterCountError(data.characters.length);
  }
  const characters = data.characters.map((characterData) =>
    Character.create({
      id: characterData.id,
      storyId: data.id,
      name: characterData.name,
      description: characterData.description,
      photoStorageBucket: characterData.photo?.storageBucket,
      photoStorageKey: characterData.photo?.storageKey,
    })
  );
  return new Story({ /* ... */ status: "pending", characters, scenes: [] });
}
```

### 3.2 Modification du Schéma de Données

- **Aucune migration nécessaire.** Les tables `stories` et `characters` existent déjà avec les bonnes colonnes. La création atomique n'ajoute aucune colonne (on ne stocke pas les préférences visuelles structurées — YAGNI, hors scope de cette feature).

### 3.3 API Routes

- **Modifié** : `POST /api/stories` — le schéma Zod accepte désormais un tableau `characters` et une description bornée à 2000 caractères :

```typescript
const createStorySchema = z.object({
  id: z.uuid(),
  title: z.string().min(3),
  description: z.string().min(10).max(2000),
  characters: z
    .array(
      z.object({
        id: z.uuid(),
        name: z.string().min(3),
        description: z.string().min(10),
        photo: z
          .object({ storageBucket: z.string(), storageKey: z.string() })
          .optional(),
      })
    )
    .min(1)
    .max(2),
});
```

- **Command handler** : `CreateAStoryCommandHandler.execute()` passe les personnages à `Story.create()` puis `storyRepository.save(story)` (une transaction persiste story + personnages).
- **Endpoint `POST /api/stories/[id]/characters`** : devient inutilisé par le nouveau parcours. **Le conserver** (rétrocompatibilité / PWA installées) — voir Risques.
- **Réponses** : `201 Created` (succès, inchangé), `400` (validation Zod), `409` (doublon), `500`.
- **Architecture par couches** (inchangée) : Route (Zod) → Command Handler → Agrégat → Repository.

### 3.4 Composants React

Fichier principal : `webapp/src/app/create-story/page.tsx` (réorganisation du rendu conditionnel).

- **State** : les personnages restent dans `characters` (state existant, on retire la dépendance à `storyId` pour les ajouter) ; `description`, `title` conservés.
- **Nouveau composant** : `DescriptionField` (dans `create-story/`) — encapsule le `Textarea` (`maxLength={2000}`) + le compteur de caractères sous le textarea + le bouton « Aidez-moi à décrire mon histoire » + le dialog de confirmation d'écrasement. Justifié car il porte une logique propre (template, confirmation, compteur).
- **Constante** : `story-description-template.ts` exporte une fonction `buildDescriptionTemplate(characterNames: string[]): string`.
- **Dialog** : composant shadcn `Dialog` **déjà présent** (`components/shadcn-ui/dialog.tsx`) pour la confirmation d'écrasement — pas de nouvelle dépendance.
- **Suppression** : les mutations `storyMutation` (création early) et `characterMutation` (POST characters) fusionnent en une seule mutation `createStory` envoyant `{ id, title, description, characters }`.
- **État serveur** : `useMutation` (création), `useQuery` (statut/polling) — inchangé. **Pas de hook personnalisé.**
- **Photo** : `CharacterPhotoUpload` inchangé — l'upload est déjà indépendant du `storyId` (`getUploadUrl` → upload → `{storageKey, storageBucket}`), donc compatible avec la création atomique sans modification.

## 4. Style de Code

- Pas de commentaires : extraire `DescriptionField`, `buildDescriptionTemplate`, `handleCreateStory`.
- Variables explicites : `characterNames`, `descriptionTemplate`, `hasExistingDescription`.
- Conventions : PascalCase (composants), camelCase (fonctions). `useState` (local), `useMutation`/`useQuery` (serveur).

## 5. Stratégie de Tests

- **E2E (Playwright)** — mettre à jour `webapp/tests/e2e/create-a-story.spec.ts` pour le **nouvel ordre** :
  1. Ajouter 2 personnages (le premier avec la photo fixture) **avant** la description.
  2. Cliquer « Aidez-moi à décrire mon histoire », vérifier que le textarea contient le template (`getByText`/valeur), le compléter/remplacer.
  3. Renseigner le titre.
  4. Cliquer « Créer l'histoire » → génération scénario → édition scènes → génération images → redirection `/stories/{id}` → 4 images.
  - **Nouveau test** : cliquer le bouton d'aide avec un textarea déjà rempli → le dialog de confirmation apparaît (`getByRole("dialog")`).
  - **Nouveau test** : parcours avec **1 seul personnage** aboutit à la création.
- **Sélecteurs accessibles uniquement** : `getByRole`, `getByLabel`, `getByText`. Nouveaux labels à prévoir : `Aidez-moi à décrire mon histoire`, `Créer l'histoire`.
- **Pas de tests unitaires (Vitest) pour cette feature.** Couverture assurée uniquement par les tests E2E Playwright.

## 6. Boundaries

### Always Do
- Valider côté client (HTML `minLength`/`required`) ET serveur (Zod) ET domaine (invariant nombre de personnages).
- Créer les personnages via l'agrégat `Story`.
- Persister story + personnages dans une transaction.
- Sélecteurs accessibles en E2E.
- Confirmer avant d'écraser une description déjà saisie.

### Ask First
- Ajouter une dépendance (aucune prévue : le `Dialog` shadcn existe déjà dans `components/shadcn-ui/dialog.tsx`).
- Toute modification de schéma DB.
- Ajouter le stockage structuré des préférences visuelles (color picker, presets…) — c'est la Direction visuelle de la discovery, **hors scope** de cette feature.

### Never Do
- Autoriser HTML/scripts dans les inputs (XSS).
- Skip les tests E2E.
- Sélecteurs CSS dans Playwright.
- Créer une story « draft » vide en base au chargement de la page.
- Ajouter un hook personnalisé sans réutilisation.

## 7. Critères d'Acceptation

- ✅ L'utilisateur saisit d'abord 1 ou 2 personnages, puis la description, puis le titre, sur une seule page.
- ✅ Un bouton « Aidez-moi à décrire mon histoire » insère le template dans le textarea.
- ✅ Le template intègre les noms des personnages saisis et couvre les 7 axes (lieu, ambiance, couleurs, détails, objets, première chose vue, caractères).
- ✅ Si le textarea contient déjà du texte, un dialog de confirmation s'affiche avant écrasement.
- ✅ Un seul `POST /api/stories` crée la story et ses personnages (transaction), l'agrégat `Story` construisant les `Character`.
- ✅ `Story.create` rejette 0 ou plus de 2 personnages.
- ✅ La suite du parcours (scénario → édition → images → redirection) est inchangée et fonctionne.
- ✅ Les tests E2E (nouvel ordre + confirmation d'écrasement + parcours 1 personnage) passent.

## 8. Étapes d'Implémentation

### Phase 1 : Domaine
1. Modifier `Story.create` pour accepter `characters[]` et construire les entités `Character` (`story.ts`).
2. Créer l'erreur domaine `InvalidCharacterCountError` (0 ou >2).

### Phase 2 : Application + Infra
3. Modifier `CreateAStoryCommandHandler` : commande enrichie `{ id, title, description, characters }` → `Story.create` → `save`.
4. Modifier `SqlStoryRepository.save` : persister aussi les personnages, le tout en **transaction** (`db.transaction()`).

### Phase 3 : API
5. Étendre le schéma Zod de `POST /api/stories` (tableau `characters`, min 1 / max 2 ; description `min 10` / `max 2000`).
6. Conserver `POST /api/stories/[id]/characters` tel quel (rétrocompat).

### Phase 4 : Frontend
7. Créer `story-description-template.ts` (`buildDescriptionTemplate`).
8. Créer le composant `DescriptionField` (textarea `maxLength=2000` + compteur de caractères + bouton d'aide + `Dialog` de confirmation).
9. Réorganiser `create-story/page.tsx` : ordre personnages → description → titre ; fusionner les mutations en un seul `createStory` ; le bouton « Créer l'histoire » enchaîne **directement** sur la génération du scénario.
10. Mettre à jour le client HTTP `_app-http-requests/create-story.ts` (payload avec `characters`).

### Phase 5 : Tests
11. Mettre à jour `create-a-story.spec.ts` (nouvel ordre).
12. Ajouter les tests E2E : confirmation d'écrasement, parcours 1 personnage.

## 9. Risques et Mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Ancien endpoint `POST /characters` cassé pour PWA installées | Utilisateurs sur ancienne version bloqués | Conserver l'endpoint et le handler existants |
| Perte de saisie via le bouton d'aide | Frustration utilisateur | Dialog de confirmation avant écrasement |
| Personnages non persistés si `save` non transactionnel | Story sans personnages en base | Transaction Kysely englobant story + personnages |
| Régression E2E (ordre + labels changés) | CI rouge | Mettre à jour la spec E2E dans la même PR |
| Feature creep vers le questionnaire visuel (color picker, presets) | Dérive de scope | Explicitement hors scope ; template textuel uniquement en v1 |

## 10. Questions Ouvertes (résolues)

- [x] **Enchaînement après « Créer l'histoire »** → **déclenche directement la génération du scénario** (pas de récap intermédiaire, pas de bouton « Générer le scénario » séparé).
- [x] **Limite de description** → **max 2000 caractères**, avec **compteur du nombre de caractères saisis affiché sous le textarea**.

---

## 11. Plan d'Implémentation (Phase 2)

### 11.1 Ordre et dépendances

Le travail se fait **de l'intérieur vers l'extérieur** (domaine → infra → API → frontend → tests), car chaque couche dépend de la signature de la précédente.

```
[A] Domaine : Story.create(characters[]) + InvalidCharacterCountError
      │
      ├──→ [B] Infra : SqlStoryRepository.save transactionnel (story + personnages)
      │
      └──→ [C] Application : CreateAStoryCommandHandler (commande enrichie)
                  │
                  └──→ [D] API : schéma Zod POST /api/stories (characters + description max 2000)
                              │
                              └──→ [E] Client HTTP : create-story.ts (payload characters)
                                          │
   [F] Template (indépendant) ───────────┤
   [G] DescriptionField (dépend de F) ────┤
                                          │
                              [H] Refonte create-story/page.tsx (ordre + mutation unique + enchaînement scénario)
                                          │
                              [I] Tests E2E (nouvel ordre + confirmation + 1 personnage)
```

### 11.2 Composants majeurs

| Bloc | Fichiers | Nature |
|---|---|---|
| **A** Domaine | `lib/domain/story.ts`, `lib/domain/invalid-character-count-error.ts` (nouveau) | Modif + création |
| **B** Infra | `lib/infrastructure/repositories/story-repository/sql-story-repository.ts` | Modif (`db.transaction`) |
| **C** Application | `lib/application/handlers/command/create-a-story/create-a-story-command-handler.ts` | Modif de la commande |
| **D** API | `app/api/stories/route.ts` | Modif schéma Zod |
| **E** Client | `app/_app-http-requests/create-story.ts` | Modif payload |
| **F** Template | `app/create-story/story-description-template.ts` (nouveau) | Création (pure) |
| **G** Champ description | `app/create-story/description-field.tsx` (nouveau) | Création (UI + `Dialog` existant) |
| **H** Page | `app/create-story/page.tsx` | Refonte du rendu + mutation unique |
| **I** Tests | `tests/e2e/create-a-story.spec.ts` | Modif + nouveaux cas |

### 11.3 Parallélisme

- **Séquentiel obligatoire** : A → B, A → C → D → E, puis H (H consomme E, F, G).
- **Parallélisable** : le bloc **F (template)** et le bloc **G (DescriptionField)** sont indépendants de la chaîne backend (A→E) et peuvent être développés en parallèle. G dépend de F.
- **I (tests E2E)** ne peut être validé qu'après H, mais l'écriture des specs peut démarrer dès que les nouveaux labels sont figés (§5).

### 11.4 Checkpoints de vérification

- **Après B** : `npm run build` (ou `tsc`) passe — les signatures domaine/infra/handler sont cohérentes.
- **Après E** : `POST /api/stories` avec un `characters[]` crée bien story + personnages en base (vérif manuelle rapide ou requête SQL).
- **Après H** : le parcours complet fonctionne à la main dans l'app (personnages → description guidée → titre → génération).
- **Après I** : `npm run test:e2e` vert (via `.env.test`, [[e2e-tests-use-env-test]]).

### 11.5 Note de rétrocompatibilité — NE PAS SUPPRIMER

⚠️ **Décision explicite et volontaire** : l'endpoint `POST /api/stories/[id]/characters`, son client HTTP `_app-http-requests/create-character.ts` et le handler `CreateACharacterForStoryCommandHandler` sont **conservés intentionnellement**.

- **Raison** : rétrocompatibilité avec les PWA déjà installées sur l'ancienne version du parcours, qui appellent encore cet endpoint.
- **Conséquence** : après cette feature, ce code apparaîtra comme « mort » du point de vue du nouveau parcours (plus aucun appel depuis `create-story/page.tsx`). **Ce n'est pas du code à nettoyer.**
- **Ne pas supprimer** lors d'un futur passe de nettoyage / chasse au code mort sans avoir d'abord vérifié que plus aucune PWA installée n'en dépend.
