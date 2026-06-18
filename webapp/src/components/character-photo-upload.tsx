"use client"

import { useState, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface CharacterPhotoUploadProps {
  characterId: string
  currentPhotoUrl?: string | null
  onPhotoUploaded?: (photoUrl: string) => void
  onPhotoDeleted?: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

async function getUploadUrl(characterId: string, contentType: string) {
  const response = await fetch(`/api/characters/${characterId}/photo/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contentType }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Erreur lors de la génération de l\'URL d\'upload')
  }

  return response.json() as Promise<{ uploadUrl: string; photoUrl: string }>
}

async function uploadFileToStorage(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error('Erreur lors de l\'upload du fichier')
  }
}

async function deletePhoto(characterId: string) {
  const response = await fetch(`/api/characters/${characterId}/photo`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Erreur lors de la suppression de la photo')
  }
}

export function CharacterPhotoUpload({
  characterId,
  currentPhotoUrl,
  onPhotoUploaded,
  onPhotoDeleted,
}: CharacterPhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, photoUrl: newPhotoUrl } = await getUploadUrl(characterId, file.type)
      await uploadFileToStorage(uploadUrl, file)
      return newPhotoUrl
    },
    onSuccess: (newPhotoUrl) => {
      setPhotoUrl(newPhotoUrl)
      setPreviewUrl(null)
      onPhotoUploaded?.(newPhotoUrl)
    },
    onError: () => {
      setPreviewUrl(null)
    },
    onSettled: () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePhoto(characterId),
    onSuccess: () => {
      setPhotoUrl(null)
      onPhotoDeleted?.()
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValidationError(null)

    if (file.size > MAX_FILE_SIZE) {
      setValidationError('La taille du fichier ne doit pas dépasser 5 MB')
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError('Format de fichier non supporté. Utilisez JPEG, PNG, GIF ou WEBP')
      return
    }

    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    uploadMutation.mutate(file)
  }

  const handleDelete = () => {
    if (!photoUrl) return
    deleteMutation.mutate()
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const error = validationError || 
    (uploadMutation.isError ? uploadMutation.error.message : null) ||
    (deleteMutation.isError ? deleteMutation.error.message : null)

  return (
    <div className="space-y-2">
      <Label>Photo de référence (optionnel)</Label>
      
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="border-2 border-dashed rounded-lg p-4">
        {!photoUrl && !previewUrl ? (
          <div className="flex flex-col items-center justify-center py-6">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Ajoutez une photo de référence pour personnaliser l'apparence du personnage
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleButtonClick}
              disabled={uploadMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? 'Upload en cours...' : 'Choisir une photo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-2">
              JPEG, PNG, GIF ou WEBP • Max 5 MB
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden">
              <img
                src={previewUrl || photoUrl || ''}
                alt="Photo de référence"
                className="w-full h-full object-cover"
              />
              {uploadMutation.isPending && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-sm">Upload en cours...</div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleButtonClick}
                disabled={uploadMutation.isPending || deleteMutation.isPending}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Remplacer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={uploadMutation.isPending || deleteMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Cette photo sera utilisée pour générer des images du personnage qui lui ressemblent
      </p>
    </div>
  )
}
