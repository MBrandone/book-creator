"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { CharacterPhotoUpload } from "@/components/character-photo-upload"

interface CreateStoryPayload {
  id: string
  title: string
  description: string
}

interface CreateCharacterPayload {
  characters: Array<{
    id: string
    name: string
    description: string
    photo?: {
      storageKey: string
      storageBucket: string
    }
  }>
}

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

async function createStory(payload: CreateStoryPayload) {
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

async function createCharacter(storyId: string, payload: CreateCharacterPayload) {
  const response = await fetch(`/api/stories/${storyId}/characters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Erreur lors de la création du personnage')
  }

  return response
}

async function generateStory(storyId: string) {
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

async function fetchStatus(storyId: string): Promise<{ status: string }> {
  const response = await fetch(`/api/stories/${storyId}/status`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Erreur lors de la vérification du statut')
  }

  return response.json()
}

async function fetchStoryData(storyId: string): Promise<StoryData> {
  const response = await fetch(`/api/stories/${storyId}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Erreur lors de la récupération de l\'histoire')
  }

  return response.json()
}

export default function CreateStoryPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [storyId, setStoryId] = useState<string | null>(null)
  const [characterName, setCharacterName] = useState("")
  const [characterDescription, setCharacterDescription] = useState("")
  const [characters, setCharacters] = useState<Array<{ id: string, name: string, description: string, photoUrl?: string | null }>>([])
  const [showCharacterForm, setShowCharacterForm] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [photoData, setPhotoData] = useState<{ storageKey: string; storageBucket: string; previewUrl: string } | null>(null)

  const storyMutation = useMutation({
    mutationFn: createStory,
    onSuccess: (_, variables) => {
      // Stocker l'ID de l'histoire créée et afficher le formulaire de personnage
      setStoryId(variables.id)
      setShowCharacterForm(true)
      setTitle("")
      setDescription("")
    },
  })

  const characterMutation = useMutation({
    mutationFn: ({ storyId, payload }: { storyId: string, payload: CreateCharacterPayload }) => 
      createCharacter(storyId, payload),
    onSuccess: (_, variables) => {
      const newCharacter = variables.payload.characters[0]
      setCharacters(prev => [...prev, { ...newCharacter, photoUrl: photoData?.previewUrl || null }])
      setCharacterName("")
      setCharacterDescription("")
      setPhotoData(null)
      setShowCharacterForm(false)
    },
  })

  const handleStorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Générer un UUID v4
    const id = crypto.randomUUID()
    
    storyMutation.mutate({
      id,
      title,
      description,
    })
  }

  const handleCharacterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!storyId) return
    
    const characterId = crypto.randomUUID()
    
    characterMutation.mutate({
      storyId,
      payload: {
        characters: [{
          id: characterId,
          name: characterName,
          description: characterDescription,
          photo: photoData ? {
            storageKey: photoData.storageKey,
            storageBucket: photoData.storageBucket,
          } : undefined,
        }]
      }
    })
  }

  // Polling du statut de la génération (toutes les 10 secondes)
  const { data: statusData } = useQuery({
    queryKey: ['story-status', storyId],
    queryFn: () => fetchStatus(storyId!),
    enabled: isGenerating && !!storyId,
    refetchInterval: 10000, // 10 secondes
    refetchIntervalInBackground: true,
  })

  // Récupération des données complètes quand la génération est terminée
  const { data: storyData } = useQuery({
    queryKey: ['story-data', storyId],
    queryFn: () => fetchStoryData(storyId!),
    enabled: statusData?.status === 'completed',
  })

  // Mutation pour lancer la génération
  const generateMutation = useMutation({
    mutationFn: generateStory,
    onSuccess: () => {
      setIsGenerating(true)
    },
  })

  const handleAddAnotherCharacter = () => {
    setCharacterName("")
    setCharacterDescription("")
    setPhotoData(null)
    setShowCharacterForm(true)
  }

  const handleGenerateStory = () => {
    if (!storyId) return
    generateMutation.mutate(storyId)
  }

  // Arrêter le polling quand la génération est terminée ou a échoué
  useEffect(() => {
    if (isGenerating && statusData && (statusData.status === 'completed' || statusData.status === 'failed')) {
      setIsGenerating(false)
    }
  }, [isGenerating, statusData])

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Créer une Histoire</h1>
        <p className="text-muted-foreground">
          Remplissez le formulaire ci-dessous pour créer une nouvelle histoire
        </p>
      </div>

      {/* Formulaire de création d'histoire */}
      {!storyId && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle Histoire</CardTitle>
            <CardDescription>
              Entrez le nom et la description de votre histoire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStorySubmit} className="space-y-6">
              {/* Message d'erreur */}
              {storyMutation.isError && (
                <div className="p-4 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm font-medium text-red-800">
                    ✗ {storyMutation.error.message}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Nom de l'histoire *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Ex: L'Aventure Magique"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={3}
                  disabled={storyMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 3 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre histoire..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={10}
                  rows={6}
                  disabled={storyMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 caractères
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={storyMutation.isPending}
              >
                {storyMutation.isPending ? "Création en cours..." : "Créer l'histoire"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Message de succès de la création de l'histoire */}
      {storyId && (
        <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200">
          <p className="text-sm font-medium text-green-800">
            ✓ Histoire créée avec succès !
          </p>
        </div>
      )}

      {/* Formulaire de création de personnage */}
      {storyId && showCharacterForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ajouter un Personnage</CardTitle>
            <CardDescription>
              Créez un personnage pour votre histoire ({characters.length}/2)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCharacterSubmit} className="space-y-6">
              {/* Message d'erreur */}
              {characterMutation.isError && (
                <div className="p-4 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm font-medium text-red-800">
                    ✗ {characterMutation.error.message}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="character-name">Nom du personnage *</Label>
                <Input
                  id="character-name"
                  type="text"
                  placeholder="Ex: Alice"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  required
                  minLength={3}
                  disabled={characterMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 3 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="character-description">Description du personnage *</Label>
                <Textarea
                  id="character-description"
                  placeholder="Décrivez le personnage..."
                  value={characterDescription}
                  onChange={(e) => setCharacterDescription(e.target.value)}
                  required
                  minLength={10}
                  rows={4}
                  disabled={characterMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 caractères
                </p>
              </div>

              <CharacterPhotoUpload
                onPhotoUploaded={setPhotoData}
                onPhotoRemoved={() => setPhotoData(null)}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={characterMutation.isPending}
              >
                {characterMutation.isPending ? "Création en cours..." : "Ajouter le personnage"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Message de succès et bouton pour ajouter un autre personnage */}
      {storyId && !showCharacterForm && characters.length > 0 && (
        <div className="space-y-4">
          <div className="p-4 rounded-md bg-green-50 border border-green-200">
            <p className="text-sm font-medium text-green-800">
              ✓ Personnage créé avec succès !
            </p>
          </div>

          {/* Afficher la liste des personnages créés */}
          <Card>
            <CardHeader>
              <CardTitle>Personnages créés ({characters.length}/2)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {characters.map((character) => (
                  <div key={character.id} className="p-4 border rounded-md">
                    <div className="flex gap-4">
                      {character.photoUrl && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={character.photoUrl}
                            alt={character.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{character.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{character.description}</p>
                        {character.photoUrl && (
                          <p className="text-xs text-green-600 mt-2">✓ Photo de référence ajoutée</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bouton pour ajouter un autre personnage (seulement si moins de 2) */}
          {characters.length < 2 && (
            <Button 
              onClick={handleAddAnotherCharacter} 
              className="w-full"
            >
              Ajouter un autre personnage
            </Button>
          )}

          {/* Bouton pour générer l'histoire (apparaît quand 2 personnages sont créés) */}
          {characters.length === 2 && !isGenerating && !storyData && (
            <Button 
              onClick={handleGenerateStory} 
              className="w-full"
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? "Lancement..." : "Générer l'histoire"}
            </Button>
          )}

          {/* Message d'erreur de génération */}
          {generateMutation.isError && (
            <div className="p-4 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">
                ✗ {generateMutation.error.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Section de génération en cours */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle>Génération en cours...</CardTitle>
            <CardDescription>
              Veuillez patienter pendant que nous créons votre histoire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Statut: {statusData?.status || 'initialisation'}</span>
                <span>⏳</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Vérification automatique toutes les 10 secondes...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Affichage des images générées */}
      {storyData && (
        <div className="space-y-6">
          <div className="p-4 rounded-md bg-green-50 border border-green-200">
            <p className="text-sm font-medium text-green-800">
              ✓ Histoire générée avec succès !
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{storyData.story.title}</CardTitle>
              <CardDescription>{storyData.story.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scènes avec images */}
              {storyData.scenes.map((scene) => (
                <div key={scene.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Scène {scene.scene_number}:</span>
                    <span className="text-sm text-muted-foreground">{scene.scene_type}</span>
                  </div>
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
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
