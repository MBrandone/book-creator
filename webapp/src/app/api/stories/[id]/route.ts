import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GetStoryQueryHandler } from '@/lib/query-handler/get-story/get-story-query-handler';
import { SqlStoryReadModel } from '@/lib/read-model/sql-story-read-model';
import { StoryNotFoundError } from '@/lib/domain/story-not-found-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
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

    const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL!;
    const storyReadModel = new SqlStoryReadModel(publicBaseUrl);
    const queryHandler = new GetStoryQueryHandler(storyReadModel);

    const storyDetails = await queryHandler.execute(storyId);

    return NextResponse.json(storyDetails);

  } catch (error) {
    if (error instanceof StoryNotFoundError) {
      return NextResponse.json(
        {
          error: 'Story non trouvée',
        },
        { status: 404 }
      );
    }

    console.error('Erreur serveur lors de la récupération de l\'histoire:', error);
    return new NextResponse(null, { status: 500 });
  }
}
