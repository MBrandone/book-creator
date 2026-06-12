import type { StorageProvider } from './storage-interface';
import { MinioStorage } from './minio-storage';
import { AwsS3Storage } from './aws-s3-storage';

/**
 * Types de storage providers disponibles
 */
export type StorageProviderType = 'minio' | 'aws-s3';

/**
 * Factory pour créer le storage provider approprié
 * basé sur la configuration d'environnement
 */
export function createStorageProvider(): StorageProvider {
  const providerType = (process.env.STORAGE_PROVIDER || 'aws-s3') as StorageProviderType;

  switch (providerType) {
    case 'minio':
      console.log('📦 Utilisation du provider MinIO natif');
      return new MinioStorage();

    case 'aws-s3':
      console.log('📦 Utilisation du provider AWS S3 (compatible MinIO, Supabase, AWS S3)');
      return new AwsS3Storage();

    default:
      throw new Error(
        `Provider de storage inconnu: "${providerType}". ` +
        `Les valeurs supportées sont: "minio", "aws-s3"`
      );
  }
}

/**
 * Instance singleton du storage provider
 * Créée à la première utilisation
 */
let storageInstance: StorageProvider | null = null;

/**
 * Récupère l'instance singleton du storage provider
 * Crée l'instance si elle n'existe pas encore
 */
export function getStorageProvider(): StorageProvider {
  if (!storageInstance) {
    storageInstance = createStorageProvider();
  }
  return storageInstance;
}

/**
 * Réinitialise l'instance singleton
 * Utile pour les tests ou pour forcer un rechargement de la configuration
 */
export function resetStorageProvider(): void {
  storageInstance = null;
}
