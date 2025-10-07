import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding de la base de données...')

  // Nettoyer les données existantes
  console.log('🧹 Nettoyage des données existantes...')
  await prisma.commercialZone.deleteMany()
  await prisma.statistic.deleteMany()
  await prisma.immeuble.deleteMany()
  await prisma.commercial.deleteMany()
  await prisma.manager.deleteMany()
  await prisma.directeur.deleteMany()
  await prisma.zone.deleteMany()

  // Créer des directeurs
  console.log('👔 Création des directeurs...')
  const directeur1 = await prisma.directeur.create({
    data: {
      nom: 'Gharbi',
      prenom: 'Fatma',
      email: 'fatma.gharbi@company.com',
      numTelephone: '+216 20 123 456',
      adresse: '123 Avenue Habib Bourguiba, Tunis',
    },
  })

  const directeur2 = await prisma.directeur.create({
    data: {
      nom: 'Triki',
      prenom: 'Mohamed',
      email: 'mohamed.triki@company.com',
      numTelephone: '+216 25 987 654',
      adresse: '456 Rue de la République, Sfax',
    },
  })

  // Créer des managers
  console.log('👨‍💼 Création des managers...')
  const manager1 = await prisma.manager.create({
    data: {
      nom: 'Ben Salem',
      prenom: 'Ahmed',
      directeurId: directeur1.id,
    },
  })

  const manager2 = await prisma.manager.create({
    data: {
      nom: 'Khelifi',
      prenom: 'Sarra',
      directeurId: directeur2.id,
    },
  })

  // Créer des zones
  console.log('🗺️ Création des zones...')
  const zone1 = await prisma.zone.create({
    data: {
      nom: 'Tunis Centre',
      xOrigin: 36.8065,
      yOrigin: 10.1815,
      rayon: 5.0,
    },
  })

  const zone2 = await prisma.zone.create({
    data: {
      nom: 'Sfax',
      xOrigin: 34.7406,
      yOrigin: 10.7603,
      rayon: 8.0,
    },
  })

  const zone3 = await prisma.zone.create({
    data: {
      nom: 'Sousse',
      xOrigin: 35.8256,
      yOrigin: 10.6369,
      rayon: 6.0,
    },
  })

  // Créer des commerciaux
  console.log('💼 Création des commerciaux...')
  const commercial1 = await prisma.commercial.create({
    data: {
      nom: 'Ben Ali',
      prenom: 'Ahmed',
      email: 'ahmed.benali@company.com',
      numTel: '+216 20 111 222',
      age: 28,
      managerId: manager1.id,
      directeurId: directeur1.id,
    },
  })

  const commercial2 = await prisma.commercial.create({
    data: {
      nom: 'Mejri',
      prenom: 'Sarra',
      email: 'sarra.mejri@company.com',
      numTel: '+216 25 333 444',
      age: 32,
      managerId: manager2.id,
      directeurId: directeur2.id,
    },
  })

  const commercial3 = await prisma.commercial.create({
    data: {
      nom: 'Ouali',
      prenom: 'Karim',
      email: 'karim.ouali@company.com',
      numTel: '+216 22 555 666',
      age: 26,
      managerId: manager1.id,
      directeurId: directeur1.id,
    },
  })

  // Créer des immeubles
  console.log('🏢 Création des immeubles...')
  await prisma.immeuble.createMany({
    data: [
      {
        adresse: '10 Rue de la Liberté, Tunis',
        nbEtages: 5,
        nbPortesParEtage: 4,
        commercialId: commercial1.id,
      },
      {
        adresse: '25 Avenue Habib Bourguiba, Tunis',
        nbEtages: 8,
        nbPortesParEtage: 6,
        commercialId: commercial1.id,
      },
      {
        adresse: '15 Rue Ali Bach Hamba, Sfax',
        nbEtages: 6,
        nbPortesParEtage: 5,
        commercialId: commercial2.id,
      },
      {
        adresse: '30 Avenue Farhat Hached, Sousse',
        nbEtages: 4,
        nbPortesParEtage: 3,
        commercialId: commercial3.id,
      },
    ],
  })

  // Assigner des zones aux commerciaux
  console.log('🔗 Attribution des zones aux commerciaux...')
  await prisma.commercialZone.createMany({
    data: [
      { commercialId: commercial1.id, zoneId: zone1.id },
      { commercialId: commercial2.id, zoneId: zone2.id },
      { commercialId: commercial3.id, zoneId: zone3.id },
    ],
  })

  // Créer des statistiques
  console.log('📊 Création des statistiques...')
  await prisma.statistic.createMany({
    data: [
      {
        commercialId: commercial1.id,
        contratsSignes: 28,
        immeublesVisites: 45,
        rendezVousPris: 32,
        refus: 12,
      },
      {
        commercialId: commercial1.id,
        contratsSignes: 22,
        immeublesVisites: 38,
        rendezVousPris: 28,
        refus: 8,
      },
      {
        commercialId: commercial2.id,
        contratsSignes: 35,
        immeublesVisites: 52,
        rendezVousPris: 41,
        refus: 15,
      },
      {
        commercialId: commercial2.id,
        contratsSignes: 42,
        immeublesVisites: 58,
        rendezVousPris: 48,
        refus: 18,
      },
      {
        commercialId: commercial3.id,
        contratsSignes: 15,
        immeublesVisites: 28,
        rendezVousPris: 22,
        refus: 9,
      },
    ],
  })

  console.log('✅ Seeding terminé avec succès !')
  console.log(`📊 Créé : 
    - ${2} directeurs
    - ${2} managers  
    - ${3} commerciaux
    - ${3} zones
    - ${4} immeubles
    - ${5} statistiques`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })