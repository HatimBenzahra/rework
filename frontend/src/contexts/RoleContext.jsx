/**
 * Contexte global pour la gestion des rôles et des données filtrées
 */

import React, { createContext, useContext, useMemo } from 'react'
import { ROLES } from '../utils/roleFilters'

const RoleContext = createContext()

// Fonctions utilitaires pour localStorage
const getUserRole = () => {
  return localStorage.getItem('userRole') || ROLES.ADMIN
}

const getUserId = () => {
  return localStorage.getItem('userId') || '1'
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
    }),
    [currentRole, currentUserId]
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export const useRole = () => {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}
