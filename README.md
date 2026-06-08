# 📚 Book Creator - Générateur de Livres par IA

## 🎯 Objectif du Projet

Book Creator est une application web qui permet aux parents de créer des livres personnalisés générés par IA où leurs enfants ou proches deviennent les héros de l'histoire. L'objectif est d'offrir un cadeau unique et mémorable qui transforme des photos et descriptions en une aventure illustrée.

## 👥 Cas d'Usage

- **Parents → Enfants** : Créer une histoire où l'enfant est le héros
- **Parents → Couples** : Offrir une histoire romantique mettant en scène les deux parents
- **Grands-parents → Petits-enfants** : Créer des souvenirs personnalisés
- **Cadeaux d'anniversaire** : Histoire unique et personnalisée

## ✨ Fonctionnalités du MVP

### Flow Utilisateur

1. **Page d'Accueil**
   - Présentation du concept
   - Call-to-action "Créer une histoire"

2. **Formulaire de Création**
   - Upload de 2 photos maximum (une par personnage)
   - Champ description pour chaque personnage (nom, âge, caractéristiques)
   - Bouton "Créer une histoire"

3. **Génération de l'Histoire**
   - L'IA génère une histoire structurée en 4 scènes :
     1. **Présentation** : Introduction des personnages et de la situation initiale
     2. **Élément Perturbateur** : Un problème ou défi apparaît
     3. **Action/Résolution** : Les héros agissent pour résoudre le problème
     4. **Situation Finale** : Conclusion heureuse de l'aventure
   
4. **Génération des Images**
   - 4 images illustrant chaque scène de l'histoire
   - Style cohérent et adapté aux enfants
   - Personnages reconnaissables basés sur les descriptions

5. **Page Résultat**
   - Affichage des 4 images générées
   - Option de téléchargement (individuel ou pack complet)

## 🏗️ Architecture Technique

### Stack Technologique

**Frontend**
- Next.js 14+ (App Router)
- React 18+ avec TypeScript
- Tailwind CSS
- shadcn/ui (composants UI)

**Backend**
- Next.js API Routes
- Node.js runtime

**Base de Données**
- PostgreSQL 16
- Kysely (ORM TypeScript type-safe)

**Stockage**
- MinIO (blob storage S3-compatible, local)

**Intelligence Artificielle**
- **Génération d'histoire** : Ollama (local) ou Hugging Face API
- **Génération d'images** : Replicate API (SDXL)

**Infrastructure**
- Docker Compose (PostgreSQL + MinIO)
- Vercel (déploiement futur)

### Architecture des Services

```
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js + React)            │
│  - Formulaire création                          │
│  - Upload images                                │
│  - Galerie résultats                            │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Backend (Next.js API Routes)            │
│  - /api/upload (images)                         │
│  - /api/generate-story                          │
│  - /api/generate-images                         │
└─────┬──────────────────┬────────────────────────┘
      │                  │
      ▼                  ▼
┌─────────────┐    ┌──────────────────┐
│  PostgreSQL │    │  MinIO Storage   │
│  (Kysely)   │    │  (Images)        │
└─────────────┘    └──────────────────┘
      │
      ▼
┌──────────────────────────────────────┐
│      Services IA Externes            │
│  - Ollama / Hugging Face (histoire)  │
│  - Replicate (images SDXL)           │
└──────────────────────────────────────┘
```

## 🚀 Installation et Setup

### Prérequis

- Node.js 18+ ([Installation](https://nodejs.org/))
- Docker & Docker Compose ([Installation](https://docs.docker.com/get-docker/))
- npm ou yarn
- Git

### Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd book-creator
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   
   Éditer `.env` avec vos configurations :
   ```env
   # Database
   DATABASE_URL=postgresql://bookuser:bookpass@localhost:5432/bookcreator

   # MinIO Storage
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET=book-images

   # AI Services
   REPLICATE_API_TOKEN=your_replicate_token_here
   OLLAMA_BASE_URL=http://localhost:11434

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Démarrer les services Docker**
   ```bash
   docker-compose up -d
   ```

5. **Initialiser la base de données**
   ```bash
   npm run db:migrate
   ```

6. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   ```

7. **Accéder à l'application**
   - Application : [http://localhost:3000](http://localhost:3000)
   - MinIO Console : [http://localhost:9001](http://localhost:9001)

## 📁 Structure du Projet

```
book-creator/
├── README.md                    # Documentation principale
├── PLAN.md                      # Plan d'implémentation détaillé
├── docker-compose.yml           # Services (PostgreSQL + MinIO)
├── .env.example                 # Template variables d'environnement
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx            # Page d'accueil
│   │   ├── layout.tsx          # Layout principal
│   │   ├── create/             # Page création histoire
│   │   ├── result/[id]/        # Page résultats
│   │   └── api/                # API Routes
│   │       ├── upload/
│   │       ├── generate-story/
│   │       └── generate-images/
│   │
│   ├── components/              # Composants React
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── CharacterForm.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── StoryGallery.tsx
│   │   └── DownloadButton.tsx
│   │
│   ├── lib/                     # Services et utilitaires
│   │   ├── db/                 # Configuration Kysely
│   │   ├── storage/            # Service MinIO
│   │   ├── ai/                 # Services IA
│   │   └── providers/          # Clients API externes
│   │
│   └── types/                   # Types TypeScript
│
├── public/                      # Assets statiques
└── scripts/                     # Scripts utilitaires
```

## 🔧 Commandes Disponibles

```bash
# Développement
npm run dev              # Démarrer le serveur de développement
npm run build            # Build pour production
npm run start            # Démarrer en mode production

# Base de données
npm run db:migrate       # Exécuter les migrations
npm run db:seed          # Seed la base de données

# Docker
docker-compose up -d     # Démarrer les services
docker-compose down      # Arrêter les services
docker-compose logs -f   # Voir les logs

# Tests
npm run test             # Lancer les tests (à venir)
npm run lint             # Linter le code
npm run type-check       # Vérifier les types TypeScript
```

## 💡 Utilisation

1. Ouvrir l'application sur [http://localhost:3000](http://localhost:3000)
2. Cliquer sur "Créer une histoire"
3. Uploader 2 photos de personnages
4. Remplir les descriptions (nom, âge, traits de caractère)
5. Cliquer sur "Générer l'histoire"
6. Attendre la génération (30-60 secondes)
7. Visualiser et télécharger les 4 images générées

## 💰 Coûts et Limitations

### MVP (Version Locale)
- **Hébergement** : Gratuit (local)
- **Base de données** : Gratuit (PostgreSQL local)
- **Storage** : Gratuit (MinIO local)
- **IA Histoire** : Gratuit (Ollama local)
- **IA Images** : ~$0.01 par histoire (Replicate SDXL)

### Estimation Mensuelle
- **0-10€** pour 100-1000 histoires générées

## 🎨 Évolutions Futures

- [ ] Authentification utilisateur
- [ ] Sauvegarde des histoires créées
- [ ] Choix du style d'illustration
- [ ] Personnalisation du thème de l'histoire
- [ ] Export en PDF imprimable
- [ ] Plusieurs langues
- [ ] Paiement en ligne
- [ ] Galerie publique d'histoires (avec accord)
- [ ] Intégration OpenAI/DALL-E pour meilleure qualité

## 🤝 Contribution

Ce projet est actuellement en développement. Les contributions seront ouvertes après la version MVP.

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Contact : [votre-email]

---

**Note** : Ce projet utilise des services IA externes (Replicate). Assurez-vous d'avoir configuré les clés API nécessaires dans le fichier `.env`.
