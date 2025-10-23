/**
 * Contexte global pour la gestion des rôles et des données filtrées
 */
import React, { useMemo } from 'react'
import { ROLES } from '../utils_role_decider/roleFilters'
import { RoleContext } from './userole'

// Fonctions utilitaires pour localStorage
const getUserRole = () => {
  const storedRole = localStorage.getItem('userRole')
  if (!storedRole) {
    // Initialiser avec admin par défaut si non défini
    localStorage.setItem('userRole', ROLES.ADMIN)
    return ROLES.ADMIN
  }
  return storedRole
}

const getUserId = () => {
  const storedId = localStorage.getItem('userId')
  if (!storedId) {
    // Initialiser avec l'ID 1 par défaut si non défini
    localStorage.setItem('userId', '1')
    return '1'
  }
  return storedId
}

export const RoleProvider = ({ children }) => {
  const currentRole = getUserRole()
  const currentUserId = getUserId()

  const setUserRole = role => {
    localStorage.setItem('userRole', role)
    // Force un rechargement pour mettre à jour le contexte
    window.location.reload()
  }

  const setUserId = id => {
    localStorage.setItem('userId', id)
    // Force un rechargement pour mettre à jour le contexte
    window.location.reload()
  }

  const value = useMemo(
    () => ({
      currentRole,
      currentUserId,
      setUserRole,
      setUserId,
      isAdmin: currentRole === ROLES.ADMIN,
      isDirecteur: currentRole === ROLES.DIRECTEUR,
      isManager: currentRole === ROLES.MANAGER,
      isCommercial: currentRole === ROLES.COMMERCIAL,
    }),
    [currentRole, currentUserId]
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}
