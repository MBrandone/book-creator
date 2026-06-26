interface StoryListItem {
    id: string
    title: string
    description: string
    status: string
    created_at: string
    updated_at: string
    character_count: number
    scene_count: number
}

export async function fetchStories(): Promise<{ stories: StoryListItem[] }> {
    const response = await fetch('/api/stories')

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des histoires')
    }

    return response.json()
}