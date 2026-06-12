#!/usr/bin/env tsx
/**
 * Script de test pour le provider Ollama
 * Teste la connexion, la disponibilité et la génération d'une histoire simple
 */

import { createOllamaGenerator } from '../src/lib/providers/ollama-story-generator';
import type { CharactersTable } from '../src/lib/db/schema';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log();
  log(`${'='.repeat(60)}`, colors.cyan);
  log(title, colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Personnages de test
const testCharacters: CharactersTable[] = [
  {
    id: '1',
    story_id: 'test-book',
    name: 'Luna',
    description: 'Une petite lapine curieuse et courageuse qui adore explorer la forêt',
    image_url: null,
  },
  {
    id: '2',
    story_id: 'test-book',
    name: 'Pixel',
    description: 'Un écureuil malicieux et joueur, meilleur ami de Luna',
    image_url: null,
  },
];

async function testConnection() {
  logSection('Test 1: Connexion à Ollama');

  const generator = createOllamaGenerator({ debug: false });

  try {
    const result = await generator.testConnection();

    if (result.connected) {
      logSuccess('Connexion réussie !');
      logInfo(`Modèle configuré: ${result.model}`);
      if (result.version) {
        logInfo(`Version Ollama: ${result.version}`);
      }
      return true;
    } else {
      logError('Connexion échouée');
      if (result.error) {
        logError(`Erreur: ${result.error}`);
      }
      return false;
    }
  } catch (error) {
    logError(`Erreur inattendue: ${error instanceof Error ? error.message : 'Unknown'}`);
    return false;
  }
}

async function testAvailability() {
  logSection('Test 2: Disponibilité du modèle');

  const generator = createOllamaGenerator({ debug: false });

  try {
    const isAvailable = await generator.isAvailable();

    if (isAvailable) {
      logSuccess('Le modèle est disponible');
      return true;
    } else {
      logWarning('Le modèle n\'est pas disponible');
      logInfo('Assurez-vous d\'avoir téléchargé le modèle avec: ollama pull llama3');
      return false;
    }
  } catch (error) {
    logError(`Erreur: ${error instanceof Error ? error.message : 'Unknown'}`);
    return false;
  }
}

async function testStoryGeneration() {
  logSection('Test 3: Génération d\'histoire');

  const generator = createOllamaGenerator({
    debug: true,
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 60000,
  });

  try {
    logInfo('Génération en cours...');
    logInfo('Cela peut prendre 10-30 secondes selon votre machine');

    const startTime = Date.now();
    const scenes = await generator.generateStory(testCharacters);
    const duration = Date.now() - startTime;

    logSuccess(`Histoire générée en ${(duration / 1000).toFixed(2)} secondes`);
    logInfo(`Nombre de scènes: ${scenes.length}`);

    console.log();
    log('--- Scènes générées ---', colors.magenta);

    for (const scene of scenes) {
      console.log();
      log(`Scène ${scene.scene_number}: ${scene.scene_type.toUpperCase()}`, colors.bright);
      log(`Description: ${scene.description}`, colors.reset);
      log(`Prompt image: ${scene.prompt.substring(0, 100)}...`, colors.cyan);
    }

    return true;
  } catch (error) {
    logError('Génération échouée');
    if (error instanceof Error) {
      logError(`Erreur: ${error.message}`);
      if (error.stack) {
        console.log();
        log('Stack trace:', colors.yellow);
        console.log(error.stack);
      }
    }
    return false;
  }
}

async function testFallback() {
  logSection('Test 4: Scènes de fallback');

  const generator = createOllamaGenerator({ debug: false });

  try {
    const scenes = generator.generateFallbackStory(testCharacters);

    logSuccess('Scènes de fallback générées');
    logInfo(`Nombre de scènes: ${scenes.length}`);

    return true;
  } catch (error) {
    logError(`Erreur: ${error instanceof Error ? error.message : 'Unknown'}`);
    return false;
  }
}

async function runAllTests() {
  log('\n🧪 Tests du Provider Ollama\n', colors.bright);

  const results = {
    connection: false,
    availability: false,
    generation: false,
    fallback: false,
  };

  // Test 1: Connexion
  results.connection = await testConnection();

  if (!results.connection) {
    logWarning('\nOllama n\'est pas accessible. Tests interrompus.');
    logInfo('Assurez-vous qu\'Ollama est installé et en cours d\'exécution:');
    logInfo('  1. Téléchargez Ollama: https://ollama.ai');
    logInfo('  2. Lancez Ollama');
    logInfo('  3. Téléchargez un modèle: ollama pull llama3');
    process.exit(1);
  }

  // Test 2: Disponibilité
  results.availability = await testAvailability();

  if (!results.availability) {
    logWarning('\nLe modèle n\'est pas disponible. Test de génération ignoré.');
    logInfo('Pour télécharger le modèle:');
    logInfo('  ollama pull llama3');
  } else {
    // Test 3: Génération
    results.generation = await testStoryGeneration();
  }

  // Test 4: Fallback
  results.fallback = await testFallback();

  // Résumé
  logSection('Résumé des tests');

  const allPassed = Object.values(results).every((r) => r);
  const passedCount = Object.values(results).filter((r) => r).length;
  const totalCount = Object.keys(results).length;

  console.log();
  log(`Tests: ${passedCount}/${totalCount} réussis`, allPassed ? colors.green : colors.yellow);

  if (allPassed) {
    log('\n✨ Tous les tests ont réussi !', colors.green);
    log('Le provider Ollama est prêt à être utilisé.\n', colors.green);
    process.exit(0);
  } else {
    log('\n⚠️  Certains tests ont échoué.', colors.yellow);
    log('Vérifiez les messages d\'erreur ci-dessus.\n', colors.yellow);
    process.exit(1);
  }
}

// Lancer les tests
runAllTests().catch((error) => {
  console.error();
  logError('Erreur fatale lors de l\'exécution des tests');
  console.error(error);
  process.exit(1);
});
