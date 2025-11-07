import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Composant qui scroll automatiquement vers le haut lors des changements de route
 * Utilisé globalement dans l'application pour améliorer l'UX
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll vers le haut de manière fluide à chaque changement de route
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  }, [pathname])

  return null // Ce composant ne rend rien visuellement
}
