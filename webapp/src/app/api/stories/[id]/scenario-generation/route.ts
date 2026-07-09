import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GenerateScenarioCommandHandler } from "@/lib/application/handlers/command/generate-scenario/generate-scenario-command-handler";
import { SqlStoryRepository } from '@/lib/infrastructure/repositories/story-repository/sql-story-repository';
import { StoryNotFoundError } from '@/lib/domain/story-not-found-error';
import { ScenarioGeneratorService } from '@/lib/story-generator-service/scenario-generator-service';
import { StoryScenesDescriptionGeneratorFactory } from "@/lib/story-scenes-description-generator/factory";
import {NoCharactersError} from "@/lib/domain/no-characters-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: storyId } = await context.params;

    const idValidationResult = z.string().uuid('L\'ID doit être un UUID valide').safeParse(storyId);

    if (!idValidationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation échouée',
          details: [{
            path: 'id',
            message: idValidationResult.error.issues[0].message,
          }],
        },
        { status: 400 }
      );
    }

    const storyRepository = new SqlStoryRepository();
    const scenesGenerator = await StoryScenesDescriptionGeneratorFactory.getGenerator();

    const scenarioGeneratorService = new ScenarioGeneratorService(scenesGenerator);

    const commandHandler = new GenerateScenarioCommandHandler(
      storyRepository,
      scenarioGeneratorService
    );

    await commandHandler.execute(storyId);

    return NextResponse.json(
      { message: 'Scenario generation started' },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof StoryNotFoundError) {
      return NextResponse.json(
        {
          error: 'Story non trouvée',
        },
        { status: 404 }
      );
    }

    if (error instanceof NoCharactersError) {
      return NextResponse.json(
        {
          error: 'Aucun personnage trouvé',
          details: [{
            path: 'characters',
            message: error.message,
          }],
        },
        { status: 400 }
      );
    }

    console.error('Erreur serveur lors du lancement de la génération du scénario:', error);
    return new NextResponse(null, { status: 500 });
  }
}
