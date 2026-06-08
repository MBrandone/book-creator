import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

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

    const storyExists = await checkStoryExists(storyId);
    if (!storyExists) {
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

    const characterCount = await getCharacterCount(storyId);
    if (characterCount >= 2) {
      return NextResponse.json(
        {
          error: 'Validation échouée',
          details: [{
            path: 'story_id',
            message: 'Cette story a déjà atteint le maximum de 2 personnages',
          }],
        },
        { status: 400 }
      );
    }

    try {
      await insertCharactersInDatabase(storyId, validationResult.data.characters);
      return new NextResponse(null, { status: 201 });
    } catch (dbError: any) {
      return handleDatabaseError(dbError);
    }
  } catch (error) {
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

async function checkStoryExists(storyId: string): Promise<boolean> {
  const result = await db
    .selectFrom('stories')
    .select('id')
    .where('id', '=', storyId)
    .executeTakeFirst();
  
  return result !== undefined;
}

async function getCharacterCount(storyId: string): Promise<number> {
  const result = await db
    .selectFrom('characters')
    .select(({ fn }) => [fn.countAll<number>().as('count')])
    .where('story_id', '=', storyId)
    .executeTakeFirst();
  
  return result?.count ?? 0;
}

async function insertCharactersInDatabase(storyId: string, characters: CharacterInput[]) {
  const values = characters.map(character => ({
    id: character.id,
    story_id: storyId,
    name: character.name,
    description: character.description,
    image_url: null,
  }));

  await db
    .insertInto('characters')
    .values(values)
    .execute();
}

function isDuplicateKeyError(error: any): boolean {
  return error.code === '23505';
}

function isForeignKeyError(error: any): boolean {
  return error.code === '23503';
}

function handleDatabaseError(error: any) {
  if (isDuplicateKeyError(error)) {
    return new NextResponse(null, { status: 409 });
  }

  if (isForeignKeyError(error)) {
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

  console.error('Erreur lors de l\'insertion en base de données:', error);
  throw error;
}
