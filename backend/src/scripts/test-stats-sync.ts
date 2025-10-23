/**
 * Script de test pour valider le système de synchronisation des statistiques
 * Usage: npm run test:stats-sync
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { StatisticSyncService } from '../statistic/statistic-sync.service';
import { PorteService } from '../porte/porte.service';
import { StatutPorte } from '../porte/porte.dto';

async function testStatsSync() {
  console.log('🚀 Démarrage des tests de synchronisation des statistiques...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const statisticSyncService = app.get(StatisticSyncService);
  const porteService = app.get(PorteService);

  try {
    // Test 1: Validation de la cohérence actuelle
    console.log('📊 Test 1: Validation de la cohérence actuelle');
    const coherenceResult = await statisticSyncService.validateStatsCoherence();
    console.log(`✅ Résultat: ${coherenceResult.valid} cohérentes, ${coherenceResult.invalid.length} incohérentes`);
    
    if (coherenceResult.invalid.length > 0) {
      console.log('❌ Statistiques incohérentes détectées:');
      coherenceResult.invalid.forEach((item, index) => {
        console.log(`  ${index + 1}. Commercial ${item.commercialId} (${item.commercial})`);
        console.log(`     Current:`, item.current);
        console.log(`     Real:   `, item.real);
      });
    }
    console.log('');

    // Test 2: Recalcul de toutes les statistiques
    console.log('🔄 Test 2: Recalcul de toutes les statistiques');
    const recalcResult = await statisticSyncService.recalculateAllStats();
    console.log(`✅ Résultat: ${recalcResult.updated} mises à jour, ${recalcResult.errors} erreurs\n`);

    // Test 3: Validation après recalcul
    console.log('📊 Test 3: Validation après recalcul');
    const coherenceAfter = await statisticSyncService.validateStatsCoherence();
    console.log(`✅ Résultat: ${coherenceAfter.valid} cohérentes, ${coherenceAfter.invalid.length} incohérentes\n`);

    // Test 4: Simuler une mise à jour de porte et vérifier la sync auto
    console.log('🔧 Test 4: Test de synchronisation automatique');
    
    // Trouver une porte existante
    const portes = await porteService.findAll();
    const porteTest = portes.find(p => p.statut === StatutPorte.NON_VISITE);
    
    if (porteTest) {
      console.log(`📍 Porte de test: ${porteTest.numero} (Immeuble ${porteTest.immeubleId})`);
      
      // Changer le statut vers CONTRAT_SIGNE
      console.log('   Changement de statut: NON_VISITE → CONTRAT_SIGNE');
      await porteService.update({
        id: porteTest.id,
        statut: StatutPorte.CONTRAT_SIGNE
      });
      
      // Attendre un peu pour la synchronisation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Vérifier la cohérence
      const coherenceFinal = await statisticSyncService.validateStatsCoherence();
      console.log(`✅ Cohérence après update: ${coherenceFinal.valid} cohérentes, ${coherenceFinal.invalid.length} incohérentes`);
      
      // Remettre la porte à l'état initial
      console.log('   Remise à l\'état initial: CONTRAT_SIGNE → NON_VISITE');
      await porteService.update({
        id: porteTest.id,
        statut: StatutPorte.NON_VISITE
      });
      
    } else {
      console.log('❌ Aucune porte NON_VISITE trouvée pour le test');
    }

    console.log('\n🎉 Tests terminés avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Exécuter les tests
if (require.main === module) {
  testStatsSync()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { testStatsSync };