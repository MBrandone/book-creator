# Product Scoping — Spécifications Techniques

Méthodologie de cadrage et de rédaction de spécifications techniques pour le projet Book Creator.

## Quand Utiliser

- Démarrage d'une nouvelle fonctionnalité
- Changement architectural significatif
- Besoin de clarifier des exigences ambiguës
- Tâche nécessitant plus de 30 minutes d'implémentation
- Décisions techniques structurantes (nouveaux services, nouveaux agrégats, nouveaux endpoints)

**Ne PAS utiliser pour** : corrections de typos, modifications d'une ligne, changements triviaux où les exigences sont évidentes.

---

## Workflow en 4 Phases

```
SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT
   │          │        │          │
   ▼          ▼        ▼          ▼
 User       User     User       User
 validates  validates validates  validates
```

**Ne pas passer à la phase suivante sans validation utilisateur.**

---

## Phase 1 : Specify — Rédiger la Spécification

### 1. Exposer les Hypothèses

**Toujours lister explicitement les hypothèses AVANT d'écrire la spec** :

```
HYPOTHÈSES :
1. L'utilisateur est authentifié (pas d'accès anonyme)
2. On utilise PostgreSQL (pas de migration vers un autre SGBD)
3. Les images sont stockées dans MinIO (pas de changement de storage)
4. Le frontend utilise React 19 + Next.js 16
→ Confirmer ou corriger ces hypothèses avant de continuer.
```

**Pourquoi ?** Éviter de spécifier pendant des heures sur la mauvaise base. Les hypothèses sont la forme la plus dangereuse de malentendu.

### 2. Poser les Questions de Clarification

**Approche** : Poser des questions ciblées **une par une** pour éviter de submerger l'utilisateur.

#### A. Questions sur le flux utilisateur
- Comment l'utilisateur accède-t-il à cette fonctionnalité ?
- Quelles sont les étapes du parcours utilisateur ?
- Quelles validations ou contraintes doivent être respectées ?
- Que se passe-t-il en cas d'erreur ?

#### B. Questions sur l'intégration technique
- Comment cette fonctionnalité s'intègre-t-elle avec l'existant ?
- Quels agrégats du domaine sont impactés ?
- Y a-t-il des contraintes techniques à respecter ?

#### C. Questions sur les données
- Quelles données doivent être stockées ?
- Où et comment doivent-elles être stockées ?
- Y a-t-il des besoins de migration des données existantes ?

#### D. Questions sur les dépendances externes
- Des services externes sont-ils requis ?
- Comment fonctionnent ces services ? (consulter la documentation si nécessaire)
- Quelles sont leurs limites/contraintes ?

#### E. Questions sur l'interface graphique
- Quelle interface utilisateur permet d'utiliser ces APIs ?
- Quels composants React sont nécessaires ?

**Principe clé** : **Une question à la fois**
- Présenter 2-5 options de réponse pour faciliter le choix
- Permettre à l'utilisateur de répondre "Je ne sais pas" pour proposer une solution
- Documenter chaque décision avec sa justification

**Transformer les exigences vagues en critères mesurables** :
```
EXIGENCE : "Améliorer la performance"
→ CRITÈRES MESURABLES :
- Temps de chargement < 2s
- LCP < 2.5s sur 4G
- Pas de CLS > 0.1
```

### 3. Structure du Document de Spécification

Le document doit couvrir **9 sections principales** :

#### 1. Objectif
- **Quoi** : Description de la fonctionnalité
- **Pourquoi** : Problème métier résolu
- **Pour qui** : Utilisateurs cibles (parents, éducateurs, etc.)
- **Valeur ajoutée** : Bénéfices concrets

#### 2. Flux Utilisateur
- **Flux actuel** vs **nouveau flux**
- **États** : lecture, édition, sauvegarde, erreur
- **Règles métier** : contraintes de timing, validation, persistance
- **Cas d'erreur** : que se passe-t-il si échec ?

