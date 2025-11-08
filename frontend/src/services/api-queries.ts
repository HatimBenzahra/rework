/**
 * @fileoverview GraphQL query definitions
 * Contains all GraphQL queries for fetching data
 */

// =============================================================================
// Directeur Queries
// =============================================================================

export const GET_DIRECTEURS = `
  query GetDirecteurs {
    directeurs {
      id
      nom
      prenom
      email
      numTelephone
      adresse
      createdAt
      updatedAt
    }
  }
`

export const GET_DIRECTEUR = `
  query GetDirecteur($id: Int!) {
    directeur(id: $id) {
      id
      nom
      prenom
      email
      numTelephone
      adresse
      createdAt
      updatedAt
    }
  }
`

// =============================================================================
// Manager Queries
// =============================================================================

export const GET_MANAGERS = `
  query GetManagers {
    managers {
      id
      nom
      prenom
      email
      numTelephone
      directeurId
      createdAt
      updatedAt
      statistics {
        id
        commercialId
        managerId
        immeubleId
        zoneId
        contratsSignes
        immeublesVisites
        rendezVousPris
        refus
        nbImmeublesProspectes
        nbPortesProspectes
        createdAt
        updatedAt
      }
    }

  }
`

export const GET_MANAGER = `
  query GetManager($id: Int!) {
    manager(id: $id) {
      id
      nom
      prenom
      email
      numTelephone
      directeurId
      createdAt
      updatedAt
    }
  }
`

export const GET_MANAGER_PERSONAL = `
  query GetManagerPersonal($id: Int!) {
    managerPersonal(id: $id) {
      id
      nom
      prenom
      email
      numTelephone
      directeurId
      createdAt
      updatedAt
      directeur {
        id
        nom
        prenom
        email
        numTelephone
      }
      immeubles {
        id
        adresse
        nbEtages
        nbPortesParEtage
        ascenseurPresent
        digitalCode
        commercialId
        managerId
        zoneId
        createdAt
        updatedAt
        portes {
          id
          numero
          etage
          statut
          nbRepassages
          rdvDate
          rdvTime
          derniereVisite
        }
      }
      statistics {
        id
        commercialId
        managerId
        immeubleId
        zoneId
        contratsSignes
        immeublesVisites
        rendezVousPris
        refus
        nbImmeublesProspectes
        nbPortesProspectes
        createdAt
        updatedAt
      }
      zones {
        id
        nom
        xOrigin
        yOrigin
        rayon
        directeurId
        managerId
        createdAt
        updatedAt
      }
    }
  }
`

export const GET_MANAGER_FULL = `
  query GetManagerFull($id: Int!) {
    managerFull(id: $id) {
      id
      nom
      prenom
      email
      numTelephone
      directeurId
      createdAt
      updatedAt
      directeur {
        id
        nom
        prenom
        email
        numTelephone
      }
      commercials {
        id
        nom
        prenom
        email
        numTel
        age
        managerId
        directeurId
        createdAt
        updatedAt
        statistics {
          id
          commercialId
          managerId
          immeubleId
          zoneId
          contratsSignes
          immeublesVisites
          rendezVousPris
          refus
          nbImmeublesProspectes
          nbPortesProspectes
          createdAt
          updatedAt
        }
        immeubles {
          id
          adresse
          nbEtages
          nbPortesParEtage
          ascenseurPresent
          digitalCode
          commercialId
          zoneId
          createdAt
          updatedAt
        }
        zones {
          id
          nom
          xOrigin
          yOrigin
          rayon
          directeurId
          managerId
          createdAt
          updatedAt
          immeubles {
            id
            adresse
            nbEtages
            nbPortesParEtage
            createdAt
            updatedAt
          }
        }
      }
      zones {
        id
        nom
        xOrigin
        yOrigin
        rayon
        directeurId
        managerId
        createdAt
        updatedAt
        immeubles {
          id
          adresse
          nbEtages
          nbPortesParEtage
          createdAt
          updatedAt
        }
      }
      immeubles {
        id
        adresse
        nbEtages
        nbPortesParEtage
        ascenseurPresent
        digitalCode
        commercialId
        managerId
        zoneId
        createdAt
        updatedAt
      }
      statistics {
        id
        commercialId
        managerId
        immeubleId
        zoneId
        contratsSignes
        immeublesVisites
        rendezVousPris
        refus
        nbImmeublesProspectes
        nbPortesProspectes
        createdAt
        updatedAt
      }
      personalStatistics {
        id
        commercialId
        managerId
        immeubleId
        zoneId
        contratsSignes
        immeublesVisites
        rendezVousPris
        refus
        nbImmeublesProspectes
        nbPortesProspectes
        createdAt
        updatedAt
      }
      teamStatistics {
        id
        commercialId
        managerId
        immeubleId
        zoneId
        contratsSignes
        immeublesVisites
        rendezVousPris
        refus
        nbImmeublesProspectes
        nbPortesProspectes
        createdAt
        updatedAt
      }
    }
  }
`

