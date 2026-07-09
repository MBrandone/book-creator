import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GetPhotoUploadUrlCommandHandler } from "@/lib/application/handlers/command/get-photo-upload-url/get-photo-upload-url-command-handler";
import { InvalidContentTypeError } from "@/lib/application/handlers/command/get-photo-upload-url/invalid-content-type-error";
import { getStorage } from "@/lib/infrastructure/storage/storage-factory";

const requestSchema = z.object({
	contentType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validationResult = requestSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Validation échouée",
					details: validationResult.error.issues.map((err) => ({
						path: err.path.join("."),
						message:
							err.path[0] === "contentType"
								? "Le type de contenu doit être image/jpeg, image/png, image/gif ou image/webp"
								: err.message,
					})),
				},
				{ status: 400 }
			);
		}

		const storage = getStorage();
		const commandHandler = new GetPhotoUploadUrlCommandHandler(storage);

		const result = await commandHandler.execute({
			contentType: validationResult.data.contentType,
		});

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		if (error instanceof InvalidContentTypeError) {
			return NextResponse.json(
				{
					error: "Validation échouée",
					details: [
						{
							path: "contentType",
							message: error.message,
						},
					],
				},
				{ status: 400 }
			);
		}

		console.error(
			"Erreur serveur lors de la génération de l'URL d'upload:",
			error
		);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
