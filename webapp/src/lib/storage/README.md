# Configuration MinIO - Book Creator

## 📁 Structure

```
src/lib/storage/
└── minio.ts        # Client et fonctions MinIO
```

## 🚀 Fonctionnalités Implémentées

### Client MinIO
- Configuration automatique depuis les variables d'environnement
- Connexion sécurisée au serveur MinIO

### Fonctions Principales

#### `initializeMinIO()`
Initialise la connexion MinIO et crée le bucket automatiquement s'il n'existe pas.
- Vérifie l'existence du bucket
- Crée le bucket si nécessaire
- Configure la politique de lecture publique
- Teste la connexion

**À appeler au démarrage de l'application**

#### `uploadImage(file, key, metadata?)`
Upload une image vers MinIO.
- **Paramètres:**
  - `file`: Buffer ou Readable stream
  - `key`: Nom/clé du fichier dans MinIO
  - `metadata`: Métadonnées optionnelles (content-type, etc.)
- **Retourne:** URL de l'image uploadée

#### `getImageUrl(key)`
Récupère l'URL publique d'une image.
- **Paramètres:**
  - `key`: Nom/clé du fichier
- **Retourne:** URL complète de l'image

#### `deleteImage(key)`
Supprime une image de MinIO.
- **Paramètres:**
  - `key`: Nom/clé du fichier à supprimer

### Fonctions Additionnelles

#### `getPresignedImageUrl(key, expirySeconds?)`
Génère une URL présignée avec expiration.
- Utile pour les buckets privés
- Durée par défaut: 24h

#### `deleteImages(keys)`
Supprime plusieurs images en une seule opération.

#### `imageExists(key)`
Vérifie si une image existe dans le bucket.

#### `listImages(prefix?)`
Liste toutes les images du bucket (avec filtre optionnel).

#### `getImageMetadata(key)`
Récupère les métadonnées d'une image (taille, type, date, etc.).

## ⚙️ Configuration

Les variables d'environnement suivantes doivent être définies dans `.env.local`:

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=book-images
```

## 🧪 Tests

Un script de test complet est disponible:

```bash
npm run test:minio
```

Le script teste:
- ✅ Connexion MinIO
- ✅ Création automatique du bucket
- ✅ Upload de fichiers
- ✅ Récupération d'URLs
- ✅ Métadonnées
- ✅ Listing d'images
- ✅ Suppression d'images

## 📝 Exemples d'Utilisation

### Initialisation (au démarrage de l'app)

```typescript
import { initializeMinIO } from '@/lib/storage/minio';

// Dans votre fichier de démarrage ou layout.tsx
await initializeMinIO();
```

### Upload d'une image

```typescript
import { uploadImage } from '@/lib/storage/minio';

// Depuis un formulaire
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
import { getImageUrl } from '@/lib/storage/minio';

const url = getImageUrl('books/123/cover.jpg');
// http://localhost:9000/book-images/books/123/cover.jpg
```

### Suppression d'une image

```typescript
import { deleteImage } from '@/lib/storage/minio';

await deleteImage('books/123/cover.jpg');
```

### Vérifier l'existence

```typescript
import { imageExists } from '@/lib/storage/minio';

const exists = await imageExists('books/123/cover.jpg');
if (exists) {
  console.log('L\'image existe');
}
```

## 🐳 Docker

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

## 🔧 Intégration dans l'Application

Pour utiliser MinIO dans vos routes API Next.js:

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/storage/minio';

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

## 🔒 Sécurité

- Le bucket est configuré avec une politique de lecture publique par défaut
- Pour des images privées, utilisez `getPresignedImageUrl()` au lieu de `getImageUrl()`
- En production, changez les credentials MinIO
- Considérez l'utilisation de HTTPS (`MINIO_USE_SSL=true`)

## 📚 Documentation MinIO

- [MinIO JavaScript Client](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)
- [MinIO Server](https://min.io/docs/minio/linux/index.html)
