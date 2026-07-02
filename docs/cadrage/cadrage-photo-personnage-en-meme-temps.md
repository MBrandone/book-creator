# Cadrage : Associer une photo au personnage lors de sa création

## Contexte

Actuellement, la fonctionnalité d'association d'une photo à un personnage se fait en deux étapes distinctes :
1. Création du personnage (nom + description)
2. Upload de la photo via un endpoint séparé nécessitant l'ID du personnage déjà créé

Cette approche nécessite deux formulaires distincts et dégrade l'expérience utilisateur. L'objectif est de permettre à l'utilisateur de renseigner toutes les informations du personnage (nom, description, photo) dans un seul formulaire, en une seule soumission.

## Objectifs

- Simplifier le parcours utilisateur en permettant l'ajout de photo dans le même formulaire de création de personnage
- Maintenir la photo comme optionnelle
- Utiliser l'upload direct vers S3 via URL pré-signée pour optimiser les performances
- Garantir la sécurité du stockage S3 contre les abus

## Décisions architecturales

### 1. Remplacement de l'endpoint d'URL pré-signée

**Décision** : Supprimer l'endpoint existant `POST /api/characters/{characterId}/photo/upload-url` et le remplacer par un nouvel endpoint `POST /api/characters/photo/upload-url` (sans characterId) qui génère une URL pré-signée avec une clé aléatoire

**Raison** : 
- L'ancien endpoint nécessite un personnage existant, ce qui ne correspond plus au nouveau flux
- Un endpoint sans ID permet d'uploader la photo avant la création du personnage
- Simplification de l'architecture en ayant un seul endpoint pour générer les URLs pré-signées

**Contraintes** : 
- Génération de clé via UUID : `character-photos/{uuid}.{extension}`
- Réutilisation du command handler `GetPhotoUploadUrlCommandHandler` existant en supprimant les vérifications sur l'existence du personnage

### 2. Structure des données photo dans l'API de création

**Décision** : Ajouter un champ optionnel `photo` dans le schema de création de personnage contenant `storageKey` et `storageBucket`

**Raison** : 
- Regroupe logiquement les informations de stockage
- Extensible pour ajouter des metadata futures
- Explicite et type-safe

### 3. Gestion des photos orphelines

**Décision** : V1 - Accepter les photos orphelines (photos uploadées mais jamais associées à un personnage)

**Raison** : Simplicité d'implémentation initiale, les photos orphelines seront rares

**Évolution future** : Script de nettoyage périodique pour supprimer les photos du dossier `character-photos/` non référencées en base après 24h

### 4. Sécurité du stockage S3

**Décision** : Implémenter plusieurs mesures de protection :
- Rate limiting sur l'endpoint de génération d'URL pré-signée : **5 requêtes par minute par IP**
- Expiration courte des URLs pré-signées : **5 minutes (300 secondes)**
- Validation stricte des content-types
- Limitation de taille (5 MB max)

**Raison** : Empêcher l'abus du système par des uploads massifs non autorisés

**Contraintes** : 
- Les URLs pré-signées ne peuvent être utilisées qu'une seule fois pour PUT
- Le dossier `character-photos/` est réservé aux photos non encore associées
- Après 5 requêtes en 1 minute, l'utilisateur reçoit une erreur 429 (Too Many Requests)

---

## Spécifications fonctionnelles

### Flow utilisateur mis à jour

