import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GenerateImagesCommandHandler } from "@/lib/application/handlers/command/generate-images/generate-images-command-handler";
import { GenerationCannotBeStartedError } from "@/lib/domain/generation-cannot-be-started-error";
import { NoCharactersError } from "@/lib/domain/no-characters-error";
import { StoryNotFoundError } from "@/lib/domain/story-not-found-error";
import { SqlStoryRepository } from "@/lib/infrastructure/repositories/story-repository/sql-story-repository";
import { getStorage } from "@/lib/infrastructure/storage/storage-factory";
import { SceneImageGeneratorFactory } from "@/lib/scene-image-generator/factory";
import { StoryImagesGeneratorService } from "@/lib/story-generator-service/story-images-generator-service";

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

		const storyRepository = new SqlStoryRepository();
		const sceneImageGenerator = await SceneImageGeneratorFactory.getGenerator();
		const storage = getStorage();

		const storyImagesGeneratorService = new StoryImagesGeneratorService(
			storyRepository,
			sceneImageGenerator,
			storage
		);

		const commandHandler = new GenerateImagesCommandHandler(
			storyRepository,
			storyImagesGeneratorService
		);

		await commandHandler.execute(storyId);

		return NextResponse.json(
			{ message: "Image generation started" },
			{ status: 202 }
		);
	} catch (error) {
		if (error instanceof StoryNotFoundError) {
			return NextResponse.json(
				{
					error: "Story non trouvée",
				},
				{ status: 404 }
			);
		}

		if (error instanceof GenerationCannotBeStartedError) {
			return NextResponse.json(
				{
					error: "Génération impossible",
					message: error.message,
				},
				{ status: 409 }
			);
		}

		if (error instanceof NoCharactersError) {
			return NextResponse.json(
				{
					error: "Aucun personnage",
					message: error.message,
				},
				{ status: 400 }
			);
		}

		console.error(
			"Erreur serveur lors du lancement de la génération des images:",
			error
		);
		return new NextResponse(null, { status: 500 });
	}
}
