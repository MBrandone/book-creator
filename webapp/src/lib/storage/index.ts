/**
 * MinIO Storage Module
 * 
 * Export toutes les fonctions et le client MinIO pour faciliter les imports
 */

export {
  minioClient,
  bucketName,
  initializeMinIO,
  uploadImage,
  getImageUrl,
  getPresignedImageUrl,
  deleteImage,
  deleteImages,
  imageExists,
  listImages,
  getImageMetadata,
} from './minio';
