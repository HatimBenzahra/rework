import React from 'react'
import { useNavigate, Outlet, useOutletContext } from 'react-router-dom'
import { BarChart3, Building2, History } from 'lucide-react'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'
import CommercialHeader from '@/components/CommercialHeader'
import CommercialBottomBar from '@/components/CommercialBottomBar'

/**
 * Layout spécifique pour la page de gestion des portes
 * Hérite du contexte commercial du layout parent mais ne montre pas le greeting
 */
export default function PortesLayout() {
  const navigate = useNavigate()
  const { base } = useCommercialTheme()

  // Récupérer le contexte du layout parent (CommercialLayout)
  const { commercial, myStats } = useOutletContext()

  // Configuration des onglets de navigation
  const navigationItems = [
    {
      id: 'stats',
      label: 'Mes Stats',
      icon: BarChart3,
      badge: myStats.contratsSignes,
    },
    {
      id: 'immeubles',
      label: 'Immeubles',
      icon: Building2,
      badge: commercial?.immeubles?.length || 0,
    },
    {
      id: 'historique',
      label: 'Historique',
      icon: History,
      badge: 0,
    },
  ]

  const handleTabChange = tabId => {
    // Navigation depuis la bottom bar
    if (tabId === 'stats') {
      navigate('/')
    } else if (tabId === 'immeubles') {
      navigate('/immeubles')
    } else if (tabId === 'historique') {
      navigate('/historique')
    }
  }

  return (
    <div className={`flex flex-col h-screen ${base.bg.card} overflow-hidden`}>
      {/* Header Commercial sans greeting */}
      <CommercialHeader commercial={commercial} showGreeting={false} stats={myStats} />

      {/* Content avec padding bottom pour la bottom bar et classe spéciale pour le scroll */}
      <div
        className={`flex-1 overflow-y-auto ${base.bg.page} px-6 py-6 pb-24 portes-scroll-container`}
      >
        <Outlet context={{ commercial, myStats }} />
      </div>

      {/* Bottom Navigation Bar */}
      <CommercialBottomBar
        navigationItems={navigationItems}
        activeTab="immeubles"
        onTabChange={handleTabChange}
      />
    </div>
  )
}
