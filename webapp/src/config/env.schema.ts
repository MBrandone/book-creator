import { z } from "zod";

export const publicEnvSchema = z.object({});

export const envSchema = z.object({
	...publicEnvSchema.shape,

	NODE_ENV: z.enum(["development", "production"]),

	POSTGRES_HOST: z.string().min(1, "POSTGRES_HOST est requis"),
	POSTGRES_PORT: z.coerce.number().int().min(1).max(65535),
	POSTGRES_DB: z.string().min(1, "POSTGRES_DB est requis"),
	POSTGRES_USER: z.string().min(1, "POSTGRES_USER est requis"),
	POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD est requis"),

	STORAGE_PROVIDER: z.enum(["minio", "aws-s3"]),
	STORAGE_ENDPOINT: z.string().min(1, "STORAGE_ENDPOINT est requis"),
	STORAGE_PORT: z.coerce.number().int().positive().optional(),
	STORAGE_USE_SSL: z.preprocess(
		(value) => (value === "false" ? "" : value),
		z.coerce.boolean()
	),
	STORAGE_ACCESS_KEY: z.string().min(1, "STORAGE_ACCESS_KEY est requis"),
	STORAGE_SECRET_KEY: z.string().min(1, "STORAGE_SECRET_KEY est requis"),
	STORAGE_BUCKET: z.string().min(1, "STORAGE_BUCKET est requis"),
	STORAGE_REGION: z.string().min(1, "STORAGE_REGION est requis"),
	STORAGE_PUBLIC_BASE_URL: z
		.string()
		.url("STORAGE_PUBLIC_BASE_URL doit être une URL valide"),

	REPLICATE_API_TOKEN: z.string().min(1, "REPLICATE_API_TOKEN est requis"),

	STORY_PROVIDER: z.enum(["ollama", "replicate", "mock"]),
	IMAGE_GENERATION_PROVIDER: z.enum(["replicate", "mock"]),
	OLLAMA_BASE_URL: z.string().url(),
	OLLAMA_MODEL: z.string().min(1, "OLLAMA_MODEL est requis"),

	MAX_FILE_SIZE: z.coerce.number().int().positive(),
	ALLOWED_IMAGE_TYPES: z.string().min(1, "ALLOWED_IMAGE_TYPES est requis"),

	STORY_GENERATION_TIMEOUT: z.coerce.number().int().positive(),
	IMAGE_GENERATION_TIMEOUT: z.coerce.number().int().positive(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type Env = z.infer<typeof envSchema>;
