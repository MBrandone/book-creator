export async function fetchStatus(
	storyId: string
): Promise<{ status: string }> {
	const response = await fetch(`/api/stories/${storyId}/status`);

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "Erreur lors de la vérification du statut");
	}

	return response.json();
}
