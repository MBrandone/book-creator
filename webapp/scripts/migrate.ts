#!/usr/bin/env node

/**
 * Script de migration de base de données
 * Usage: npm run db:migrate
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';

// Charger les variables d'environnement depuis .env.local
config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'bookstory',
  user: process.env.POSTGRES_USER || 'bookstory',
  password: process.env.POSTGRES_PASSWORD || 'bookstory',
});

// Table pour tracker les migrations
const MIGRATIONS_TABLE = 'schema_migrations';

async function createMigrationsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log(`✓ Table ${MIGRATIONS_TABLE} créée ou déjà existante`);
  } finally {
    client.release();
  }
}

async function getExecutedMigrations(): Promise<Set<string>> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT migration_name FROM ${MIGRATIONS_TABLE} ORDER BY id`
    );
    return new Set(result.rows.map(row => row.migration_name));
  } finally {
    client.release();
  }
}

async function executeMigration(migrationName: string, sqlContent: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Exécuter le SQL de la migration
    await client.query(sqlContent);
    
    // Enregistrer la migration comme exécutée
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (migration_name) VALUES ($1)`,
      [migrationName]
    );
    
    await client.query('COMMIT');
    console.log(`✓ Migration ${migrationName} exécutée avec succès`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function rollbackLastMigration() {
  try {
    console.log('🔄 Rollback de la dernière migration...\n');
    
    // Créer la table de tracking si elle n'existe pas
    await createMigrationsTable();
    
    // Récupérer la dernière migration exécutée
    let client = await pool.connect();
    let lastMigration: string;
    
    try {
      const result = await client.query(
        `SELECT migration_name FROM ${MIGRATIONS_TABLE} ORDER BY id DESC LIMIT 1`
      );
      
      if (result.rows.length === 0) {
        console.log('ℹ️  Aucune migration à rollback');
        return;
      }
      
      lastMigration = result.rows[0].migration_name;
      console.log(`📋 Migration à rollback: ${lastMigration}\n`);
    } finally {
      client.release();
    }
    
    // Chercher le fichier de rollback correspondant
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const downFileName = lastMigration.replace('.sql', '_down.sql');
    const downFilePath = path.join(migrationsDir, downFileName);
    
    try {
      const downSql = await fs.readFile(downFilePath, 'utf-8');
      
      // Exécuter le rollback
      client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        console.log(`⚙️  Exécution du rollback ${downFileName}...`);
        await client.query(downSql);
        
        // Supprimer l'entrée de la table de migrations
        await client.query(
          `DELETE FROM ${MIGRATIONS_TABLE} WHERE migration_name = $1`,
          [lastMigration]
        );
        
        await client.query('COMMIT');
        console.log(`✓ Rollback de ${lastMigration} réussi`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.error(`❌ Fichier de rollback non trouvé: ${downFileName}`);
        console.error('   Créez ce fichier pour pouvoir rollback cette migration');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Rollback terminé avec succès!');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du rollback:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function runMigrations() {
  try {
    console.log('🚀 Démarrage des migrations...\n');
    
    // Créer la table de tracking des migrations
    await createMigrationsTable();
    
    // Récupérer les migrations déjà exécutées
    const executedMigrations = await getExecutedMigrations();
    console.log(`📋 Migrations déjà exécutées: ${executedMigrations.size}\n`);
    
    // Lire le répertoire des migrations
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = await fs.readdir(migrationsDir);
    
    // Filtrer et trier les fichiers SQL (exclure les fichiers _down.sql)
    const migrationFiles = files
      .filter(file => file.endsWith('.sql') && !file.endsWith('_down.sql'))
      .sort();
    
    console.log(`📁 Fichiers de migration trouvés: ${migrationFiles.length}\n`);
    
    // Exécuter les migrations non encore appliquées
    let appliedCount = 0;
    for (const file of migrationFiles) {
      if (!executedMigrations.has(file)) {
        console.log(`⚙️  Exécution de ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sqlContent = await fs.readFile(filePath, 'utf-8');
        await executeMigration(file, sqlContent);
        appliedCount++;
      } else {
        console.log(`⏭️  Migration ${file} déjà exécutée`);
      }
    }
    
    console.log(`\n✅ Migrations terminées avec succès!`);
    console.log(`   ${appliedCount} nouvelle(s) migration(s) appliquée(s)`);
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution des migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Déterminer la commande (up par défaut, ou down)
const command = process.argv[2] || 'up';

if (command === 'down') {
  rollbackLastMigration();
} else if (command === 'up') {
  runMigrations();
} else {
  console.error('❌ Commande inconnue. Usage: npm run db:migrate [up|down]');
  process.exit(1);
}
