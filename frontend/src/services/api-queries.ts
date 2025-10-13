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

// =============================================================================
// Commercial Queries
// =============================================================================

/**
 * Requête légère pour la liste des commerciaux (tableau)
 * ⚡ Optimisée : Charge uniquement les champs de base sans relations
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
    }
  }
`

/**
 * Requête légère pour un commercial sans relations
 * ⚡ Optimisée : Charge uniquement les champs de base
 * Utilisée par : Formulaires d'édition rapide
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
 * 📊 Charge toutes les relations : immeubles, zones, statistics
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
        commercialId
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
        commercials {
          id
          commercialId
          zoneId
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
  query GetZones {
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
      nbEtages
      nbPortesParEtage
      commercialId
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
      nbEtages
      nbPortesParEtage
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
  query GetStatistics {
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
