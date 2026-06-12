/**
 * Script de test pour la génération d'images avec Replicate SDXL
 * 
 * Usage:
 *   npx ts-node scripts/test-replicate.ts
 * 
 * Prérequis:
 * - REPLICATE_API_TOKEN configuré dans .env.local
 * - MinIO en cours d'exécution (docker-compose up -d)
 * - Bucket "book-images" créé dans MinIO
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger explicitement .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { ReplicateImageProvider } from '../src/lib/providers/replicate';
import type { ImageGenerationOptions } from '@/lib/command-handler/generate-story-book-images/image-generator';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function waitWithMessage(seconds: number, reason: string) {
  log(`\n⏳ Attente de ${seconds} secondes (${reason})...`, colors.yellow);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  log(`✅ Prêt à continuer\n`, colors.green);
}

async function testImageGeneration() {
  log('\n🧪 Test de génération d\'image avec Replicate SDXL\n', colors.bright);

  // Debug: afficher le chemin du fichier .env.local
  const envPath = resolve(__dirname, '../.env.local');
  log(`📄 Chargement des variables depuis: ${envPath}`, colors.cyan);
  
  // Vérifier la présence de la clé API
  if (!process.env.REPLICATE_API_TOKEN) {
    log('❌ ERREUR: REPLICATE_API_TOKEN non défini dans .env.local', colors.red);
    log('\nPour obtenir une clé API:', colors.yellow);
    log('1. Créez un compte sur https://replicate.com', colors.yellow);
    log('2. Allez dans Account Settings > API Tokens', colors.yellow);
    log('3. Créez un nouveau token', colors.yellow);
    log('4. Ajoutez-le dans .env.local: REPLICATE_API_TOKEN=votre_token', colors.yellow);
    process.exit(1);
  }

  if (process.env.REPLICATE_API_TOKEN === 'your_replicate_token_here') {
    log('⚠️  ATTENTION: Remplacez "your_replicate_token_here" par votre vraie clé API', colors.yellow);
    process.exit(1);
  }

  // Afficher un aperçu du token (masqué)
  const tokenPreview = process.env.REPLICATE_API_TOKEN.substring(0, 8) + '...' + 
                       process.env.REPLICATE_API_TOKEN.substring(process.env.REPLICATE_API_TOKEN.length - 4);
  log(`🔑 Token API détecté: ${tokenPreview}\n`, colors.green);

  try {
    // Créer le provider
    log('📦 Création du provider Replicate...', colors.cyan);
    const provider = new ReplicateImageProvider();
    log('✅ Provider créé avec succès\n', colors.green);

    // Test 1: Génération simple avec prompt de livre pour enfants
    log('🎨 Test 1: Génération d\'image simple', colors.bright);
    const options1: ImageGenerationOptions = {
      prompt: 'A friendly dragon playing with colorful balloons in a magical forest',
      aspectRatio: '1:1',
      seed: 12345, // Seed fixe pour reproductibilité
    };

    log(`Prompt: "${options1.prompt}"`, colors.blue);
    log('Génération en cours (peut prendre 30-60 secondes)...', colors.yellow);
    
    const startTime1 = Date.now();
    const result1 = await provider.generateImage(options1);
    const duration1 = ((Date.now() - startTime1) / 1000).toFixed(1);

    log(`✅ Image générée en ${duration1}s`, colors.green);
    log(`   URL: ${result1.url}`, colors.cyan);
    log(`   Seed: ${result1.seed}`, colors.cyan);
    log(`   Provider: ${result1.provider}`, colors.cyan);
    log(`   Metadata:`, colors.cyan);
    log(`     - Dimensions: ${result1.metadata?.dimensions.width}x${result1.metadata?.dimensions.height}`, colors.cyan);
    log(`     - Aspect ratio: ${result1.metadata?.aspectRatio}`, colors.cyan);
    log(`     - Filename: ${result1.metadata?.filename}\n`, colors.cyan);

    // Attendre pour respecter la limite de taux de Replicate (6 requêtes/minute)
    await waitWithMessage(10, 'rate limit Replicate: 6 requêtes/minute');

    // Test 2: Génération avec aspect ratio 16:9
    log('🎨 Test 2: Génération avec aspect ratio 16:9', colors.bright);
    const options2: ImageGenerationOptions = {
      prompt: 'A cute bunny reading a book under a rainbow',
      aspectRatio: '16:9',
      seed: 67890,
    };

    log(`Prompt: "${options2.prompt}"`, colors.blue);
    log('Génération en cours...', colors.yellow);
    
    const startTime2 = Date.now();
    const result2 = await provider.generateImage(options2);
    const duration2 = ((Date.now() - startTime2) / 1000).toFixed(1);

    log(`✅ Image générée en ${duration2}s`, colors.green);
    log(`   URL: ${result2.url}`, colors.cyan);
    log(`   Dimensions: ${result2.metadata?.dimensions.width}x${result2.metadata?.dimensions.height}\n`, colors.cyan);

    // Attendre pour respecter la limite de taux de Replicate (6 requêtes/minute)
    await waitWithMessage(10, 'rate limit Replicate: 6 requêtes/minute');

    // Test 3: Génération avec style personnalisé
    log('🎨 Test 3: Génération avec style personnalisé', colors.bright);
    const options3: ImageGenerationOptions = {
      prompt: 'A magical castle floating in the clouds',
      aspectRatio: '4:3',
      style: 'watercolor painting, soft colors, dreamy atmosphere',
      steps: 35, // Plus de steps pour plus de détails
    };

    log(`Prompt: "${options3.prompt}"`, colors.blue);
    log(`Style: "${options3.style}"`, colors.blue);
    log('Génération en cours...', colors.yellow);
    
    const startTime3 = Date.now();
    const result3 = await provider.generateImage(options3);
    const duration3 = ((Date.now() - startTime3) / 1000).toFixed(1);

    log(`✅ Image générée en ${duration3}s`, colors.green);
    log(`   URL: ${result3.url}\n`, colors.cyan);

    // Résumé
    log('\n' + '='.repeat(60), colors.bright);
    log('✅ Tous les tests ont réussi!', colors.green);
    log('='.repeat(60) + '\n', colors.bright);

    log('📊 Résumé des résultats:', colors.bright);
    log(`   Test 1 (1:1): ${duration1}s`, colors.cyan);
    log(`   Test 2 (16:9): ${duration2}s`, colors.cyan);
    log(`   Test 3 (4:3, style personnalisé): ${duration3}s`, colors.cyan);
    log(`   Temps total: ${((Date.now() - startTime1) / 1000).toFixed(1)}s\n`, colors.cyan);

    log('🔗 URLs des images générées:', colors.bright);
    log(`   Image 1: ${result1.url}`, colors.blue);
    log(`   Image 2: ${result2.url}`, colors.blue);
    log(`   Image 3: ${result3.url}\n`, colors.blue);

    log('💡 Conseils:', colors.yellow);
    log('   - Les URLs sont présignées et valides pendant 7 jours', colors.yellow);
    log('   - Les images sont stockées dans MinIO sous le chemin "images/generated/"', colors.yellow);
    log('   - Utilisez un seed fixe pour générer la même image', colors.yellow);
    log('   - Le temps de génération dépend de la charge sur Replicate (30-90s typiquement)\n', colors.yellow);

  } catch (error) {
    log('\n❌ ERREUR lors du test:', colors.red);
    if (error instanceof Error) {
      log(`   Message: ${error.message}`, colors.red);
      if (error.stack) {
        log(`   Stack: ${error.stack}`, colors.red);
      }
    } else {
      log(`   ${String(error)}`, colors.red);
    }
    
    log('\n🔍 Vérifications à faire:', colors.yellow);
    log('   1. MinIO est-il en cours d\'exécution? (docker-compose ps)', colors.yellow);
    log('   2. Le bucket "book-images" existe-t-il?', colors.yellow);
    log('   3. La clé REPLICATE_API_TOKEN est-elle valide?', colors.yellow);
    log('   4. Avez-vous des crédits Replicate disponibles?\n', colors.yellow);
    
    process.exit(1);
  }
}


// Exécuter les tests
testImageGeneration().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
