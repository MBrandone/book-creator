"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

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

async function fetchStories(): Promise<{ stories: StoryListItem[] }> {
  const response = await fetch('/api/stories')

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des histoires')
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

export default function StoriesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stories'],
    queryFn: fetchStories,
  })

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mes Histoires</h1>
          <p className="text-muted-foreground">
            Retrouvez toutes vos histoires générées
          </p>
        </div>
        <Link href="/">
          <Button>Créer une nouvelle histoire</Button>
        </Link>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Chargement des histoires...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <p className="text-sm font-medium text-red-800">
              ✗ Erreur lors du chargement des histoires
            </p>
          </CardContent>
        </Card>
      )}

      {data && data.stories.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">Aucune histoire créée pour le moment</p>
            <Link href="/">
              <Button>Créer ma première histoire</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {data && data.stories.length > 0 && (
        <div className="space-y-4">
          {data.stories.map((story) => (
            <Link key={story.id} href={`/stories/${story.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle>{story.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {story.description}
                      </CardDescription>
                    </div>
                    <StatusBadge status={story.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>👥 {story.character_count} personnage(s)</span>
                    <span>🎬 {story.scene_count} scène(s)</span>
                    <span>📅 {new Date(story.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
