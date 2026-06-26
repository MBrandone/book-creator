"use client"

import {useQuery} from "@tanstack/react-query"
import {Button} from "@/components/shadcn-ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/shadcn-ui/card"
import Link from "next/link"
import {Badge} from "@/components/shadcn-ui/badge"
import {fetchStories} from "@/app/_app-http-requests/fetch-stories";

export default function StoriesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stories'],
    queryFn: fetchStories,
  })

  return (
    <div className="container mx-auto py-10 max-w-4xl px-8 md:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-2">Mes histoires</h1>
          <p className="text-muted-foreground">
            Retrouvez toutes vos histoires générées
          </p>
        </div>
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
              <Card className="hover:shadow-lg transition-shadow cursor-pointer mb-4">
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
