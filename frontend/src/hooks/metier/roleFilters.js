/**
 * Utilitaires centralisés pour le filtrage des données selon les rôles
 */

// Types de rôles supportés
export const ROLES = {
  ADMIN: 'admin',
  DIRECTEUR: 'directeur',
  MANAGER: 'manager',
  COMMERCIAL: 'commercial',
}

// Permissions par rôle et par entité
export const PERMISSIONS = {
  [ROLES.ADMIN]: {
    commerciaux: { view: true, add: true, edit: true, delete: true },
    managers: { view: true, add: true, edit: true, delete: true },
    directeurs: { view: true, add: true, edit: true, delete: true },
    zones: { view: true, add: true, edit: true, delete: true },
    immeubles: { view: true, add: true, edit: true, delete: true },
    statistics: { view: true, add: true, edit: true, delete: true },
    'gps-tracking': { view: true, add: false, edit: false, delete: false },
    ecoutes: { view: true, add: true, edit: true, delete: true },
  },
  [ROLES.DIRECTEUR]: {
    commerciaux: { view: true, add: true, edit: true, delete: true },
    managers: { view: true, add: true, edit: true, delete: true },
    directeurs: { view: false, add: false, edit: false, delete: false },
    zones: { view: true, add: true, edit: true, delete: false },
    immeubles: { view: true, add: true, edit: true, delete: false },
    statistics: { view: true, add: false, edit: false, delete: false },
    'gps-tracking': { view: true, add: false, edit: false, delete: false },
    ecoutes: { view: true, add: true, edit: true, delete: true },
  },
  [ROLES.MANAGER]: {
    commerciaux: { view: true, add: true, edit: true, delete: false },
    managers: { view: false, add: false, edit: false, delete: false },
    directeurs: { view: false, add: false, edit: false, delete: false },
    zones: { view: true, add: true, edit: true, delete: false },
    immeubles: { view: true, add: true, edit: true, delete: false },
    statistics: { view: true, add: true, edit: true, delete: false },
    'gps-tracking': { view: false, add: false, edit: false, delete: false },
    ecoutes: { view: false, add: false, edit: false, delete: false },
  },
  [ROLES.COMMERCIAL]: {
    commerciaux: { view: false, add: false, edit: false, delete: false },
    managers: { view: false, add: false, edit: false, delete: false },
    directeurs: { view: false, add: false, edit: false, delete: false },
    zones: { view: true, add: false, edit: false, delete: false },
    immeubles: { view: true, add: false, edit: false, delete: false },
    statistics: { view: true, add: true, edit: true, delete: false },
    'gps-tracking': { view: false, add: false, edit: false, delete: false },
    ecoutes: { view: false, add: false, edit: false, delete: false },
  },
}

/**
 * Filtre les commerciaux selon le rôle de l'utilisateur
 */
export const filterCommercials = (commercials, managers, userRole, userId) => {
  if (!commercials?.length) return []

  const userIdInt = parseInt(userId, 10)
  if (isNaN(userIdInt)) return []

  const roleFilters = {
    [ROLES.ADMIN]: () => commercials,
    [ROLES.DIRECTEUR]: () => commercials.filter(commercial => commercial.directeurId === userIdInt),
    [ROLES.MANAGER]: () => commercials.filter(commercial => commercial.managerId === userIdInt),
    [ROLES.COMMERCIAL]: () => commercials.filter(commercial => commercial.id === userIdInt),
  }

  return roleFilters[userRole]?.() || []
}

/**
 * Filtre les managers selon le rôle de l'utilisateur
 */
export const filterManagers = (managers, userRole, userId) => {
  if (!managers?.length) return []

  const userIdInt = parseInt(userId, 10)
  if (isNaN(userIdInt)) return []

  const roleFilters = {
    [ROLES.ADMIN]: () => managers,
    [ROLES.DIRECTEUR]: () => managers.filter(manager => manager.directeurId === userIdInt),
    [ROLES.MANAGER]: () => [],
    [ROLES.COMMERCIAL]: () => [],
  }

  return roleFilters[userRole]?.() || []
}

/**
 * Filtre les directeurs selon le rôle de l'utilisateur
 */
export const filterDirecteurs = (directeurs, userRole, userId) => {
  if (!directeurs?.length) return []

  const userIdInt = parseInt(userId, 10)
  if (isNaN(userIdInt)) return []

  const roleFilters = {
    [ROLES.ADMIN]: () => directeurs,
    [ROLES.DIRECTEUR]: () => directeurs.filter(directeur => directeur.id === userIdInt),
    [ROLES.MANAGER]: () => [],
    [ROLES.COMMERCIAL]: () => [],
  }

  return roleFilters[userRole]?.() || []
}

/**
 * Filtre les zones selon le rôle de l'utilisateur
 */
export const filterZones = (zones, commercials, userRole, userId) => {
  if (!zones?.length || !commercials?.length) return []

  const userIdInt = parseInt(userId, 10)
  if (isNaN(userIdInt)) return []

  const getCommercialIds = commercialsList => commercialsList.map(c => c.id)

  const isZoneAssignedToCommercials = (zone, commercialIds) =>
    zone.commercials?.some(czr => commercialIds.includes(czr.commercialId))

  const roleFilters = {
    [ROLES.ADMIN]: () => zones,

    [ROLES.DIRECTEUR]: () => {
      const directeurCommercials = commercials.filter(c => c.directeurId === userIdInt)
      const commercialIds = getCommercialIds(directeurCommercials)

      return zones.filter(
        zone => zone.directeurId === userIdInt || isZoneAssignedToCommercials(zone, commercialIds)
      )
    },

    [ROLES.MANAGER]: () => {
      const managerCommercials = commercials.filter(c => c.managerId === userIdInt)
      const managerCommercialIds = getCommercialIds(managerCommercials)

      return zones.filter(
        zone =>
          zone.managerId === userIdInt || isZoneAssignedToCommercials(zone, managerCommercialIds)
      )
    },

    [ROLES.COMMERCIAL]: () => {
      return zones.filter(zone => isZoneAssignedToCommercials(zone, [userIdInt]))
    },
  }

  return roleFilters[userRole]?.() || []
}

