export async function updateScene(
	storyId: string,
	sceneId: string,
	description: string
): Promise<void> {
	const response = await fetch(`/api/stories/${storyId}/scenes/${sceneId}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ description }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Échec de la mise à jour de la scène");
	}
}
