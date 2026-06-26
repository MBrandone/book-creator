"use client"

import {useRef, useState} from "react"
import {useMutation} from "@tanstack/react-query"
import {Button} from "@/components/shadcn-ui/button"
import {Label} from "@/components/shadcn-ui/label"
import {Image as ImageIcon, Upload, X} from "lucide-react"
import {uploadFileToStorage} from "@/app/_app-http-requests/upload-file-to-storage";
import {getUploadUrl} from "@/app/_app-http-requests/get-upload-url";

interface CharacterPhotoUploadProps {
  onPhotoUploaded?: (data: { storageKey: string; storageBucket: string; previewUrl: string }) => void
  onPhotoRemoved?: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function CharacterPhotoUpload({
  onPhotoUploaded,
  onPhotoRemoved,
}: CharacterPhotoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, storageKey, storageBucket } = await getUploadUrl(file.type)
      await uploadFileToStorage(uploadUrl, file)
      return { storageKey, storageBucket }
    },
    onSuccess: (data, file) => {
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)
      onPhotoUploaded?.({ ...data, previewUrl: preview })
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

    uploadMutation.mutate(file)
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onPhotoRemoved?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const error = validationError || 
    (uploadMutation.isError ? uploadMutation.error.message : null)

  return (
    <div className="space-y-2">
      <Label>Photo de référence (optionnel)</Label>
      
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="border-2 border-dashed rounded-lg p-4">
        {!previewUrl ? (
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
                src={previewUrl}
                alt="Photo de référence"
                className="w-full h-full object-cover"
              />
              {uploadMutation.isPending && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-sm">Upload en cours...</div>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-col ">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleButtonClick}
                disabled={uploadMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                Remplacer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={uploadMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Supprimer
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
