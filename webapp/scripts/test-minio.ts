#!/usr/bin/env tsx
/**
 * Script de test pour vérifier la configuration MinIO
 * Usage: npm run test:minio ou tsx scripts/test-minio.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import {
  initializeMinIO,
  uploadImage,
  getImageUrl,
  deleteImage,
  imageExists,
  listImages,
  getImageMetadata,
} from '../src/lib/storage/minio';

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testMinIO() {
  console.log('\n🚀 Démarrage des tests MinIO...\n');

  try {
    // Test 1: Initialisation et connexion
    console.log('📋 Test 1: Initialisation de MinIO');
    await initializeMinIO();
    console.log('✅ Test 1 réussi\n');

    // Test 2: Upload d'une image de test
    console.log('📋 Test 2: Upload d\'une image de test');
    const testImageKey = `test/test-image-${Date.now()}.txt`;
    const testContent = Buffer.from('Ceci est un fichier de test pour MinIO');
    const uploadedUrl = await uploadImage(testContent, testImageKey, {
      'Content-Type': 'text/plain',
    });
    console.log(`   URL de l'image: ${uploadedUrl}`);
    console.log('✅ Test 2 réussi\n');

    // Test 3: Vérifier l'existence de l'image
    console.log('📋 Test 3: Vérification de l\'existence de l\'image');
    const exists = await imageExists(testImageKey);
    if (!exists) {
      throw new Error('L\'image uploadée n\'existe pas!');
    }
    console.log('✅ Test 3 réussi\n');

    // Test 4: Récupérer l'URL de l'image
    console.log('📋 Test 4: Récupération de l\'URL');
    const url = getImageUrl(testImageKey);
    console.log(`   URL: ${url}`);
    console.log('✅ Test 4 réussi\n');

    // Test 5: Récupérer les métadonnées
    console.log('📋 Test 5: Récupération des métadonnées');
    const metadata = await getImageMetadata(testImageKey);
    console.log(`   Taille: ${metadata.size} bytes`);
    console.log(`   Content-Type: ${metadata.contentType}`);
    console.log(`   Dernière modification: ${metadata.lastModified}`);
    console.log('✅ Test 5 réussi\n');

    // Test 6: Lister les images
    console.log('📋 Test 6: Liste des images dans le bucket');
    const images = await listImages('test/');
    console.log(`   Nombre d'images trouvées: ${images.length}`);
    if (images.length > 0) {
      console.log(`   Première image: ${images[0]}`);
    }
    console.log('✅ Test 6 réussi\n');

    // Test 7: Supprimer l'image de test
    console.log('📋 Test 7: Suppression de l\'image de test');
    await deleteImage(testImageKey);
    console.log('✅ Test 7 réussi\n');

    // Test 8: Vérifier que l'image a bien été supprimée
    console.log('📋 Test 8: Vérification de la suppression');
    const existsAfterDelete = await imageExists(testImageKey);
    if (existsAfterDelete) {
      throw new Error('L\'image n\'a pas été supprimée correctement!');
    }
    console.log('✅ Test 8 réussi\n');

    // Test 9: Upload d'une image réaliste (PNG simulé)
    console.log('📋 Test 9: Upload d\'une image PNG simulée');
    const pngTestKey = `test/test-image-${Date.now()}.png`;
    // Créer un petit fichier PNG valide (1x1 pixel transparent)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    const pngUrl = await uploadImage(pngBuffer, pngTestKey, {
      'Content-Type': 'image/png',
    });
    console.log(`   URL PNG: ${pngUrl}`);
    console.log('✅ Test 9 réussi\n');

    // Nettoyer
    console.log('🧹 Nettoyage...');
    await deleteImage(pngTestKey);
    console.log('✅ Nettoyage terminé\n');

    console.log('🎉 Tous les tests sont passés avec succès!');
    console.log('\n📊 Résumé:');
    console.log('   - Connexion MinIO: ✅');
    console.log('   - Création de bucket: ✅');
    console.log('   - Upload d\'images: ✅');
    console.log('   - Récupération d\'URL: ✅');
    console.log('   - Métadonnées: ✅');
    console.log('   - Liste d\'images: ✅');
    console.log('   - Suppression d\'images: ✅');
    console.log('\n✅ MinIO est correctement configuré et opérationnel!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors des tests MinIO:');
    console.error(error);
    console.log('\n💡 Vérifiez que:');
    console.log('   1. Docker est en cours d\'exécution');
    console.log('   2. Le conteneur MinIO est démarré (docker-compose up -d minio)');
    console.log('   3. Les variables d\'environnement dans .env.local sont correctes');
    console.log('   4. Le port 9000 est accessible\n');
    process.exit(1);
  }
}

// Exécuter les tests
testMinIO();
