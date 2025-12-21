/**
 * Contexte global pour la gestion des rôles et des données filtrées
 * Intégré avec Keycloak SSO
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ROLES } from '../hooks/metier/permissions/roleFilters'
import { RoleContext } from './userole'
import { authService } from '../services/auth'
import { api } from '../services/api'
import { apiCache } from '../services/core'
import LoadingScreen from '../components/LoadingScreen'
import { useAppLoading } from './AppLoadingContext'
import { setUser as setSentryUser } from '../config/sentry'

export const RoleProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAppReady } = useAppLoading()

  // État de chargement initial
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // userId sera chargé depuis l'API via api.auth.getMe()
  const [currentRole, setCurrentRole] = useState(() => authService.getUserRole())
  const [currentUserId, setCurrentUserId] = useState(null)

  // Envoyer les infos utilisateur à Sentry au montage initial (si authentifié)
  useEffect(() => {
    if (currentUserId && currentRole && authService.isAuthenticated()) {
      setSentryUser({
        id: currentUserId.toString(),
        role: currentRole,
      })
    }
  }, [currentUserId, currentRole])

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

  useEffect(() => {
    let authChangeTimers = []

    const handleAuthChange = () => {
      const newRole = authService.getUserRole()

      setCurrentRole(newRole)
      // userId sera rechargé via api.auth.getMe() dans le useEffect séparé
      // Ne pas essayer de le récupérer depuis le JWT car il n'y est pas

      // Recharger les infos utilisateur depuis l'API
      if (authService.isAuthenticated()) {
        api.auth
          .getMe()
          .then(userInfo => {
            setCurrentUserId(userInfo.id)
            setSentryUser({
              id: userInfo.id.toString(),
              role: userInfo.role,
            })
          })
          .catch(error => {
            console.error('Erreur récupération user info lors du changement:', error)
          })
      } else {
        setCurrentUserId(null)
        setSentryUser(null)
      }

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

  const logout = useCallback(() => {
    // Nettoyer les tokens et données d'authentification
    authService.logout()

    // Nettoyer tout le cache API pour éviter les fuites de données
    apiCache.clear()

    // Réinitialiser les états locaux
    setCurrentRole(null)
    setCurrentUserId(null)

    // Retirer l'utilisateur de Sentry
    setSentryUser(null)

    // Rediriger vers la page de connexion
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo(
    () => ({
      currentRole,
      currentUserId,

      logout,
      isAuthenticated: authService.isAuthenticated(),
      isAdmin: currentRole === ROLES.ADMIN,
      isDirecteur: currentRole === ROLES.DIRECTEUR,
      isManager: currentRole === ROLES.MANAGER,
      isCommercial: currentRole === ROLES.COMMERCIAL,
    }),
    [currentRole, currentUserId, logout]
  )

  // Charger les infos utilisateur depuis l'API au démarrage
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userInfo = await api.auth.getMe()
          setCurrentUserId(userInfo.id)
          setCurrentRole(userInfo.role)

          // Mettre à jour Sentry
          setSentryUser({
            id: userInfo.id.toString(),
            role: userInfo.role,
          })
        } catch (error) {
          console.error('Erreur récupération user info:', error)
          // En cas d'erreur, déconnecter l'utilisateur
          logout()
        }
      }
    }

    fetchUserInfo()
  }, [logout])

  return (
    <RoleContext.Provider value={value}>
      {children}
      {/* LoadingScreen par-dessus tout pendant le chargement initial */}
      {isInitialLoading && authService.isAuthenticated() && <LoadingScreen />}
    </RoleContext.Provider>
  )
}