/**
 * Filtre les immeubles selon le rôle de l'utilisateur
 */
export const filterImmeubles = (immeubles, commercials, userRole, userId) => {
  if (!immeubles?.length || !commercials?.length) return []

  const userIdInt = parseInt(userId, 10)
  if (isNaN(userIdInt)) return []

  const getCommercialIds = commercialsList => commercialsList.map(c => c.id)

  const roleFilters = {
    [ROLES.ADMIN]: () => immeubles,

    [ROLES.DIRECTEUR]: () => {
      const directeurCommercials = commercials.filter(c => c.directeurId === userIdInt)
      const commercialIds = getCommercialIds(directeurCommercials)
      return immeubles.filter(immeuble => commercialIds.includes(immeuble.commercialId))
    },

    [ROLES.MANAGER]: () => {
      const managerCommercials = commercials.filter(c => c.managerId === userIdInt)
      const managerCommercialIds = getCommercialIds(managerCommercials)
      return immeubles.filter(immeuble => managerCommercialIds.includes(immeuble.commercialId))
    },

    [ROLES.COMMERCIAL]: () => {
      return immeubles.filter(immeuble => immeuble.commercialId === userIdInt)
    },
  }

  return roleFilters[userRole]?.() || []
}

/**
 * Filtre les statistiques selon le rôle de l'utilisateur
 */
export const filterStatistics = (statistics, commercials, userRole, userId) => {
  if (!statistics?.length || !commercials?.length) return []

  const userIdInt = parseInt(userId, 10)
  if (isNaN(userIdInt)) return []

  const getCommercialIds = commercialsList => commercialsList.map(c => c.id)

  const roleFilters = {
    [ROLES.ADMIN]: () => statistics,

    [ROLES.DIRECTEUR]: () => {
      const directeurCommercials = commercials.filter(c => c.directeurId === userIdInt)
      const commercialIds = getCommercialIds(directeurCommercials)
      return statistics.filter(stat => commercialIds.includes(stat.commercialId))
    },

    [ROLES.MANAGER]: () => {
      const managerCommercials = commercials.filter(c => c.managerId === userIdInt)
      const managerCommercialIds = getCommercialIds(managerCommercials)
      return statistics.filter(stat => managerCommercialIds.includes(stat.commercialId))
    },

    [ROLES.COMMERCIAL]: () => {
      return statistics.filter(stat => stat.commercialId === userIdInt)
    },
  }

  return roleFilters[userRole]?.() || []
}

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export const hasPermission = (userRole, entity, action) => {
  return PERMISSIONS[userRole]?.[entity]?.[action] || false
}

/**
 * Génère une description dynamique selon le rôle
 */
export const getEntityDescription = (entity, userRole) => {
  const descriptions = {
    commerciaux: {
      [ROLES.ADMIN]: "Tous les commerciaux de l'entreprise avec leurs informations et performances",
      [ROLES.DIRECTEUR]: 'Commerciaux de votre division avec leurs informations et performances',
      [ROLES.MANAGER]: 'Vos commerciaux avec leurs informations et performances',
    },
    managers: {
      [ROLES.ADMIN]: "Tous les managers de l'entreprise avec leurs équipes",
      [ROLES.DIRECTEUR]: 'Managers de votre division avec leurs équipes',
      [ROLES.MANAGER]: 'Informations sur les managers',
    },
    directeurs: {
      [ROLES.ADMIN]: "Tous les directeurs de l'entreprise avec leurs divisions",
      [ROLES.DIRECTEUR]: 'Vos informations en tant que directeur',
      [ROLES.MANAGER]: 'Informations sur les directeurs',
    },
    zones: {
      [ROLES.ADMIN]: "Toutes les zones géographiques de l'entreprise",
      [ROLES.DIRECTEUR]: 'Zones géographiques de votre division',
      [ROLES.MANAGER]: 'Zones géographiques de vos commerciaux',
      [ROLES.COMMERCIAL]: 'Vos zones géographiques assignées',
    },
    immeubles: {
      [ROLES.ADMIN]: "Tous les immeubles gérés par l'entreprise",
      [ROLES.DIRECTEUR]: 'Immeubles gérés par votre division',
      [ROLES.MANAGER]: 'Immeubles gérés par vos commerciaux',
      [ROLES.COMMERCIAL]: 'Vos immeubles assignés',
    },
    statistics: {
      [ROLES.ADMIN]: "Statistiques de tous les commerciaux de l'entreprise",
      [ROLES.DIRECTEUR]: 'Statistiques des commerciaux de votre division',
      [ROLES.MANAGER]: 'Statistiques de vos commerciaux',
      [ROLES.COMMERCIAL]: 'Vos statistiques personnelles',
    },
    ecoutes: {
      [ROLES.ADMIN]: "Écoutes et enregistrements de tous les commerciaux de l'entreprise",
      [ROLES.DIRECTEUR]: 'Écoutes et enregistrements des commerciaux de votre division',
      [ROLES.MANAGER]: "Pas d'accès aux écoutes",
      [ROLES.COMMERCIAL]: "Pas d'accès aux écoutes",
    },
  }

  return descriptions[entity]?.[userRole] || `Gestion des ${entity}`
}
