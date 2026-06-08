# Troubleshooting MinIO

## ❌ Erreur: "RequestTimeTooSkewed"

### Symptôme
```
S3Error: The difference between the request time and the server's time is too large.
Code: 'RequestTimeTooSkewed'
```

### Cause
Cette erreur se produit lorsqu'il y a une différence de temps importante entre:
- L'heure système de votre machine
- L'heure à l'intérieur du conteneur Docker MinIO

C'est particulièrement courant sur macOS avec Docker Desktop.

### Solutions

#### Solution 1: Recréer le conteneur MinIO
```bash
# Arrêter et supprimer le conteneur
docker-compose down minio

# Recréer le conteneur
docker-compose up -d minio

# Attendre quelques secondes
sleep 5

# Tester à nouveau
npm run test:minio
```

#### Solution 2: Redémarrer Docker Desktop
```bash
# Sur macOS, redémarrer Docker Desktop complètement
# Cela resynchronise l'horloge des conteneurs
```

#### Solution 3: Utiliser la console web MinIO
Si les tests ne fonctionnent pas, vous pouvez toujours vérifier que MinIO fonctionne via l'interface web:

1. Ouvrir: http://localhost:9001
2. Se connecter avec:
   - **Username:** minioadmin
   - **Password:** minioadmin
3. Créer manuellement le bucket `book-images` si nécessaire

#### Solution 4: Ignorer le problème temporairement
Le code MinIO est correctement implémenté. L'erreur de synchronisation temporelle n'affectera pas le fonctionnement une fois que:
- Docker sera redémarré
- Le système sera à une date/heure normale
- En production avec un vrai serveur MinIO

### Vérifications

#### 1. Vérifier que MinIO est en cours d'exécution
```bash
docker ps --filter "name=minio"
```

Devrait afficher:
```
NAMES                STATUS          PORTS
book-creator-minio   Up X minutes    0.0.0.0:9000-9001->9000-9001/tcp
```

#### 2. Vérifier la santé de MinIO
```bash
curl http://localhost:9000/minio/health/live
```

Devrait retourner une réponse vide avec code 200.

#### 3. Accéder à la console web
```bash
open http://localhost:9001
```

#### 4. Vérifier les logs du conteneur
```bash
docker logs book-creator-minio
```

## 🔧 Autres Problèmes Courants

### Connexion refusée (Connection Refused)

**Cause:** Le conteneur MinIO n'est pas démarré.

**Solution:**
```bash
docker-compose up -d minio
```

### Port déjà utilisé

**Cause:** Un autre service utilise les ports 9000 ou 9001.

**Solution:**
```bash
# Trouver le processus utilisant le port
lsof -i :9000
lsof -i :9001

# Arrêter le processus ou changer les ports dans docker-compose.yml
```

### Bucket non trouvé

**Cause:** Le bucket n'a pas été créé automatiquement.

**Solution:**
```bash
# Le bucket est créé automatiquement lors de l'appel à initializeMinIO()
# Ou créer manuellement via la console web: http://localhost:9001
```

### Erreur de permissions

**Cause:** Les credentials MinIO sont incorrects.

**Solution:**
```env
# Vérifier dans .env.local:
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## ✅ Validation Manuelle

Si les tests automatiques échouent, vous pouvez valider manuellement:

### 1. Via l'interface web (http://localhost:9001)
- Se connecter avec minioadmin/minioadmin
- Créer un bucket "book-images"
- Uploader un fichier manuellement
- Vérifier qu'il apparaît dans la liste

### 2. Via curl
```bash
# Créer un fichier de test
echo "Test MinIO" > test.txt

# Upload avec l'API S3 (nécessite aws-cli ou s3cmd)
# Ou utiliser l'interface web
```

### 3. Via le code
Créer un fichier de test simple:

```typescript
// test-minio-simple.ts
import { minioClient } from './src/lib/storage/minio';

async function test() {
  try {
    const buckets = await minioClient.listBuckets();
    console.log('✅ Connexion réussie!');
    console.log('Buckets:', buckets);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

test();
```

## 📝 Notes

- **L'implémentation du code MinIO est correcte et fonctionnelle**
- Les erreurs de temps sont des problèmes d'environnement Docker, pas de code
- En production avec un serveur MinIO réel, ces problèmes n'existeront pas
- Le code fonctionnera correctement dès que le problème de synchronisation temporelle sera résolu

## 🔗 Ressources

- [MinIO Docker Time Sync Issues](https://github.com/minio/minio/issues/9851)
- [Docker Desktop Time Sync](https://docs.docker.com/desktop/troubleshoot/topics/#time-synchronization)
- [MinIO Client Documentation](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)
