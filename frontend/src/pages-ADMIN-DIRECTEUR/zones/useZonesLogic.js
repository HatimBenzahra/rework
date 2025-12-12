import { useMemo } from 'react'
import { ROLES } from '@/hooks/metier/roleFilters'
import { fetchLocationName } from './zones-utils'

/**
 * Hook to enrich zones with assignment information
 */
export const useEnrichedZones = (zones, directeurs, managers, commercials, allAssignments) => {
  return useMemo(() => {
    if (!zones) return []

    // Créer des Maps pour un accès O(1) au lieu de .find() qui est O(n)
    const directeursMap = new Map(directeurs?.map(d => [d.id, d]) || [])
    const managersMap = new Map(managers?.map(m => [m.id, m]) || [])
    const commercialsMap = new Map(commercials?.map(c => [c.id, c]) || [])

    // Créer un index des assignations par zoneId pour éviter les filtres répétés
    const assignmentsByZone = (allAssignments || []).reduce((acc, assignment) => {
      if (!acc[assignment.zoneId]) {
        acc[assignment.zoneId] = []
      }
      acc[assignment.zoneId].push(assignment)
      return acc
    }, {})

    return zones
      .map(zone => {
        const assignedUsers = []

        // 1. Vérifier l'assignation directe au directeur (recherche O(1))
        if (zone.directeurId) {
          const directeur = directeursMap.get(zone.directeurId)
          if (directeur) {
            assignedUsers.push(`${directeur.prenom} ${directeur.nom} (Directeur)`)
          }
        }

        // 2. Vérifier l'assignation directe au manager (recherche O(1))
        if (zone.managerId) {
          const manager = managersMap.get(zone.managerId)
          if (manager) {
            assignedUsers.push(`${manager.prenom} ${manager.nom} (Manager)`)
          }
        }

        // 3. Trouver toutes les assignations via ZoneEnCours (recherche O(1))
        const zoneAssignments = assignmentsByZone[zone.id] || []

        zoneAssignments.forEach(assignment => {
          if (assignment.userType === 'COMMERCIAL') {
            const commercial = commercialsMap.get(assignment.userId)
            if (commercial) {
              assignedUsers.push(`${commercial.prenom} ${commercial.nom} (Commercial)`)
            }
          } else if (assignment.userType === 'MANAGER') {
            const manager = managersMap.get(assignment.userId)
            if (manager) {
              assignedUsers.push(`${manager.prenom} ${manager.nom} (Manager)`)
            }
          } else if (assignment.userType === 'DIRECTEUR') {
            const directeur = directeursMap.get(assignment.userId)
            if (directeur) {
              assignedUsers.push(`${directeur.prenom} ${directeur.nom} (Directeur)`)
            }
          }
        })

          // Deduplicate assignedUsers strings
          const uniqueAssignedUsers = [...new Set(assignedUsers)];

        // Formater l'affichage: si plusieurs utilisateurs, les joindre avec des virgules
        const assignedTo = uniqueAssignedUsers.length > 0
          ? uniqueAssignedUsers.join(', ')
          : 'Non assigné'

        return {
          ...zone,
          assignedTo,
          assignedUsersCount: uniqueAssignedUsers.length,
        }
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [zones, directeurs, managers, commercials, allAssignments])
}

/**
 * Hook to get assignable users based on permissions and role
 */
export const useAssignableUsers = (permissions, currentUserId, currentRole, directeurs, managers, commercials) => {
  return useMemo(() => {
    if (!permissions.canAdd && !permissions.canEdit) {
      return []
    }

    const userIdInt = parseInt(currentUserId, 10)
    const safeUserId = Number.isNaN(userIdInt) ? null : userIdInt

    const formatUsers = (collection, role) =>
      (collection || []).map(item => ({
        id: item.id,
        name: `${item.prenom} ${item.nom}`,
        role,
        managerId: item.managerId,
        directeurId: item.directeurId,
      }))

    switch (currentRole) {
      case ROLES.ADMIN:
        return [
          ...formatUsers(directeurs, 'directeur'),
          ...formatUsers(managers, 'manager'),
          ...formatUsers(commercials, 'commercial'),
        ]

      case ROLES.DIRECTEUR: {
        const scopedDirecteur = directeurs?.find(d => d.id === safeUserId)
        const directeurOption = scopedDirecteur
          ? [
              {
                id: scopedDirecteur.id,
                name: `${scopedDirecteur.prenom} ${scopedDirecteur.nom}`,
                role: 'directeur',
              },
            ]
          : []

        return [
          ...directeurOption,
          ...formatUsers(managers, 'manager'),
          ...formatUsers(commercials, 'commercial'),
        ]
      }

      case ROLES.COMMERCIAL: {
        const scopedCommercial = commercials?.find(c => c.id === safeUserId)
        return scopedCommercial
          ? [
              {
                id: scopedCommercial.id,
                name: `${scopedCommercial.prenom} ${scopedCommercial.nom}`,
                role: 'commercial',
              },
            ]
          : []
      }

      default:
        return []
    }
  }, [permissions, currentUserId, currentRole, directeurs, managers, commercials])
}

/**
 * Hook for Mapbox lazy loader configuration
 */
export const useMapboxLoader = () => {
    return useMemo(
    () => ({
      namespace: 'mapbox-geocode',
      fetcher: async zone => {
        return fetchLocationName(zone.xOrigin, zone.yOrigin)
      },
      getCacheKey: zone => [zone.xOrigin.toFixed(4), zone.yOrigin.toFixed(4)],
      shouldLoad: (zone, currentData) => {
        return zone.xOrigin && zone.yOrigin && !currentData
      },
      delay: 200, // 200ms entre chaque appel
      maxConcurrent: 3,
    }),
    []
  )
}