#### 3. Architecture et Structure

##### 3.1 Identification des Agrégats (DDD Tactique)
- **Agrégat Root** : entité principale qui contrôle les invariants métier
- **Entités enfants** : entités appartenant à l'agrégat
- **Repositories** : chargent l'agrégat complet (root + entités)
- **Pattern** : modifications passent toujours par l'agrégat root

**Exemple** :
```typescript
// Story = Agrégat Root
// Scene = Entité enfant
class Story {
  private scenes: Scene[];
  
  updateSceneDescription(sceneId: string, description: string): void {
    // Validation du statut (invariant métier)
    if (this.status !== 'pending') {
      throw new CannotEditSceneAfterGenerationError();
    }
    // Modification via l'agrégat root
    const scene = this.scenes.find(s => s.id === sceneId);
    scene.description = description;
  }
}
```

**Avantages** :
- Cohérence forte des invariants métier
- Une seule requête DB au lieu de deux
- Validation métier centralisée dans l'agrégat root

##### 3.2 Modification du Schéma de Données
- **Migrations** : nouvelles colonnes, nouvelles tables
- **Statuts** : nouveaux statuts de l'agrégat si nécessaire
- **Pas de migration ?** : préciser si le schéma existant suffit

##### 3.3 API Routes et Architecture

