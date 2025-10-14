/**
 * Script de migration pour assigner automatiquement les zones aux immeubles
 * Basé sur la géolocalisation de chaque immeuble
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour calculer la distance entre deux points (Haversine)
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}

// Fonction pour extraire les coordonnées d'une adresse (simulation)
// TODO: Remplacer par un vrai service de géocodage (Mapbox, Google Maps, etc.)
async function getCoordinatesFromAddress(
  address: string,
): Promise<{ lat: number; lon: number } | null> {
  // Pour l'instant, on retourne null
  // Dans un vrai projet, on utiliserait un service de géocodage
  console.log(`⚠️  Géocodage à implémenter pour: ${address}`);
  return null;
}

// Trouver la zone qui contient un point
function findZoneForPoint(
  lat: number,
  lon: number,
  zones: any[],
): number | null {
  for (const zone of zones) {
    const distance = haversineDistance(lat, lon, zone.yOrigin, zone.xOrigin);
    if (distance <= zone.rayon) {
      return zone.id;
    }
  }
  return null;
}

async function migrateImmeubleZones() {
  console.log('🚀 Début de la migration des zones pour les immeubles...\n');

  try {
    // 1. Récupérer toutes les zones
    const zones = await prisma.zone.findMany();
    console.log(`📍 ${zones.length} zones trouvées`);

    // 2. Récupérer tous les immeubles
    const immeubles = await prisma.immeuble.findMany({
      include: {
        commercial: {
          include: {
            zones: {
              include: {
                zone: true,
              },
            },
          },
        },
      },
    });
    console.log(`🏢 ${immeubles.length} immeubles à traiter\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // 3. Pour chaque immeuble
    for (const immeuble of immeubles) {
      try {
        let zoneId: number | null = null;

        // Stratégie 1: Si l'immeuble a un commercial, prendre sa première zone
        if (
          immeuble.commercial?.zones &&
          immeuble.commercial.zones.length > 0
        ) {
          zoneId = immeuble.commercial.zones[0].zoneId;
          console.log(
            `✅ Immeuble #${immeuble.id} → Zone #${zoneId} (via commercial)`,
          );
        }
        // Stratégie 2: Géocodage de l'adresse (à implémenter)
        else {
          const coords = await getCoordinatesFromAddress(immeuble.adresse);
          if (coords) {
            zoneId = findZoneForPoint(coords.lat, coords.lon, zones);
            if (zoneId) {
              console.log(
                `✅ Immeuble #${immeuble.id} → Zone #${zoneId} (via géocodage)`,
              );
            }
          }
        }

        // 4. Mettre à jour l'immeuble
        if (zoneId) {
          await prisma.immeuble.update({
            where: { id: immeuble.id },
            data: { zoneId },
          });
          updated++;
        } else {
          console.log(
            `⚠️  Immeuble #${immeuble.id} ignoré (aucune zone trouvée)`,
          );
          skipped++;
        }
      } catch (error) {
        console.error(
          `❌ Erreur pour l'immeuble #${immeuble.id}:`,
          error.message,
        );
        errors++;
      }
    }

    // 5. Résumé
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DE LA MIGRATION');
    console.log('='.repeat(50));
    console.log(`✅ Immeubles mis à jour: ${updated}`);
    console.log(`⚠️  Immeubles ignorés: ${skipped}`);
    console.log(`❌ Erreurs: ${errors}`);
    console.log(`📈 Total: ${immeubles.length}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateImmeubleZones()
  .then(() => {
    console.log('\n✅ Migration terminée avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration échouée:', error);
    process.exit(1);
  });
