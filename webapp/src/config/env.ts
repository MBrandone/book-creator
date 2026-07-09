import { envSchema } from "./env.schema";

function validateEnv() {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		console.error("❌ Configuration invalide au runtime");
		console.error(result.error.flatten().fieldErrors);
		process.exit(1);
	}

	return result.data;
}

export const env = validateEnv();

export type { Env, PublicEnv } from "./env.schema";