// =============================================================================
// Commercial Queries
// =============================================================================

/**
 * Requête pour la liste des commerciaux (tableau)
 * Charge les champs de base + statistiques pour le calcul des rangs
 * Utilisée par : Page Commerciaux (liste/tableau)
 */
export const GET_COMMERCIALS = `
  query GetCommercials {
    commercials {
      id
      nom
      prenom
      email
      numTel
      age
      managerId
      directeurId
      createdAt
      updatedAt
      statistics {
        id
        commercialId
        contratsSignes
        immeublesVisites
        rendezVousPris
        refus
        createdAt
        updatedAt
      }
    }
  }
`

/**
 * Requête légère pour un commercial sans relations
 */
export const GET_COMMERCIAL = `
  query GetCommercial($id: Int!) {
    commercial(id: $id) {
      id
      nom
      prenom
      email
      numTel
      age
      managerId
      directeurId
      createdAt
      updatedAt
    }
  }
`

/**
 * Requête complète pour les détails d'un commercial
 * Charge toutes les relations : immeubles, zones, statistics
 * Utilisée par : Page détails commercial
 */
export const GET_COMMERCIAL_FULL = `
  query GetCommercialFull($id: Int!) {
    commercial(id: $id) {
      id
      nom
      prenom
      email
      numTel
      age
      managerId
      directeurId
      createdAt
      updatedAt
      immeubles {
        id
        adresse
        nbEtages
        nbPortesParEtage
        ascenseurPresent
        digitalCode
        commercialId
        zoneId
        createdAt
        updatedAt
        portes {
          id
          numero
          etage
          statut
          nbRepassages
          rdvDate
          rdvTime
          derniereVisite
        }
      }
      zones {
        id
        nom
        xOrigin
        yOrigin
        rayon
        directeurId
        managerId
        createdAt
        updatedAt
      }
      statistics {
        id
        commercialId
        contratsSignes
        immeublesVisites
        rendezVousPris
        refus
        createdAt
        updatedAt
      }
    }
  }
`

// =============================================================================
// Zone Queries
// =============================================================================

export const GET_ZONES = `
  query GetZones {
    zones {
      id
      nom
      xOrigin
      yOrigin
      rayon
      directeurId
      managerId
      immeubles {
        id
        adresse
        latitude
        longitude
        nbEtages
        nbPortesParEtage
        commercialId
        zoneId
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_ZONE = `
  query GetZone($id: Int!) {
    zone(id: $id) {
      id
      nom
      xOrigin
      yOrigin
      rayon
      directeurId
      managerId
      immeubles {
        id
        adresse
        latitude
        longitude
        nbEtages
        nbPortesParEtage
        commercialId
        zoneId
      }
      createdAt
      updatedAt
    }
  }
