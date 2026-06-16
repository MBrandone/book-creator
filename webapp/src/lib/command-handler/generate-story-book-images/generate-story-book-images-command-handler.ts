import {SceneGenerator} from "@/lib/command-handler/generate-story-book-images/scene-generator";
import {type CharactersTable, db} from "@/lib/db";
import {NextResponse} from "next/server";
import {getReplicateProvider} from "@/lib/providers";

export class GenerateStoryBookImagesCommandHandler {
    constructor(
        private readonly scenesGenerator: SceneGenerator,
        // private readonly storyRepository: StoryRepository,
        // private readonly imageGenerator: ImageGenerator,
    ) {
    }

    async execute(storyId: string) {
        try {

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

        this.generateStoryBackground(storyId, characters).catch((error) => {
            console.error(`[${storyId}] Unhandled error in background process:`, error);
        });

        return NextResponse.json(
            { message: 'Generation started' },
            { status: 202 }
        );
    } catch (error: any) {
        console.error('Erreur serveur lors du lancement de la génération:', error);
        return new NextResponse(null, { status: 500 });
        }
    }

    async generateStoryBackground(storyId: string, characters: CharactersTable[]) {
        try {
            const isAvailable = await this.scenesGenerator.isAvailable();

            if (!isAvailable) {
                throw new Error(`Story generator ${this.scenesGenerator.name} is not available`);
            }

            const generatedScenes = await this.scenesGenerator.generateStory(characters);

            if (generatedScenes.length !== 4) {
                throw new Error(`Expected 4 scenes, got ${generatedScenes.length}`);
            }

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
                        storage_bucket: null,
                        storage_key: null,
                    })
                    .execute();

            }

            const imageProvider = getReplicateProvider();

            for (const scene of generatedScenes) {

                try {
                    const imageResult = await imageProvider.generateImage({
                        prompt: scene.prompt,
                        aspectRatio: '16:9',
                    });

                    await db
                        .updateTable('scenes')
                        .set({ 
                            storage_bucket: imageResult.bucket,
                            storage_key: imageResult.key 
                        })
                        .where('story_id', '=', storyId)
                        .where('scene_number', '=', scene.scene_number)
                        .execute();

                    const seconds_to_wait = 10
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

}

