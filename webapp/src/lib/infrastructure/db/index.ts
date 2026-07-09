import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { env } from "@/config/env";
import type { Database } from "./schema";

const dialect = new PostgresDialect({
	pool: new Pool({
		host: env.POSTGRES_HOST,
		port: env.POSTGRES_PORT,
		database: env.POSTGRES_DB,
		user: env.POSTGRES_USER,
		password: env.POSTGRES_PASSWORD,
		max: 10,
	}),
});

export const db = new Kysely<Database>({
	dialect,
});

export type { Database } from "./schema";
export * from "./schema";
