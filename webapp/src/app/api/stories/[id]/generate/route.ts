import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  GenerateStoryBookImagesCommandHandler
} from "@/lib/command-handler/generate-story-book-images/generate-story-book-images-command-handler";
import {InMemorySceneGenerator} from "@/lib/story-scenes-description-generator/in-memory-story-generator";
import { SqlStoryRepository } from '@/lib/repositories/story-repository/sql-story-repository';
import { StoryNotFoundError } from '@/lib/domain/story-not-found-error';
import { StoryAlreadyGeneratingError } from '@/lib/command-handler/generate-story-book-images/story-already-generating-error';
import { NoCharactersFoundError } from '@/lib/command-handler/generate-story-book-images/no-characters-found-error';
import { StoryGeneratorService } from '@/lib/service/story-generator-service';
import { getReplicateProvider } from '@/lib/scene-image-generator/replicate-scene-image-generator';
import { SqlSceneRepository } from '@/lib/repositories/scene-repository/sql-scene-repository';

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
    const sceneRepository = new SqlSceneRepository();
    const scenesGenerator = new InMemorySceneGenerator();
    const sceneImageGenerator = getReplicateProvider();
    
    const storyGeneratorService = new StoryGeneratorService(
      storyRepository,
      scenesGenerator,
      sceneImageGenerator,
      sceneRepository
    );
    
    const commandHandler = new GenerateStoryBookImagesCommandHandler(
      storyRepository,
      storyGeneratorService
    );

    await commandHandler.execute(storyId);

    return NextResponse.json(
      { message: 'Generation started' },
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

    if (error instanceof StoryAlreadyGeneratingError) {
      return NextResponse.json(
        {
          error: 'La génération a déjà été lancée pour cette story',
          details: [{
            path: 'status',
            message: `Le statut actuel est "${error.currentStatus}". Seules les stories avec le statut "pending" peuvent être générées.`,
          }],
        },
        { status: 400 }
      );
    }

    if (error instanceof NoCharactersFoundError) {
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

    console.error('Erreur serveur lors du lancement de la génération:', error);
    return new NextResponse(null, { status: 500 });
  }
}
