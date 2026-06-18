import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DeleteCharacterPhotoCommandHandler } from '@/lib/command-handler/delete-character-photo/delete-character-photo-command-handler';
import { SqlCharacterRepository } from '@/lib/repositories/character-repository/sql-character-repository';
import { getStorage } from '@/lib/storage/storage-factory';
import { CharacterNotFoundError } from '@/lib/command-handler/get-photo-upload-url/character-not-found-error';

interface RouteContext {
  params: Promise<{ characterId: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const storage = getStorage();
    const characterRepository = new SqlCharacterRepository();
    const commandHandler = new DeleteCharacterPhotoCommandHandler(
      characterRepository,
      storage
    );

    await commandHandler.execute({ characterId });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof CharacterNotFoundError) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    console.error('Erreur serveur lors de la suppression de la photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
