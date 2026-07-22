import { env } from "@/config/env";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import { AwsS3Storage } from "./aws-s3-storage";
import { MinioStorage } from "./minio-storage";
import type { Storage } from "./storage";
import type { StorageProvider } from "./storage-provider";

const providers = {
	minio: () => new MinioStorage(),
	"aws-s3": () => new AwsS3Storage(),
} satisfies Record<StorageProvider, () => Storage>;

let cachedInstance: Storage | null = null;

export function getStorage(): Storage {
	if (cachedInstance) {
		return cachedInstance;
	}

	const provider = env.STORAGE_PROVIDER;
	getLogger().info("Storage provider selected", { provider });

	cachedInstance = providers[provider]();
	return cachedInstance;
}