**Nommage REST des Endpoints** :
- ✅ `POST /api/stories/{id}/scenario-generation` (ressource + action)
- ✅ `POST /api/stories/{id}/images-generation` (ressource + action)
- ✅ `PATCH /api/stories/{id}/scenes/{sceneId}` (ressource + verbe HTTP)
- ❌ `POST /api/stories/{id}/generate-scenario` (éviter verbe dans l'URL avec POST)

**Architecture par Couches** :
```
API Route (validation Zod)
  ↓
Command Handler (logique applicative)
  ↓
Agrégat Root (validation métier)
  ↓
Repository (persistance)
```

**Réponses API** :
- `200 OK` : requête synchrone réussie avec body
- `202 Accepted` : requête asynchrone acceptée (génération en background) ou modification acceptée sans body
- `400 Bad Request` : validation échouée
- `409 Conflict` : règle métier violée (ex: modification impossible après génération)

##### 3.4 Composants React
- Structure de fichiers (nouveaux composants, services, handlers)
- Props des composants (types TypeScript)
- Utilisation de React Query (`useMutation`, `useQuery` directement)
- **Pas de hooks personnalisés** sauf si réutilisables à plusieurs endroits

#### 4. Style de Code
- **Conventions TypeScript** : PascalCase (composants), camelCase (fonctions)
- **Pas de commentaires** : utiliser des noms explicites et extraire des méthodes
- **Extraction de méthodes** : clarifier le code par décomposition
- **Gestion d'état** : `useState` (local), `useMutation`/`useQuery` (serveur)

#### 5. Stratégie de Tests
- **Tests E2E (Playwright)** : flux utilisateur complet
- **Tests unitaires (Vitest)** : validation métier du domaine (si nécessaire)
- **Tests d'API** : validation des entrées, gestion des erreurs (si nécessaire)
- **Priorité** : E2E couvrant le flux principal > tests unitaires/API

**Convention de sélecteurs Playwright** :
- ✅ Sélecteurs accessibles : `getByRole`, `getByLabel`, `getByText`
- ❌ Sélecteurs CSS : `.class`, `#id`, `[data-testid]`

#### 6. Boundaries (Limites et Règles)

**Always Do (Toujours Faire)** :
- Valider côté client ET serveur
- Vérifier les invariants métier dans le domaine
- Utiliser des sélecteurs accessibles dans les tests
- Extraire des méthodes plutôt que commenter
- Tester le flux complet en E2E

**Ask First (Demander Avant)** :
- Ajouter de nouvelles dépendances
- Modifier le schéma de base de données au-delà du scope
- Ajouter des fonctionnalités hors scope (feature creep)
- Changer l'architecture existante (pattern différent)

**Never Do (Ne Jamais Faire)** :
- Autoriser HTML/scripts dans les inputs utilisateur (XSS)
- Skip les tests E2E pour "aller plus vite"
- Utiliser des sélecteurs CSS dans Playwright
- Sauvegarder automatiquement sans action explicite utilisateur
- Ajouter des hooks personnalisés React sans justification

#### 7. Critères d'Acceptation

Liste **vérifiable** de conditions pour considérer la feature terminée :
- ✅ L'utilisateur peut faire X
- ✅ Les validations Y sont en place
- ✅ Les tests E2E passent
- ✅ L'architecture respecte le pattern Z
- ✅ Les endpoints suivent les conventions REST

#### 8. Étapes d'Implémentation

**Organisation par phases** :
1. **Phase Domaine** : agrégats, validation métier, erreurs domaine
2. **Phase Services** : refactoring/création de services applicatifs
3. **Phase API** : routes, command handlers, validation Zod
4. **Phase Frontend** : composants React, appels API
5. **Phase Tests** : mise à jour des tests E2E
6. **Phase Conservation** : rétrocompatibilité (si nécessaire)

**Chaque phase inclut** :
- Actions concrètes (créer X, modifier Y)
- Fichiers impactés
- Ordre de dépendance

#### 9. Risques et Mitigations

Identifier les **risques techniques et métier** :

| Risque | Impact | Mitigation |
|--------|--------|------------|
| PWA installées cassées | Utilisateurs ne peuvent plus accéder | Conserver l'ancien endpoint |
| Génération sans scénario | Erreur utilisateur | Validation métier dans le handler |
| Validation client contournée | Données invalides en base | Triple validation (HTML + Zod + Domaine) |

---

## Phase 2 : Plan — Planification Technique

Avec la spécification validée, générer un plan d'implémentation :

1. **Identifier les composants majeurs** et leurs dépendances
2. **Déterminer l'ordre d'implémentation** (ce qui doit être construit en premier)
3. **Noter les risques** et les stratégies de mitigation
4. **Identifier le parallélisme** : ce qui peut être fait en parallèle vs séquentiel
5. **Définir les checkpoints de vérification** entre les phases

**Le plan doit être reviewable** : l'utilisateur doit pouvoir dire "oui, c'est la bonne approche" ou "non, change X".

---

## Phase 3 : Tasks — Découpage en Tâches

Découper le plan en **tâches implémentables** :

- Chaque tâche est **complétable en une session** de travail
- Chaque tâche a des **critères d'acceptation explicites**
- Chaque tâche inclut une **étape de vérification** (test, build, check manuel)
- Les tâches sont **ordonnées par dépendance** (pas par importance)
- Une tâche ne modifie **pas plus de ~5 fichiers**

**Template de tâche** :
```markdown
- [ ] Tâche : [Description]
  - Acceptation : [Ce qui doit être vrai quand c'est terminé]
  - Vérification : [Comment confirmer — commande de test, build, check manuel]
  - Fichiers : [Fichiers impactés]
```

---

## Principes de Cadrage

### YAGNI (You Aren't Gonna Need It)
- **Proposer le minimum** pour implémenter la fonctionnalité
- **Pas de feature creep** : rester concentré sur le besoin immédiat
- **Pas d'abstraction prématurée** : trois duplications avant d'abstraire
- **Pas de sur-ingénierie** : ne pas anticiper des besoins hypothétiques

**Exemple** :
```
❌ Ajouter un système de versioning des scènes "au cas où"
✅ Écraser la description directement (besoin actuel)

❌ Créer un hook personnalisé useSceneEditor pour un seul usage
✅ Utiliser useMutation directement dans le composant
```

### DDD Tactique — Agrégats et Invariants

### Conventions REST
- **Nommage des endpoints** : ressources (noms) + actions (verbes HTTP)
- **Verbes HTTP sémantiques** : GET (lecture), POST (création/action), PATCH (modification partielle), DELETE (suppression)
- **Codes HTTP appropriés** : 200 (OK), 202 (Accepted), 400 (Bad Request), 409 (Conflict)
- **Actions dans l'URL** : utiliser des noms (ex: `/scenario-generation`, pas `/generate-scenario`)

### Validation en Couches
- **Validation HTML native** : `minLength`, `maxLength`, `required` sur les inputs
- **Validation Zod (API)** : schéma de validation côté serveur
- **Validation Domaine** : règles métier dans l'agrégat root

### Conventions d'Écriture

- **Langage clair et sans ambiguïté** : éviter les termes vagues ("améliorer", "optimiser")
- **Exemples concrets** : code snippets, JSON samples, schémas TypeScript
- **Valeurs numériques précises** : timeouts (10s, pas "quelques secondes"), limites (10-500 caractères)
- **Pas de jargon inutile** : expliquer les termes techniques si nécessaire

---

## Template de Spécification

```markdown
# Spécification Technique : [Nom de la Fonctionnalité]

## 1. Objectif
- **Quoi** : [Description de la fonctionnalité]
- **Pourquoi** : [Problème métier résolu]
- **Pour qui** : [Utilisateurs cibles]
- **Valeur ajoutée** : [Bénéfices concrets]

## 2. Flux Utilisateur
### 2.1 Positionnement dans le Parcours
**Flux actuel** : [Étapes actuelles]
**Nouveau flux** : [Étapes avec la nouvelle fonctionnalité]

### 2.2 États
- État 1 : [Description]
- État 2 : [Description]

### 2.3 Règles Métier
- **Contraintes de timing** : [Quand c'est possible/impossible]
- **Contraintes de validation** : [Règles de validation]
- **Contraintes de persistance** : [Comment les données sont sauvegardées]

## 3. Architecture et Structure
### 3.1 Agrégats (DDD Tactique)
- **Agrégat Root** : [Entité principale]
- **Entités enfants** : [Entités appartenant à l'agrégat]
- **Invariants métier** : [Règles contrôlées par l'agrégat root]

### 3.2 Modification du Schéma de Données
- **Migrations** : [Nouvelles colonnes/tables]
- **Statuts** : [Nouveaux statuts si nécessaire]

### 3.3 API Routes
- **Endpoints** : [Liste des endpoints avec méthodes HTTP]
- **Architecture** : API → Command Handler → Agrégat → Repository
- **Réponses** : [Codes HTTP et formats de réponse]

### 3.4 Composants React
- **Structure de fichiers** : [Arborescence]
- **Composants** : [Liste des composants avec props]
- **État** : [useMutation, useQuery, useState]

## 4. Style de Code
- **Conventions TypeScript** : [Nommage, types]
- **Pas de commentaires** : [Extraction de méthodes]
- **Gestion d'état** : [useState, useMutation, useQuery]

## 5. Stratégie de Tests
- **Tests E2E (Playwright)** : [Fichiers de test, scénarios]
- **Tests unitaires (Vitest)** : [Si nécessaire]
- **Conventions de sélecteurs** : [getByRole, getByLabel, getByText]

## 6. Boundaries (Limites et Règles)
### Always Do
- [Liste des règles toujours applicables]

### Ask First
- [Liste des actions nécessitant approbation]

### Never Do
- [Liste des interdictions]

## 7. Critères d'Acceptation
- ✅ [Critère 1]
- ✅ [Critère 2]
- ✅ [Critère 3]

## 8. Étapes d'Implémentation
### Phase 1 : [Nom]
1. [Action 1]
2. [Action 2]

### Phase 2 : [Nom]
3. [Action 3]
4. [Action 4]

## 9. Risques et Mitigations
| Risque | Impact | Mitigation |
|--------|--------|------------|
| [Risque 1] | [Impact] | [Mitigation] |
| [Risque 2] | [Impact] | [Mitigation] |

## 10. Questions Ouvertes
- [ ] [Question 1]
- [ ] [Question 2]
```

---

## Garder la Spec Vivante

La spécification est un **document vivant**, pas un artefact ponctuel :

- **Mettre à jour quand les décisions changent** : si le modèle de données change, mettre à jour la spec d'abord
- **Mettre à jour quand le scope change** : fonctionnalités ajoutées ou retirées doivent être reflétées
- **Committer la spec** : la spec fait partie du version control avec le code
- **Référencer la spec dans les PRs** : lier chaque PR à la section de la spec qu'elle implémente

---

## Red Flags (Signaux d'Alerte)

- Commencer à coder sans aucune exigence écrite
- Demander "devrais-je juste commencer à construire ?" sans clarifier ce que "terminé" signifie
- Implémenter des fonctionnalités non mentionnées dans la spec
- Prendre des décisions architecturales sans les documenter
- Skip la spec parce que "c'est évident ce qu'il faut construire"

---

## Rationalisations Communes

| Rationalisation | Réalité |
|---|---|
| "C'est simple, pas besoin de spec" | Les tâches simples ne nécessitent pas de *longues* specs, mais elles ont besoin de critères d'acceptation. Une spec de 2 lignes suffit. |
| "J'écrirai la spec après avoir codé" | C'est de la documentation, pas une spécification. La valeur de la spec est de forcer la clarté *avant* le code. |
| "La spec va nous ralentir" | 15 minutes de spec évitent des heures de rework. Waterfall en 15 minutes bat debugging en 15 heures. |
| "Les exigences vont changer de toute façon" | C'est pourquoi la spec est un document vivant. Une spec obsolète vaut mieux que pas de spec. |
| "L'utilisateur sait ce qu'il veut" | Même les demandes claires ont des hypothèses implicites. La spec fait ressortir ces hypothèses. |

---

## Checklist de Validation

Avant de passer à l'implémentation :

- [ ] La spec couvre les 9 sections principales
- [ ] Les hypothèses sont explicitement listées et validées
- [ ] L'utilisateur a reviewé et approuvé la spec
- [ ] Les critères d'acceptation sont spécifiques et testables
- [ ] Les boundaries (Always/Ask First/Never) sont définies
- [ ] Les agrégats DDD sont identifiés (root + entités)
- [ ] Les endpoints suivent les conventions REST
- [ ] YAGNI est respecté (pas de sur-ingénierie)
- [ ] La spec est sauvegardée dans `docs/technical/SPEC-[nom].md`

---

## Outils et Ressources

### Pour l'exploration
- `read_file` : Lire les fichiers de code et documentation
- `search_files` : Rechercher des patterns spécifiques
- `list_files` : Explorer la structure du projet

### Pour la validation technique
- `execute_command` : Tester des APIs, outils CLI
- Documentation en ligne des services tiers
- Exemples de code et tutoriels

### Pour la collaboration
- Poser des questions ciblées une par une
- Proposer des options multiples
- Itérer sur les réponses

---

## Conclusion

Cette méthodologie vise à produire des spécifications techniques de qualité de manière collaborative et structurée. L'objectif est d'équilibrer :

- **Rigueur** : Couvrir tous les aspects importants
- **Pragmatisme** : Ne pas sur-spécifier, rester actionable (YAGNI)
- **Collaboration** : Impliquer l'utilisateur dans les décisions
- **Clarté** : Produire une documentation compréhensible et non ambiguë

**Principe directeur** : Les meilleures specs sont celles qui permettent de développer la fonctionnalité avec confiance, tout en évitant la sur-ingénierie et en respectant les principes DDD tactiques.