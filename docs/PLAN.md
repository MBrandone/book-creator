# 📋 Plan d'Implémentation - Book Creator MVP

## 📊 Vue d'Ensemble

Ce document détaille le plan d'implémentation complet du MVP (Minimum Viable Product) de Book Creator, de l'initialisation du projet jusqu'au déploiement.

**Durée estimée totale : 18-22 heures**

---

## 🎯 Phases d'Implémentation

### Phase 1 : Setup Initial & Infrastructure (3-4h)

#### 1.1 Initialisation du Projet Next.js
- [X] Créer le projet Next.js 14+ avec TypeScript
  ```bash
  npx create-next-app@latest book-creator --typescript --tailwind --app --src-dir
  ```
- [X] Configuration du projet :
  - App Router activé
  - TypeScript strict mode
  - ESLint + Prettier
  - Import aliases configurés (`@/`)

#### 1.2 Configuration Docker Compose
- [X] Créer `docker-compose.yml` avec :
  - Service PostgreSQL 16
  - Service MinIO (S3-compatible storage)
  - Volumes persistants
  - Network configuration
- [X] Créer script d'initialisation MinIO pour créer le bucket

#### 1.3 Variables d'Environnement
- [X] Créer `.env.example` avec tous les paramètres nécessaires
- [X] Créer `.env.local` pour développement
- [ ] Documenter chaque variable

#### 1.4 Configuration Tailwind CSS
- [X] Installer et configurer Tailwind CSS
- [X] Configuration des couleurs personnalisées
- [X] Configuration des breakpoints responsives
- [X] Installer shadcn/ui CLI
  ```bash
  npx shadcn-ui@latest init
  ```

### Phase 2 : Configuration Base de Données & Storage (3-4h)

#### 2.1 Setup Kysely
- [X] Installer Kysely et les dépendances
  ```bash
  npm install kysely pg
  npm install -D @types/pg
  ```
- [X] Créer `src/lib/db/index.ts` - Client Kysely
- [X] Créer `src/lib/db/schema.ts` - Types de la base de données

#### 2.2 Schéma de Base de Données
- [X] Définir le schéma des tables :
  
  **Table `stories`** :
  - `id` (UUID, PRIMARY KEY)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)
  - `status` (ENUM: 'pending', 'generating', 'completed', 'failed')
  
  **Table `characters`** :
  - `id` (UUID, PRIMARY KEY)
  - `story_id` (UUID, FOREIGN KEY)
  - `name` (VARCHAR)
  - `description` (TEXT)
  - `image_url` (VARCHAR)
  - `order` (INTEGER) - Pour l'ordre des personnages
  
  **Table `scenes`** :
  - `id` (UUID, PRIMARY KEY)
  - `story_id` (UUID, FOREIGN KEY)
  - `scene_number` (INTEGER) - 1, 2, 3, 4
  - `scene_type` (ENUM: 'introduction', 'conflict', 'action', 'resolution')
  - `description` (TEXT) - Description de la scène générée
  - `image_url` (VARCHAR) - URL de l'image générée
  - `prompt` (TEXT) - Prompt utilisé pour générer l'image

  **Table `uploaded_photos`** :
  - `id` (UUID, PRIMARY KEY)
  - `url` (VARCHAR)
  - `character_id` (UUID, FOREIGN KEY) 

  **Table `generated_images`** :
  - `id` (UUID, PRIMARY KEY)
  - `story_id` (UUID, FOREIGN KEY)
  - `scene_id` (UUID, FOREIGN KEY)
  - `url` (VARCHAR)


#### 2.3 Migrations
- [X] Créer système de migrations manuelles
- [X] Créer `migrations/001_initial_schema.sql`
- [X] Créer script `scripts/migrate.ts` pour exécuter les migrations
- [X] Ajouter npm script `db:migrate`

#### 2.4 Configuration MinIO
- [X] Créer `src/lib/storage/minio.ts` - Client MinIO
- [X] Implémenter fonctions :
  - `uploadImage(file, key)` - Upload une image
  - `getImageUrl(key)` - Récupérer URL d'une image
  - `deleteImage(key)` - Supprimer une image
- [X] Créer bucket automatiquement au démarrage si inexistant
- [X] Tester la connexion et l'upload

---

### Phase 3 : Services IA (4-5h)

#### 3.1 Service de Génération d'Histoire
- [X] Créer `src/lib/ai/story-generator.ts`
- [X] Créer `src/lib/ai/prompts.ts` - Templates de prompts
- [X] Implémenter interface générique pour les providers :
  ```typescript
  interface StoryGenerator {
    generateStory(characters: Character[]): Promise<Scene[]>
  }
  ```

