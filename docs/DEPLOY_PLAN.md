# Plan de déploiement : Vercel + Supabase

## Partie 1 — Préparation du code (à faire avant de déployer)
### 1.1 — Mocker le scene generator

### 1.2 — Mettre à jour webapp/.env.prod

## Partie 2 — Étapes de déploiement
Étape 1 — Créer le projet Supabase
supabase.com → New project
Choisis une région, note bien le mot de passe de la DB
Attends ~2 min que le projet soit initialisé
Étape 2 — Appliquer le schéma SQL
Supabase → SQL Editor → New query
Colle webapp/migrations/001_initial_schema.sql
Run ✅
Étape 3 — Créer le bucket Supabase Storage
Supabase → Storage → New bucket
Nom : book-images, activer Public si tu veux les images accessibles sans auth
Dans Settings → Storage, note l'Access Key ID et le Secret Access Key S3
Étape 4 — Récupérer les credentials
Dans Project Settings → Database :

Host, Port (5432 ou 6543 pour le pooler), Database, User, Password
Dans Project Settings → API :

Project ref (ex: abcdefgh)
Dans Project Settings → Storage → S3 Connection :

Access Key ID
Secret Access Key
Endpoint : https://<ref>.supabase.co/storage/v1/s3
Étape 5 — Déployer sur Vercel
vercel.com → New Project → importer MBrandone/book-creator
Root Directory : webapp ⚠️
Framework : Next.js (auto-détecté)
Étape 6 — Variables d'environnement sur Vercel
Dans Settings → Environment Variables :


# Base de données Supabase
POSTGRES_HOST=db.<ref>.supabase.co
POSTGRES_PORT=6543
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<ton_mdp>

# MinIO SDK → Supabase Storage S3
MINIO_ENDPOINT=<ref>.supabase.co
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=<s3-access-key-id>
MINIO_SECRET_KEY=<s3-secret-access-key>
MINIO_BUCKET=book-images

# Replicate (images + texte)
REPLICATE_API_TOKEN=<ton_token>
STORY_PROVIDER=replicate

# App
NEXT_PUBLIC_APP_URL=https://<ton-app>.vercel.app
NODE_ENV=production
Étape 7 — Deploy
Clique Deploy
Vérifie les logs dans Deployments → Functions si des erreurs
Résumé
#	Quoi	Effort
1.1	Créer ReplicateStoryGenerator (LLM via Replicate)	🔧 Code
1.2	MinIO → rien à changer dans le code, juste les env vars	✅ Config
1.3	Mettre à jour .env.example	📝 Doc
2.1-7	Déploiement Supabase + Vercel	🚀 Ops

PG password
njkxfKasFSJLgUlH