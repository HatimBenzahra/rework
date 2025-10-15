/**
 * @fileoverview GraphQL mutation definitions
 * Contains all GraphQL mutations for creating, updating, and deleting data
 */

// =============================================================================
// Directeur Mutations
// =============================================================================

export const CREATE_DIRECTEUR = `
  mutation CreateDirecteur($createDirecteurInput: CreateDirecteurInput!) {
    createDirecteur(createDirecteurInput: $createDirecteurInput) {
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

export const UPDATE_DIRECTEUR = `
  mutation UpdateDirecteur($updateDirecteurInput: UpdateDirecteurInput!) {
    updateDirecteur(updateDirecteurInput: $updateDirecteurInput) {
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

export const REMOVE_DIRECTEUR = `
  mutation RemoveDirecteur($id: Int!) {
    removeDirecteur(id: $id) {
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
// Manager Mutations
// =============================================================================

export const CREATE_MANAGER = `
  mutation CreateManager($createManagerInput: CreateManagerInput!) {
    createManager(createManagerInput: $createManagerInput) {
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

export const UPDATE_MANAGER = `
  mutation UpdateManager($updateManagerInput: UpdateManagerInput!) {
    updateManager(updateManagerInput: $updateManagerInput) {
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

export const REMOVE_MANAGER = `
  mutation RemoveManager($id: Int!) {
    removeManager(id: $id) {
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
// Commercial Mutations
// =============================================================================

export const CREATE_COMMERCIAL = `
  mutation CreateCommercial($createCommercialInput: CreateCommercialInput!) {
    createCommercial(createCommercialInput: $createCommercialInput) {
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

export const UPDATE_COMMERCIAL = `
  mutation UpdateCommercial($updateCommercialInput: UpdateCommercialInput!) {
    updateCommercial(updateCommercialInput: $updateCommercialInput) {
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

export const REMOVE_COMMERCIAL = `
  mutation RemoveCommercial($id: Int!) {
    removeCommercial(id: $id) {
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

// =============================================================================
// Zone Mutations
// =============================================================================

export const CREATE_ZONE = `
  mutation CreateZone($createZoneInput: CreateZoneInput!) {
    createZone(createZoneInput: $createZoneInput) {
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

export const UPDATE_ZONE = `
  mutation UpdateZone($updateZoneInput: UpdateZoneInput!) {
    updateZone(updateZoneInput: $updateZoneInput) {
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

export const REMOVE_ZONE = `
  mutation RemoveZone($id: Int!) {
    removeZone(id: $id) {
      id
      nom
      xOrigin
      yOrigin
      rayon
      createdAt
      updatedAt
    }
  }
`

// =============================================================================
// Immeuble Mutations
// =============================================================================

export const CREATE_IMMEUBLE = `
  mutation CreateImmeuble($createImmeubleInput: CreateImmeubleInput!) {
    createImmeuble(createImmeubleInput: $createImmeubleInput) {
      id
      adresse
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

export const UPDATE_IMMEUBLE = `
  mutation UpdateImmeuble($updateImmeubleInput: UpdateImmeubleInput!) {
    updateImmeuble(updateImmeubleInput: $updateImmeubleInput) {
      id
      adresse
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

export const REMOVE_IMMEUBLE = `
  mutation RemoveImmeuble($id: Int!) {
    removeImmeuble(id: $id) {
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
// Statistic Mutations
// =============================================================================

export const CREATE_STATISTIC = `
  mutation CreateStatistic($createStatisticInput: CreateStatisticInput!) {
    createStatistic(createStatisticInput: $createStatisticInput) {
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

export const UPDATE_STATISTIC = `
  mutation UpdateStatistic($updateStatisticInput: UpdateStatisticInput!) {
    updateStatistic(updateStatisticInput: $updateStatisticInput) {
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

export const REMOVE_STATISTIC = `
  mutation RemoveStatistic($id: Int!) {
    removeStatistic(id: $id) {
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

// =============================================================================
// Porte Mutations
// =============================================================================

export const CREATE_PORTE = `
  mutation CreatePorte($createPorteInput: CreatePorteInput!) {
    createPorte(createPorteInput: $createPorteInput) {
      id
      numero
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

export const UPDATE_PORTE = `
  mutation UpdatePorte($updatePorteInput: UpdatePorteInput!) {
    updatePorte(updatePorteInput: $updatePorteInput) {
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

export const REMOVE_PORTE = `
  mutation RemovePorte($id: Int!) {
    removePorte(id: $id) {
      id
      numero
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

// =============================================================================
// Zone Assignment Mutations
// =============================================================================

export const ASSIGN_ZONE_TO_COMMERCIAL = `
  mutation AssignZoneToCommercial($commercialId: Int!, $zoneId: Int!) {
    assignZoneToCommercial(commercialId: $commercialId, zoneId: $zoneId)
  }
`

export const UNASSIGN_ZONE_FROM_COMMERCIAL = `
  mutation UnassignZoneFromCommercial($commercialId: Int!, $zoneId: Int!) {
    unassignZoneFromCommercial(commercialId: $commercialId, zoneId: $zoneId)
  }
`
