import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import type { StorageProvider, ImageMetadata, StorageConfig } from './storage-interface';

export class AwsS3Storage implements StorageProvider {
  private client: S3Client;
  private config: StorageConfig;

  constructor() {
    this.config = this.loadConfig();
    this.client = this.createClient();
  }

  private loadConfig(): StorageConfig {
    return {
      endpoint: process.env.STORAGE_ENDPOINT || 'localhost',
      port: process.env.STORAGE_PORT ? Number.parseInt(process.env.STORAGE_PORT) : undefined,
      useSSL: process.env.STORAGE_USE_SSL === 'true',
      accessKey: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
      bucket: process.env.STORAGE_BUCKET || 'book-images',
      region: process.env.STORAGE_REGION || 'us-east-1',
    };
  }

  private createClient(): S3Client {
    const protocol = this.config.useSSL ? 'https' : 'http';
    const port = this.config.port ? `:${this.config.port}` : '';
    const endpoint = `${protocol}://${this.config.endpoint}${port}`;

    return new S3Client({
      endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      forcePathStyle: true, // Requis pour MinIO et certains services S3-compatible
    });
  }

  async initialize(): Promise<void> {
    try {
      try {
        await this.client.send(
          new HeadBucketCommand({
            Bucket: this.config.bucket,
          })
        );
        console.log(`✅ Bucket "${this.config.bucket}" existe déjà`);
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          await this.client.send(
            new CreateBucketCommand({
              Bucket: this.config.bucket,
            })
          );
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

          await this.client.send(
            new PutBucketPolicyCommand({
              Bucket: this.config.bucket,
              Policy: JSON.stringify(policy),
            })
          );
          console.log(`✅ Politique de lecture publique configurée pour le bucket "${this.config.bucket}"`);
        } else {
          throw error;
        }
      }

      console.log('✅ Connexion AWS S3 établie avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du storage AWS S3:', error);
      throw error;
    }
  }

  async uploadImage(
    file: Buffer | Readable,
    key: string,
    metadata?: Record<string, string>
  ): Promise<{ bucket: string; key: string }> {
    try {
      let body: Buffer;
      if (Buffer.isBuffer(file)) {
        body = file;
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of file) {
          chunks.push(Buffer.from(chunk));
        }
        body = Buffer.concat(chunks);
      }

      const contentType = metadata?.['Content-Type'] || 'application/octet-stream';

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          Metadata: metadata,
        })
      );

      console.log(`✅ Image uploadée avec succès: ${key}`);

      return { bucket: this.config.bucket, key };
    } catch (error) {
      console.error(`❌ Erreur lors de l'upload de l'image ${key}:`, error);
      throw new Error(
        `Échec de l'upload de l'image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Récupère l'URL publique d'une image
   */
  getImageUrl(bucket: string, key: string): string {
    const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL!;
    return `${publicBaseUrl}/${bucket}/${key}`;
  }

  /**
   * Récupère une URL présignée pour accéder temporairement à une image
   */
  async getPresignedImageUrl(key: string, expirySeconds: number = 86400): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: expirySeconds,
      });

      return url;
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de l'URL présignée pour ${key}:`, error);
      throw new Error(
        `Échec de la génération de l'URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Supprime une image
   */
  async deleteImage(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      );
      console.log(`✅ Image supprimée avec succès: ${key}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de l'image ${key}:`, error);
      throw new Error(
        `Échec de la suppression de l'image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Supprime plusieurs images
   */
  async deleteImages(keys: string[]): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.config.bucket,
          Delete: {
            Objects: keys.map((key) => ({ Key: key })),
          },
        })
      );
      console.log(`✅ ${keys.length} images supprimées avec succès`);
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des images:`, error);
      throw new Error(
        `Échec de la suppression des images: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Vérifie si une image existe
   */
  async imageExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Liste toutes les images dans le bucket
   */
  async listImages(prefix?: string): Promise<string[]> {
    try {
      const images: string[] = [];
      let continuationToken: string | undefined;

      do {
        const response = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.config.bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          })
        );

        if (response.Contents) {
          for (const obj of response.Contents) {
            if (obj.Key) {
              images.push(obj.Key);
            }
          }
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return images;
    } catch (error) {
      console.error('❌ Erreur lors du listing des images:', error);
      throw new Error(
        `Échec du listing des images: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Récupère les métadonnées d'une image
   */
  async getImageMetadata(key: string): Promise<ImageMetadata> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      );

      return {
        size: response.ContentLength || 0,
        etag: response.ETag || '',
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des métadonnées pour ${key}:`, error);
      throw new Error(
        `Échec de la récupération des métadonnées: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
