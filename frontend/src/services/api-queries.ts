/**
 * @fileoverview GraphQL query definitions
 * Contains all GraphQL queries for fetching data
 */

// =============================================================================
// Directeur Queries
// =============================================================================

export const GET_DIRECTEURS = `
  query GetDirecteurs($userId: Int, $userRole: String) {
    directeurs(userId: $userId, userRole: $userRole) {
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
  query GetManagers($userId: Int, $userRole: String) {
    managers(userId: $userId, userRole: $userRole) {
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
          commercials {
            id
            commercialId
            zoneId
            createdAt
          }
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
        commercials {
          id
          commercialId
          zoneId
          createdAt
        }
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
  query GetCommercials($userId: Int, $userRole: String) {
    commercials(userId: $userId, userRole: $userRole) {
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
        commercials {
          id
          commercialId
          zoneId
          createdAt
        }
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
  query GetZones($userId: Int, $userRole: String) {
    zones(userId: $userId, userRole: $userRole) {
      id
      nom
      xOrigin
      yOrigin
      rayon
      directeurId
      managerId
      commercials {
        id
        commercialId
        zoneId
      }
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

export const GET_ZONES_WITH_COMMERCIALS = `
  query GetZonesWithCommercials {
    commercials {
      id
      nom
      prenom
      zones {
        id
        nom
        xOrigin
        yOrigin
        rayon
        directeurId
        managerId
        commercials {
          id
          commercialId
          zoneId
          createdAt
        }
        createdAt
        updatedAt
      }
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
      commercials {
        id
        commercialId
        zoneId
      }
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
  query GetImmeubles($userId: Int, $userRole: String) {
    immeubles(userId: $userId, userRole: $userRole) {
      id
      adresse
      latitude
      longitude
      nbEtages
      nbPortesParEtage
      ascenseurPresent
      digitalCode
      commercialId
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
      createdAt
      updatedAt
    }
  }
`

// =============================================================================
// Statistic Queries
// =============================================================================

export const GET_STATISTICS = `
  query GetStatistics($commercialId: Int, $userId: Int, $userRole: String) {
    statistics(commercialId: $commercialId, userId: $userId, userRole: $userRole) {
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
  query GetZoneStatistics($userId: Int, $userRole: String) {
    zoneStatistics(userId: $userId, userRole: $userRole) {
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
