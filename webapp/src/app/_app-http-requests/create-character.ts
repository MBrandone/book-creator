export interface CreateCharacterPayload {
	characters: Array<{
		id: string;
		name: string;
		description: string;
		photo?: {
			storageKey: string;
			storageBucket: string;
		};
	}>;
}

export async function createCharacter(
	storyId: string,
	payload: CreateCharacterPayload
) {
	const response = await fetch(`/api/stories/${storyId}/characters`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "Erreur lors de la création du personnage");
	}

	return response;
}
