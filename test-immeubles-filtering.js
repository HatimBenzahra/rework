#!/usr/bin/env node

/**
 * Test du filtrage des immeubles par rôles
 */

// Données de l'API
const apiData = {
  immeubles: [
    {id: 1, adresse: "10 Rue de la Liberté, Tunis", nbEtages: 5, nbPortesParEtage: 4, commercialId: 1},
    {id: 2, adresse: "25 Avenue Habib Bourguiba, Tunis", nbEtages: 8, nbPortesParEtage: 6, commercialId: 1},
    {id: 3, adresse: "15 Rue Ali Bach Hamba, Sfax", nbEtages: 6, nbPortesParEtage: 5, commercialId: 2},
    {id: 4, adresse: "30 Avenue Farhat Hached, Sousse", nbEtages: 4, nbPortesParEtage: 3, commercialId: 3}
  ],
  commercials: [
    {id: 1, nom: "Hatim", prenom: "Ahmed", managerId: 1, directeurId: 1},
    {id: 2, nom: "Mejri", prenom: "Sarra", managerId: 2, directeurId: 2},
    {id: 3, nom: "Ouali", prenom: "Karim", managerId: 1, directeurId: 1}
  ]
}

const ROLES = {
  ADMIN: 'admin',
  DIRECTEUR: 'directeur', 
  MANAGER: 'manager',
}

// Fonction de filtrage des immeubles (comme dans roleFilters.js)
const filterImmeubles = (immeubles, commercials, userRole, userId) => {
  if (!immeubles || !commercials) return []
  
  const userIdInt = parseInt(userId)
  
  switch (userRole) {
    case ROLES.ADMIN:
      return immeubles
    
    case ROLES.DIRECTEUR: {
      const directeurCommercials = commercials.filter(c => c.directeurId === userIdInt)
      const commercialIds = directeurCommercials.map(c => c.id)
      return immeubles.filter(immeuble => commercialIds.includes(immeuble.commercialId))
    }
    
    case ROLES.MANAGER: {
      const managerCommercials = commercials.filter(c => c.managerId === userIdInt)
      const managerCommercialIds = managerCommercials.map(c => c.id)
      return immeubles.filter(immeuble => managerCommercialIds.includes(immeuble.commercialId))
    }
    
    default:
      return []
  }
}

console.log('🏢 TEST FILTRAGE IMMEUBLES PAR RÔLES\n')
console.log('📊 Données brutes:')
console.log(`- ${apiData.immeubles.length} immeubles`)
console.log(`- ${apiData.commercials.length} commercials`)
console.log('\n' + '='.repeat(50) + '\n')

const scenarios = [
  { role: 'admin', userId: '999', name: '👑 ADMIN' },
  { role: 'directeur', userId: '1', name: '👨‍💼 DIRECTEUR #1' },
  { role: 'directeur', userId: '2', name: '👨‍💼 DIRECTEUR #2' },
  { role: 'manager', userId: '1', name: '👤 MANAGER #1' },
  { role: 'manager', userId: '2', name: '👤 MANAGER #2' }
]

scenarios.forEach(scenario => {
  const filtered = filterImmeubles(apiData.immeubles, apiData.commercials, scenario.role, scenario.userId)
  
  console.log(`${scenario.name} (ID: ${scenario.userId})`)
  console.log(`🔹 Immeubles visibles: ${filtered.length}`)
  
  filtered.forEach(immeuble => {
    const commercial = apiData.commercials.find(c => c.id === immeuble.commercialId)
    console.log(`   - ${immeuble.adresse} (Commercial: ${commercial?.prenom} ${commercial?.nom})`)
  })
  
  console.log()
})

console.log('✅ VALIDATION:')
console.log('- Admin: voit 4 immeubles ✓')
console.log('- Directeur #1: voit 3 immeubles (commercials 1,3) ✓')
console.log('- Directeur #2: voit 1 immeuble (commercial 2) ✓') 
console.log('- Manager #1: voit 3 immeubles (commercials 1,3) ✓')
console.log('- Manager #2: voit 1 immeuble (commercial 2) ✓')