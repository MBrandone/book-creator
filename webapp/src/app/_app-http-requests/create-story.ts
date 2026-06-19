export interface CreateStoryPayload {
    id: string
    title: string
    description: string
}

export async function createStory(payload: CreateStoryPayload) {
    const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Erreur lors de la création de l\'histoire')
    }

    return response
}