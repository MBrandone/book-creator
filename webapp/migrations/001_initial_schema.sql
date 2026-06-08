-- Migration 001: Initial Schema
-- Création des tables principales pour le système de génération d'histoires

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types ENUM
CREATE TYPE story_status AS ENUM ('pending', 'generating', 'completed', 'failed');
CREATE TYPE scene_type AS ENUM ('introduction', 'conflict', 'action', 'resolution');

-- Table stories
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status story_status NOT NULL DEFAULT 'pending'
);

-- Table characters
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500)
);

-- Table scenes
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    scene_type scene_type NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    prompt TEXT,
    CONSTRAINT scenes_scene_number_check CHECK (scene_number BETWEEN 1 AND 4),
    CONSTRAINT scenes_story_scene_unique UNIQUE (story_id, scene_number)
);

-- Table uploaded_photos
CREATE TABLE uploaded_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(500) NOT NULL,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE
);

-- Table generated_images
CREATE TABLE generated_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL
);

-- Index pour améliorer les performances
CREATE INDEX idx_characters_story_id ON characters(story_id);
CREATE INDEX idx_scenes_story_id ON scenes(story_id);
CREATE INDEX idx_scenes_scene_number ON scenes(story_id, scene_number);
CREATE INDEX idx_uploaded_photos_character_id ON uploaded_photos(character_id);
CREATE INDEX idx_generated_images_story_id ON generated_images(story_id);
CREATE INDEX idx_generated_images_scene_id ON generated_images(scene_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la table stories
CREATE TRIGGER update_stories_updated_at
BEFORE UPDATE ON stories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
