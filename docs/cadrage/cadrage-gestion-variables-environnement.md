# Cadrage - Amélioration de la gestion des variables d'environnement

**Date**: 23 juin 2026  
**Auteur**: Analyse technique  
**Statut**: Validé - Approche Zod personnalisée

---

## 🎯 Contexte et objectifs

L'application Next.js book-creator présente plusieurs problèmes dans la gestion de ses variables d'environnement, rendant difficile le déploiement, le debugging et la maintenance de l'application.

### Objectifs principaux
1. Standardiser l'accès aux variables d'environnement dans toute l'application
2. Empêcher le démarrage de l'application si des variables critiques sont manquantes
3. Faciliter l'onboarding des nouveaux développeurs
4. Améliorer la sécurité et la maintenabilité
5. Respecter le principe "build once, run everywhere"

---

## 🔍 Analyse des problèmes actuels

### 1. Problème de versionnement du .env.example

**Constat**:
- Un fichier `.env.example` existe bien dans `webapp/.env.example` avec 45 lignes de configuration
- ❌ **MAIS** le `.gitignore` ignore tous les fichiers `.env*` (ligne 34: `.env*`)
- Le fichier `.env.example` n'est donc pas versionné dans Git
- Les développeurs ne savent pas quelles variables sont nécessaires sans consulter le code source

**Impact**:
- Onboarding difficile pour les nouveaux développeurs
- Risque d'oublier des variables en production
- Documentation implicite au lieu d'explicite

### 2. Valeurs par défaut omniprésentes

**Exemples trouvés dans le code** :

#### Database (webapp/src/lib/infrastructure/db/index.ts)
```typescript
host: process.env.POSTGRES_HOST,
port: Number.parseInt(process.env.POSTGRES_PORT || "5432"),
database: process.env.POSTGRES_DB,
user: process.env.POSTGRES_USER,
password: process.env.POSTGRES_PASSWORD,
```

#### Storage (webapp/src/lib/infrastructure/storage/aws-s3-storage.ts)
```typescript
endpoint: process.env.STORAGE_ENDPOINT || 'localhost',
port: process.env.STORAGE_PORT ? Number.parseInt(process.env.STORAGE_PORT) : undefined,
useSSL: process.env.STORAGE_USE_SSL === 'true',
accessKey: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
secretKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
bucket: process.env.STORAGE_BUCKET || 'book-images',
region: process.env.STORAGE_REGION || 'us-east-1',
```

#### Storage Public URL (plusieurs endroits)
```typescript
const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL!;  // ❌ Non-null assertion dangereuse
```

**Problèmes identifiés**:
- L'application démarre même si des variables critiques manquent
- Les valeurs par défaut peuvent masquer des erreurs de configuration
- En production, on pourrait se connecter accidentellement à `localhost` au lieu du vrai serveur
- Le `!` (non-null assertion) sur `STORAGE_PUBLIC_BASE_URL` causera un crash runtime si la variable est absente
- Comportement non prévisible entre les environnements

### 3. Patterns d'accès incohérents

**Inventaire des différentes approches trouvées** :

#### ❌ Approche 1 : Accès direct dans le code de configuration (db/index.ts)
```typescript
const dialect = new PostgresDialect({
  pool: new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number.parseInt(process.env.POSTGRES_PORT || "5432"),
    // ...
  }),
});
```

#### ❌ Approche 2 : Méthode privée loadConfig() dans les classes storage
```typescript
private loadConfig(): StorageConfig {
  return {
    endpoint: process.env.STORAGE_ENDPOINT || 'localhost',
    // ...
  };
}
```

#### ❌ Approche 3 : Paramètre de constructeur avec fallback (Replicate)
```typescript
constructor(apiToken?: string) {
  const token = apiToken || process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN is required');
  }
  // ...
}
```

#### ❌ Approche 4 : Accès direct dans les API routes
```typescript
const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL!;
const storyReadModel = new SqlStoryReadModel(publicBaseUrl);
```

#### ❌ Approche 5 : Lecture avec factory pattern
```typescript
const provider = forceProvider || process.env.STORY_PROVIDER || 'ollama';
```

**Problèmes**:
- Duplication de logique de parsing
- Difficile à tester (dépendance directe à process.env)
- Pas de source unique de vérité
- Mélange de responsabilités
- Incohérence dans le parsing (`parseInt` vs `Number.parseInt` vs conversion booléenne)