#### 3.2 Provider Ollama (Local)
- [X] Créer `src/lib/providers/ollama.ts`
- [X] Implémenter client Ollama HTTP
- [X] Créer prompts pour générer les 4 scènes :
  - Prompt système : Contexte narratif
  - Prompt utilisateur : Descriptions des personnages
  - Format de réponse : JSON avec 4 scènes
- [X] Gérer les erreurs et timeouts

#### 3.3 Provider Hugging Face (Fallback)
- [ ] Créer `src/lib/providers/huggingface.ts`
- [ ] Implémenter client Hugging Face Inference API
- [ ] Utiliser modèles gratuits (ex: Mistral-7B)
- [ ] Même interface que Ollama

#### 3.4 Service de Génération d'Images
- [X] Créer `src/lib/ai/image-generator.ts`
- [X] Implémenter interface générique :
  ```typescript
  interface ImageGenerator {
    generateImage(prompt: string, seed?: number): Promise<string>
  }
  ```

#### 3.5 Provider Replicate (SDXL)
- [X] Créer `src/lib/providers/replicate.ts`
- [X] Installer SDK Replicate
  ```bash
  npm install replicate
  ```
- [X] Implémenter génération d'image avec SDXL
- [X] Paramètres optimisés :
  - Modèle : `stability-ai/sdxl`
  - Style : Children's book illustration
  - Aspect ratio : 1:1 ou 16:9
  - Steps : 25-30 pour qualité/vitesse
- [X] Gérer le polling pour attendre la génération
- [X] Télécharger l'image et uploader sur MinIO

#### 3.6 Prompts Engineering
- [X] Créer prompts optimisés pour chaque scène
- [X] Inclure style cohérent (ex: "watercolor children's book illustration")
- [X] Intégrer descriptions des personnages
- [X] Tester et affiner les prompts

---

### Phase 4 : API Routes Backend (3-4h)

#### 4.1 Route Création d'Histoire
- [X] Créer `src/app/api/stories/route.ts`
- [X] Endpoint POST pour créer une nouvelle histoire
- [X] Valider les données :
  - uuid crée côté client
  - Titre de l'histoire (colonne à rajouter dans la table)
  - Description minimum 10 caractères
- [X] Insérer dans la base de données
- [X] Retourner l'ID de l'histoire créée

#### 4.2 Route Création des personnages de l'histoire
- [X] Créer `src/app/api/stories/{id}/characters/route.ts`
- [X] Endpoint POST pour créer deux nouveaux personnages
- [X] Valider les données entrée :
  - Le name a minimum 3 caractères
  - La description fait au minimum 10 caractères
  - L'id dans l'url est un uuid valide
- [X] Validation après :
  - Le story id doit bien exister sinon on renvoie 400
  - Il peut y avoir maximum deux personnages par histoire, donc si l'histoire a déjà deux personnages associés, on renvoie 400
- [X] Insérer dans la base de données

#### 4.3 Route Génération de l'Histoire
- [X] Créer `src/app/api/stories/[id]/generate/route.ts`
- [X] L'API lance un process, renvoie un code statut 200 le plus vite possible et la génération se fait en background
- [X] Process :
  1. Récupérer les données de l'histoire
  2. Appeler le service de génération d'histoire
  3. Générer les 4 scènes
  4. Déclencher génération des images
  5. Créer un prompt d'image détaillé
  6. Appeler Replicate API
  7. Attendre la génération
  8. Uploader sur MinIO
  9. Sauvegarder l'URL dans la DB
- [X] Gérer les états (pending → generating → completed/failed) de la story dans le process
- [X] Créer un endpoint GET de polling retournant le statut de la génération

#### 4.4 Route Génération des Images (Pas implémenté, intégré dans la tache précédente)
- [ ] Créer logique de génération d'images (peut être dans le même endpoint)
- [ ] Pour chaque scène :
  1. Créer un prompt d'image détaillé
  2. Appeler Replicate API
  3. Attendre la génération
  4. Uploader sur MinIO
  5. Sauvegarder l'URL dans la DB
- [ ] Gérer la génération en parallèle ou séquentielle (selon les ressources)

#### 4.5
Route Récupération des Résultats
- [X] Créer `src/app/api/stories/[id]/route.ts`
- [X] Endpoint GET pour récupérer une histoire complète
- [X] Inclure :
  - Métadonnées de l'histoire
  - Personnages avec leurs images
  - 4 scènes avec descriptions et images (url depuis le minio)
- [X] Optimiser les requêtes (JOIN)

#### 4.6 Route Téléchargement
- [ ] Créer `src/app/api/stories/[id]/download/route.ts`
- [ ] Permettre téléchargement :
  - Image individuelle
  - Archive ZIP avec toutes les images
- [ ] Générer le fichier à la volée

---

### Phase 5 : Interface Utilisateur (4-5h)

