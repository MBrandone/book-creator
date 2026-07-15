import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await sql`ALTER TABLE scenes DROP CONSTRAINT scenes_scene_number_check`.execute(
		db
	);
	await sql`ALTER TABLE scenes ADD CONSTRAINT scenes_scene_number_check CHECK (scene_number BETWEEN 0 AND 4)`.execute(
		db
	);
}

export async function down(db: Kysely<any>): Promise<void> {
	await sql`ALTER TABLE scenes DROP CONSTRAINT scenes_scene_number_check`.execute(
		db
	);
	await sql`ALTER TABLE scenes ADD CONSTRAINT scenes_scene_number_check CHECK (scene_number BETWEEN 1 AND 4)`.execute(
		db
	);
}
