# Configuration Storage - Book Creator

## 📁 Structure

```
src/lib/storage/
├── storage-interface.ts      # Interface commune pour tous les providers
├── aws-s3-storage.ts         # Implémentation AWS S3 SDK (compatible MinIO, Supabase, AWS)
├── minio-storage.ts          # Implémentation MinIO native
├── storage-factory.ts        # Factory pour sélectionner le provider
├── index.ts                  # Point d'entrée unifié
├── README.md                 # Ce fichier
└── TROUBLESHOOTING.md
```

## 🎯 Architecture Multi-Provider

Le système de storage utilise maintenant une architecture flexible qui permet de basculer entre différents providers de stockage S3-compatible.

### Providers Disponibles

#### 1. **AWS S3 SDK** (Recommandé - `STORAGE_PROVIDER=aws-s3`)
- ✅ Compatible avec MinIO local
- ✅ Compatible avec Supabase Storage
- ✅ Compatible avec AWS S3 réel
- ✅ Compatible avec tout service S3-compatible
- ✅ Standard de l'industrie

#### 2. **MinIO Native** (`STORAGE_PROVIDER=minio`)
- ✅ Client officiel MinIO
- ✅ Optimisé pour MinIO
- ⚠️ Non compatible avec Supabase Storage

## ⚙️ Configuration

### Variables d'environnement

```env
# Provider à utiliser (aws-s3 ou minio)
STORAGE_PROVIDER=aws-s3

# Configuration du serveur
STORAGE_ENDPOINT=localhost          # ou votre-projet.supabase.co/storage/v1/s3
STORAGE_PORT=9000                   # vide pour Supabase
STORAGE_USE_SSL=false               # true pour Supabase
STORAGE_ACCESS_KEY=minioadmin       # vos credentials
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=book-images
STORAGE_REGION=us-east-1
```

### Configurations Spécifiques

#### 🔧 MinIO Local (développement)

```env
STORAGE_PROVIDER=aws-s3
STORAGE_ENDPOINT=localhost
STORAGE_PORT=9000
STORAGE_USE_SSL=false
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=book-images
STORAGE_REGION=us-east-1
```

#### ☁️ Supabase Storage (production)

```env
STORAGE_PROVIDER=aws-s3
STORAGE_ENDPOINT=votre-projet.supabase.co/storage/v1/s3
STORAGE_PORT=
STORAGE_USE_SSL=true
STORAGE_ACCESS_KEY=<votre-supabase-s3-access-key>
STORAGE_SECRET_KEY=<votre-supabase-s3-secret-key>
STORAGE_BUCKET=book-images
STORAGE_REGION=us-east-1
```

#### 🌩️ AWS S3 Réel

```env
STORAGE_PROVIDER=aws-s3
STORAGE_ENDPOINT=s3.amazonaws.com
STORAGE_PORT=
STORAGE_USE_SSL=true
STORAGE_ACCESS_KEY=<your-aws-access-key>
STORAGE_SECRET_KEY=<your-aws-secret-key>
STORAGE_BUCKET=book-images
STORAGE_REGION=eu-west-1
```

## 🚀 Utilisation

### Initialisation (au démarrage de l'app)

```typescript
import { initializeStorage } from '@/lib/storage';

// Dans votre fichier de démarrage ou layout.tsx
await initializeStorage();
```

**Note**: `initializeMinIO()` est toujours disponible comme alias pour la rétrocompatibilité.

### Upload d'une image

```typescript
import { uploadImage } from '@/lib/storage';

const file = await request.formData().get('file');
const buffer = Buffer.from(await file.arrayBuffer());

const imageUrl = await uploadImage(
  buffer,
  `books/${bookId}/cover.jpg`,
  { 'Content-Type': 'image/jpeg' }
);
```

### Récupération d'URL

```typescript
import { getImageUrl } from '@/lib/storage';

const url = getImageUrl('books/123/cover.jpg');
// http://localhost:9000/book-images/books/123/cover.jpg
```

### URL Présignée (pour buckets privés)

```typescript
import { getPresignedImageUrl } from '@/lib/storage';

const url = await getPresignedImageUrl('books/123/cover.jpg', 3600); // 1 heure
```

