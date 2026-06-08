import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validationResult = createStorySchema.safeParse(body);

        if (!validationResult.success) {
            return buildValidationErrorResponse(validationResult.error);
        }

        try {
            await insertStoryInDatabase(validationResult.data);
            return new NextResponse(null, { status: 201 });
        } catch (dbError: any) {
            return handleDatabaseError(dbError);
        }
    } catch (error) {
        console.error('Erreur serveur lors de la création de la story:', error);
        return new NextResponse(null, { status: 500 });
    }
}

const createStorySchema = z.object({
  id: z.uuid('L\'ID doit être un UUID valide'),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
});

type CreateStoryInput = z.infer<typeof createStorySchema>;

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

async function insertStoryInDatabase(data: CreateStoryInput) {
  await db
    .insertInto('stories')
    .values({
      id: data.id,
      title: data.title,
      description: data.description,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    })
    .execute();
}

function isDuplicateKeyError(error: any): boolean {
  return error.code === '23505';
}

function handleDatabaseError(error: any) {
  if (isDuplicateKeyError(error)) {
    return new NextResponse(null, { status: 409 });
  }

  console.error('Erreur lors de l\'insertion en base de données:', error);
  throw error;
}