### 4. Autres défauts identifiés

#### 4.1 Parsing incohérent
```typescript
// Parfois :
Number.parseInt(process.env.POSTGRES_PORT || "5432")

// Parfois :
parseInt(process.env.STORY_GENERATION_TIMEOUT || '60000', 10)

// Parfois :
process.env.STORAGE_PORT ? Number.parseInt(process.env.STORAGE_PORT) : undefined
```

#### 4.2 Conversion booléenne fragile
```typescript
useSSL: process.env.STORAGE_USE_SSL === 'true'  // Seulement 'true' fonctionne, pas '1', 'yes', etc.
```

#### 4.3 Pas de validation de format
- URLs non validées
- Ports non vérifiés (< 1024 ou > 65535)
- Emails non validés
- Pas de vérification de valeurs enum

#### 4.4 Difficulté de test
- Impossible de mocker facilement les configurations
- Tests dépendants de l'environnement
- Pas de configuration de test dédiée

#### 4.5 Variables utilisées mais non documentées dans .env.example
Après analyse du code vs .env.example :
- `STORAGE_PUBLIC_BASE_URL` : ❌ Utilisé dans le code, **manquant dans .env.example**
- `STORY_PROVIDER` : ✅ Présent dans .env.local mais **manquant dans .env.example**
- `HUGGINGFACE_API_TOKEN` : ✅ Présent dans .env.local mais **manquant dans .env.example**

---

## 💡 Solution retenue : Configuration centralisée avec validation Zod

### Pourquoi Zod ?
- ✅ Validation stricte au runtime
- ✅ Inférence de types TypeScript automatique
- ✅ Messages d'erreur clairs
- ✅ Transformations intégrées (string → number, string → boolean)
- ✅ Validation de formats (URL, email, etc.)
- ✅ Largement utilisé dans l'écosystème Next.js

### Architecture proposée

```
webapp/src/config/
├── env.schema.ts      # Deux schémas de validation Zod (public + complet)
└── env.ts             # Configuration runtime avec validation
```

---

## 🏗️ Principe "Build once, run everywhere"

### Le principe fondamental

**"Build once, run everywhere"** est un principe clé du déploiement cloud-native :
- **Une seule image Docker** est buildée
- **Cette image unique** est déployée dans tous les environnements (dev, staging, prod)
- **La configuration change**, pas l'artefact
- Les variables d'environnement sont le mécanisme standard pour cette configuration

```
Image Docker unique ───┬──► Dev (env vars dev)
                       ├──► Staging (env vars staging)  
                       └──► Production (env vars prod)
```

### Application à notre contexte

**Conséquence** : Si on applique strictement ce principe, **PRESQUE TOUTES** les variables d'environnement devraient être injectées au runtime, pas au build-time.

**EXCEPTION : Les variables NEXT_PUBLIC_***

Next.js a une particularité : les variables `NEXT_PUBLIC_*` sont **intégrées dans le bundle JavaScript** au moment du build :
- ✅ Nécessaires au build-time (intégrées dans le bundle)
- ⚠️ Exposées au client (bundle public)
- 🔒 Ne doivent JAMAIS contenir de secrets

**Pour cette application** : `NEXT_PUBLIC_APP_URL` est la seule variable publique.

### Validation séparée : Build-time vs Runtime

#### Validation au BUILD-TIME : Variables publiques uniquement

**Ce qui DOIT être validé au build** :
```typescript
✅ NEXT_PUBLIC_APP_URL   // Intégrée dans le bundle, requise au build
```

**Ce qui NE DOIT PAS être validé au build** :
```typescript
❌ POSTGRES_HOST         // Injectée au runtime
❌ POSTGRES_PASSWORD     // Injectée au runtime (secret)
❌ STORAGE_ENDPOINT      // Injectée au runtime
❌ REPLICATE_API_TOKEN   // Injectée au runtime (secret)
❌ ... toutes les autres
```

**Pourquoi ?**
- ✅ Respect de "build once, run everywhere"
- ✅ La même image peut être déployée partout
- ✅ Les secrets ne sont jamais dans l'image Docker
- ✅ Flexibilité maximale de configuration

#### Validation au RUNTIME : Toutes les variables

**Objectif** : Garantir une configuration valide **au démarrage de l'application**

