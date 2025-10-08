/**
 * Utilitaires centralisés pour le filtrage des données selon les rôles
 */

// Types de rôles supportés
export const ROLES = {
  ADMIN: 'admin',
  DIRECTEUR: 'directeur',
  MANAGER: 'manager',
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
  },
  [ROLES.DIRECTEUR]: {
    commerciaux: { view: true, add: true, edit: true, delete: true },
    managers: { view: true, add: true, edit: true, delete: true },
    directeurs: { view: false, add: false, edit: false, delete: false },
    zones: { view: true, add: true, edit: true, delete: false },
    immeubles: { view: true, add: true, edit: true, delete: false },
    statistics: { view: true, add: false, edit: false, delete: false },
  },
  [ROLES.MANAGER]: {
    commerciaux: { view: true, add: true, edit: true, delete: false },
    managers: { view: false, add: false, edit: false, delete: false },
    directeurs: { view: false, add: false, edit: false, delete: false },
    zones: { view: true, add: false, edit: false, delete: false },
    immeubles: { view: true, add: false, edit: false, delete: false },
    statistics: { view: true, add: false, edit: false, delete: false },
  },
}

/**
 * Filtre les commerciaux selon le rôle de l'utilisateur
 */
export const filterCommercials = (commercials, managers, userRole, userId) => {
  if (!commercials) return []

  const userIdInt = parseInt(userId)

  switch (userRole) {
    case ROLES.ADMIN:
      return commercials

    case ROLES.DIRECTEUR:
      return commercials.filter(commercial => commercial.directeurId === userIdInt)

    case ROLES.MANAGER:
      return commercials.filter(commercial => commercial.managerId === userIdInt)

    default:
      return []
  }
}

/**
 * Filtre les managers selon le rôle de l'utilisateur
 */
export const filterManagers = (managers, userRole, userId) => {
  if (!managers) return []

  const userIdInt = parseInt(userId)

  switch (userRole) {
    case ROLES.ADMIN:
      return managers

    case ROLES.DIRECTEUR:
      return managers.filter(manager => manager.directeurId === userIdInt)

    case ROLES.MANAGER:
      return []

    default:
      return []
  }
}

/**
 * Filtre les directeurs selon le rôle de l'utilisateur
 */
export const filterDirecteurs = (directeurs, userRole, userId) => {
  if (!directeurs) return []

  const userIdInt = parseInt(userId)

  switch (userRole) {
    case ROLES.ADMIN:
      return directeurs

    case ROLES.DIRECTEUR:
      return directeurs.filter(directeur => directeur.id === userIdInt)

    case ROLES.MANAGER:
      return []

    default:
      return []
  }
}

/**
 * Filtre les zones selon le rôle de l'utilisateur
 */
export const filterZones = (zones, commercials, userRole, userId) => {
  if (!zones || !commercials) return []

  const userIdInt = parseInt(userId)

  switch (userRole) {
    case ROLES.ADMIN:
      return zones

    case ROLES.DIRECTEUR: {
      // Zones des commerciaux du directeur
      const directeurCommercials = commercials.filter(c => c.directeurId === userIdInt)
      const commercialIds = directeurCommercials.map(c => c.id)
      return zones.filter(zone =>
        zone.commercials?.some(czr => commercialIds.includes(czr.commercialId))
      )
    }

    case ROLES.MANAGER: {
      // Zones des commerciaux du manager
      const managerCommercials = commercials.filter(c => c.managerId === userIdInt)
      const managerCommercialIds = managerCommercials.map(c => c.id)
      return zones.filter(zone =>
        zone.commercials?.some(czr => managerCommercialIds.includes(czr.commercialId))
      )
    }

    default:
      return []
  }
}

/**
 * Filtre les immeubles selon le rôle de l'utilisateur
 */
export const filterImmeubles = (immeubles, commercials, userRole, userId) => {
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

/**
 * Filtre les statistiques selon le rôle de l'utilisateur
 */
export const filterStatistics = (statistics, commercials, userRole, userId) => {
  if (!statistics || !commercials) return []

  const userIdInt = parseInt(userId)

  switch (userRole) {
    case ROLES.ADMIN:
      return statistics

    case ROLES.DIRECTEUR: {
      // Statistiques des commerciaux du directeur
      const directeurCommercials = commercials.filter(c => c.directeurId === userIdInt)
      const commercialIds = directeurCommercials.map(c => c.id)
      return statistics.filter(stat => commercialIds.includes(stat.commercialId))
    }

    case ROLES.MANAGER: {
      // Statistiques des commerciaux du manager
      const managerCommercials = commercials.filter(c => c.managerId === userIdInt)
      const managerCommercialIds = managerCommercials.map(c => c.id)
      return statistics.filter(stat => managerCommercialIds.includes(stat.commercialId))
    }

    default:
      return []
  }
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
    },
    immeubles: {
      [ROLES.ADMIN]: "Tous les immeubles gérés par l'entreprise",
      [ROLES.DIRECTEUR]: 'Immeubles gérés par votre division',
      [ROLES.MANAGER]: 'Immeubles gérés par vos commerciaux',
    },
    statistics: {
      [ROLES.ADMIN]: "Statistiques de tous les commerciaux de l'entreprise",
      [ROLES.DIRECTEUR]: 'Statistiques des commerciaux de votre division',
      [ROLES.MANAGER]: 'Statistiques de vos commerciaux',
    },
  }

  return descriptions[entity]?.[userRole] || `Gestion des ${entity}`
}