`

// =============================================================================
// Immeuble Queries
// =============================================================================

export const GET_IMMEUBLES = `
  query GetImmeubles {
    immeubles {
      id
      adresse
      latitude
      longitude
      nbEtages
      nbPortesParEtage
      ascenseurPresent
      digitalCode
      commercialId
      managerId
      portes {
        id
        statut
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_IMMEUBLE = `
  query GetImmeuble($id: Int!) {
    immeuble(id: $id) {
      id
      adresse
      latitude
      longitude
      nbEtages
      nbPortesParEtage
      ascenseurPresent
      digitalCode
      commercialId
      managerId
      createdAt
      updatedAt
    }
  }
`

// =============================================================================
// Statistic Queries
// =============================================================================

export const GET_STATISTICS = `
  query GetStatistics($commercialId: Int) {
    statistics(commercialId: $commercialId) {
      id
      commercialId
      managerId
      immeubleId
      zoneId
      contratsSignes
      immeublesVisites
      rendezVousPris
      refus
      nbImmeublesProspectes
      nbPortesProspectes
      createdAt
      updatedAt
    }
  }
`

export const GET_STATISTIC = `
  query GetStatistic($id: Int!) {
    statistic(id: $id) {
      id
      commercialId
      contratsSignes
      immeublesVisites
      rendezVousPris
      refus
      createdAt
      updatedAt
    }
  }
`

export const GET_ZONE_STATISTICS = `
  query GetZoneStatistics {
    zoneStatistics {
      zoneId
      zoneName
      totalContratsSignes
      totalImmeublesVisites
      totalRendezVousPris
      totalRefus
      totalImmeublesProspectes
      totalPortesProspectes
      tauxConversion
      tauxSuccesRdv
      nombreCommerciaux
      performanceGlobale
    }
  }
`

export const GET_CURRENT_USER_ASSIGNMENT = `
  query GetCurrentUserAssignment($userId: Int!, $userType: UserType!) {
    currentUserAssignment(userId: $userId, userType: $userType) {
      id
      zoneId
      userId
      userType
      assignedAt
      zone {
        id
        nom
        xOrigin
        yOrigin
        rayon
        createdAt
        updatedAt
      }
    }
  }
`

export const GET_ALL_ZONE_HISTORY = `
  query GetAllZoneHistory {
    allZoneHistory {
      id
      zoneId
      userId
      userType
      assignedAt
      unassignedAt
      totalContratsSignes
      totalImmeublesVisites
      totalRendezVousPris
      totalRefus
      totalImmeublesProspectes
      totalPortesProspectes
      zone {
        id
        nom
      }
    }
  }
`

export const GET_ALL_CURRENT_ASSIGNMENTS = `
  query GetAllCurrentAssignments {
    allCurrentAssignments {
      id
      zoneId
      userId
      userType
      assignedAt
      zone {
        id
        nom
        xOrigin
        yOrigin
        rayon
        immeubles {
          id
          adresse
          latitude
          longitude
          nbEtages
          nbPortesParEtage
        }
      }
    }
  }
`

export const GET_ZONE_CURRENT_ASSIGNMENTS = `
  query GetZoneCurrentAssignments($zoneId: Int!) {
    zoneCurrentAssignments(zoneId: $zoneId) {
      id
      zoneId
      userId
      userType
      assignedAt
    }
  }
`

// =============================================================================
// Porte Queries
// =============================================================================

export const GET_PORTES = `
  query GetPortes {
    portes {
      id
      numero
      nomPersonnalise
      etage
      immeubleId
      statut
      nbRepassages
      rdvDate
      rdvTime
      commentaire
      derniereVisite
      createdAt
      updatedAt
    }
  }
`

export const GET_PORTE = `
  query GetPorte($id: Int!) {
    porte(id: $id) {
      id
      numero
      nomPersonnalise
      etage
      immeubleId
      statut
      nbRepassages
      rdvDate
      rdvTime
      commentaire
      derniereVisite
      createdAt
      updatedAt
    }
  }
`

export const GET_PORTES_BY_IMMEUBLE = `
  query GetPortesByImmeuble($immeubleId: Int!) {
    portesByImmeuble(immeubleId: $immeubleId) {
      id
      numero
      nomPersonnalise
      etage
      immeubleId
      statut
      nbRepassages
      rdvDate
      rdvTime
      commentaire
      derniereVisite
      createdAt
      updatedAt
    }
  }
`
/**
 * Requête pour les portes modifiées aujourd'hui _ affichage du tableau de bord
 */
export const GET_PORTES_MODIFIED_TODAY = `
  query GetPortesModifiedToday($immeubleId: Int) {
    portesModifiedToday(immeubleId: $immeubleId) {
      id
      numero
      nomPersonnalise
      etage
      immeubleId
      statut
      nbRepassages
      rdvDate
      rdvTime
      commentaire
      derniereVisite
      createdAt
      updatedAt
    }
  }
`

export const GET_PORTES_RDV_TODAY = `
  query GetPortesRdvToday {
    portesRdvToday {
      id
      numero
      nomPersonnalise
      etage
      immeubleId
      statut
      nbRepassages
      rdvDate
      rdvTime
      commentaire
      derniereVisite
      createdAt
      updatedAt
    }
  }
`