**Ce qui est validé** :
```typescript
✅ TOUTES les variables (configuration + secrets)
✅ Variables publiques (NEXT_PUBLIC_*)
✅ Variables de configuration (POSTGRES_HOST, STORAGE_ENDPOINT, etc.)
✅ Variables sensibles (POSTGRES_PASSWORD, API tokens, etc.)
```

**Pourquoi une validation runtime complète ?**
- ✅ Valide les variables injectées après le build
- ✅ Détecte les erreurs avant d'accepter du trafic
- ✅ Messages d'erreur clairs pour les ops
- ✅ Compatible avec patterns modernes (K8s secrets, AWS Parameter Store)

### Deux schémas de validation différents

**C'est NÉCESSAIRE car** :
1. Le build-time ne valide QUE les variables publiques
2. Le runtime valide TOUTES les variables
3. Ils ont des responsabilités différentes
4. Ils s'exécutent à des moments différents avec des variables disponibles différentes

---

## ⚠️ Que faire si la validation échoue au runtime ?

### Stratégie recommandée : Fail-fast ✅

**Approche** : Crash immédiat de l'application (`process.exit(1)`)

```typescript
function validateEnv() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ FATAL: Configuration invalide au runtime');
    console.error(result.error.flatten().fieldErrors);
    
    // Crash immédiat - pas de compromis
    process.exit(1);
  }
  
  return result.data;
}
```

### Pourquoi fail-fast est la bonne approche ?

**Avantages** :
- ✅ Évite un comportement imprévisible (connexion à mauvaise DB, etc.)
- ✅ Le processus crashe immédiatement, visible dans les logs
- ✅ Force la correction avant mise en service
- ✅ Pas de risque de corruption de données
- ✅ Principe "fail fast, fail loud"

**Scénario typique** :
```
1. Application démarre avec configuration invalide
2. Validation échoue → process.exit(1)
3. Le processus s'arrête immédiatement
4. ❌ L'application ne démarre pas
5. 📋 Les erreurs sont visibles dans les logs
6. 👤 Développeur/Ops corrige la configuration
7. 🔄 Redémarrage avec bonne config
8. ✅ Application démarre correctement
```

**Note sur les orchestrateurs (Kubernetes, Docker Swarm, etc.)** :
Si vous déployez avec un orchestrateur, celui-ci détectera automatiquement le crash et :
- Ne routera pas de trafic vers l'instance défaillante
- Conservera les instances avec bonne configuration en service
- Permettra un rollback automatique

**Comparaison avec d'autres stratégies** :

| Stratégie | Avantages | Inconvénients | Recommandation |
|-----------|-----------|---------------|----------------|
| **Fail-fast** (process.exit) | Sécurité maximale, comportement prévisible | L'app ne démarre pas | ✅ **RECOMMANDÉ** |
| Mode dégradé + valeurs par défaut | App démarre toujours | Comportement imprévisible, bugs silencieux | ❌ Dangereux |
| Logging seulement | App démarre | Masque les problèmes, risque de corruption | ❌ Très dangereux |


---

## 📝 Implémentation technique

### Fichier env.schema.ts - Deux schémas distincts

