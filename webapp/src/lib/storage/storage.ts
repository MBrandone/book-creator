import { Readable } from 'stream';

export interface Storage {
  initialize(): Promise<void>;

  uploadImage(
    file: Buffer | Readable,
    key: string,
    metadata?: Record<string, string>
  ): Promise<{ bucket: string; key: string }>;

  getImageUrl(bucket: string, key: string): string;

  getPresignedImageUrl(key: string, expirySeconds?: number): Promise<string>;

  deleteImages(keys: string[]): Promise<void>;

  imageExists(key: string): Promise<boolean>;

  listImages(prefix?: string): Promise<string[]>;

  getImageMetadata(key: string): Promise<ImageMetadata>;
}

export interface ImageMetadata {
  size: number;
  etag: string;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, any>;
}

export interface StorageConfig {
  endpoint: string;
  port?: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
}
