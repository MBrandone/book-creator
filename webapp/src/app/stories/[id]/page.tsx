"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { use } from "react"

interface Scene {
  id: string
  scene_number: number
  scene_type: string
  description: string
  image_url: string | null
  prompt: string
}

interface StoryData {
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

async function fetchStoryData(storyId: string): Promise<StoryData> {
  const response = await fetch(`/api/stories/${storyId}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Erreur lors de la récupération de l\'histoire')
  }

  return response.json()
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
    pending: { variant: "secondary", label: "En attente" },
    generating: { variant: "outline", label: "En génération..." },
    completed: { variant: "default", label: "Terminée" },
    failed: { variant: "destructive", label: "Échec" },
  }

  const config = variants[status] || { variant: "outline", label: status }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

function SceneTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    introduction: "Introduction",
    conflict: "Conflit",
    action: "Action",
    resolution: "Résolution",
  }

  return <Badge variant="outline">{labels[type] || type}</Badge>
}

export default function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data, isLoading, error } = useQuery({
    queryKey: ['story-detail', id],
    queryFn: () => fetchStoryData(id),
    refetchInterval: (query) => {
      const status = query.state.data?.story.status
      return status === 'generating' ? 10000 : false
    },
  })

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <Link href="/stories">
          <Button variant="ghost" className="mb-4">← Retour aux histoires</Button>
        </Link>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Chargement de l'histoire...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <p className="text-sm font-medium text-red-800">
              ✗ {(error as Error).message}
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-6">
          {/* En-tête de l'histoire */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-3xl">{data.story.title}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {data.story.description}
                  </CardDescription>
                </div>
                <StatusBadge status={data.story.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>📅 Créée le {new Date(data.story.created_at).toLocaleDateString('fr-FR')}</span>
                <span>🔄 Mise à jour le {new Date(data.story.updated_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Personnages */}
          {data.characters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Personnages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.characters.map((character) => (
                    <div key={character.id} className="p-4 border rounded-md">
                      <h3 className="font-semibold text-lg">{character.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{character.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scènes */}
          {data.scenes.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Scènes</h2>
              {data.scenes.map((scene) => (
                <Card key={scene.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Scène {scene.scene_number}</span>
                      <SceneTypeBadge type={scene.scene_type} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{scene.description}</p>
                    {scene.image_url && (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                        <img
                          src={scene.image_url}
                          alt={`Scène ${scene.scene_number}: ${scene.scene_type}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {!scene.image_url && data.story.status === 'generating' && (
                      <div className="w-full aspect-video rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                        <p className="text-sm">Image en cours de génération...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Message si en cours de génération */}
          {data.story.status === 'generating' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-6 text-center">
                <p className="text-sm font-medium text-blue-800">
                  ⏳ Génération en cours... La page se met à jour automatiquement.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Message si en attente */}
          {data.story.status === 'pending' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="py-6 text-center">
                <p className="text-sm font-medium text-yellow-800">
                  ⚠️ Cette histoire n'a pas encore été générée.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Message si échec */}
          {data.story.status === 'failed' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-6 text-center">
                <p className="text-sm font-medium text-red-800">
                  ✗ La génération de cette histoire a échoué.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
