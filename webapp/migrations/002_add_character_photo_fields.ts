import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('characters')
    .addColumn('photo_storage_bucket', 'varchar(255)')
    .addColumn('photo_storage_key', 'varchar(512)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('characters')
    .dropColumn('photo_storage_bucket')
    .dropColumn('photo_storage_key')
    .execute();
}
