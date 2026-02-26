/**
 * @fileoverview Gamification related GraphQL queries
 */

export const GET_RANKING = `
  query GetRanking($period: RankPeriod!, $periodKey: String!) {
    ranking(period: $period, periodKey: $periodKey) {
      id
      commercialId
      managerId
      managerNom
      managerPrenom
      period
      periodKey
      rank
      points
      contratsSignes
      rankTierKey
      rankTierLabel
      metadata
      computedAt
      commercialNom
      commercialPrenom
      managerNom
      managerPrenom
    }
  }
`

export const GET_COMMERCIAL_RANKINGS = `
  query GetCommercialRankings($commercialId: Int!) {
    commercialRankings(commercialId: $commercialId) {
      id
      commercialId
      period
      periodKey
      rank
      points
      contratsSignes
      rankTierKey
      rankTierLabel
      metadata
      computedAt
    }
  }
`

export const GET_OFFRES = `
  query GetOffres($activeOnly: Boolean) {
    offres(activeOnly: $activeOnly) {
      id
      externalId
      nom
      description
      categorie
      fournisseur
      logoUrl
      prixBase
      features
      popular
      rating
      isActive
      points
      badgeProductKey
      syncedAt
      createdAt
      updatedAt
    }
  }
`

export const GET_BADGE_DEFINITIONS = `
  query GetBadgeDefinitions($category: BadgeCategory, $activeOnly: Boolean) {
    badgeDefinitions(category: $category, activeOnly: $activeOnly) {
      id
      code
      nom
      description
      category
      iconUrl
      condition
      tier
      isActive
      createdAt
      updatedAt
    }
  }
`

export const GET_COMMERCIAL_BADGES = `
  query GetCommercialBadges($commercialId: Int!) {
    commercialBadges(commercialId: $commercialId) {
      id
      commercialId
      badgeDefinitionId
      periodKey
      awardedAt
      metadata
      badgeDefinition {
        id
        code
        nom
        description
        category
        iconUrl
        tier
      }
    }
  }
`

export const GET_WINLEADPLUS_USERS = `
  query GetWinleadPlusUsers {
    winleadPlusUsers {
      id
      nom
      prenom
      username
      email
      role
      isActive
      managerId
    }
  }
`

export const GET_MAPPING_SUGGESTIONS = `
  query GetMappingSuggestions {
    mappingSuggestions {
      prowinId
      prowinNom
      prowinPrenom
      prowinEmail
      prowinType
      winleadPlusId
      winleadPlusNom
      winleadPlusPrenom
      winleadPlusEmail
      confidence
      alreadyMapped
    }
  }
`

export const GET_CONTRATS_BY_COMMERCIAL = `
  query GetContratsByCommercial($commercialId: Int!) {
    contratsByCommercial(commercialId: $commercialId) {
      id
      externalContratId
      externalProspectId
      commercialWinleadPlusId
      commercialId
      offreExternalId
      offreId
      dateValidation
      dateSignature
      periodDay
      periodWeek
      periodMonth
      periodQuarter
      periodYear
      metadata
      syncedAt
      createdAt
    }
  }
`
