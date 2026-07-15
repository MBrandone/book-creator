import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateAStoryCommandHandler } from "@/lib/application/handlers/command/create-a-story/create-a-story-command-handler";
import { DuplicateStoryError } from "@/lib/application/handlers/command/create-a-story/duplicate-story-error";
import { ListStoriesQueryHandler } from "@/lib/application/handlers/query/list-stories/list-stories-query-handler";
import { SqlStoryReadModel } from "@/lib/infrastructure/read-model/sql-story-read-model";
import { SqlStoryRepository } from "@/lib/infrastructure/repositories/story-repository/sql-story-repository";

export async function GET() {
	try {
		const storyReadModel = new SqlStoryReadModel();
		const queryHandler = new ListStoriesQueryHandler(storyReadModel);
		const stories = await queryHandler.execute();

		return NextResponse.json({ stories });
	} catch (error) {
		console.error("Erreur lors de la récupération des histoires:", error);
		return new NextResponse(null, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validationResult = createStorySchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Validation échouée",
					details: validationResult.error.issues.map((err) => ({
						path: err.path.join("."),
						message: err.message,
					})),
				},
				{ status: 400 }
			);
		}

		const storyRepository = new SqlStoryRepository();
		const commandHandler = new CreateAStoryCommandHandler(storyRepository);
		await commandHandler.execute(validationResult.data);

		return new NextResponse(null, { status: 201 });
	} catch (error) {
		if (error instanceof DuplicateStoryError) {
			return new NextResponse(null, { status: 409 });
		}
		console.error("Erreur serveur lors de la création de la story:", error);
		return new NextResponse(null, { status: 500 });
	}
}

const createStorySchema = z.object({
	id: z.uuid("L'ID doit être un UUID valide"),
	title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
	description: z
		.string()
		.min(10, "La description doit contenir au moins 10 caractères")
		.max(2000, "La description ne peut pas dépasser 2000 caractères"),
	characters: z
		.array(
			z.object({
				id: z.uuid("L'ID du personnage doit être un UUID valide"),
				name: z
					.string()
					.min(3, "Le nom du personnage doit contenir au moins 3 caractères"),
				description: z
					.string()
					.min(
						10,
						"La description du personnage doit contenir au moins 10 caractères"
					),
				photo: z
					.object({
						storageBucket: z.string(),
						storageKey: z.string(),
					})
					.optional(),
			})
		)
		.min(1, "L'histoire doit avoir au moins 1 personnage")
		.max(2, "L'histoire ne peut pas avoir plus de 2 personnages"),
});
