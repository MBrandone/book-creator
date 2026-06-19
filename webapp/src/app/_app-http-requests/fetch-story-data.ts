export interface Scene {
    id: string
    scene_number: number
    scene_type: string
    description: string
    image_url: string | null
    prompt: string
}

export interface StoryData {
    story: {
        id: string
        title: string
        description: string
        status: string
        created_at: string
        updated_at: string
    }
    characters: Array<{
        id: string
        name: string
        description: string
        image_url: string | null
    }>
    scenes: Scene[]
}

export async function fetchStoryData(storyId: string): Promise<StoryData> {
    const response = await fetch(`/api/stories/${storyId}`)

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Erreur lors de la récupération de l\'histoire')
    }

    return response.json()
}