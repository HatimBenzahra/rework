import React from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { BarChart3, Building2, History } from 'lucide-react'
import { useRole } from '@/contexts/userole'
import { useCommercialFull } from '@/hooks/metier/use-api'
import { useCommercialTheme } from '@/hooks/ui/use-commercial-theme'
import { useCommercialAutoAudio } from '@/hooks/audio/useCommercialAutoAudio'
import CommercialHeader from '@/components/CommercialHeader'
import CommercialBottomBar from '@/components/CommercialBottomBar'

/**
 * Layout principal pour l'espace commercial
 * Gère le header, la bottombar et la navigation de manière centralisée
 */
export default function CommercialLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUserId } = useRole()
  const { base, components } = useCommercialTheme()

  // Ref pour le scroll container (utilisée par PortesGestion)
  const scrollContainerRef = React.useRef(null)

  // Récupérer les données du commercial pour le header et bottom bar
  const {
    data: commercial,
    loading: commercialLoading,
    refetch,
  } = useCommercialFull(parseInt(currentUserId))

  // Activer l'audio monitoring automatique
  const {
    isConnected: audioConnected,
    isConnecting: audioConnecting,
    error: audioError,
    roomName,
  } = useCommercialAutoAudio(parseInt(currentUserId), true)

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

  // Configuration des onglets de navigation
  const navigationItems = [
    {
      id: 'stats',
      label: 'Tableau de bord',
      icon: BarChart3,
      badge: myStats.contratsSignes,
      path: '/',
    },
    {
      id: 'immeubles',
      label: 'Immeubles',
      icon: Building2,
      badge: commercial?.immeubles?.length || 0,
      path: '/immeubles',
    },
    {
      id: 'historique',
      label: 'Historique',
      icon: History,
      badge: 0,
      path: '/historique',
    },
  ]

  // Déterminer l'onglet actif basé sur le chemin
  const getActiveTab = () => {
    const path = location.pathname

    // Cas spécial pour la page des portes
    if (path.startsWith('/portes/')) {
      return 'immeubles'
    }

    // Mapping des paths vers les tabs
    if (path === '/immeubles') return 'immeubles'
    if (path === '/historique') return 'historique'
    return 'stats' // Par défaut
  }

  // Déterminer le titre de la page
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Tableau de bord'
    if (path === '/immeubles') return 'Mes Immeubles'
    if (path === '/historique') return 'Historique'
    if (path.startsWith('/portes/')) return 'Gestion des Portes'
    return null
  }

  // Gestion du changement d'onglet
  const handleTabChange = tabId => {
    const navItem = navigationItems.find(item => item.id === tabId)
    if (navItem) {
      navigate(navItem.path)
    }
  }

  if (commercialLoading) {
    return (
      <div className={`flex flex-col h-screen w-screen ${base.bg.card} overflow-hidden`}>
        <CommercialHeader
          commercial={null}
          showGreeting={true}
          stats={myStats}
          pageTitle={getPageTitle()}
        />
        <div className={components.loading.container}>
          <div className="text-center">
            <div className={`${components.loading.spinner} mx-auto mb-4`}></div>
            <p className={components.loading.text}>Chargement...</p>
          </div>
        </div>
        <CommercialBottomBar
          navigationItems={navigationItems}
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
        />
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-screen w-screen ${base.bg.card} overflow-hidden`}>
      {/* Header Commercial - visible sur toutes les pages sauf portes */}
      <CommercialHeader
        commercial={commercial}
        showGreeting={true}
        stats={myStats}
        pageTitle={getPageTitle()}
      />

      {/* Content avec padding bottom pour la bottom bar */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden ${base.bg.page} px-4 sm:px-6 py-4 sm:py-6 pb-24 ${
          location.pathname.startsWith('/portes/')
            ? 'portes-scroll-container'
            : 'commercial-scroll-container'
        }`}
      >
        <Outlet
          context={{
            commercial,
            myStats,
            commercialLoading,
            refetch,
            audioStatus: { audioConnected, audioConnecting, audioError, roomName },
            scrollContainerRef,
          }}
        />
      </div>

      {/* Bottom Navigation Bar */}
      <CommercialBottomBar
        navigationItems={navigationItems}
        activeTab={getActiveTab()}
        onTabChange={handleTabChange}
      />
    </div>
  )
}
