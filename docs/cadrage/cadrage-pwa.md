# Cadrage: Transformation en PWA

## Contexte

Book Creator est une application Next.js 16.2.9 qui génère des livres illustrés pour enfants avec l'IA. L'objectif est de permettre l'installation sur mobile comme une application native.

**Pourquoi ce changement :**
- Installation sur l'écran d'accueil mobile (comme une app native)
- Cache des images pour chargements plus rapides
- Meilleure UX mobile avec affichage plein écran
- Meilleur engagement et rétention

**État actuel :**
- Next.js 16.2.9 avec App Router, **Turbopack activé**
- React 19.2.4, TypeScript 5
- Application en français
- Logo 1024×1024 disponible (`/public/logo.png`)
- Aucun code PWA existant

## Approche d'implémentation

**PWA minimaliste compatible Turbopack :**

Service worker **standalone** compilé séparément (pas de plugin webpack/turbopack). Workbox core uniquement.

**Stratégie de cache SIMPLIFIÉE :**
- ✅ **Images uniquement** : Cache-first
- ❌ **Pas de cache** : API, HTML, JS, CSS → réseau direct
- ❌ **Pas de notifications** : Mise à jour silencieuse

**SSR :** Compatible, service worker côté client uniquement.

## Découpage des tâches

### Phase 1 : Icônes

**Tâche 1.1 : Générer les icônes PWA**
- Script Deno depuis logo.png : 192×192, 512×512, 180×180, maskable
- Fichiers créés :
  - `/webapp/scripts/generate-icons.ts`
  - `/webapp/public/icons/icon-{192,512,180-apple,192-maskable}.png`

**Tâche 1.2 : Vérifier favicon**
- S'assurer favicon.ico existe

---

### Phase 2 : Manifest

**Tâche 2.1 : Créer manifest.ts**
- Fichier : `/webapp/src/app/manifest.ts`
- Config : français, standalone, portrait, icônes

**Tâche 2.2 : Meta tags Apple**
- Fichier : `/webapp/src/app/layout.tsx`
- Tags iOS : apple-mobile-web-app-*

---

### Phase 3 : Service Worker (Simplifié)

**Tâche 3.1 : Installer Workbox core**
- `npm install workbox-core workbox-routing workbox-strategies workbox-expiration`
- Pas de workbox-webpack-plugin (incompatible Turbopack)

**Tâche 3.2 : Service Worker standalone**
- Fichier : `/webapp/src/service-worker/sw.ts`
- Cache images UNIQUEMENT (Cache-first, 50 max, 30j)
- Fichier : `/webapp/src/service-worker/config.ts`

**Tâche 3.3 : Script compilation SW**
- Script : `/webapp/scripts/build-sw.ts`
- Compile SW TypeScript → `/webapp/public/sw.js`
- Intégration automatique dans package.json :
  - `"build": "tsx scripts/build-sw.ts && next build"`
  - `"dev": "tsx scripts/build-sw.ts && next dev --turbopack"`
  - `"build:sw": "tsx scripts/build-sw.ts"` (rebuild manuel optionnel)

**Tâche 3.4 : Enregistrement SW minimal**
- Fichier : `/webapp/src/components/service-worker-registration.tsx`
- Code : `navigator.serviceWorker.register('/sw.js')`
- Pas de notifications de mise à jour
- Production uniquement

---

### Phase 4 : Métadonnées

**Tâche 4.1 : Métadonnées layout**
- Fichier : `/webapp/src/app/layout.tsx`
- viewport, themeColor, manifest

**Tâche 4.2 : Intégrer enregistrement SW**
- Ajouter `<ServiceWorkerRegistration />` dans layout

---

### Phase 5 : Installation

**Tâche 5.1 : Bouton installation autonome**
- Fichier : `/webapp/src/components/install-app-button.tsx`
- Logique beforeinstallprompt intégrée directement (pas de hook séparé)
- SSR-safe
- Texte : "Installer l'application"

**Tâche 5.2 : Intégrer au footer**
- Fichier : `/webapp/src/components/footer.tsx`
- Placement non intrusif

---

### Phase 6 : Offline (Optionnel)

**Tâche 6.1 : Page fallback**
- Fichier : `/webapp/src/app/offline/page.tsx`

**Tâche 6.2 : Indicateur réseau**
- Fichier : `/webapp/src/components/network-status.tsx`
- Toast Sonner hors ligne

**Tâche 6.3 : Bloquer génération offline**
- Fichier : `/webapp/src/app/create-story/page.tsx`
- Message : "La génération nécessite une connexion Internet"

---

## Vérification

1. `npm run build && npm start`
2. Lighthouse PWA audit (90+)
3. Installation Android/iOS
4. Cache images fonctionne
5. Pas de cache API (Network tab)

---

## Questions résolues

### Turbopack vs workbox-webpack-plugin ?
**Solution :** Service worker standalone, compilé séparément avec `tsx`. Pas de plugin webpack. Build automatisé dans `npm run build` et `npm run dev`.

### Build manuel du SW ?
**Décision :** Script `build-sw.ts` intégré automatiquement dans les commandes `build` et `dev`. Pas de build manuel requis.

### Hook installation séparé ?
**Décision :** Pas de dossier `src/hooks` générique. Logique `beforeinstallprompt` intégrée directement dans `install-app-button.tsx`.

### App shell ?
Dans Next.js : JS/CSS de `/_next/static/*`.
**Décision :** Pas de cache app shell. Images uniquement.

### Notifications ?
**Décision :** Aucune notification (ni mise à jour, ni push).

### SSR et PWA ?
**Réponse :** Aucun problème. Compatible.

### Emplacement bouton ?
**Décision :** Footer (pas header).

---

## Fichiers

**Nouveaux :**
- `/webapp/scripts/generate-icons.ts`
- `/webapp/scripts/build-sw.ts`
- `/webapp/src/app/manifest.ts`
- `/webapp/src/service-worker/sw.ts`
- `/webapp/src/service-worker/config.ts`
- `/webapp/src/components/service-worker-registration.tsx`
- `/webapp/src/hooks/use-install-prompt.ts`
- `/webapp/src/components/install-app-button.tsx`
- `/webapp/src/app/offline/page.tsx` (opt)
- `/webapp/src/components/network-status.tsx` (opt)
- ~~`/webapp/src/hooks/use-install-prompt.ts`~~ (supprimé : logique dans install-app-button)

**Modifiés :**
- `/webapp/src/app/layout.tsx`
- `/webapp/package.json`
- `/webapp/src/components/footer.tsx`
- `/webapp/src/app/create-story/page.tsx` (opt)

**Assets :**
- `/webapp/public/icons/*.png`
- `/webapp/public/sw.js`
