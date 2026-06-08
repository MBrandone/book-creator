import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { StoryGeneratorFactory } from '@/lib/ai/story-generator';
import { getReplicateProvider } from '@/lib/providers/replicate';
import type { CharactersTable } from '@/lib/db/schema';

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

    const story = await db
      .selectFrom('stories')
      .select(['id', 'status', 'title', 'description'])
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

    if (story.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'La génération a déjà été lancée pour cette story',
          details: [{
            path: 'status',
            message: `Le statut actuel est "${story.status}". Seules les stories avec le statut "pending" peuvent être générées.`,
          }],
        },
        { status: 400 }
      );
    }

    const characters = await db
      .selectFrom('characters')
      .selectAll()
      .where('story_id', '=', storyId)
      .execute();

    if (characters.length === 0) {
      return NextResponse.json(
        {
          error: 'Aucun personnage trouvé',
          details: [{
            path: 'characters',
            message: 'La story doit avoir au moins un personnage avant de lancer la génération.',
          }],
        },
        { status: 400 }
      );
    }

    await db
      .updateTable('stories')
      .set({ status: 'generating', updated_at: new Date() })
      .where('id', '=', storyId)
      .execute();

    generateStoryBackground(storyId, characters).catch((error) => {
      console.error(`[${storyId}] Unhandled error in background process:`, error);
    });

    return NextResponse.json(
      { message: 'Generation started' },
      { status: 202 }
    );

  } catch (error) {
    console.error('Erreur serveur lors du lancement de la génération:', error);
    return new NextResponse(null, { status: 500 });
  }
}

async function generateStoryBackground(storyId: string, characters: CharactersTable[]) {
  console.log(`[${storyId}] 🚀 Starting generation process`);
  console.log(`[${storyId}] Characters: ${characters.map(c => c.name).join(', ')}`);

  try {
    console.log(`[${storyId}] 📝 Step 1: Generating story scenes with AI`);
    const storyGenerator = await StoryGeneratorFactory.getGenerator();
    
    console.log(`[${storyId}] Using story generator: ${storyGenerator.name}`);
    const isAvailable = await storyGenerator.isAvailable();
    
    if (!isAvailable) {
      throw new Error(`Story generator ${storyGenerator.name} is not available`);
    }

    const generatedScenes = await storyGenerator.generateStory(characters);
    console.log(`[${storyId}] ✅ Generated ${generatedScenes.length} scenes`);

    if (generatedScenes.length !== 4) {
      throw new Error(`Expected 4 scenes, got ${generatedScenes.length}`);
    }

    console.log(`[${storyId}] 💾 Step 2: Inserting scenes into database`);
    for (const scene of generatedScenes) {
      await db
        .insertInto('scenes')
        .values({
          id: crypto.randomUUID(),
          story_id: storyId,
          scene_number: scene.scene_number,
          scene_type: scene.scene_type,
          description: scene.description,
          prompt: scene.prompt,
          image_url: null,
        })
        .execute();
      
      console.log(`[${storyId}] ✅ Inserted scene ${scene.scene_number}: ${scene.scene_type}`);
    }

    console.log(`[${storyId}] 🎨 Step 3: Generating images for each scene`);
    const imageProvider = getReplicateProvider();

    for (const scene of generatedScenes) {
      console.log(`[${storyId}] 🖼️  Generating image for scene ${scene.scene_number}/${generatedScenes.length}`);
      console.log(`[${storyId}] Prompt: ${scene.prompt.substring(0, 100)}...`);

      try {
        const imageResult = await imageProvider.generateImage({
          prompt: scene.prompt,
          aspectRatio: '16:9',
        });

        console.log(`[${storyId}] ✅ Image generated for scene ${scene.scene_number}`);
        console.log(`[${storyId}] Image URL: ${imageResult.url}`);

        await db
          .updateTable('scenes')
          .set({ image_url: imageResult.url })
          .where('story_id', '=', storyId)
          .where('scene_number', '=', scene.scene_number)
          .execute();

        console.log(`[${storyId}] ✅ Updated scene ${scene.scene_number} with image URL`);

        const seconds_to_wait = 10
        console.log(`\n⏳ Attente de ${seconds_to_wait} secondes pour éviter les 429 de replicate)...`);
        await new Promise(resolve => setTimeout(resolve, seconds_to_wait * 1000));

      } catch (imageError) {
        console.error(`[${storyId}] ❌ Failed to generate image for scene ${scene.scene_number}:`, imageError);
        throw new Error(`Failed to generate image for scene ${scene.scene_number}: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
      }
    }

    await db
      .updateTable('stories')
      .set({ status: 'completed', updated_at: new Date() })
      .where('id', '=', storyId)
      .execute();

    console.log(`[${storyId}] ✅ Generation completed successfully`);
    console.log(`[${storyId}] 🎉 Story generation finished!`);

  } catch (error) {
    console.error(`[${storyId}] ❌ Generation failed:`, error);
    console.error(`[${storyId}] Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    try {
      await db
        .updateTable('stories')
        .set({ status: 'failed', updated_at: new Date() })
        .where('id', '=', storyId)
        .execute();
      
      console.log(`[${storyId}] ℹ️  Story status set to 'failed'`);
    } catch (updateError) {
      console.error(`[${storyId}] ❌ Failed to update story status to 'failed':`, updateError);
    }
  }
}
