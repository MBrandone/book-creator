/**
 * Storage Module
 * 
 * Point d'entrée unifié pour le système de storage
 * Utilise automatiquement le provider configuré (MinIO ou AWS S3)
 */

import { getStorageProvider } from './storage-factory';
import {Readable} from "stream";

const storage = getStorageProvider();

/**
 * Initialise la connexion au storage et crée le bucket si nécessaire
 */
export async function initializeStorage(): Promise<void> {
  return storage.initialize();
}

/**
 * Upload une image vers le storage
 * @param file - Le fichier à uploader (Buffer ou Readable stream)
 * @param key - La clé/nom du fichier dans le storage
 * @param metadata - Métadonnées optionnelles (content-type, etc.)
 * @returns L'URL de l'image uploadée
 */
export async function uploadImage(
  file: Buffer | NodeJS.ReadableStream,
  key: string,
  metadata?: Record<string, string>
): Promise<string> {
  return storage.uploadImage(file as Buffer<ArrayBufferLike> | Readable, key, metadata);
}

/**
 * Récupère l'URL publique d'une image stockée
 * @param key - La clé/nom du fichier
 * @returns L'URL complète de l'image
 */
export function getImageUrl(key: string): string {
  return storage.getImageUrl(key);
}

/**
 * Récupère une URL présignée pour accéder temporairement à une image
 * @param key - La clé/nom du fichier
 * @param expirySeconds - Durée de validité de l'URL en secondes (défaut: 24h)
 * @returns URL présignée
 */
export async function getPresignedImageUrl(
  key: string,
  expirySeconds?: number
): Promise<string> {
  return storage.getPresignedImageUrl(key, expirySeconds);
}

/**
 * Supprime une image du storage
 * @param key - La clé/nom du fichier à supprimer
 */
export async function deleteImage(key: string): Promise<void> {
  return storage.deleteImage(key);
}

/**
 * Supprime plusieurs images du storage
 * @param keys - Liste des clés/noms des fichiers à supprimer
 */
export async function deleteImages(keys: string[]): Promise<void> {
  return storage.deleteImages(keys);
}

/**
 * Vérifie si une image existe dans le storage
 * @param key - La clé/nom du fichier à vérifier
 * @returns true si l'image existe, false sinon
 */
export async function imageExists(key: string): Promise<boolean> {
  return storage.imageExists(key);
}

/**
 * Liste toutes les images dans le bucket
 * @param prefix - Préfixe optionnel pour filtrer les résultats
 * @returns Liste des clés des images
 */
export async function listImages(prefix?: string): Promise<string[]> {
  return storage.listImages(prefix);
}

/**
 * Récupère les métadonnées d'une image
 * @param key - La clé/nom du fichier
 * @returns Les métadonnées de l'image
 */
export async function getImageMetadata(key: string) {
  return storage.getImageMetadata(key);
}

// Export des types et interfaces pour utilisation externe
export type { StorageProvider, ImageMetadata, StorageConfig } from './storage-interface';
export type { StorageProviderType } from './storage-factory';

// Alias pour la rétrocompatibilité
export const initializeMinIO = initializeStorage;

// Export de la factory pour usage avancé
export { getStorageProvider, createStorageProvider, resetStorageProvider } from './storage-factory';
