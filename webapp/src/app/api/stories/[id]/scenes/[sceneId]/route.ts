import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UpdateSceneDescriptionCommandHandler } from "@/lib/application/handlers/command/update-scene-description/update-scene-description-command-handler";
import { CannotEditSceneAfterGenerationError } from "@/lib/domain/cannot-edit-scene-after-generation-error";
import { SceneDescriptionTooLongError } from "@/lib/domain/scene-description-too-long-error";
import { SceneDescriptionTooShortError } from "@/lib/domain/scene-description-too-short-error";
import { SceneNotFoundInStoryError } from "@/lib/domain/scene-not-found-in-story-error";
import { StoryNotFoundError } from "@/lib/domain/story-not-found-error";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import { SqlStoryRepository } from "@/lib/infrastructure/repositories/story-repository/sql-story-repository";

interface RouteContext {
	params: Promise<{ id: string; sceneId: string }>;
}

const updateSceneSchema = z.object({
	description: z
		.string()
		.min(10, "La description doit contenir au moins 10 caractères")
		.max(500, "La description ne peut pas dépasser 500 caractères")
		.trim(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
	try {
		const { id: storyId, sceneId } = await context.params;

		const idValidationResult = z
			.string()
			.uuid("L'ID de l'histoire doit être un UUID valide")
			.safeParse(storyId);
		const sceneIdValidationResult = z
			.string()
			.uuid("L'ID de la scène doit être un UUID valide")
			.safeParse(sceneId);

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

		if (!sceneIdValidationResult.success) {
			return NextResponse.json(
				{
					error: "Validation échouée",
					details: [
						{
							path: "sceneId",
							message: sceneIdValidationResult.error.issues[0].message,
						},
					],
				},
				{ status: 400 }
			);
		}

		const body = await request.json();
		const validationResult = updateSceneSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Validation échouée",
					details: validationResult.error.issues.map((issue) => ({
						path: issue.path.join("."),
						message: issue.message,
					})),
				},
				{ status: 400 }
			);
		}

		const storyRepository = new SqlStoryRepository();
		const commandHandler = new UpdateSceneDescriptionCommandHandler(
			storyRepository
		);

		await commandHandler.execute(
			storyId,
			sceneId,
			validationResult.data.description
		);

		return new NextResponse(null, { status: 202 });
	} catch (error) {
		if (error instanceof StoryNotFoundError) {
			return NextResponse.json(
				{
					error: "Story non trouvée",
				},
				{ status: 404 }
			);
		}

		if (error instanceof SceneNotFoundInStoryError) {
			return NextResponse.json(
				{
					error: "Scène non trouvée",
					message: error.message,
				},
				{ status: 404 }
			);
		}

		if (error instanceof CannotEditSceneAfterGenerationError) {
			return NextResponse.json(
				{
					error: "Modification impossible",
					message: error.message,
				},
				{ status: 409 }
			);
		}

		if (
			error instanceof SceneDescriptionTooShortError ||
			error instanceof SceneDescriptionTooLongError
		) {
			return NextResponse.json(
				{
					error: "Validation échouée",
					details: [
						{
							path: "description",
							message: error.message,
						},
					],
				},
				{ status: 400 }
			);
		}

		getLogger().error("Erreur serveur lors de la mise à jour de la scène", {
			error: String(error),
		});
		return new NextResponse(null, { status: 500 });
	}
}
