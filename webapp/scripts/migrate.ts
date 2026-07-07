#!/usr/bin/env node

import { config } from 'dotenv';
import { Kysely, PostgresDialect } from 'kysely';
import { Migrator, FileMigrationProvider } from 'kysely/migration';
import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production'
  ? '.env.prod'
  : '.env.local';

config({ path: path.join(__dirname, '..', envFile) });

console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Loading config from: ${envFile}\n`);

async function main() {
  const { env } = await import('../src/config/env.js');

  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: env.POSTGRES_HOST,
        port: env.POSTGRES_PORT,
        database: env.POSTGRES_DB,
        user: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '..', 'migrations'),
    })
  });

  const command = process.argv[2] || 'latest';

  try {
    switch (command) {
      case 'latest':
        await migrateToLatest(migrator);
        break;
      case 'up':
        await migrateUp(migrator);
        break;
      case 'down':
        await migrateDown(migrator);
        break;
      default:
        console.error('❌ Unknown command. Usage: npm run db:migrate [latest|up|down]');
        process.exit(1);
    }
  } finally {
    await db.destroy();
  }
}

async function migrateToLatest(migrator: Migrator) {
  console.log('🚀 Running migrations to latest...\n');

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    if (result.status === 'Success') {
      console.log(`✓ Migration ${result.migrationName} executed successfully`);
    } else if (result.status === 'Error') {
      console.error(`❌ Migration ${result.migrationName} failed`);
    }
  });

  if (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }

  if (!results || results.length === 0) {
    console.log('✓ Already up to date');
  }

  console.log('\n✅ Migrations completed successfully!');
}

async function migrateUp(migrator: Migrator) {
  console.log('🚀 Running next migration...\n');

  const { error, results } = await migrator.migrateUp();

  results?.forEach((result) => {
    if (result.status === 'Success') {
      console.log(`✓ Migration ${result.migrationName} executed successfully`);
    } else if (result.status === 'Error') {
      console.error(`❌ Migration ${result.migrationName} failed`);
    }
  });

  if (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }

  if (!results || results.length === 0) {
    console.log('✓ Already up to date');
  }

  console.log('\n✅ Migration completed!');
}

async function migrateDown(migrator: Migrator) {
  console.log('🔄 Rolling back last migration...\n');

  const { error, results } = await migrator.migrateDown();

  results?.forEach((result) => {
    if (result.status === 'Success') {
      console.log(`✓ Migration ${result.migrationName} rolled back successfully`);
    } else if (result.status === 'Error') {
      console.error(`❌ Migration ${result.migrationName} rollback failed`);
    }
  });

  if (error) {
    console.error('\n❌ Rollback failed:', error);
    process.exit(1);
  }

  if (!results || results.length === 0) {
    console.log('✓ No migrations to roll back');
  }

  console.log('\n✅ Rollback completed!');
}

main();
