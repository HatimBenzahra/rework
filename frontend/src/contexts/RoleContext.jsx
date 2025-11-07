/**
 * Contexte global pour la gestion des rôles et des données filtrées
 * Intégré avec Keycloak SSO
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ROLES } from '../hooks/metier/roleFilters'
import { RoleContext } from './userole'
import { authService } from '../services/auth.service'
import { apiCache } from '../services/api-cache'
import LoadingScreen from '../components/LoadingScreen'
import { useAppLoading } from './AppLoadingContext'

export const RoleProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAppReady } = useAppLoading()

  // État de chargement initial
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Utiliser des states pour rendre le contexte réactif
  const [currentRole, setCurrentRole] = useState(() => localStorage.getItem('userRole'))
  const [currentUserId, setCurrentUserId] = useState(() => {
    const storedId = localStorage.getItem('userId')
    return storedId ? parseInt(storedId, 10) : null
  })

  // Vérifier l'authentification au montage
  useEffect(() => {
    const publicRoutes = ['/login', '/unauthorized']
    const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route))

    // Si on n'est pas sur une route publique et pas authentifié, rediriger vers login
    if (!isPublicRoute && !authService.isAuthenticated()) {
      navigate('/login', { replace: true })
      setIsInitialLoading(false)
    } else if (isPublicRoute) {
      // Sur les routes publiques, pas de loading
      setIsInitialLoading(false)
    } else {
      // Pour les routes protégées, attendre OBLIGATOIREMENT que les données soient chargées
      let minDelayPassed = false

      const checkAllReady = () => {
        // On cache le loading SEULEMENT si le délai minimum est passé ET les données sont chargées
        if (minDelayPassed && isAppReady) {
          setIsInitialLoading(false)
        }
      }

      // Délai minimum pour l'animation (1.5s)
      const minTimer = setTimeout(() => {
        minDelayPassed = true
        checkAllReady()
      }, 1500)

      // Vérifier périodiquement si les données sont prêtes
      const checkInterval = setInterval(() => {
        if (isAppReady && minDelayPassed) {
          checkAllReady()
        }
      }, 100)

      // Timeout de sécurité après 8 secondes max
      const maxTimer = setTimeout(() => {
        setIsInitialLoading(false)
      }, 8000)

      return () => {
        clearTimeout(minTimer)
        clearTimeout(maxTimer)
        clearInterval(checkInterval)
      }
    }
  }, [navigate, location, isAppReady])

  // Écouter les changements dans localStorage (pour mise à jour du contexte)
  useEffect(() => {
    let authChangeTimers = []

    const handleAuthChange = () => {
      const newRole = localStorage.getItem('userRole')
      const newId = localStorage.getItem('userId')

      setCurrentRole(newRole)
      setCurrentUserId(newId ? parseInt(newId, 10) : null)

      // Nettoyer les anciens timers
      authChangeTimers.forEach(timer => clearTimeout(timer))
      authChangeTimers = []

      // Afficher le loading screen lors du changement d'auth
      setIsInitialLoading(true)

      // Attendre le rechargement de la page
      let isPageReady = false
      let minDelayPassed = false

      const minTimer = setTimeout(() => {
        minDelayPassed = true
        if (isPageReady) {
          setIsInitialLoading(false)
        }
      }, 2000)
      authChangeTimers.push(minTimer)

      const checkReady = () => {
        if (document.readyState === 'complete') {
          isPageReady = true
          if (minDelayPassed) {
            setIsInitialLoading(false)
          }
        }
      }

      const checkTimer = setTimeout(checkReady, 100)
      authChangeTimers.push(checkTimer)

      const maxTimer = setTimeout(() => {
        setIsInitialLoading(false)
      }, 5000)
      authChangeTimers.push(maxTimer)
    }

    // Écouter les changements de storage (entre onglets)
    window.addEventListener('storage', handleAuthChange)

    // Custom event pour les changements dans le même onglet
    window.addEventListener('auth-changed', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleAuthChange)
      window.removeEventListener('auth-changed', handleAuthChange)
      // Nettoyer les timers restants
      authChangeTimers.forEach(timer => clearTimeout(timer))
    }
  }, [])

  const updateUserRole = useCallback(role => {
    localStorage.setItem('userRole', role)
    setCurrentRole(role)
    // Dispatch custom event pour notifier les autres composants
    window.dispatchEvent(new Event('auth-changed'))
  }, [])

  const updateUserId = useCallback(id => {
    localStorage.setItem('userId', id.toString())
    setCurrentUserId(id)
    // Dispatch custom event pour notifier les autres composants
    window.dispatchEvent(new Event('auth-changed'))
  }, [])

  const logout = useCallback(() => {
    // Nettoyer les tokens et données d'authentification
    authService.logout()

    // Nettoyer tout le cache API pour éviter les fuites de données
    apiCache.clear()

    // Réinitialiser les états locaux
    setCurrentRole(null)
    setCurrentUserId(null)

    // Rediriger vers la page de connexion
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo(
    () => ({
      currentRole,
      currentUserId,
      setUserRole: updateUserRole,
      setUserId: updateUserId,
      logout,
      isAuthenticated: authService.isAuthenticated(),
      isAdmin: currentRole === ROLES.ADMIN,
      isDirecteur: currentRole === ROLES.DIRECTEUR,
      isManager: currentRole === ROLES.MANAGER,
      isCommercial: currentRole === ROLES.COMMERCIAL,
    }),
    [currentRole, currentUserId, updateUserRole, updateUserId, logout]
  )

  return (
    <RoleContext.Provider value={value}>
      {children}
      {/* LoadingScreen par-dessus tout pendant le chargement initial */}
      {isInitialLoading && authService.isAuthenticated() && <LoadingScreen />}
    </RoleContext.Provider>
  )
}
