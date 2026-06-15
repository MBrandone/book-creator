#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Please provide a migration name');
  console.error('Usage: npm run db:migrate:create <migration_name>');
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[-:T]/g, '')
  .split('.')[0];

const fileName = `${timestamp}_${migrationName}.ts`;
const migrationsDir = path.join(__dirname, '..', 'migrations');
const filePath = path.join(migrationsDir, fileName);

const template = `import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  
}

export async function down(db: Kysely<any>): Promise<void> {
  
}
`;

async function createMigration() {
  try {
    await fs.mkdir(migrationsDir, { recursive: true });
    await fs.writeFile(filePath, template, 'utf-8');
    console.log(`✅ Migration created: ${fileName}`);
  } catch (error) {
    console.error('❌ Failed to create migration:', error);
    process.exit(1);
  }
}

createMigration();