```typescript
import { z } from 'zod';

/**
 * Schéma des variables publiques (NEXT_PUBLIC_*).
 * 
 * Ces variables sont intégrées dans le bundle au build-time.
 * Validé UNIQUEMENT au build-time dans next.config.ts
 * 
 * ATTENTION : Ne jamais mettre de secrets ici !
 */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL doit être une URL valide"),
});

/**
 * Schéma complet de toutes les variables d'environnement.
 * Validé au runtime (démarrage de l'application).
 * 
 * Respecte le principe "build once, run everywhere" :
 * - Une seule image buildée
 * - Configuration + secrets injectés au runtime
 */
export const envSchema = z.object({
  // Application (variables publiques)
  ...publicEnvSchema.shape,
  
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  POSTGRES_HOST: z.string().min(1, "POSTGRES_HOST est requis"),
  POSTGRES_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  POSTGRES_DB: z.string().min(1, "POSTGRES_DB est requis"),
  POSTGRES_USER: z.string().min(1, "POSTGRES_USER est requis"),
  POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD est requis"),

  // Storage
  STORAGE_PROVIDER: z.enum(['minio', 'aws-s3']).default('aws-s3'),
  STORAGE_ENDPOINT: z.string().min(1, "STORAGE_ENDPOINT est requis"),
  STORAGE_PORT: z.coerce.number().int().positive().optional(),
  STORAGE_USE_SSL: z.coerce.boolean().default(false),
  STORAGE_ACCESS_KEY: z.string().min(1, "STORAGE_ACCESS_KEY est requis"),
  STORAGE_SECRET_KEY: z.string().min(1, "STORAGE_SECRET_KEY est requis"),
  STORAGE_BUCKET: z.string().min(1).default('book-images'),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_PUBLIC_BASE_URL: z.string().url("STORAGE_PUBLIC_BASE_URL doit être une URL valide"),

  // AI Services
  REPLICATE_API_TOKEN: z.string().min(1, "REPLICATE_API_TOKEN est requis"),
  
  // Story Generation
  STORY_PROVIDER: z.enum(['ollama', 'openai', 'huggingface']).default('ollama'),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.2:3b'),
  HUGGINGFACE_API_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Upload Configuration
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(10485760), // 10MB
  ALLOWED_IMAGE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),

  // Timeouts
  STORY_GENERATION_TIMEOUT: z.coerce.number().int().positive().default(60000),
  IMAGE_GENERATION_TIMEOUT: z.coerce.number().int().positive().default(90000),
});

// Type helpers pour l'autocomplétion
export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type Env = z.infer<typeof envSchema>;
```

### Fichier env.ts - Configuration runtime

```typescript
import { envSchema } from './env.schema';

/**
 * Validation des variables d'environnement au RUNTIME.
 * 
 * Exécutée au démarrage du serveur Next.js, cette validation garantit que :
 * - Toutes les variables requises sont présentes
 * - Les secrets injectés au runtime (K8s, Docker) sont valides
 * - L'application ne démarre pas avec une configuration invalide
 * 
 * STRATÉGIE : FAIL-FAST
 * Si la validation échoue, l'application crashe immédiatement (process.exit(1))
 * pour éviter tout comportement imprévisible.
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ ========================================');
    console.error('❌ FATAL: Configuration invalide au runtime');
    console.error('❌ ========================================');
    console.error('\n📋 Erreurs de validation :');
    console.error(result.error.flatten().fieldErrors);
    console.error('\n💡 Consultez .env.example pour la liste complète des variables');
    console.error('💡 Vérifiez que toutes les variables requises sont définies');
    console.error('\n🔴 L\'application ne peut pas démarrer avec une configuration invalide');
    
    // Fail-fast : crash immédiat
    process.exit(1);
  }
  
  // Log succès (sans les secrets)
  console.log('✅ Variables d\'environnement validées au runtime');
  console.log(`📝 Environnement: ${result.data.NODE_ENV}`);
  console.log(`📝 Storage provider: ${result.data.STORAGE_PROVIDER}`);
  console.log(`📝 Story provider: ${result.data.STORY_PROVIDER}`);
  
  return result.data;
}

// Export de la configuration validée (singleton)
// L'app crashe ici si la config est invalide
export const env = validateEnv();

// Re-export des types pour l'autocomplétion
export type { Env, PublicEnv } from './env.schema';
```

### Configuration Next.js - Validation build-time

Dans `next.config.ts`, valider UNIQUEMENT les variables publiques :

```typescript
import type { NextConfig } from 'next';
import { publicEnvSchema } from './src/config/env.schema';

/**
 * Validation des variables publiques au BUILD-TIME.
 * 
 * Principe "build once, run everywhere" :
 * - Seules les variables NEXT_PUBLIC_* sont validées ici
 * - Ces variables sont intégrées dans le bundle au build
 * - Les autres variables sont injectées et validées au runtime
 * 
 * Cette validation garantit que le build ne peut pas se terminer
 * si les variables publiques requises sont manquantes.
 */
const buildTimeEnv = publicEnvSchema.safeParse(process.env);

if (!buildTimeEnv.success) {
  console.error('❌ ========================================');
  console.error('❌ Build échoué : variables publiques invalides');
  console.error('❌ ========================================');
  console.error('\n📋 Erreurs de validation :');
  console.error(buildTimeEnv.error.flatten().fieldErrors);
  console.error('\n💡 Les variables NEXT_PUBLIC_* sont requises au build');
  console.error('💡 Elles sont intégrées dans le bundle JavaScript');
  console.error('\n🔴 Le build ne peut pas continuer');
  
  process.exit(1);
}

console.log('✅ Variables publiques validées au build-time');
console.log(`📝 App URL: ${buildTimeEnv.data.NEXT_PUBLIC_APP_URL}`);

const nextConfig: NextConfig = {
  // ... votre configuration Next.js
};

export default nextConfig;
```

