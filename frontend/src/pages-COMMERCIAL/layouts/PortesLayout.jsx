import React from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, Building2, History } from 'lucide-react'
import { useRole } from '@/contexts/RoleContext'
import { useCommercialFull } from '@/hooks/use-api'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'
import CommercialHeader from '@/components/CommercialHeader'
import CommercialBottomBar from '@/components/CommercialBottomBar'

/**
 * Layout spécifique pour la page de gestion des portes
 * Charge ses propres données et ne montre pas le greeting
 */
export default function PortesLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUserId } = useRole()
  const { base, components } = useCommercialTheme()

  // Charger les données du commercial
  const { data: commercial, loading: commercialLoading } = useCommercialFull(
    parseInt(currentUserId)
  )

  // Statistiques du commercial - Somme de toutes les zones
  const myStats = React.useMemo(() => {
    if (!commercial?.statistics || commercial.statistics.length === 0) {
      return {
        contratsSignes: 0,
        immeublesVisites: 0,
        rendezVousPris: 0,
        refus: 0,
      }
    }

    // Calculer la somme des statistiques de toutes les zones
    return commercial.statistics.reduce(
      (acc, stat) => ({
        contratsSignes: acc.contratsSignes + stat.contratsSignes,
        immeublesVisites: acc.immeublesVisites + stat.immeublesVisites,
        rendezVousPris: acc.rendezVousPris + stat.rendezVousPris,
        refus: acc.refus + stat.refus,
      }),
      {
        contratsSignes: 0,
        immeublesVisites: 0,
        rendezVousPris: 0,
        refus: 0,
      }
    )
  }, [commercial?.statistics])

  // Déterminer l'onglet actif selon la route
  // Si c'est /portes/lecture/:immeubleId => "historique"
  // Si c'est /portes/:immeubleId => "immeubles"
  const activeTab = location.pathname.includes('/portes/lecture/') ? 'historique' : 'immeubles'

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

  if (commercialLoading) {
    return (
      <div className={`flex flex-col h-screen w-screen ${base.bg.card} overflow-hidden`}>
        <CommercialHeader
          commercial={null}
          showGreeting={false}
          stats={myStats}
          pageTitle="Gestion des Portes"
        />
        <div className={components.loading.container}>
          <div className="text-center">
            <div className={`${components.loading.spinner} mx-auto mb-4`}></div>
            <p className={components.loading.text}>Chargement...</p>
          </div>
        </div>
        <CommercialBottomBar
          navigationItems={navigationItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-screen w-screen ${base.bg.card} overflow-hidden`}>
      {/* Header Commercial sans greeting */}
      <CommercialHeader
        commercial={commercial}
        showGreeting={false}
        stats={myStats}
        pageTitle="Gestion des Portes"
      />

      {/* Content avec padding bottom pour la bottom bar et classe spéciale pour le scroll */}
      <div
        className={`flex-1 overflow-y-auto overflow-x-hidden ${base.bg.page} px-4 sm:px-6 py-4 sm:py-6 pb-24 portes-scroll-container`}
      >
        <Outlet context={{ commercial, myStats, commercialLoading }} />
      </div>

      {/* Bottom Navigation Bar */}
      <CommercialBottomBar
        navigationItems={navigationItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  )
}
