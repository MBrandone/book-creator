import { env } from "@/config/env";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import { AwsS3Storage } from "./aws-s3-storage";
import { MinioStorage } from "./minio-storage";
import type { Storage } from "./storage";

export function createStorage(): Storage {
	const providerType = env.STORAGE_PROVIDER;

	switch (providerType) {
		case "minio":
			getLogger().info("Storage provider selected", { provider: "minio" });
			return new MinioStorage();

		case "aws-s3":
			getLogger().info("Storage provider selected", { provider: "aws-s3" });
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
