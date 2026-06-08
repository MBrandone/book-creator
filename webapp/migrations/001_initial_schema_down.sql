-- Rollback Migration 001: Initial Schema
-- Suppression des tables et types créés dans la migration initiale

-- Supprimer les triggers
DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;

-- Supprimer la fonction
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Supprimer les tables (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS generated_images CASCADE;
DROP TABLE IF EXISTS uploaded_photos CASCADE;
DROP TABLE IF EXISTS scenes CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS stories CASCADE;

-- Supprimer les types ENUM
DROP TYPE IF EXISTS scene_type;
DROP TYPE IF EXISTS story_status;

-- Note: On ne supprime pas l'extension uuid-ossp car elle peut être utilisée ailleurs
-- DROP EXTENSION IF EXISTS "uuid-ossp";
