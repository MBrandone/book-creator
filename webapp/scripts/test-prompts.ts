/**
 * Script de test pour les prompts de génération d'images
 * 
 * Ce script permet de tester et visualiser les prompts générés
 * avec différentes configurations de styles et de scènes.
 * 
 * Usage:
 *   npx tsx scripts/test-prompts.ts
 */

import {
  generateImagePrompt,
  generateAdvancedImagePrompt,
  generateCharacterDescription,
  getStylePrefix,
  ART_STYLES,
  NEGATIVE_PROMPT,
  type ArtStyle,
  type AdvancedPromptOptions,
} from '../src/lib/ai/prompts';
import type { CharactersTable, SceneType } from '../src/lib/db/schema';

// Données de test
const TEST_CHARACTERS: CharactersTable[] = [
  {
    id: '1',
    story_id: 'test-book',
    name: 'Luna',
    description: 'une petite licorne blanche avec une crinière arc-en-ciel et des yeux pétillants',
    order: 1,
    image_url: "null"
  },
  {
    id: '2',
    story_id: 'test-book',
    name: 'Oscar',
    description: 'un renard roux malicieux avec un foulard bleu et des lunettes rondes',
    order: 2,
    image_url: "null"
  },
];

const SCENE_DESCRIPTIONS = {
  introduction: 'Luna et Oscar se rencontrent dans une forêt enchantée remplie de fleurs magiques',
  conflict: 'Ils découvrent que les fleurs magiques perdent leurs couleurs mystérieusement',
  action: 'Luna et Oscar suivent les traces colorées pour trouver la source du problème',
  resolution: 'Ensemble, ils réveillent l\'esprit de la forêt et les couleurs reviennent plus éclatantes que jamais',
};

// Couleurs pour l'affichage console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function printSeparator(char = '=', length = 80) {
  console.log(colors.dim + char.repeat(length) + colors.reset);
}

function printTitle(title: string) {
  console.log();
  printSeparator();
  console.log(colors.bright + colors.cyan + title + colors.reset);
  printSeparator();
  console.log();
}

function printSubtitle(subtitle: string) {
  console.log(colors.bright + colors.yellow + subtitle + colors.reset);
}

function printPrompt(label: string, prompt: string) {
  console.log(colors.green + label + colors.reset);
  console.log(colors.dim + '→ ' + colors.reset + prompt);
  console.log();
}

function printInfo(label: string, value: string) {
  console.log(colors.blue + label + ': ' + colors.reset + value);
}

// Test 1: Afficher tous les styles disponibles
function testArtStyles() {
  printTitle('📐 TEST 1: Styles artistiques disponibles');
  
  Object.entries(ART_STYLES).forEach(([key, style]) => {
    printSubtitle(`Style: ${style.name} (${key})`);
    printInfo('Description', style.description);
    printPrompt('Prompt de base', style.basePrompt);
    printPrompt('Palette de couleurs', style.colorPalette);
    printPrompt('Modificateurs de qualité', style.qualityModifiers);
    printPrompt('Préfixe complet', getStylePrefix(key as ArtStyle));
  });
}

// Test 2: Description des personnages
function testCharacterDescription() {
  printTitle('👥 TEST 2: Description des personnages');
  
  printSubtitle('Avec 2 personnages');
  const desc = generateCharacterDescription(TEST_CHARACTERS);
  printPrompt('Description générée', desc);
  
  printSubtitle('Avec 1 personnage');
  const singleChar = generateCharacterDescription([TEST_CHARACTERS[0]]);
  printPrompt('Description générée', singleChar);
  
  printSubtitle('Avec 0 personnage');
  const noChar = generateCharacterDescription([]);
  printPrompt('Description générée', noChar || '(vide)');
}

// Test 3: Prompts de base pour chaque type de scène
function testBasicPrompts() {
  printTitle('🎬 TEST 3: Prompts de base par type de scène');
  
  const sceneTypes: SceneType[] = ['introduction', 'conflict', 'action', 'resolution'];
  
  sceneTypes.forEach((sceneType) => {
    printSubtitle(`Scène: ${sceneType.toUpperCase()}`);
    printInfo('Description', SCENE_DESCRIPTIONS[sceneType]);
    
    const prompt = generateImagePrompt(
      SCENE_DESCRIPTIONS[sceneType],
      TEST_CHARACTERS,
      sceneType
    );
    
    printPrompt('Prompt généré', prompt);
    printInfo('Longueur', `${prompt.length} caractères`);
  });
}

// Test 4: Comparaison entre styles
function testStyleComparison() {
  printTitle('🎨 TEST 4: Comparaison des styles pour une même scène');
  
  const sceneType: SceneType = 'introduction';
  const description = SCENE_DESCRIPTIONS[sceneType];
  
  printInfo('Type de scène', sceneType);
  printInfo('Description', description);
  console.log();
  
  Object.keys(ART_STYLES).forEach((style) => {
    printSubtitle(`Style: ${ART_STYLES[style as ArtStyle].name}`);
    
    const prompt = generateImagePrompt(
      description,
      TEST_CHARACTERS,
      sceneType,
      style as ArtStyle
    );
    
    printPrompt('Prompt généré', prompt);
  });
}

