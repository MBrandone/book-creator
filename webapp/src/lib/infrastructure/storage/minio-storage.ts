import * as Minio from "minio";
import { Readable } from "stream";
import { env } from "@/config/env";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import type {
	ImageMetadata,
	Storage,
	StorageConfig,
} from "@/lib/infrastructure/storage/storage";

export class MinioStorage implements Storage {
	private client: Minio.Client;
	private config: StorageConfig;

	constructor() {
		this.config = this.loadConfig();
		this.client = this.createClient();
	}

	private loadConfig(): StorageConfig {
		return {
			endpoint: env.STORAGE_ENDPOINT,
			port: env.STORAGE_PORT,
			useSSL: env.STORAGE_USE_SSL,
			accessKey: env.STORAGE_ACCESS_KEY,
			secretKey: env.STORAGE_SECRET_KEY,
			bucket: env.STORAGE_BUCKET,
			region: env.STORAGE_REGION,
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
				getLogger().info("Bucket créé avec succès", {
					bucket: this.config.bucket,
				});

				const policy = {
					Version: "2012-10-17",
					Statement: [
						{
							Effect: "Allow",
							Principal: { AWS: ["*"] },
							Action: ["s3:GetObject"],
							Resource: [`arn:aws:s3:::${this.config.bucket}/*`],
						},
					],
				};

				await this.client.setBucketPolicy(
					this.config.bucket,
					JSON.stringify(policy)
				);
				getLogger().info("Politique de lecture publique configurée", {
					bucket: this.config.bucket,
				});
			} else {
				getLogger().info("Bucket existe déjà", { bucket: this.config.bucket });
			}

			await this.client.listBuckets();
			getLogger().info("Connexion MinIO établie avec succès");
		} catch (error) {
			getLogger().error("Erreur lors de l'initialisation de MinIO", {
				error: String(error),
			});
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
				"Content-Type":
					metadata?.["Content-Type"] || "application/octet-stream",
				...metadata,
			};

			await this.client.putObject(
				this.config.bucket,
				key,
				stream,
				size,
				metaData
			);

			getLogger().info("Image uploadée avec succès", { key });

			return { bucket: this.config.bucket, key };
		} catch (error) {
			getLogger().error("Erreur lors de l'upload de l'image", {
				key,
				error: String(error),
			});
			throw new Error(
				`Échec de l'upload de l'image: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	getImageUrl(bucket: string, key: string): string {
		return `${env.STORAGE_PUBLIC_BASE_URL}/${bucket}/${key}`;
	}

	async getImageBuffer(key: string): Promise<Buffer> {
		try {
			const stream = await this.client.getObject(this.config.bucket, key);
			const chunks: Buffer[] = [];

			for await (const chunk of stream) {
				chunks.push(Buffer.from(chunk));
			}

			const buffer = Buffer.concat(chunks);
			getLogger().info("Image buffer récupéré", { key, bytes: buffer.length });
			return buffer;
		} catch (error) {
			getLogger().error("Erreur lors de la récupération du buffer", {
				key,
				error: String(error),
			});
			throw new Error(
				`Échec de la récupération de l'image: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	async getPresignedUploadUrl(
		key: string,
		contentType: string,
		expirySeconds: number = 900
	): Promise<string> {
		try {
			const url = await this.client.presignedPutObject(
				this.config.bucket,
				key,
				expirySeconds
			);
			return url;
		} catch (error) {
			getLogger().error(
				"Erreur lors de la génération de l'URL présignée d'upload",
				{ key, error: String(error) }
			);
			throw new Error(
				`Échec de la génération de l'URL d'upload: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	async deleteImages(keys: string[]): Promise<void> {
		try {
			await this.client.removeObjects(this.config.bucket, keys);
			getLogger().info("Images supprimées avec succès", { count: keys.length });
		} catch (error) {
			getLogger().error("Erreur lors de la suppression des images", {
				error: String(error),
			});
			throw new Error(
				`Échec de la suppression des images: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	async imageExists(key: string): Promise<boolean> {
		try {
			await this.client.statObject(this.config.bucket, key);
			return true;
		} catch {
			return false;
		}
	}

	async listImages(prefix?: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			const images: string[] = [];
			const stream = this.client.listObjects(this.config.bucket, prefix, true);

			stream.on("data", (obj) => {
				if (obj.name) {
					images.push(obj.name);
				}
			});

			stream.on("end", () => {
				resolve(images);
			});

			stream.on("error", (err) => {
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
				contentType: stat.metaData?.["content-type"],
				metadata: stat.metaData,
			};
		} catch (error) {
			getLogger().error("Erreur lors de la récupération des métadonnées", {
				key,
				error: String(error),
			});
			throw new Error(
				`Échec de la récupération des métadonnées: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}
}
