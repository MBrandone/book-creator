export async function generateStory(storyId: string) {
    const response = await fetch(`/api/stories/${storyId}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Erreur lors du lancement de la génération')
    }

    return response.json()
}