// Test 5: Prompts avancés avec options
function testAdvancedPrompts() {
  printTitle('⚡ TEST 5: Prompts avancés avec options');
  
  const sceneType: SceneType = 'action';
  const description = SCENE_DESCRIPTIONS[sceneType];
  
  const configurations: Array<{ name: string; options: AdvancedPromptOptions }> = [
    {
      name: 'Configuration de base',
      options: {},
    },
    {
      name: 'Matin ensoleillé',
      options: {
        timeOfDay: 'morning',
        weather: 'sunny',
      },
    },
    {
      name: 'Soirée nuageuse',
      options: {
        artStyle: 'soft-pastel',
        timeOfDay: 'evening',
        weather: 'cloudy',
      },
    },
    {
      name: 'Scène de neige avec emphase sur les personnages',
      options: {
        artStyle: 'watercolor',
        weather: 'snowy',
        emphasizeCharacters: true,
      },
    },
    {
      name: 'Style classique avec modificateurs personnalisés',
      options: {
        artStyle: 'storybook-classic',
        customModifiers: ['vintage feel', 'nostalgic atmosphere', 'hand-drawn quality'],
      },
    },
  ];
  
  configurations.forEach((config) => {
    printSubtitle(config.name);
    
    const prompt = generateAdvancedImagePrompt(
      description,
      TEST_CHARACTERS,
      sceneType,
      config.options
    );
    
    printPrompt('Prompt généré', prompt);
    printInfo('Longueur', `${prompt.length} caractères`);
  });
}

// Test 6: Prompt négatif
function testNegativePrompt() {
  printTitle('🚫 TEST 6: Prompt négatif');
  
  printInfo('Description', 'Éléments à éviter dans la génération d\'images');
  printPrompt('Prompt négatif', NEGATIVE_PROMPT);
  printInfo('Longueur', `${NEGATIVE_PROMPT.length} caractères`);
}

// Test 7: Analyse de la structure d'un prompt complet
function testPromptStructure() {
  printTitle('🔍 TEST 7: Analyse de la structure d\'un prompt');
  
  const sceneType: SceneType = 'resolution';
  const description = SCENE_DESCRIPTIONS[sceneType];
  const artStyle: ArtStyle = 'watercolor';
  
  printInfo('Type de scène', sceneType);
  printInfo('Style artistique', artStyle);
  printInfo('Description', description);
  console.log();
  
  const prompt = generateImagePrompt(description, TEST_CHARACTERS, sceneType, artStyle);
  
  printSubtitle('Prompt complet');
  console.log(colors.dim + prompt + colors.reset);
  console.log();
  
  printSubtitle('Décomposition du prompt');
  const parts = prompt.split(', ');
  parts.forEach((part, index) => {
    console.log(`${colors.cyan}${index + 1}.${colors.reset} ${part}`);
  });
  
  console.log();
  printInfo('Nombre de parties', parts.length.toString());
  printInfo('Longueur totale', `${prompt.length} caractères`);
  printInfo('Longueur moyenne par partie', `${Math.round(prompt.length / parts.length)} caractères`);
}

// Test 8: Génération complète d'une histoire (4 scènes)
function testCompleteStory() {
  printTitle('📖 TEST 8: Génération complète d\'une histoire (4 scènes)');
  
  const sceneTypes: SceneType[] = ['introduction', 'conflict', 'action', 'resolution'];
  const artStyle: ArtStyle = 'watercolor';
  
  printInfo('Style artistique', ART_STYLES[artStyle].name);
  printInfo('Personnages', TEST_CHARACTERS.map(c => c.name).join(' et '));
  console.log();
  
  sceneTypes.forEach((sceneType, index) => {
    printSubtitle(`Scène ${index + 1}: ${sceneType}`);
    printInfo('Description narrative', SCENE_DESCRIPTIONS[sceneType]);
    
    const prompt = generateImagePrompt(
      SCENE_DESCRIPTIONS[sceneType],
      TEST_CHARACTERS,
      sceneType,
      artStyle
    );
    
    printPrompt('Prompt d\'image', prompt);
  });
}

// Exécution de tous les tests
async function runAllTests() {
  console.log(colors.bright + colors.magenta);
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                     TEST DES PROMPTS DE GÉNÉRATION D\'IMAGES                   ║');
  console.log('║                              Book Creator Application                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  try {
    testArtStyles();
    testCharacterDescription();
    testBasicPrompts();
    testStyleComparison();
    testAdvancedPrompts();
    testNegativePrompt();
    testPromptStructure();
    testCompleteStory();
    
    printTitle('✅ Tests terminés avec succès');
    console.log(colors.green + 'Tous les tests de prompts ont été exécutés avec succès!' + colors.reset);
    console.log();
  } catch (error) {
    printTitle('❌ Erreur lors des tests');
    console.error(colors.bright + colors.yellow + 'Une erreur est survenue:' + colors.reset);
    console.error(error);
    process.exit(1);
  }
}

// Lancer les tests
runAllTests();
