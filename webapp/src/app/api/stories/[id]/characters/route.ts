import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CreateACharacterForStoryCommandHandler } from '@/lib/application/handlers/command/create-a-character-for-story/create-a-character-for-story-command-handler';
import { SqlStoryRepository } from '@/lib/infrastructure/repositories/story-repository/sql-story-repository';
import { SqlCharacterRepository, DuplicateCharacterError } from '@/lib/infrastructure/repositories/character-repository/sql-character-repository';
import { StoryNotFoundError } from '@/lib/domain/story-not-found-error';
import { MaxCharactersReachedError } from '@/lib/application/handlers/command/create-a-character-for-story/max-characters-reached-error';

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
          error: 'Validation échouée',
          details: [{
            path: 'story_id',
            message: 'La story spécifiée n\'existe pas',
          }],
        },
        { status: 400 }
      );
    }

    if (error instanceof MaxCharactersReachedError) {
      return NextResponse.json(
        {
          error: 'Validation échouée',
          details: [{
            path: 'story_id',
            message: error.message,
          }],
        },
        { status: 400 }
      );
    }

    if (error instanceof DuplicateCharacterError) {
      return new NextResponse(null, { status: 409 });
    }

    console.error('Erreur serveur lors de la création des personnages:', error);
    return new NextResponse(null, { status: 500 });
  }
}

const characterSchema = z.object({
  id: z.string().uuid('L\'ID du personnage doit être un UUID valide'),
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
});

const createCharactersSchema = z.object({
  characters: z.array(characterSchema).min(1, 'Au moins un personnage doit être fourni'),
});

type CharacterInput = z.infer<typeof characterSchema>;
type CreateCharactersInput = z.infer<typeof createCharactersSchema>;

function buildValidationErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    {
      error: 'Validation échouée',
      details: error.issues.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    },
    { status: 400 }
  );
}
