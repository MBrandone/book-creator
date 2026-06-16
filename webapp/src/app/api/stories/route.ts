import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {CreateAStoryCommandHandler} from '@/lib/command-handler/create-a-story/create-a-story-command-handler';
import {DuplicateStoryError} from "@/lib/command-handler/create-a-story/duplicate-story-error";
import {SqlStoryRepository} from '@/lib/repositories/story-repository/sql-story-repository';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validationResult = createStorySchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation échouée',
                    details: validationResult.error.issues.map(err => ({
                        path: err.path.join('.'),
                        message: err.message,
                    })),
                },
                {status: 400}
            );
        }

        const storyRepository = new SqlStoryRepository();
        const commandHandler = new CreateAStoryCommandHandler(storyRepository);
        await commandHandler.execute(validationResult.data);

        return new NextResponse(null, { status: 201 });

    } catch (error) {
        if (error instanceof DuplicateStoryError) {
            return new NextResponse(null, { status: 409 });
        }
        console.error('Erreur serveur lors de la création de la story:', error);
        return new NextResponse(null, { status: 500 });
    }
}

const createStorySchema = z.object({
  id: z.uuid('L\'ID doit être un UUID valide'),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
});

