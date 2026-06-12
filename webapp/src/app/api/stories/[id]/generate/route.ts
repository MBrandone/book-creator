import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  GenerateStoryBookImagesCommandHandler
} from "@/lib/command-handler/generate-story-book-images/generate-story-book-images-command-handler";
import {InMemorySceneGenerator} from "@/lib/providers/in-memory-story-generator";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
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

  return new GenerateStoryBookImagesCommandHandler(new InMemorySceneGenerator()).execute(storyId)
}
