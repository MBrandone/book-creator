import { Readable } from 'stream';

/**
 * Interface commune pour tous les providers de storage
 * Compatible avec MinIO, AWS S3, Supabase Storage, etc.
 */
export interface StorageProvider {
  /**
   * Initialise la connexion au storage et crée le bucket si nécessaire
   */
  initialize(): Promise<void>;

  /**
   * Upload une image vers le storage
   * @param file - Le fichier à uploader (Buffer ou Readable stream)
   * @param key - La clé/nom du fichier dans le storage
   * @param metadata - Métadonnées optionnelles (content-type, etc.)
   * @returns Le bucket et la clé de l'image uploadée
   */
  uploadImage(
    file: Buffer | Readable,
    key: string,
    metadata?: Record<string, string>
  ): Promise<{ bucket: string; key: string }>;

  /**
   * Récupère l'URL publique d'une image stockée
   * @param bucket - Le nom du bucket
   * @param key - La clé/nom du fichier
   * @returns L'URL complète de l'image
   */
  getImageUrl(bucket: string, key: string): string;

  /**
   * Récupère une URL présignée pour accéder temporairement à une image
   * Utile si le bucket n'est pas public
   * @param key - La clé/nom du fichier
   * @param expirySeconds - Durée de validité de l'URL en secondes (défaut: 24h)
   * @returns URL présignée
   */
  getPresignedImageUrl(key: string, expirySeconds?: number): Promise<string>;

  /**
   * Supprime une image du storage
   * @param key - La clé/nom du fichier à supprimer
   */
  deleteImage(key: string): Promise<void>;

  /**
   * Supprime plusieurs images du storage
   * @param keys - Liste des clés/noms des fichiers à supprimer
   */
  deleteImages(keys: string[]): Promise<void>;

  /**
   * Vérifie si une image existe dans le storage
   * @param key - La clé/nom du fichier à vérifier
   * @returns true si l'image existe, false sinon
   */
  imageExists(key: string): Promise<boolean>;

  /**
   * Liste toutes les images dans le bucket
   * @param prefix - Préfixe optionnel pour filtrer les résultats
   * @returns Liste des clés des images
   */
  listImages(prefix?: string): Promise<string[]>;

  /**
   * Récupère les métadonnées d'une image
   * @param key - La clé/nom du fichier
   * @returns Les métadonnées de l'image
   */
  getImageMetadata(key: string): Promise<ImageMetadata>;
}

/**
 * Métadonnées d'une image stockée
 */
export interface ImageMetadata {
  size: number;
  etag: string;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, any>;
}

/**
 * Configuration commune pour tous les providers
 */
export interface StorageConfig {
  endpoint: string;
  port?: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
}
