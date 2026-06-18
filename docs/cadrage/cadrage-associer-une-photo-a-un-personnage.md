# Cadrage : Associer une photo à un personnage

## Contexte

Dans le cadre de l'amélioration de l'application de création de livres d'histoires personnalisés, nous souhaitons permettre aux utilisateurs d'associer des photos de référence à leurs personnages. 
Ces photos serviront de base visuelle pour la génération d'images par IA.

## Objectifs

- Permettre une personnalisation visuelle des personnages
- Assurer la cohérence des apparences des personnages à travers toutes les scènes
- Améliorer la qualité et la pertinence des images générées

## Décisions architecturales

### 1. Upload des photos
**Décision** : Upload séparé après la création du personnage via un nouvel endpoint  
**Raison** : Séparation des responsabilités, permet de créer le personnage d'abord puis d'ajouter/modifier la photo indépendamment

### 2. Stockage des photos
**Décision** : Utiliser le même système de storage S3/MinIO que pour les images générées  
**Raison** : Réutiliser l'infrastructure existante, cohérence du système de stockage

### 3. Utilisation par le modèle Flux
**Décision** : Passer des URLs publiques des photos au modèle Replicate et utiliser le modèle `black-forest-labs/flux-2-klein-4b` sur Replicate pour la génération d'images
**Contrainte technique** : Maximum 5 images de référence supportées par le modèle (limite respectée car maximum 5 personnages par histoire)
**Format supporté** : JPEG, PNG, GIF, WEBP

### 4. Gestion des personnages par scène
**Décision** : Inclure TOUTES les photos de tous les personnages dans TOUTES les scènes (v1)  
**Raison** :
- Simplicité d'implémentation
- Cohérence visuelle maximale entre les scènes
- Respect de la limite technique (maximum 5 personnages par histoire, donc maximum 5 photos)
- Évolution future possible : détection intelligente des personnages par scène

### 5. Méthode d'upload
**Décision** : Upload direct vers S3/MinIO via URL pré-signée  
**Raison** :
- Réduit la charge sur le backend (pas de transit par le serveur)
- Améliore les performances d'upload pour les fichiers volumineux
- Meilleure scalabilité
- Pattern standard pour les uploads de fichiers dans le cloud
- La base de données est mise à jour immédiatement lors de la génération de l'URL pour simplifier le flow

---

## Spécifications fonctionnelles

### Flow utilisateur mis à jour

1. L'utilisateur renseigne le nom de son histoire et fournit une description
2. L'utilisateur ajoute un personnage avec un nom et une description
3. L'utilisateur ajoute un deuxième personnage avec un nom et une description
4. **[NOUVEAU]** L'utilisateur peut uploader une photo de référence pour chaque personnage
5. L'utilisateur clique sur générer une histoire
6. L'IA génère l'histoire
   - Un modèle de génération de texte génère un scénario en 4 parties
   - Un modèle de génération d'images (Flux Klein) génère des images basées sur ces personnages, leurs photos de référence et les scénarios générés
7. Les images générées s'affichent dans l'application

---

## Spécifications techniques

### 1. API REST

#### Obtenir une URL pré-signée pour upload d'une photo
```
POST /api/characters/{characterId}/photo/upload-url
Content-Type: application/json

Body:
{
  "contentType": "string"  // image/jpeg, image/png, image/gif, ou image/webp
}

Response 200:
{
  "uploadUrl": "string",      // URL pré-signée pour PUT direct vers S3/MinIO
  "photoUrl": "string",       // URL publique de la photo (pour affichage futur)
  "storageKey": "string",     // Clé de stockage générée
  "expiresIn": number         // Durée de validité en secondes (ex: 900 pour 15 min)
}

Response 404:
{
  "error": "Character not found"
}

Response 400:
{
  "error": "Invalid content type"
}
```

**Note** : La base de données est mise à jour immédiatement avec le `storageKey`. Le client doit ensuite uploader le fichier via l'`uploadUrl` en faisant un `PUT` avec le header `Content-Type` correspondant.

#### Suppression d'une photo de personnage
```
DELETE /api/characters/{characterId}/photo

Response 204: No content

Response 404:
{
  "error": "Character not found"
}
```

#### Récupération d'un personnage avec sa photo
```
GET /api/stories/{storyId}/characters/{characterId}

Response 200:
{
  "id": "string",
  "name": "string",
  "description": "string",
  "photo": {
    "url": "string",
    "storageBucket": "string",
    "storageKey": "string"
  } | null
}
```

### 2. Modifications du schéma de base de données

```typescript
export interface CharactersTable {
  id: string;
  story_id: string;
  name: string;
  description: string;
  photo_storage_bucket: string | null;  // NOUVEAU
  photo_storage_key: string | null;     // NOUVEAU
}
```

**Migration SQL** :
```sql
ALTER TABLE characters 
ADD COLUMN photo_storage_bucket VARCHAR(255),
ADD COLUMN photo_storage_key VARCHAR(512);
```

### 3. Validation des fichiers

