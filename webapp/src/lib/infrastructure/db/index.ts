import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from './schema';

// Configuration de la connexion PostgreSQL
const dialect = new PostgresDialect({
  pool: new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number.parseInt(process.env.POSTGRES_PORT || "5432"),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    max: 10,
  }),
});

// Création de l'instance Kysely
export const db = new Kysely<Database>({
  dialect,
});

// Export des types pour utilisation dans l'application
export type { Database } from './schema';
export * from './schema';
