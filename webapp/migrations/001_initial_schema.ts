import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('stories')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('title', 'varchar(255)')
    .addColumn('description', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('pending'))
    .execute();

  await db.schema
    .createTable('characters')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('story_id', 'uuid', (col) => col.notNull().references('stories.id').onDelete('cascade'))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('image_url', 'varchar(500)')
    .execute();

  await db.schema
    .createTable('scenes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('story_id', 'uuid', (col) => col.notNull().references('stories.id').onDelete('cascade'))
    .addColumn('scene_number', 'integer', (col) => col.notNull())
    .addColumn('scene_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('image_url', 'varchar(500)')
    .addColumn('prompt', 'text')
    .addCheckConstraint('scenes_scene_number_check', sql`scene_number BETWEEN 1 AND 4`)
    .addUniqueConstraint('scenes_story_scene_unique', ['story_id', 'scene_number'])
    .execute();

  await db.schema
    .createTable('uploaded_photos')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('url', 'varchar(500)', (col) => col.notNull())
    .addColumn('character_id', 'uuid', (col) => col.notNull().references('characters.id').onDelete('cascade'))
    .execute();

  await db.schema
    .createTable('generated_images')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('story_id', 'uuid', (col) => col.notNull().references('stories.id').onDelete('cascade'))
    .addColumn('scene_id', 'uuid', (col) => col.notNull().references('scenes.id').onDelete('cascade'))
    .addColumn('url', 'varchar(500)', (col) => col.notNull())
    .execute();

  await db.schema.createIndex('idx_characters_story_id').on('characters').column('story_id').execute();
  await db.schema.createIndex('idx_scenes_story_id').on('scenes').column('story_id').execute();
  await db.schema.createIndex('idx_scenes_scene_number').on('scenes').columns(['story_id', 'scene_number']).execute();
  await db.schema.createIndex('idx_uploaded_photos_character_id').on('uploaded_photos').column('character_id').execute();
  await db.schema.createIndex('idx_generated_images_story_id').on('generated_images').column('story_id').execute();
  await db.schema.createIndex('idx_generated_images_scene_id').on('generated_images').column('scene_id').execute();
  await db.schema.createIndex('idx_stories_status').on('stories').column('status').execute();
  await db.schema.createIndex('idx_stories_created_at').on('stories').column('created_at').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('generated_images').ifExists().cascade().execute();
  await db.schema.dropTable('uploaded_photos').ifExists().cascade().execute();
  await db.schema.dropTable('scenes').ifExists().cascade().execute();
  await db.schema.dropTable('characters').ifExists().cascade().execute();
  await db.schema.dropTable('stories').ifExists().cascade().execute();
}