### Utilisation dans le code

#### Avant (db/index.ts)
```typescript
const dialect = new PostgresDialect({
  pool: new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number.parseInt(process.env.POSTGRES_PORT || "5432"),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    max: 10,
  }),
});
```

#### Après
```typescript
import { env } from '@/config/env';

const dialect = new PostgresDialect({
  pool: new Pool({
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DB,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    max: 10,
  }),
});
```

**Avantages** :
- ✅ Autocomplétion TypeScript complète
- ✅ Validation garantie au démarrage
- ✅ Parsing automatique (string → number, boolean)
- ✅ Messages d'erreur explicites
- ✅ Source unique de vérité
- ✅ Facilement testable (mock du module env)

---

## 📋 Plan d'implémentation

### Phase 1 : Sécurisation et préparation (URGENT)

1. **Mettre à jour .gitignore**
   ```gitignore
   # env files
   .env*
   !.env.example  # ✅ Autoriser .env.example
   ```

2. **Mettre à jour .env.example**
   - Ajouter les variables manquantes (`STORAGE_PUBLIC_BASE_URL`, `STORY_PROVIDER`, `HUGGINGFACE_API_TOKEN`)
   - Documenter chaque variable
   - Indiquer les variables sensibles

3. **Commiter .env.example**
   ```bash
   git add webapp/.env.example webapp/.gitignore
   git commit -m "docs: version .env.example for developer onboarding"
   ```

### Phase 2 : Mise en place de la configuration centralisée

1. **Installer les dépendances**
   ```bash
   cd webapp
   npm install zod
   ```

2. **Créer le module de configuration**
   - Créer `webapp/src/config/env.schema.ts` (deux schémas : public + complet)
   - Créer `webapp/src/config/env.ts` (validation runtime avec fail-fast)
   - Modifier `webapp/next.config.ts` (validation build-time des vars publiques)

### Phase 3 : Migration progressive du code existant

**Ordre de migration recommandé** (du plus critique au moins critique) :

1. **Database** (`webapp/src/lib/infrastructure/db/index.ts`)
   - Remplacer les accès directs par `env.POSTGRES_*`
   - Supprimer les valeurs par défaut

2. **Storage** (`webapp/src/lib/infrastructure/storage/*.ts`)
   - Refactorer `loadConfig()` pour utiliser `env`
   - Centraliser la configuration storage

3. **API Routes** (tous les fichiers dans `webapp/src/app/api/`)
   - Remplacer `process.env.STORAGE_PUBLIC_BASE_URL!` par `env.STORAGE_PUBLIC_BASE_URL`
   - Utiliser `env` pour toutes les configurations

4. **AI Services** (`webapp/src/lib/scene-image-generator/*.ts`, `webapp/src/lib/story-scenes-description-generator/*.ts`)
   - Refactorer les constructeurs
   - Utiliser `env` au lieu de paramètres optionnels

5. **Factories** (`webapp/src/lib/infrastructure/storage/storage-factory.ts`)
   - Utiliser `env.STORAGE_PROVIDER` directement

### Phase 4 : Tests et validation

1. **Tests d'intégration**
   - Vérifier que l'app refuse de démarrer si variables manquantes (fail-fast)
   - Simuler différents scénarios d'erreur de configuration

2. **Tests de résilience**
   - Démarrer avec config invalide → doit crasher immédiatement
   - Vérifier que les logs d'erreur sont clairs

### Phase 5 : Amélioration continue

1. **Configuration par environnement**
   - Documenter les différences dev/staging/prod
   - Créer des templates `.env` pour chaque environnement

2. **CI/CD**
   - Le build échoue automatiquement si variables publiques manquantes
   - Pas besoin de validation supplémentaire (intégrée dans le build)

---

## 🎯 Bénéfices attendus

