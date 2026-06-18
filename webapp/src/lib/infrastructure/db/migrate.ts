import { Kysely, PostgresDialect } from 'kysely';
import { Migrator, FileMigrationProvider } from 'kysely/migration';
import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';

function createMigrator() {
  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'bookstory',
        user: process.env.POSTGRES_USER || 'bookstory',
        password: process.env.POSTGRES_PASSWORD || 'bookstory',
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(process.cwd(), 'migrations'),
    }),
    migrationTableName: 'schema_migrations',
    migrationLockTableName: 'schema_migrations_lock',
  });

  return { db, migrator };
}

export async function runMigrationsSync(): Promise<void> {
  const { db, migrator } = createMigrator();

  try {
    console.log('🚀 [Migrations] Vérification des migrations en attente...');

    const { error, results } = await migrator.migrateToLatest();

    if (error) {
      console.error('❌ [Migrations] Erreur lors de l\'exécution des migrations:', error);
      throw error;
    }

    if (!results || results.length === 0) {
      console.log('✓ [Migrations] Base de données à jour, aucune migration nécessaire');
      return;
    }

    results.forEach((result) => {
      if (result.status === 'Success') {
        console.log(`✓ [Migrations] ${result.migrationName} exécutée avec succès`);
      } else if (result.status === 'Error') {
        console.error(`❌ [Migrations] ${result.migrationName} a échoué`);
      }
    });

    console.log(`✅ [Migrations] ${results.length} migration(s) appliquée(s) avec succès`);
  } catch (error) {
    console.error('❌ [Migrations] Échec de la migration de la base de données:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

export async function checkPendingMigrations(): Promise<string[]> {
  const { db, migrator } = createMigrator();

  try {
    const migrations = await migrator.getMigrations();
    const pending = migrations
      .filter(m => m.executedAt === undefined)
      .map(m => m.name);

    return pending;
  } finally {
    await db.destroy();
  }
}
