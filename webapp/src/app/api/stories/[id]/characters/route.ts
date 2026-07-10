import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateACharacterForStoryCommandHandler } from "@/lib/application/handlers/command/create-a-character-for-story/create-a-character-for-story-command-handler";
import { MaxCharactersReachedError } from "@/lib/application/handlers/command/create-a-character-for-story/max-characters-reached-error";
import { StoryNotFoundError } from "@/lib/domain/story-not-found-error";
import {
	DuplicateCharacterError,
	SqlCharacterRepository,
} from "@/lib/infrastructure/repositories/character-repository/sql-character-repository";
import { SqlStoryRepository } from "@/lib/infrastructure/repositories/story-repository/sql-story-repository";

interface RouteContext {
	params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
	try {
		const { id: storyId } = await context.params;

		const idValidationResult = z
			.string()
			.uuid("L'ID doit être un UUID valide")
			.safeParse(storyId);

		if (!idValidationResult.success) {
			return NextResponse.json(
				{
					error: "Validation échouée",
					details: [
						{
							path: "id",
							message: idValidationResult.error.issues[0].message,
						},
					],
				},
				{ status: 400 }
			);
		}

		const body = await request.json();
		const validationResult = createCharactersSchema.safeParse(body);

		if (!validationResult.success) {
			return buildValidationErrorResponse(validationResult.error);
		}

		const storyRepository = new SqlStoryRepository();
		const characterRepository = new SqlCharacterRepository();
		const commandHandler = new CreateACharacterForStoryCommandHandler(
			storyRepository,
			characterRepository
		);

		await commandHandler.execute({
			storyId,
			characters: validationResult.data.characters,
		});

		return new NextResponse(null, { status: 201 });
	} catch (error) {
		if (error instanceof StoryNotFoundError) {
			return NextResponse.json(
				{
					error: "Validation échouée",
					details: [
						{
							path: "story_id",
							message: "La story spécifiée n'existe pas",
						},
					],
				},
				{ status: 400 }
			);
		}

		if (error instanceof MaxCharactersReachedError) {
			return NextResponse.json(
				{
					error: "Validation échouée",
					details: [
						{
							path: "story_id",
							message: error.message,
						},
					],
				},
				{ status: 400 }
			);
		}

		if (error instanceof DuplicateCharacterError) {
			return new NextResponse(null, { status: 409 });
		}

		console.error("Erreur serveur lors de la création des personnages:", error);
		return new NextResponse(null, { status: 500 });
	}
}

const photoSchema = z.object({
	storageKey: z
		.string()
		.regex(
			/^character-photos\/[a-f0-9-]+\.(jpg|png|gif|webp)$/,
			"Le storageKey doit suivre le format character-photos/{uuid}.{extension}"
		),
	storageBucket: z.string().min(1, "Le storageBucket ne peut pas être vide"),
});

const characterSchema = z.object({
	id: z.string().uuid("L'ID du personnage doit être un UUID valide"),
	name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
	description: z
		.string()
		.min(10, "La description doit contenir au moins 10 caractères"),
	photo: photoSchema.optional(),
});

const createCharactersSchema = z.object({
	characters: z
		.array(characterSchema)
		.min(1, "Au moins un personnage doit être fourni"),
});

function buildValidationErrorResponse(error: z.ZodError) {
	return NextResponse.json(
		{
			error: "Validation échouée",
			details: error.issues.map((err) => ({
				path: err.path.join("."),
				message: err.message,
			})),
		},
		{ status: 400 }
	);
}
