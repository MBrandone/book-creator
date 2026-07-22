export const STORAGE_PROVIDERS = ["minio", "aws-s3"] as const;

export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];