### Pour les développeurs
- ✅ Onboarding simplifié avec `.env.example` versionné
- ✅ Autocomplétion et typage complet
- ✅ Messages d'erreur clairs en cas de mauvaise configuration
- ✅ Tests plus faciles à écrire
- ✅ Source unique de vérité pour la configuration

### Pour l'application
- ✅ Fail-fast au démarrage si configuration invalide
- ✅ Moins de bugs liés à la configuration
- ✅ Comportement prévisible entre environnements
- ✅ Meilleure sécurité (validation des URLs, ports, etc.)
- ✅ Respect de "build once, run everywhere"

### Pour les opérations
- ✅ Déploiements plus sûrs (rollback automatique si config invalide)
- ✅ Configuration documentée et versionée
- ✅ Moins de surprises en production
- ✅ Debugging facilité
- ✅ Logs clairs en cas de problème

---

## ⚠️ Risques et mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Breaking changes lors de la migration | Élevé | Moyenne | Migration progressive, tests complets |
| Oubli de variables lors de la migration | Moyen | Moyenne | Analyse automatique des `process.env` |
| App crash en prod si config invalide | Élevé | Faible | Fail-fast + logs clairs + monitoring |
| Variables manquantes détectées au runtime | Moyen | Moyenne | Fail-fast + logging clair + alerting |

---

## 📊 Décisions d'architecture

### 1. Build-time vs Runtime : Décision finale

**Validation build-time** :
- ✅ Variables `NEXT_PUBLIC_*` **uniquement**
- ✅ Schéma : `publicEnvSchema`
- ✅ Localisation : `next.config.ts`
- ✅ Justification : Ces variables sont intégrées au bundle, requises au build

**Validation runtime** :
- ✅ **TOUTES** les variables (configuration + secrets)
- ✅ Schéma : `envSchema` (complet, inclut `publicEnvSchema`)
- ✅ Localisation : `env.ts` (importé au démarrage de l'app)
- ✅ Justification : Respect de "build once, run everywhere"

**Pourquoi deux schémas différents ?**
- Les responsabilités sont différentes
- Ils s'exécutent à des moments différents
- Les variables disponibles sont différentes
- Build-time : variables publiques seulement
- Runtime : toutes les variables (config + secrets injectés)

### 2. Stratégie d'échec : Fail-fast obligatoire

**En cas de configuration invalide au runtime** :
- ✅ `process.exit(1)` immédiat, sans exception
- ✅ Logs d'erreur détaillés et structurés
- ✅ Le processus s'arrête, empêchant tout comportement imprévisible
- ❌ **Pas de mode dégradé** (trop dangereux)
- ❌ **Pas de valeurs par défaut en production** (masque les problèmes)

**Note** : Si vous utilisez un orchestrateur (Kubernetes, Docker Swarm), celui-ci détectera automatiquement le crash et ne routera pas de trafic vers l'instance défaillante.

**Justification** : 
- Sécurité > Disponibilité pour les erreurs de configuration
- Comportement prévisible et déterministe
- Force la correction immédiate du problème
- Évite les bugs silencieux et la corruption de données

### 3. Observabilité

**Logging** :
- ✅ Configuration au démarrage (secrets masqués)
- ✅ Erreurs de validation détaillées avec exemples
- ✅ Intégration avec monitoring (Datadog, Prometheus, etc.)
- ✅ Logs structurés (JSON) pour faciliter le parsing

---

## 🔗 Ressources

- [Zod Documentation](https://zod.dev/)
- [Next.js Environment Variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)
- [12 Factor App - Config](https://12factor.net/config)

---

## 📝 Notes additionnelles

### Variables sensibles identifiées

Ces variables ne doivent JAMAIS être commitées ou intégrées au build :
- `POSTGRES_PASSWORD`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `REPLICATE_API_TOKEN`
- `HUGGINGFACE_API_TOKEN`
- `OPENAI_API_KEY`

**Elles sont injectées au runtime** via :
- Kubernetes Secrets
- Docker Compose secrets
- AWS Parameter Store
- Variables d'environnement du système

### Variables publiques (NEXT_PUBLIC_*)

Seules ces variables peuvent être exposées au client :
- `NEXT_PUBLIC_APP_URL`

**Caractéristiques** :
- Intégrées dans le bundle JavaScript au build
- Accessibles côté client
- Ne doivent contenir aucune information sensible
- Validées au build-time

Toutes les autres variables doivent rester côté serveur et être injectées au runtime.
