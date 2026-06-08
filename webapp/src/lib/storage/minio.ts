import * as Minio from 'minio';
import { Readable } from 'stream';

// Configuration MinIO depuis les variables d'environnement
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
};

const bucketName = process.env.MINIO_BUCKET || 'book-images';

// Créer le client MinIO
export const minioClient = new Minio.Client(minioConfig);

/**
 * Initialise MinIO - Crée le bucket s'il n'existe pas
 * Cette fonction doit être appelée au démarrage de l'application
 */
export async function initializeMinIO(): Promise<void> {
  try {
    // Vérifier si le bucket existe
    const bucketExists = await minioClient.bucketExists(bucketName);
    
    if (!bucketExists) {
      // Créer le bucket s'il n'existe pas
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket MinIO "${bucketName}" créé avec succès`);
      
      // Définir la politique du bucket pour permettre la lecture publique des images
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log(`✅ Politique de lecture publique configurée pour le bucket "${bucketName}"`);
    } else {
      console.log(`✅ Bucket MinIO "${bucketName}" existe déjà`);
    }
    
    // Tester la connexion
    await minioClient.listBuckets();
    console.log('✅ Connexion MinIO établie avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de MinIO:', error);
    throw error;
  }
}

/**
 * Upload une image vers MinIO
 * @param file - Le fichier à uploader (Buffer ou Readable stream)
 * @param key - La clé/nom du fichier dans MinIO
 * @param metadata - Métadonnées optionnelles (content-type, etc.)
 * @returns L'URL de l'image uploadée
 */
export async function uploadImage(
  file: Buffer | Readable,
  key: string,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    // Déterminer la taille du fichier
    let size: number;
    let stream: Readable;

    if (Buffer.isBuffer(file)) {
      size = file.length;
      stream = Readable.from(file);
    } else {
      // Pour un stream, on doit le convertir en buffer pour obtenir la taille
      const chunks: Buffer[] = [];
      for await (const chunk of file) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      size = buffer.length;
      stream = Readable.from(buffer);
    }

    // Préparer les métadonnées
    const metaData = {
      'Content-Type': metadata?.['Content-Type'] || 'application/octet-stream',
      ...metadata,
    };

    // Upload le fichier
    await minioClient.putObject(bucketName, key, stream, size, metaData);
    
    console.log(`✅ Image uploadée avec succès: ${key}`);
    
    // Retourner l'URL de l'image
    return getImageUrl(key);
  } catch (error) {
    console.error(`❌ Erreur lors de l'upload de l'image ${key}:`, error);
    throw new Error(`Échec de l'upload de l'image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Récupère l'URL d'une image stockée dans MinIO
 * @param key - La clé/nom du fichier dans MinIO
 * @returns L'URL complète de l'image
 */
export function getImageUrl(key: string): string {
  const protocol = minioConfig.useSSL ? 'https' : 'http';
  const port = minioConfig.port === 443 || minioConfig.port === 80 ? '' : `:${minioConfig.port}`;
  return `${protocol}://${minioConfig.endPoint}${port}/${bucketName}/${key}`;
}

/**
 * Récupère une URL présignée pour accéder temporairement à une image
 * Utile si le bucket n'est pas public
 * @param key - La clé/nom du fichier dans MinIO
 * @param expirySeconds - Durée de validité de l'URL en secondes (défaut: 24h)
 * @returns URL présignée
 */
export async function getPresignedImageUrl(
  key: string,
  expirySeconds: number = 86400
): Promise<string> {
  try {
    const url = await minioClient.presignedGetObject(bucketName, key, expirySeconds);
    return url;
  } catch (error) {
    console.error(`❌ Erreur lors de la génération de l'URL présignée pour ${key}:`, error);
    throw new Error(`Échec de la génération de l'URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Supprime une image de MinIO
 * @param key - La clé/nom du fichier à supprimer
 */
export async function deleteImage(key: string): Promise<void> {
  try {
    await minioClient.removeObject(bucketName, key);
    console.log(`✅ Image supprimée avec succès: ${key}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de l'image ${key}:`, error);
    throw new Error(`Échec de la suppression de l'image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Supprime plusieurs images de MinIO
 * @param keys - Liste des clés/noms des fichiers à supprimer
 */
export async function deleteImages(keys: string[]): Promise<void> {
  try {
    await minioClient.removeObjects(bucketName, keys);
    console.log(`✅ ${keys.length} images supprimées avec succès`);
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression des images:`, error);
    throw new Error(`Échec de la suppression des images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Vérifie si une image existe dans MinIO
 * @param key - La clé/nom du fichier à vérifier
 * @returns true si l'image existe, false sinon
 */
export async function imageExists(key: string): Promise<boolean> {
  try {
    await minioClient.statObject(bucketName, key);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Liste toutes les images dans le bucket
 * @param prefix - Préfixe optionnel pour filtrer les résultats
 * @returns Liste des clés des images
 */
export async function listImages(prefix?: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const images: string[] = [];
    const stream = minioClient.listObjects(bucketName, prefix, true);
    
    stream.on('data', (obj) => {
      if (obj.name) {
        images.push(obj.name);
      }
    });
    
    stream.on('end', () => {
      resolve(images);
    });
    
    stream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Récupère les métadonnées d'une image
 * @param key - La clé/nom du fichier
 * @returns Les métadonnées de l'image
 */
export async function getImageMetadata(key: string) {
  try {
    const stat = await minioClient.statObject(bucketName, key);
    return {
      size: stat.size,
      etag: stat.etag,
      lastModified: stat.lastModified,
      contentType: stat.metaData?.['content-type'],
      metadata: stat.metaData,
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des métadonnées pour ${key}:`, error);
    throw new Error(`Échec de la récupération des métadonnées: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export du nom du bucket pour utilisation externe si nécessaire
export { bucketName };
