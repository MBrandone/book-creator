import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/stories/[id]
 * Récupère une histoire complète avec tous ses détails :
 * - Métadonnées de l'histoire (title, description, status, dates)
 * - Personnages avec leurs données
 * - 4 scènes avec descriptions et images (URL depuis MinIO)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: storyId } = await context.params;
    
    // Validation de l'UUID
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

    // Récupération des données en parallèle pour optimiser les performances
    const [story, characters, scenes] = await Promise.all([
      // Récupérer les métadonnées de l'histoire
      db
        .selectFrom('stories')
        .select(['id', 'title', 'description', 'status', 'created_at', 'updated_at'])
        .where('id', '=', storyId)
        .executeTakeFirst(),
      
      // Récupérer tous les personnages de l'histoire
      db
        .selectFrom('characters')
        .select(['id', 'name', 'description', 'image_url'])
        .where('story_id', '=', storyId)
        .execute(),
      
      // Récupérer toutes les scènes de l'histoire, ordonnées par numéro
      db
        .selectFrom('scenes')
        .select(['id', 'scene_number', 'scene_type', 'description', 'image_url', 'prompt'])
        .where('story_id', '=', storyId)
        .orderBy('scene_number', 'asc')
        .execute(),
    ]);

    // Vérifier si l'histoire existe
    if (!story) {
      return NextResponse.json(
        {
          error: 'Story non trouvée',
        },
        { status: 404 }
      );
    }

    // Retourner la réponse complète
    return NextResponse.json({
      story: {
        id: story.id,
        title: story.title,
        description: story.description,
        status: story.status,
        created_at: story.created_at,
        updated_at: story.updated_at,
      },
      characters: characters.map(character => ({
        id: character.id,
        name: character.name,
        description: character.description,
        image_url: character.image_url,
      })),
      scenes: scenes.map(scene => ({
        id: scene.id,
        scene_number: scene.scene_number,
        scene_type: scene.scene_type,
        description: scene.description,
        image_url: scene.image_url,
        prompt: scene.prompt,
      })),
    });

  } catch (error) {
    console.error('Erreur serveur lors de la récupération de l\'histoire:', error);
    return new NextResponse(null, { status: 500 });
  }
}