- **Types MIME acceptés** : `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **Validation** : Vérification côté client du type MIME et de la taille avant la demande d'URL pré-signée
- **Taille maximale** : 5 MB
- **Organisation du stockage** : `characters/{characterId}/reference-photo.{ext}`

### 4. Intégration avec Flux 2 Klein

#### Paramètres du modèle Replicate

```typescript
interface FluxKleinInput {
  prompt: string;                    // Description de la scène
  images: string[];                  // URLs publiques des photos de référence (max 5)
  aspect_ratio?: string;             // "1:1", "16:9", etc.
  output_megapixels?: string;        // "0.25", "0.5", "1", "2", "4"
  output_format?: "webp" | "jpg" | "png";
  output_quality?: number;           // 0-100
  seed?: number;                     // Pour la reproductibilité
  go_fast?: boolean;                 // Optimisations supplémentaires
  disable_safety_checker?: boolean;
}
```

#### Flux de génération

1. **Récupération des données**
   - Charger tous les personnages de l'histoire
   - Pour chaque personnage ayant une photo, générer une URL publique (signed URL si nécessaire)
   - Construire le tableau d'URLs de référence

2. **Génération de chaque scène**
   - Obtenir la description textuelle de la scène depuis l'IA de génération de texte
   - Construire le prompt enrichi pour Flux Klein
   - Appeler l'API Replicate avec :
     - `prompt` : Description de la scène + style artistique
     - `images` : Toutes les URLs des photos de référence
   - Récupérer l'image générée et la stocker dans S3/MinIO

3. **Gestion des erreurs**
   - Si une URL de photo est invalide : logger l'erreur et continuer sans cette photo
   - Si aucune photo disponible : générer sans références (comportement actuel)

### 5. Command Handler : Get Photo Upload URL

```typescript
interface GetPhotoUploadUrlCommand {
  characterId: string;
  contentType: string;
}

class GetPhotoUploadUrlCommandHandler {
  async execute(command: GetPhotoUploadUrlCommand): Promise<{
    uploadUrl: string;
    photoUrl: string;
    storageKey: string;
    expiresIn: number;
  }> {
    // 1. Vérifier que le personnage existe
    // 2. Valider le contentType (doit être image/jpeg, image/png, image/gif ou image/webp)
    // 3. Supprimer l'ancienne photo du S3 si elle existe
    // 4. Générer un storageKey unique : characters/{characterId}/reference-photo.{ext}
    // 5. Générer une URL pré-signée pour PUT avec durée de validité (15 minutes)
    // 6. Générer l'URL publique de la photo
    // 7. Mettre à jour la base de données avec le storageKey
    // 8. Retourner uploadUrl, photoUrl, storageKey et expiresIn
  }
}
```

### 6. Modifications du générateur d'images

**Fichier** : `webapp/src/lib/scene-image-generator/replicate-flux-klein-generator.ts`

```typescript
export class ReplicateFluxKleinGenerator implements SceneImageGenerator {
  readonly name = 'replicate-flux-klein';
  
  async generateImage(options: ImageGenerationOptions & {
    referenceImageUrls?: string[];  // NOUVEAU
  }): Promise<ImageGenerationResult> {
    const input = {
      prompt: options.prompt,
      images: options.referenceImageUrls || [],  // Photos de référence
      aspect_ratio: options.aspectRatio || '1:1',
      output_megapixels: '1',
      output_format: 'jpg',
      go_fast: true,
      // ... autres paramètres
    };
    
    // Appel à l'API Replicate
    // ...
  }
}
```

---

## Sécurité et considérations

### Sécurité
- **Validation stricte des types MIME** : Éviter les uploads de fichiers malveillants
- **URLs signées** : Utiliser des signed URLs pour les photos de référence si sensibilité des données
- **Quotas** : Limiter le nombre d'uploads par utilisateur/période

### Nettoyage des données
- **Suppression de personnage** : Supprimer automatiquement la photo associée
- **Suppression d'histoire** : Supprimer tous les personnages et leurs photos
- **Photos orphelines** : Script de nettoyage périodique

---

## Plan de déploiement

### Phase 1 : Préparation 
- [ ] Créer la migration de base de données
- [ ] Ajouter les champs `photo_storage_bucket` et `photo_storage_key` à la table `characters`
- [ ] Déployer la migration en local

### Phase 2 : Backend 
- [ ] Implémenter `GetPhotoUploadUrlCommandHandler`
- [ ] Créer l'endpoint `POST /api/characters/{characterId}/photo/upload-url`
- [ ] Créer l'endpoint `DELETE /api/characters/{characterId}/photo`
- [ ] Modifier l'endpoint `GET /api/stories/{id}/characters/{characterId}` pour inclure la photo
- [ ] Implémenter `ReplicateFluxKleinGenerator`
- [ ] Modifier `StoryGeneratorService` pour passer les photos de référence
- [ ] Tests unitaires et d'intégration

### Phase 3 : Frontend
- [ ] Ajouter composant d'upload de photo dans le formulaire de personnage
- [ ] Implémenter le flux d'upload avec URL pré-signée :
  - Validation côté client (type MIME, taille 5MB max)
  - Demande d'URL pré-signée au backend
  - Upload direct vers S3/MinIO via PUT
  - Gestion des erreurs d'upload
- [ ] Afficher la photo de référence dans la liste/détails des personnages
- [ ] Permettre la suppression/remplacement de la photo
- [ ] Afficher un placeholder si pas de photo
- [ ] Tests E2E

### Phase 4 : Tests et déploiement 
- [ ] Tests de charge (upload de fichiers volumineux)
- [ ] Tests de sécurité (validation des types de fichiers)
- [ ] Tests avec différents formats d'images
- [ ] Tests de génération avec/sans photos
- [ ] Déploiement en staging
- [ ] Validation utilisateur beta
- [ ] Déploiement en production

---

## Décisions prises

1. **Taille maximale** : 5 MB
2. **URLs pré-signées** : Utilisation d'URLs pré-signées pour l'upload direct vers S3/MinIO depuis le client
3. **Compression automatique** : Non, pas de redimensionnement/compression automatique en v1
4. **Multiple photos** : Non, une seule photo par personnage en v1
5. **Watermarking** : Non, pas de watermark sur les photos uploadées

---

## Références

- [Replicate Flux 2 Klein Documentation](https://replicate.com/black-forest-labs/flux-2-klein-4b)
- [Architecture actuelle](../SPECS.md)
- [Replicate API Documentation](https://replicate.com/docs)