### Suppression d'une image

```typescript
import { deleteImage } from '@/lib/storage';

await deleteImage('books/123/cover.jpg');
```

### Vérifier l'existence

```typescript
import { imageExists } from '@/lib/storage';

const exists = await imageExists('books/123/cover.jpg');
if (exists) {
  console.log('L\'image existe');
}
```

### Lister les images

```typescript
import { listImages } from '@/lib/storage';

const images = await listImages('books/123/');
console.log(images); // ['books/123/cover.jpg', 'books/123/page1.jpg', ...]
```

### Obtenir les métadonnées

```typescript
import { getImageMetadata } from '@/lib/storage';

const metadata = await getImageMetadata('books/123/cover.jpg');
console.log(metadata);
// {
//   size: 1024000,
//   etag: "abc123...",
//   lastModified: Date,
//   contentType: "image/jpeg",
//   metadata: { ... }
// }
```

## 📝 API Complète

### Fonctions Principales

| Fonction | Description | Retour |
|----------|-------------|--------|
| `initializeStorage()` | Initialise le storage et crée le bucket | `Promise<void>` |
| `uploadImage(file, key, metadata?)` | Upload une image | `Promise<string>` |
| `getImageUrl(key)` | Récupère l'URL publique | `string` |
| `getPresignedImageUrl(key, expiry?)` | Génère une URL présignée | `Promise<string>` |
| `deleteImage(key)` | Supprime une image | `Promise<void>` |
| `deleteImages(keys)` | Supprime plusieurs images | `Promise<void>` |
| `imageExists(key)` | Vérifie l'existence | `Promise<boolean>` |
| `listImages(prefix?)` | Liste les images | `Promise<string[]>` |
| `getImageMetadata(key)` | Récupère les métadonnées | `Promise<ImageMetadata>` |

### Types TypeScript

```typescript
import type { 
  StorageProvider,
  ImageMetadata,
  StorageConfig,
  StorageProviderType 
} from '@/lib/storage';
```

## 🔧 Intégration dans les Routes API

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `uploads/${Date.now()}-${file.name}`;
    
    const url = await uploadImage(buffer, key, {
      'Content-Type': file.type,
    });

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

## 🐳 Docker - MinIO Local

Le service MinIO est défini dans `docker-compose.yml`:

```bash
# Démarrer MinIO
docker-compose up -d minio

# Vérifier le statut
docker ps --filter "name=minio"

# Accéder à l'interface web
http://localhost:9001
```

### Identifiants MinIO Console
- **Username:** minioadmin
- **Password:** minioadmin

## 🔒 Sécurité

- **Buckets publics**: Par défaut, les buckets sont configurés avec lecture publique
- **Buckets privés**: Utilisez `getPresignedImageUrl()` pour générer des URLs temporaires
- **Production**: 
  - Changez les credentials par défaut
  - Utilisez HTTPS (`STORAGE_USE_SSL=true`)
  - Configurez des politiques de bucket appropriées

## 🎓 Usage Avancé

### Changer de Provider à Runtime

```typescript
import { resetStorageProvider, getStorageProvider } from '@/lib/storage';

// Forcer un rechargement de la configuration
resetStorageProvider();

// Récupérer une nouvelle instance
const storage = getStorageProvider();
```

### Créer un Provider Personnalisé

```typescript
import { StorageProvider, ImageMetadata } from '@/lib/storage/storage-interface';

class CustomStorage implements StorageProvider {
  async initialize(): Promise<void> {
    // Votre implémentation
  }
  
  async uploadImage(file: Buffer, key: string, metadata?: Record<string, string>): Promise<string> {
    // Votre implémentation
  }
  
  // ... autres méthodes
}
```

## 📚 Documentation Externe

- [AWS SDK for JavaScript v3 - S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [MinIO JavaScript Client](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)
- [Supabase Storage - S3 Compatibility](https://supabase.com/docs/guides/storage/s3/authentication)
- [MinIO Server](https://min.io/docs/minio/linux/index.html)

## ❓ Problèmes ?

Consultez le fichier [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) pour les problèmes courants et leurs solutions.
