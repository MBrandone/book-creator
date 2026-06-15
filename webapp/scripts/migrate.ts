#!/usr/bin/env node

import { config } from 'dotenv';
import { Kysely, PostgresDialect } from 'kysely';
import { Migrator, FileMigrationProvider } from 'kysely/migration';
import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';

config({ path: path.join(__dirname, '..', '.env.local') });

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
    migrationFolder: path.join(__dirname, '..', 'migrations'),
  }),
  migrationTableName: 'schema_migrations',
  migrationLockTableName: 'schema_migrations_lock',
});

async function migrateToLatest() {
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

async function migrateUp() {
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

async function migrateDown() {
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

async function main() {
  const command = process.argv[2] || 'latest';

  try {
    switch (command) {
      case 'latest':
        await migrateToLatest();
        break;
      case 'up':
        await migrateUp();
        break;
      case 'down':
        await migrateDown();
        break;
      default:
        console.error('❌ Unknown command. Usage: npm run db:migrate [latest|up|down]');
        process.exit(1);
    }
  } finally {
    await db.destroy();
  }
}

main();
