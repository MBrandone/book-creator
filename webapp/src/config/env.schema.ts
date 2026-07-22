import { z } from "zod";
import {
	NON_SENTRY_LOGGER_PROVIDERS,
	SENTRY_LOGGER_PROVIDER,
} from "../lib/infrastructure/logging/logger-provider";
import { STORAGE_PROVIDERS } from "../lib/infrastructure/storage/storage-provider";
import { SCENE_IMAGE_GENERATOR_PROVIDERS } from "../lib/scene-image-generator/scene-image-generator-provider";
import { STORY_SCENES_DESCRIPTION_GENERATOR_PROVIDERS } from "../lib/story-scenes-description-generator/story-scenes-description-generator-provider";

export const publicEnvSchema = z.object({
	NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
});

const baseEnvSchema = z.object({
	...publicEnvSchema.shape,

	NODE_ENV: z.enum(["development", "production"]),

	POSTGRES_HOST: z.string().min(1, "POSTGRES_HOST est requis"),
	POSTGRES_PORT: z.coerce.number().int().min(1).max(65535),
	POSTGRES_DB: z.string().min(1, "POSTGRES_DB est requis"),
	POSTGRES_USER: z.string().min(1, "POSTGRES_USER est requis"),
	POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD est requis"),

	STORAGE_PROVIDER: z.enum(STORAGE_PROVIDERS),
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

	STORY_PROVIDER: z.enum(STORY_SCENES_DESCRIPTION_GENERATOR_PROVIDERS),
	IMAGE_GENERATION_PROVIDER: z.enum(SCENE_IMAGE_GENERATOR_PROVIDERS),
	OLLAMA_BASE_URL: z.url(),
	OLLAMA_MODEL: z.string().min(1, "OLLAMA_MODEL est requis"),

	MAX_FILE_SIZE: z.coerce.number().int().positive(),
	ALLOWED_IMAGE_TYPES: z.string().min(1, "ALLOWED_IMAGE_TYPES est requis"),

	STORY_GENERATION_TIMEOUT: z.coerce.number().int().positive(),
	IMAGE_GENERATION_TIMEOUT: z.coerce.number().int().positive(),
});

const sentryLogsSchema = z.object({
	LOGS_PROVIDER: z.literal(SENTRY_LOGGER_PROVIDER),
	NEXT_PUBLIC_SENTRY_DSN: z.string().url("NEXT_PUBLIC_SENTRY_DSN est requis"),
	SENTRY_DSN: z.url("SENTRY_DSN est requis"),
	SENTRY_ORG: z.string().min(1, "SENTRY_ORG est requis"),
	SENTRY_PROJECT: z.string().min(1, "SENTRY_PROJECT est requis"),
	SENTRY_AUTH_TOKEN: z.string().min(1, "SENTRY_AUTH_TOKEN est requis"),
});

const otherLogsSchema = z.object({
	LOGS_PROVIDER: z.enum(NON_SENTRY_LOGGER_PROVIDERS),
});

export const envSchema = z.intersection(
	baseEnvSchema,
	z.discriminatedUnion("LOGS_PROVIDER", [sentryLogsSchema, otherLogsSchema])
);

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type Env = z.infer<typeof envSchema>;
