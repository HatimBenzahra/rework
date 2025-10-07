import { useState, useEffect } from 'react'

/**
 * Hook personnalisé pour gérer le loading des pages
 * @param {number} delay - Délai de simulation en ms (par défaut 800ms)
 * @param {Function} fetchData - Fonction async optionnelle pour charger des données
 * @returns {Object} { loading, data, error, setData }
 */
export function usePageLoading(delay = 800, fetchData = null) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Si une fonction fetchData est fournie, l'exécuter
        if (fetchData) {
          const result = await fetchData()
          setData(result)
        } else {
          // Sinon, juste simuler un délai de chargement
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (err) {
        setError(err)
        console.error('Erreur de chargement:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [delay, fetchData])

  return { loading, data, error, setData }
}

/**
 * Hook simplifié pour le loading sans données
 * Utile pour les pages qui utilisent des données statiques
 * @param {number} delay - Délai de simulation en ms
 * @returns {boolean} loading
 */
export function useSimpleLoading(delay = 800) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return loading
}
