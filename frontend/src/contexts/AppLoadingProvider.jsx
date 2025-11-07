import { useState, useEffect } from 'react'
import { AppLoadingContext } from './AppLoadingContext'
import { apiCache } from '../services/api-cache'

export function AppLoadingProvider({ children }) {
  const [isAppReady, setIsAppReady] = useState(false)
  const [hasCheckedCache, setHasCheckedCache] = useState(false)

  // Vérifier si des données sont déjà en cache au montage
  useEffect(() => {
    const checkCache = () => {
      // Vérifier si les données critiques sont en cache
      const hasCachedData =
        apiCache.has('commercials') || apiCache.has('managers') || apiCache.has('directeurs')

      if (hasCachedData) {
        // Si des données sont en cache, l'app peut être considérée comme prête plus rapidement
        setIsAppReady(true)
      }

      setHasCheckedCache(true)
    }

    // Petit délai pour laisser le temps au cache de se charger
    const timer = setTimeout(checkCache, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AppLoadingContext.Provider value={{ isAppReady, setAppReady: setIsAppReady, hasCheckedCache }}>
      {children}
    </AppLoadingContext.Provider>
  )
}