#### Creation d'histoire
- [X] Un formulaire de creation d'histoire avec un champ nom et un champ description
- [X] à l'envoi du formulaire, les informations sont envoyés à l'endpoint POST /story

#### Creation de personnages associés à un histoire
- [X] Quand la story est bien crée, un formulaire permettant de créer un personnage s'affiche 
  - Chaque personnage a un nom et une description
  - Les informations sont envoyés à l'endpoint POST /story/{id}/charatcers 
  - quand l'envoie s'est bien passé, un bouton ajouter un personnage apparait 
    - l'utilisateur peut ajouter un autre personnage avec les même modalités cités précédemment
  - plus aucun bouton n'apparait quand l'utilisateur a déjà crée deux personnages

### Génération d'histoire 
  - [X] Quand l'utilisateur a crée deux personnages, un bouton générer un histoire apparait
    - Ce bouton appelle le endpoint POST stories/[id]/generate
    - L'appli appelle l'endpoint polling toutes les 10 secondes pour vérifier que la génération est terminé
    - Quand la génération est terminé, l'application affiche les images

### Phase 6 : Déploiement 

App Next.js sur Vercel
Base de données PG sur MarketPlace Storage
Ollama sur ? AI Gateway Vercel ?
Minio sur Vercel Blob

#### 5.6 Page Génération/Loading
- [ ] Créer `src/app/stories/[id]/generating/page.tsx`
- [ ] Afficher :
  - Animation de chargement créative
  - Messages encourageants ("Votre histoire prend vie...")
  - Indicateur de progression (étapes)
- [ ] Polling toutes les 2-3 secondes pour vérifier l'état
- [ ] Redirection automatique vers résultats quand terminé

#### 5.3 Composant Upload d'Image
- [ ] Créer `src/components/ImageUploader.tsx`
- [ ] Fonctionnalités :
  - Drag & drop
  - Click to upload
  - Preview de l'image
  - Indicateur de progression
  - Validation côté client
- [ ] Utiliser shadcn/ui pour le styling

#### 5.7 Composant Galerie d'Images
- [ ] Créer `src/components/StoryGallery.tsx`
- [ ] Afficher les 4 scènes :
  - Image
  - Description de la scène
  - Numéro de scène
- [ ] Layout en grille responsive (2x2 ou 1x4 selon l'écran)
- [ ] Possibilité d'agrandir les images (lightbox)

#### 5.8 Composant Bouton Téléchargement
- [ ] Créer `src/components/DownloadButton.tsx`
- [ ] Options :
  - Télécharger image individuelle
  - Télécharger toutes les images (ZIP)
- [ ] Indicateur de téléchargement

#### 5.9 Page Résultats
- [ ] Créer `src/app/stories/[id]/page.tsx`
- [ ] Intégrer StoryGallery
- [ ] Boutons de téléchargement
- [ ] Option "Créer une nouvelle histoire"
- [ ] Possibilité de partager (futur)

---

### Phase 6 : Optimisations & UX (2-3h)

#### 6.1 États de Chargement
- [ ] Composant Skeleton pour chargements
- [ ] Spinners avec shadcn/ui
- [ ] Transitions fluides entre états

#### 6.2 Gestion d'Erreurs
- [ ] Composant ErrorBoundary global
- [ ] Messages d'erreur clairs et actionnables
- [ ] Toast notifications avec shadcn/ui
- [ ] Boutons de retry

#### 6.3 Validations
- [ ] Validation côté client (React Hook Form + Zod)
- [ ] Validation côté serveur (Zod)
- [ ] Messages de validation en français

#### 6.4 Optimisation des Images
- [ ] Utiliser Next.js Image pour l'optimisation
- [ ] Lazy loading
- [ ] Formats modernes (WebP, AVIF)
- [ ] Placeholder blur

#### 6.5 Responsive Design
- [ ] Tester sur mobile, tablette, desktop
- [ ] Ajustements des layouts
- [ ] Touch-friendly pour mobile

#### 6.6 Accessibilité
- [ ] Labels ARIA
- [ ] Navigation au clavier
- [ ] Contraste des couleurs
- [ ] Alt text pour les images

---

### Phase 7 : Tests & Déploiement (2-3h)

#### 7.1 Tests Manuels
- [ ] Tester le flow complet :
  - Création d'une histoire
  - Génération des scènes
  - Génération des images
  - Téléchargement
- [ ] Tester les cas d'erreur :
  - Images trop grandes
  - Descriptions vides
  - API indisponible
  - Timeout de génération

#### 7.2 Tests de Performance
- [ ] Temps de chargement des pages
- [ ] Temps de génération d'une histoire
- [ ] Optimisation des requêtes DB
- [ ] Mise en cache si nécessaire

#### 7.3 Documentation Technique
- [ ] Commenter le code complexe
- [ ] Documenter les APIs (endpoints, formats)
- [ ] README à jour avec instructions
- [ ] Variables d'environnement documentées

#### 7.4 Préparation Déploiement Local
- [ ] Docker Compose fonctionnel
- [ ] Script d'initialisation complet
- [ ] Commandes npm configurées
- [ ] Guide de démarrage rapide

#### 7.5 (Optionnel) Déploiement Vercel
- [ ] Configuration vercel.json
- [ ] Setup base de données externe (Neon, Supabase)
- [ ] Setup storage externe (Cloudinary, Vercel Blob)
- [ ] Variables d'environnement en production
- [ ] Premier déploiement

---

## 🔧 Technologies et Packages

### Core
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0"
  }
}
```

### Database & Storage
```json
{
  "dependencies": {
    "kysely": "^0.27.0",
    "pg": "^8.11.0",
    "minio": "^7.1.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.0"
  }
}
```

### AI Services
```json
{
  "dependencies": {
    "replicate": "^0.30.0",
    "ollama": "^0.5.0",
    "@huggingface/inference": "^2.6.0"
  }
}
```

### UI & Forms
```json
{
  "dependencies": {
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.3.0"
  }
}
```

### Utilities
```json
{
  "dependencies": {
    "date-fns": "^3.6.0",
    "uuid": "^9.0.0",
    "archiver": "^7.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0",
    "@types/archiver": "^6.0.0"
  }
}
```

---

## 📝 Scripts NPM

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:migrate": "tsx scripts/migrate.ts",
    "db:seed": "tsx scripts/seed.ts",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  }
}
```

