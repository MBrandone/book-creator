import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GetPhotoUploadUrlCommandHandler } from '@/lib/command-handler/get-photo-upload-url/get-photo-upload-url-command-handler';
import { SqlCharacterRepository } from '@/lib/repositories/character-repository/sql-character-repository';
import { SqlCharacterPhotoRepository } from '@/lib/repositories/character-photo-repository/sql-character-photo-repository';
import { getStorage } from '@/lib/storage/storage-factory';
import { CharacterNotFoundError } from '@/lib/command-handler/get-photo-upload-url/character-not-found-error';
import { InvalidContentTypeError } from '@/lib/command-handler/get-photo-upload-url/invalid-content-type-error';

interface RouteContext {
  params: Promise<{ characterId: string }>;
}

const requestSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { characterId } = await context.params;

    const idValidationResult = z.string().uuid('L\'ID du personnage doit être un UUID valide').safeParse(characterId);
    if (!idValidationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation échouée',
          details: [{
            path: 'characterId',
            message: idValidationResult.error.issues[0].message,
          }],
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation échouée',
          details: validationResult.error.issues.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const storage = getStorage();
    const characterRepository = new SqlCharacterRepository();
    const characterPhotoRepository = new SqlCharacterPhotoRepository(storage);
    const commandHandler = new GetPhotoUploadUrlCommandHandler(
      characterRepository,
      characterPhotoRepository,
      storage
    );

    const result = await commandHandler.execute({
      characterId,
      contentType: validationResult.data.contentType,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof CharacterNotFoundError) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    if (error instanceof InvalidContentTypeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error('Erreur serveur lors de la génération de l\'URL d\'upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
