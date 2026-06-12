"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function DemoPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Démonstration des Composants UI</h1>
        <p className="text-muted-foreground">
          Tous les composants shadcn/ui sont prêts à l'emploi pour Book Creator
        </p>
      </div>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Boutons</CardTitle>
          <CardDescription>Différentes variantes de boutons disponibles</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Badges de statut et d'information</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
        </CardContent>
      </Card>

      {/* Form Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Formulaires</CardTitle>
          <CardDescription>Champs de saisie pour les formulaires</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" placeholder="Entrez votre nom" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Décrivez votre personnage..." rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Barre de Progression</CardTitle>
          <CardDescription>Indicateur de progression pour la génération</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>25%</span>
              <span className="text-muted-foreground">Génération en cours...</span>
            </div>
            <Progress value={25} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>75%</span>
              <span className="text-muted-foreground">Presque terminé...</span>
            </div>
            <Progress value={75} />
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>Dialog</CardTitle>
          <CardDescription>Fenêtre modale interactive</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Ouvrir le Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Êtes-vous sûr ?</DialogTitle>
                <DialogDescription>
                  Cette action va créer une nouvelle histoire. Voulez-vous continuer ?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Annuler</Button>
                <Button>Continuer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Personnage 1</CardTitle>
            <CardDescription>Description du personnage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Contenu de la carte avec des informations sur le personnage.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Action</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personnage 2</CardTitle>
            <CardDescription>Description du personnage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Contenu de la carte avec des informations sur le personnage.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Action</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scène 1</CardTitle>
            <CardDescription>Introduction de l'histoire</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Description de la première scène de l'histoire générée.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="secondary">Voir l'image</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
