import * as Minio from 'minio';
import { Readable } from 'stream';
import {StorageConfig, Storage, ImageMetadata} from "@/lib/storage/storage";

export class MinioStorage implements Storage {
  private client: Minio.Client;
  private config: StorageConfig;

  constructor() {
    this.config = this.loadConfig();
    this.client = this.createClient();
  }

  private loadConfig(): StorageConfig {
    return {
      endpoint: process.env.STORAGE_ENDPOINT || 'localhost',
      port: process.env.STORAGE_PORT ? Number.parseInt(process.env.STORAGE_PORT) : 9000,
      useSSL: process.env.STORAGE_USE_SSL === 'true',
      accessKey: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
      bucket: process.env.STORAGE_BUCKET || 'book-images',
      region: process.env.STORAGE_REGION || 'us-east-1',
    };
  }

  private createClient(): Minio.Client {
    return new Minio.Client({
      endPoint: this.config.endpoint,
      port: this.config.port,
      useSSL: this.config.useSSL,
      accessKey: this.config.accessKey,
      secretKey: this.config.secretKey,
    });
  }

  async initialize(): Promise<void> {
    try {
      const bucketExists = await this.client.bucketExists(this.config.bucket);

      if (!bucketExists) {
        await this.client.makeBucket(this.config.bucket, this.config.region);
        console.log(`✅ Bucket "${this.config.bucket}" créé avec succès`);

        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.config.bucket}/*`],
            },
          ],
        };

        await this.client.setBucketPolicy(this.config.bucket, JSON.stringify(policy));
        console.log(`✅ Politique de lecture publique configurée pour le bucket "${this.config.bucket}"`);
      } else {
        console.log(`✅ Bucket "${this.config.bucket}" existe déjà`);
      }

      await this.client.listBuckets();
      console.log('✅ Connexion MinIO établie avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de MinIO:', error);
      throw error;
    }
  }

  async uploadImage(
    file: Buffer | Readable,
    key: string,
    metadata?: Record<string, string>
  ): Promise<{ bucket: string; key: string }> {
    try {
      let size: number;
      let stream: Readable;

      if (Buffer.isBuffer(file)) {
        size = file.length;
        stream = Readable.from(file);
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of file) {
          chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        size = buffer.length;
        stream = Readable.from(buffer);
      }

      const metaData = {
        'Content-Type': metadata?.['Content-Type'] || 'application/octet-stream',
        ...metadata,
      };

      await this.client.putObject(this.config.bucket, key, stream, size, metaData);

      console.log(`✅ Image uploadée avec succès: ${key}`);

      return { bucket: this.config.bucket, key };
    } catch (error) {
      console.error(`❌ Erreur lors de l'upload de l'image ${key}:`, error);
      throw new Error(
        `Échec de l'upload de l'image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getImageUrl(bucket: string, key: string): string {
    const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL!;
    return `${publicBaseUrl}/${bucket}/${key}`;
  }

  async getPresignedImageUrl(key: string, expirySeconds: number = 86400): Promise<string> {
    try {
      const url = await this.client.presignedGetObject(this.config.bucket, key, expirySeconds);
      return url;
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de l'URL présignée pour ${key}:`, error);
      throw new Error(
        `Échec de la génération de l'URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async deleteImages(keys: string[]): Promise<void> {
    try {
      await this.client.removeObjects(this.config.bucket, keys);
      console.log(`✅ ${keys.length} images supprimées avec succès`);
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des images:`, error);
      throw new Error(
        `Échec de la suppression des images: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async imageExists(key: string): Promise<boolean> {
    try {
      await this.client.statObject(this.config.bucket, key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async listImages(prefix?: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const images: string[] = [];
      const stream = this.client.listObjects(this.config.bucket, prefix, true);

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

  async getImageMetadata(key: string): Promise<ImageMetadata> {
    try {
      const stat = await this.client.statObject(this.config.bucket, key);
      return {
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
        contentType: stat.metaData?.['content-type'],
        metadata: stat.metaData,
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des métadonnées pour ${key}:`, error);
      throw new Error(
        `Échec de la récupération des métadonnées: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
