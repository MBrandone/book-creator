# Configuration Tailwind CSS & shadcn/ui

## ✅ Configuration Terminée

Cette documentation détaille la configuration de Tailwind CSS et shadcn/ui pour le projet Book Creator.

---

## 🎨 Tailwind CSS

### Couleurs Personnalisées

Le thème a été configuré avec des couleurs adaptées à un créateur de livres pour enfants :

- **Primary (Violet)** : `hsl(262.1 83.3% 57.8%)` - Pour la créativité
- **Secondary (Rose)** : `hsl(340 82% 67%)` - Thème livres pour enfants
- **Accent (Orange)** : `hsl(24.6 95% 53.1%)` - Pour l'énergie
- **Success (Vert)** : `hsl(142.1 76.2% 36.3%)`
- **Warning (Jaune)** : `hsl(37.7 92.1% 50.2%)`
- **Destructive (Rouge)** : `hsl(0 84.2% 60.2%)`

### Breakpoints Responsives

Les breakpoints sont configurés dans `src/app/globals.css` :

```css
--breakpoint-xs: 375px;
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Mode Sombre

Le support du mode sombre est automatiquement géré via `prefers-color-scheme`.

---

## 🧩 Composants shadcn/ui Installés

Tous les composants sont disponibles dans `src/components/ui/` :

### Composants de Base
- **Button** (`button.tsx`) - Boutons avec variantes (default, secondary, outline, ghost, link, destructive)
- **Card** (`card.tsx`) - Cartes avec Header, Title, Description, Content, Footer
- **Badge** (`badge.tsx`) - Badges avec variantes de statut
- **Progress** (`progress.tsx`) - Barre de progression

### Composants de Formulaire
- **Input** (`input.tsx`) - Champs de saisie texte
- **Label** (`label.tsx`) - Labels pour formulaires
- **Textarea** (`textarea.tsx`) - Zone de texte multiligne

### Composants Modaux
- **Dialog** (`dialog.tsx`) - Fenêtre modale avec overlay
- **Sonner** (`sonner.tsx`) - Toast notifications

### Utilitaires
- **cn()** dans `src/lib/utils.ts` - Fonction pour combiner les classes Tailwind

---

## 📦 Dépendances Installées

```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "latest",
    "@radix-ui/react-slot": "latest",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-label": "latest",
    "next-themes": "latest",
    "sonner": "latest"
  }
}
```

---

## 🚀 Utilisation

### Import Simple

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
```

### Ou via l'export global

```tsx
import { Button, Card, Input, Label } from "@/components/ui"
```

### Exemple d'Utilisation

```tsx
export default function MyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un personnage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Nom</Label>
          <Input id="name" placeholder="Entrez le nom" />
        </div>
        <Button>Créer</Button>
      </CardContent>
    </Card>
  )
}
```

---

## 🎯 Page de Démonstration

Une page de démonstration complète est disponible à `/demo` montrant tous les composants installés.

Pour la voir en développement :
```bash
npm run dev
# Puis visiter http://localhost:3000/demo
```

---

## 📝 Configuration des Fichiers

### `components.json`
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### `src/app/globals.css`
Contient toutes les variables CSS personnalisées pour les couleurs, avec support du mode sombre.

---

## ✨ Prochaines Étapes

Maintenant que l'infrastructure UI est en place, vous pouvez :

1. **Créer les composants métier** :
   - `CharacterForm.tsx` - Formulaire de création de personnage
   - `ImageUploader.tsx` - Upload d'images avec drag & drop
   - `StoryGallery.tsx` - Galerie d'images des scènes
   - `LoadingState.tsx` - États de chargement

2. **Personnaliser les pages** :
   - Page d'accueil (`src/app/page.tsx`)
   - Page de création (`src/app/create/page.tsx`)
   - Page de résultats (`src/app/stories/[id]/page.tsx`)

3. **Ajouter plus de composants shadcn/ui si nécessaire** :
   ```bash
   npx shadcn@latest add [composant]
   ```

---

## 🔍 Vérification

✅ Build réussi sans erreurs  
✅ TypeScript compilé avec succès  
✅ Tous les composants sont fonctionnels  
✅ Page de démonstration disponible  
✅ Couleurs personnalisées configurées  
✅ Breakpoints responsives définis  

---

**Date de configuration** : 4 juin 2026  
**Version Tailwind CSS** : 4.x  
**Version Next.js** : 16.2.7  
**Style shadcn/ui** : new-york
