import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useImmeuble, usePortesByImmeuble } from '@/hooks/metier/use-api'
import PortesTemplate from './components/PortesTemplate'

export default function PortesLecture() {
  const { immeubleId } = useParams()

  // États pour les filtres par statut
  const [selectedStatuts, setSelectedStatuts] = useState([])

  // Récupérer les données sans cache (lecture seule)
  const { loading: immeubleLoading } = useImmeuble(parseInt(immeubleId))
  const { data: portesData, loading } = usePortesByImmeuble(parseInt(immeubleId))
  const portes = portesData || []

  // Fonctions de gestion des filtres
  const handleStatutToggle = statut => {
    setSelectedStatuts(prev =>
      prev.includes(statut) ? prev.filter(s => s !== statut) : [...prev, statut]
    )
  }

  const handleClearStatutFilters = () => {
    setSelectedStatuts([])
  }

  return (
    <PortesTemplate
      portes={portes}
      loading={loading || immeubleLoading}
      readOnly={true}
      showStatusFilters={true}
      selectedStatuts={selectedStatuts}
      onStatutToggle={handleStatutToggle}
      onClearStatutFilters={handleClearStatutFilters}
      backButtonText="Retour"
      scrollTargetText="Haut"
    />
  )
}
