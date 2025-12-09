import React, { useState, useCallback, useEffect } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import {
  useImmeuble,
  useInfinitePortesByImmeuble,
  usePorteStatistics
} from '@/hooks/metier/use-api'
import PortesTemplate from './components/PortesTemplate'

export default function PortesLecture() {
  const { immeubleId } = useParams()

  // Récupérer la ref du layout parent (comme PortesGestion)
  const { scrollContainerRef } = useOutletContext() || {}

  // États pour les filtres
  const [selectedStatuts, setSelectedStatuts] = useState([])
  const [selectedFloor, setSelectedFloor] = useState(null)

  // Récupérer les données avec infinite scroll
  const {
    data: portes,
    loading: portesLoading,
    loadMore,
    hasMore,
    isFetchingMore
  } = useInfinitePortesByImmeuble(parseInt(immeubleId, 10), 20, selectedFloor)

  const { data: statsData } = usePorteStatistics(parseInt(immeubleId, 10))

  const { loading: immeubleLoading } = useImmeuble(parseInt(immeubleId, 10))

  // Infinite scroll logic avec préservation de la position
  useEffect(() => {
    const container = scrollContainerRef?.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight

      // Charger plus quand on arrive à 80% du scroll
      if (scrollTop + clientHeight >= scrollHeight * 0.8 && !portesLoading && hasMore) {
        // Sauvegarder la position avant le chargement
        const savedScrollTop = container.scrollTop

        loadMore().then(() => {
          // Restaurer la position après le chargement (au prochain tick)
          requestAnimationFrame(() => {
            if (container.scrollTop < savedScrollTop) {
              container.scrollTop = savedScrollTop
            }
          })
        })
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [loadMore, portesLoading, hasMore, scrollContainerRef, selectedFloor])

  // Fonctions de gestion des filtres
  const handleStatutToggle = useCallback(statut => {
    setSelectedStatuts(prev =>
      prev.includes(statut) ? prev.filter(s => s !== statut) : [...prev, statut]
    )
  }, [])

  const handleFloorSelect = useCallback((etage) => {
    // If clicking same floor, toggle off
    if (selectedFloor === etage) {
      setSelectedFloor(null)
    } else {
      setSelectedFloor(etage)
    }
  }, [selectedFloor])

  const clearAllFilters = useCallback(() => {
    setSelectedStatuts([])
    setSelectedFloor(null)
  }, [])

  return (
    <PortesTemplate
      portes={portes}
      loading={portesLoading || immeubleLoading}
      readOnly={true}
      showStatusFilters={true}
      selectedStatuts={selectedStatuts}
      onStatutToggle={handleStatutToggle}
      onClearStatutFilters={clearAllFilters}
      backButtonText="Retour"
      scrollTargetText="Haut"
      isFetchingMore={isFetchingMore}
      statsData={statsData}
      onFloorSelect={handleFloorSelect}
      selectedFloor={selectedFloor}
    />
  )
}
