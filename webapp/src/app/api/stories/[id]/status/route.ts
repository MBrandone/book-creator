import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

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

    const story = await db
      .selectFrom('stories')
      .select('status')
      .where('id', '=', storyId)
      .executeTakeFirst();

    if (!story) {
      return NextResponse.json(
        {
          error: 'Story non trouvée',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: story.status,
    });

  } catch (error) {
    console.error('Erreur serveur lors de la récupération du statut:', error);
    return new NextResponse(null, { status: 500 });
  }
}
