export async function getUploadUrl(contentType: string) {
	const response = await fetch("/api/characters/photo/upload-url", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ contentType }),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(
			error.error || "Erreur lors de la génération de l'URL d'upload"
		);
	}

	return response.json() as Promise<{
		uploadUrl: string;
		storageKey: string;
		storageBucket: string;
		expiresIn: number;
	}>;
}
