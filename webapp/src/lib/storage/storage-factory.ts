import type { Storage } from './storage';
import { MinioStorage } from './minio-storage';
import { AwsS3Storage } from './aws-s3-storage';

export type StorageProviderType = 'minio' | 'aws-s3';

export function createStorage(): Storage {
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

let storageInstance: Storage | null = null;

export function getStorage(): Storage {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}
