/**
 * @fileoverview GraphQL mutations for all entities
 * Centralized mutations to avoid duplication
 */

import * as Apollo from '@apollo/client'

// ========== DIRECTEUR MUTATIONS ==========
export const CREATE_DIRECTEUR = Apollo.gql`
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

export const UPDATE_DIRECTEUR = Apollo.gql`
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

export const DELETE_DIRECTEUR = Apollo.gql`
  mutation DeleteDirecteur($id: Int!) {
    removeDirecteur(id: $id) {
      id
      nom
      prenom
    }
  }
`

// ========== MANAGER MUTATIONS ==========
export const CREATE_MANAGER = Apollo.gql`
  mutation CreateManager($createManagerInput: CreateManagerInput!) {
    createManager(createManagerInput: $createManagerInput) {
      id
      nom
      prenom
      directeurId
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_MANAGER = Apollo.gql`
  mutation UpdateManager($updateManagerInput: UpdateManagerInput!) {
    updateManager(updateManagerInput: $updateManagerInput) {
      id
      nom
      prenom
      directeurId
      createdAt
      updatedAt
    }
  }
`

export const DELETE_MANAGER = Apollo.gql`
  mutation DeleteManager($id: Int!) {
    removeManager(id: $id) {
      id
      nom
      prenom
    }
  }
`

// ========== COMMERCIAL MUTATIONS ==========
export const CREATE_COMMERCIAL = Apollo.gql`
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

export const UPDATE_COMMERCIAL = Apollo.gql`
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

export const DELETE_COMMERCIAL = Apollo.gql`
  mutation DeleteCommercial($id: Int!) {
    removeCommercial(id: $id) {
      id
      nom
      prenom
    }
  }
`

// ========== ZONE MUTATIONS ==========
export const CREATE_ZONE = Apollo.gql`
  mutation CreateZone($createZoneInput: CreateZoneInput!) {
    createZone(createZoneInput: $createZoneInput) {
      id
      nom
      rayon
      xOrigin
      yOrigin
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_ZONE = Apollo.gql`
  mutation UpdateZone($updateZoneInput: UpdateZoneInput!) {
    updateZone(updateZoneInput: $updateZoneInput) {
      id
      nom
      rayon
      xOrigin
      yOrigin
      createdAt
      updatedAt
    }
  }
`

export const DELETE_ZONE = Apollo.gql`
  mutation DeleteZone($id: Int!) {
    removeZone(id: $id) {
      id
      nom
    }
  }
`

export const ASSIGN_ZONE_TO_COMMERCIAL = Apollo.gql`
  mutation AssignZoneToCommercial($zoneId: Int!, $commercialId: Int!) {
    assignZoneToCommercial(zoneId: $zoneId, commercialId: $commercialId)
  }
`

export const UNASSIGN_ZONE_FROM_COMMERCIAL = Apollo.gql`
  mutation UnassignZoneFromCommercial($zoneId: Int!, $commercialId: Int!) {
    unassignZoneFromCommercial(zoneId: $zoneId, commercialId: $commercialId)
  }
`

// ========== IMMEUBLE MUTATIONS ==========
export const CREATE_IMMEUBLE = Apollo.gql`
  mutation CreateImmeuble($createImmeubleInput: CreateImmeubleInput!) {
    createImmeuble(createImmeubleInput: $createImmeubleInput) {
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

export const UPDATE_IMMEUBLE = Apollo.gql`
  mutation UpdateImmeuble($updateImmeubleInput: UpdateImmeubleInput!) {
    updateImmeuble(updateImmeubleInput: $updateImmeubleInput) {
      id
      adresse
      nbEtages
      nbPortesParEtage
      createdAt
      updatedAt
    }
  }
`

export const DELETE_IMMEUBLE = Apollo.gql`
  mutation DeleteImmeuble($id: Int!) {
    removeImmeuble(id: $id) {
      id
      adresse
    }
  }
`

// ========== STATISTIC MUTATIONS ==========
export const CREATE_STATISTIC = Apollo.gql`
  mutation CreateStatistic($createStatisticInput: CreateStatisticInput!) {
    createStatistic(createStatisticInput: $createStatisticInput) {
      id
      commercialId
      portesVisitees
      contratsSignes
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_STATISTIC = Apollo.gql`
  mutation UpdateStatistic($updateStatisticInput: UpdateStatisticInput!) {
    updateStatistic(updateStatisticInput: $updateStatisticInput) {
      id
      commercialId
      portesVisitees
      contratsSignes
      createdAt
      updatedAt
    }
  }
`

export const DELETE_STATISTIC = Apollo.gql`
  mutation DeleteStatistic($id: Int!) {
    removeStatistic(id: $id) {
      id
    }
  }
`
