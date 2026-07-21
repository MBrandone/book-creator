import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GenerateScenarioCommandHandler } from "@/lib/application/handlers/command/generate-scenario/generate-scenario-command-handler";
import { NoCharactersError } from "@/lib/domain/no-characters-error";
import { StoryNotFoundError } from "@/lib/domain/story-not-found-error";
import { getLogger } from "@/lib/infrastructure/logging/logger-factory";
import { SqlStoryRepository } from "@/lib/infrastructure/repositories/story-repository/sql-story-repository";
import { ScenarioGeneratorService } from "@/lib/story-generator-service/scenario-generator-service";
import { getStoryScenesDescriptionGenerator } from "@/lib/story-scenes-description-generator/factory";

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
		const scenesGenerator = await getStoryScenesDescriptionGenerator();

		const scenarioGeneratorService = new ScenarioGeneratorService(
			scenesGenerator
		);

		const commandHandler = new GenerateScenarioCommandHandler(
			storyRepository,
			scenarioGeneratorService
		);

		await commandHandler.execute(storyId);

		return NextResponse.json(
			{ message: "Scenario generation started" },
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

		if (error instanceof NoCharactersError) {
			return NextResponse.json(
				{
					error: "Aucun personnage trouvé",
					details: [
						{
							path: "characters",
							message: error.message,
						},
					],
				},
				{ status: 400 }
			);
		}

		getLogger().error(
			"Erreur serveur lors du lancement de la génération du scénario",
			{ error: String(error) }
		);
		return new NextResponse(null, { status: 500 });
	}
}