1. L'utilisateur renseigne le nom de son histoire et fournit une description
2. L'utilisateur ajoute un personnage dans un **formulaire unique** contenant :
   - Nom du personnage
   - Description du personnage
   - **[NOUVEAU]** Photo de référence (optionnelle via l'input existant dans le même formulaire)
3. **[NOUVEAU - Si photo sélectionnée]** :
   - Le frontend demande automatiquement une URL pré-signée au nouvel endpoint
   - Le frontend upload la photo vers S3
   - Le frontend garde en mémoire le storageKey et storageBucket
4. **[NOUVEAU]** Lors de la soumission du formulaire :
   - Le frontend envoie nom + description + infos de photo (si uploadée) en une seule requête
   - Le backend crée le personnage avec toutes ses données
5. L'utilisateur ajoute d'autres personnages avec le même flux
6. L'utilisateur clique sur générer une histoire
7. L'IA génère l'histoire avec les photos de référence des personnages

### Cas de test (BDD - Behaviour Driven Development)

#### Scénario 1 : Création d'un personnage avec photo

```gherkin
Given l'utilisateur est sur la page de création d'histoire
And l'histoire a été créée avec succès
When l'utilisateur ouvre le formulaire d'ajout de personnage
And l'utilisateur saisit "Alice" comme nom
And l'utilisateur saisit "Une petite fille curieuse" comme description
And l'utilisateur sélectionne une photo JPEG de 2 MB
Then la photo est automatiquement uploadée vers S3
And un aperçu de la photo s'affiche dans le formulaire
When l'utilisateur soumet le formulaire
Then le personnage est créé avec la photo associée
And la photo est visible dans la liste des personnages
```

#### Scénario 2 : Création d'un personnage sans photo

```gherkin
Given l'utilisateur est sur la page de création d'histoire
And l'histoire a été créée avec succès
When l'utilisateur ouvre le formulaire d'ajout de personnage
And l'utilisateur saisit "Bob" comme nom
And l'utilisateur saisit "Un robot aventurier" comme description
And l'utilisateur ne sélectionne pas de photo
When l'utilisateur soumet le formulaire
Then le personnage est créé sans photo
And un placeholder est affiché dans la liste des personnages
```

#### Scénario 3 : Validation de la taille de fichier

```gherkin
Given l'utilisateur est sur le formulaire d'ajout de personnage
When l'utilisateur sélectionne une photo de 8 MB
Then un message d'erreur s'affiche : "La taille du fichier ne doit pas dépasser 5 MB"
And la photo n'est pas uploadée
And l'utilisateur peut sélectionner une autre photo
```

#### Scénario 4 : Validation du type de fichier

```gherkin
Given l'utilisateur est sur le formulaire d'ajout de personnage
When l'utilisateur sélectionne un fichier PDF
Then un message d'erreur s'affiche : "Format de fichier non supporté. Utilisez JPEG, PNG, GIF ou WEBP"
And le fichier n'est pas uploadé
```

#### Scénario 5 : Annulation après upload de photo

```gherkin
Given l'utilisateur a uploadé une photo dans le formulaire
And la photo est visible en aperçu
When l'utilisateur clique sur "Annuler" dans le formulaire
Then le formulaire se ferme
And la photo reste stockée dans S3 (photo orpheline)
And aucun personnage n'est créé
```

#### Scénario 6 : Remplacement de photo avant soumission

```gherkin
Given l'utilisateur a uploadé une première photo
And la photo est visible en aperçu
When l'utilisateur clique sur "Remplacer"
And l'utilisateur sélectionne une nouvelle photo
Then la nouvelle photo est uploadée vers S3
And l'aperçu affiche la nouvelle photo
And l'ancienne photo reste dans S3 (photo orpheline)
When l'utilisateur soumet le formulaire
Then le personnage est créé avec la nouvelle photo uniquement
```

#### Scénario 7 : Gestion des erreurs d'upload S3

```gherkin
Given l'utilisateur a sélectionné une photo valide
When l'upload vers S3 échoue (timeout réseau)
Then un message d'erreur s'affiche : "Erreur lors de l'upload de la photo"
And l'utilisateur peut réessayer
And le formulaire reste rempli avec les autres données
```

#### Scénario 8 : Rate limiting de l'endpoint

```gherkin
Given un utilisateur malveillant tente d'abuser du système
When l'utilisateur fait plus de 5 requêtes d'URL pré-signée en 1 minute
Then les requêtes suivantes retournent une erreur 429 (Too Many Requests)
And un message indique "Trop de requêtes, veuillez réessayer dans quelques instants"
```

---

## Spécifications techniques

### 1. API REST

#### Nouvel endpoint : Obtenir une URL pré-signée sans personnage existant

**Endpoint** : `POST /api/characters/photo/upload-url`

**Payload** :
```json
{
  "contentType": "image/jpeg" | "image/png" | "image/gif" | "image/webp"
}
```

**Réponse 200** :
```json
{
  "uploadUrl": "string",
  "storageKey": "string",
  "storageBucket": "string",
  "expiresIn": 300
}
```

**Réponse 400** :
```json
{
  "error": "Validation échouée",
  "details": [
    {
      "path": "contentType",
      "message": "Le type de contenu doit être image/jpeg, image/png, image/gif ou image/webp"
    }
  ]
}
```

**Réponse 429** :
```json
{
  "error": "Too many requests"
}
```

**Notes** : 
- Le storageKey généré suit le pattern `character-photos/{uuid}.{extension}`
- Rate limiting : maximum 5 requêtes par minute par IP
- Expiration de l'URL : 5 minutes (300 secondes)

#### Modification : Création de personnages avec photo optionnelle

**Endpoint** : `POST /api/stories/{storyId}/characters`

**Payload** :
```json
{
  "characters": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "photo": {
        "storageKey": "string",
        "storageBucket": "string"
      } | null
    }
  ]
}
```

**Réponse 201** : No content

**Réponse 400** :
```json
{
  "error": "Validation échouée",
  "details": [...]
}
```

**Validation** :
- Si `photo` est fourni, `storageKey` et `storageBucket` sont requis
- `storageKey` doit matcher le pattern `^character-photos\/[a-f0-9-]+\.(jpg|png|gif|webp)$`
- `storageBucket` doit être une chaîne non vide

### 2. Modifications du schéma de base de données

Aucune modification nécessaire. Les champs `photo_storage_bucket` et `photo_storage_key` existent déjà dans la table `characters`.

### 3. Command Handler : GetPhotoUploadUrlCommandHandler

**Fichier** : `webapp/src/lib/application/handlers/command/get-photo-upload-url/get-photo-upload-url-command-handler.ts`

**Modifications** :
- Supprimer la vérification de l'existence du personnage (`characterRepository.existsById`)
- Supprimer la dépendance à `CharacterRepository`
- Supprimer la dépendance à `CharacterPhotoRepository`
- Supprimer l'appel à `characterPhotoRepository.updatePhoto`
- Générer le storageKey avec un UUID aléatoire : `character-photos/{uuid}.{extension}`
- Conserver la validation du contentType
- Conserver la génération de l'URL pré-signée
- Modifier l'expiration à 300 secondes (5 minutes)

**Interface de commande** :
```typescript
interface GetPhotoUploadUrlCommand {
  contentType: string;
}

interface GetPhotoUploadUrlResult {
  uploadUrl: string;
  storageKey: string;
  storageBucket: string;
  expiresIn: number;
}
```

### 4. Route API

**Fichier** : `webapp/src/app/api/characters/photo/upload-url/route.ts`

**Modifications** :
- Supprimer la route existante avec `{characterId}` dans le path
- Créer le nouveau fichier dans `webapp/src/app/api/characters/photo/upload-url/route.ts`
- Implémenter le rate limiting (5 requêtes/minute par IP)
- Valider le contentType via Zod
- Instancier le command handler sans les repositories
- Retourner 429 si rate limit dépassé

**Rate limiting** :
- Utiliser une Map en mémoire : `Map<string, { count: number; resetTime: number }>`
- Clé : adresse IP (extraite des headers `x-forwarded-for` ou `x-real-ip`)
- Limite : 5 requêtes par fenêtre de 60 secondes
- Réinitialisation automatique après 60 secondes

### 5. Modifications du Command Handler de création de personnage

**Fichier** : `webapp/src/lib/application/handlers/command/create-a-character-for-story/create-a-character-for-story-command-handler.ts`

**Modifications** :
- Ajouter un champ optionnel `photo` dans `CreateCharacterCommand`
- Passer `photoStorageBucket` et `photoStorageKey` à `Character.create()`

**Type de commande mis à jour** :
```typescript
type CreateCharacterCommand = {
  id: string;
  name: string;
  description: string;
  photo?: {
    storageKey: string;
    storageBucket: string;
  } | null;
};
```

### 6. Modifications du domaine Character

**Fichier** : `webapp/src/lib/domain/character.ts`

Aucune modification nécessaire. Les champs `photoStorageBucket` et `photoStorageKey` existent déjà.

### 7. Frontend : Intégration dans le formulaire existant

**Fichier** : Composant de formulaire de création de personnage (à déterminer selon l'architecture frontend actuelle)

**Modifications** :
- Intégrer le composant `CharacterPhotoUpload` existant dans le formulaire unique
- Adapter le composant pour ne plus nécessiter de `characterId`
- Modifier l'URL de requête vers `/api/characters/photo/upload-url` (sans characterId)
- Stocker le `storageKey` et `storageBucket` dans le state du formulaire
- Lors de la soumission, inclure les données photo dans la requête de création
- Utiliser react-query pour toutes les requêtes asynchrones

**Flux utilisateur** :
1. L'utilisateur remplit nom et description
2. L'utilisateur sélectionne une photo (optionnel)
3. Si photo sélectionnée :
   - Requête automatique vers `/api/characters/photo/upload-url` (react-query)
   - Upload vers S3 via l'URL pré-signée (react-query)
   - Stockage du storageKey et storageBucket dans le state
4. L'utilisateur clique sur "Ajouter le personnage"
5. Requête vers `/api/stories/{storyId}/characters` avec toutes les données

---

## Sécurité et considérations

### Sécurité

**Rate limiting**
- Limite de 5 requêtes d'URL pré-signée par minute par IP
- Implémentation en mémoire (Map) pour la V1
- Évolution future : Redis pour un rate limiting distribué multi-instances

**Validation stricte**
- Content-type validé côté backend (liste blanche : JPEG, PNG, GIF, WEBP)
- Taille maximale de 5 MB validée côté frontend et S3 (via paramètres de l'URL pré-signée)
- Pattern du storageKey validé via regex pour éviter path traversal

**Expiration des URLs pré-signées**
- 5 minutes d'expiration (300 secondes)
- URLs à usage unique (PUT seulement)

**Quotas futurs (V2)**
- Limite du nombre de photos par utilisateur/session
- Monitoring des uploads pour détecter les abus
- Blacklist d'IPs abusives

### Performance

**Upload direct vers S3**
- Pas de transit par le backend
- Réduction de la charge serveur
- Meilleure expérience utilisateur pour les fichiers volumineux

**Gestion des photos orphelines**
- V1 : Acceptation des photos orphelines (impact minimal)
- V2 : Script de nettoyage périodique (cron job quotidien)
  - Récupérer toutes les clés du dossier `character-photos/`
  - Comparer avec les clés référencées en base
  - Supprimer les photos de plus de 24h non référencées

### Nettoyage des données

**Suppression d'ancien code**
- Supprimer l'endpoint `POST /api/characters/{characterId}/photo/upload-url`
- Supprimer l'endpoint `DELETE /api/characters/{characterId}/photo` (si existant)
- Supprimer les routes API associées
- Nettoyer les imports et dépendances inutilisés

**Photos orphelines**
- Script de nettoyage périodique (V2)

---

## Plan de déploiement

### Phase 1 : Backend - Modification du Command Handler
- [ ] Modifier `GetPhotoUploadUrlCommandHandler` pour supprimer les vérifications de personnage
- [ ] Supprimer les dépendances à `CharacterRepository` et `CharacterPhotoRepository`
- [ ] Modifier la génération du storageKey (UUID aléatoire)
- [ ] Modifier l'expiration à 300 secondes

### Phase 2 : Backend - Nouveau endpoint
- [ ] Supprimer l'ancien endpoint `POST /api/characters/{characterId}/photo/upload-url`
- [ ] Créer le nouvel endpoint `POST /api/characters/photo/upload-url`
- [ ] Implémenter le rate limiting (5 requêtes/minute)
- [ ] Tests d'intégration de l'endpoint
- [ ] Tests du rate limiting

### Phase 3 : Backend - Mise à jour de l'API de création
- [ ] Modifier le schema Zod de `POST /api/stories/{id}/characters` pour accepter le champ photo optionnel
- [ ] Ajouter la validation du storageKey (regex)
- [ ] Modifier la route API pour passer les données photo au command handler
- [ ] Modifier `CreateACharacterForStoryCommandHandler` pour accepter le champ photo
- [ ] Tests d'intégration avec et sans photo

### Phase 4 : Frontend - Modification du composant existant
- [ ] Adapter le composant `CharacterPhotoUpload` pour ne pas nécessiter de characterId
- [ ] Modifier l'URL de requête vers le nouvel endpoint
- [ ] Retourner le storageKey et storageBucket au parent
- [ ] Gérer l'affichage des erreurs de rate limiting

### Phase 5 : Frontend - Intégration dans le formulaire
- [ ] Intégrer le composant photo dans le formulaire unique de création de personnage
- [ ] Stocker les infos photo dans le state du formulaire
- [ ] Modifier la soumission pour inclure les données photo
- [ ] Gérer les états de chargement (upload photo + création personnage)
- [ ] Gérer les erreurs (upload, création, rate limiting)

### Phase 6 : Nettoyage et déploiement
- [ ] Supprimer l'ancien code et fichiers inutilisés
- [ ] Supprimer les imports et dépendances obsolètes
- [ ] Déploiement en staging
- [ ] Tests de sécurité (tentatives d'abus)
- [ ] Validation utilisateur beta
- [ ] Monitoring des uploads et photos orphelines
- [ ] Déploiement en production
- [ ] Documentation utilisateur

### Phase 8 : Améliorations futures (V2)
- [ ] Implémenter le script de nettoyage des photos orphelines
- [ ] Migrer le rate limiting vers Redis (si multi-instances)
- [ ] Ajouter des quotas par utilisateur authentifié
- [ ] Ajouter des métriques de monitoring (CloudWatch, Datadog, etc.)

---

## Métriques de succès

- **UX** : Réduction du nombre de clics nécessaires pour créer un personnage avec photo (de ~8 clics à ~4 clics)
- **Adoption** : Pourcentage de personnages créés avec photo (objectif : >40%)
- **Performance** : Temps moyen d'upload < 5 secondes pour une photo de 5 MB
- **Fiabilité** : Taux de succès d'upload > 95%
- **Sécurité** : Aucun abus détecté (uploads massifs, photos malveillantes)
- **Coût** : Photos orphelines < 5% du total des photos stockées

---

## Questions ouvertes / À décider

1. ~~Comment générer l'URL pré-signée sans personnage existant ?~~ → **Résolu** : Nouvel endpoint avec clé aléatoire
2. ~~Comment structurer les données de photo dans l'API ?~~ → **Résolu** : Objet `photo` optionnel
3. ~~Que faire des photos orphelines ?~~ → **Résolu** : Accepter en V1, nettoyer en V2
4. ~~Quelle limite de rate limiting ?~~ → **Résolu** : 5 requêtes/minute
5. ~~Quelle durée d'expiration des URLs ?~~ → **Résolu** : 5 minutes
6. Faut-il authentifier les utilisateurs pour limiter les abus ? → À décider selon les besoins futurs
7. Faut-il compresser automatiquement les photos ? → À décider selon les retours utilisateurs

---

## Références

- [Documentation précédente](./cadrage-associer-une-photo-a-un-personnage.md)
- [Méthodologie de rédaction de specs](../../webapp/.claude/skills/METHODOLOGIE-REDACTION-SPECS.md)
- [Spécifications fonctionnelles](../SPECS.md)
- [AWS S3 Pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [React Query Documentation](https://tanstack.com/query/latest)