---

## 🎯 Critères de Succès du MVP

### Fonctionnels
- [ ] Un utilisateur peut uploader 2 photos
- [ ] Un utilisateur peut décrire 2 personnages
- [ ] Le système génère une histoire en 4 scènes cohérentes
- [ ] Le système génère 4 images illustrant l'histoire
- [ ] Les images sont affichées dans une galerie
- [ ] Les images peuvent être téléchargées

### Techniques
- [ ] Application responsive (mobile, tablette, desktop)
- [ ] Temps de génération < 90 secondes
- [ ] Gestion d'erreurs robuste
- [ ] Code TypeScript type-safe
- [ ] Base de données fonctionnelle
- [ ] Storage d'images fonctionnel

### Qualité
- [ ] Code propre et maintenable
- [ ] Documentation complète
- [ ] Expérience utilisateur fluide
- [ ] Messages d'erreur clairs
- [ ] Interface intuitive

---

## 🚀 Prochaines Itérations (Post-MVP)

### Version 1.1
- Authentification utilisateur
- Sauvegarde des histoires créées
- Historique des créations

### Version 1.2
- Choix de styles d'illustration
- Thèmes d'histoire prédéfinis
- Personnalisation avancée

### Version 1.3
- Export PDF imprimable
- Partage sur réseaux sociaux
- Galerie publique

### Version 2.0
- Paiement en ligne
- Crédit d'images
- Modèles premium (OpenAI, Midjourney)

---

## 📊 Estimation de Temps par Phase

| Phase | Description | Temps Estimé |
|-------|-------------|--------------|
| 1 | Setup Initial & Infrastructure | 3-4h |
| 2 | Base de Données & Storage | 3-4h |
| 3 | Services IA | 4-5h |
| 4 | API Routes Backend | 3-4h |
| 5 | Interface Utilisateur | 4-5h |
| 6 | Optimisations & UX | 2-3h |
| 7 | Tests & Déploiement | 2-3h |
| **Total** | | **21-28h** |

---

## 📌 Notes Importantes

### Décisions Techniques
- **Kysely vs Prisma** : Kysely choisi pour sa légèreté et son approche type-safe sans génération de code
- **MinIO vs Cloud Storage** : MinIO pour le développement local, migration vers Cloudinary/S3 facile
- **Replicate vs Local SD** : Replicate pour simplicité MVP, migration vers local possible
- **Ollama Local** : Pour développement gratuit, fallback sur Hugging Face

### Points d'Attention
- **Coût Replicate** : Surveiller l'utilisation (~$0.01 par histoire)
- **Timeout IA** : Prévoir des timeouts longs (60-90s)
- **Taille Images** : Limiter upload à 10MB max
- **Concurrent Requests** : Limiter génération simultanée pour MVP

### Bonnes Pratiques
- Commit réguliers avec messages descriptifs
- Tests manuels après chaque phase
- Documentation au fur et à mesure
- Configuration flexible pour migration cloud

---

**Date de création** : 4 juin 2026
**Dernière mise à jour** : 4 juin 2026
**Version** : 1.0
