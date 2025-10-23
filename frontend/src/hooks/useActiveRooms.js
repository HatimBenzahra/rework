import { useCallback } from 'react'
import { AudioMonitoringService } from '@/services/audio-monitoring'
import { useAsyncState } from './useAsyncState'
import { usePolling } from './useInterval'

/**
 * Hook pour récupérer et surveiller les rooms actives et les commerciaux en ligne
 */
export function useActiveRooms(refreshInterval = 5000) {
  // Utiliser useAsyncState pour gérer l'état loading/error/data
  const asyncState = useAsyncState({
    namespace: 'ActiveRooms',
    retryEnabled: true,
    retryDelays: [1000, 2000, 4000],
    showToasts: true,
  })

  // Fonction pour récupérer les données
  const fetchData = useCallback(async () => {
    // Récupérer les rooms actives et les sessions en parallèle
    const [rooms, sessions] = await Promise.all([
      AudioMonitoringService.getActiveRooms(),
      AudioMonitoringService.getActiveSessions(),
    ])

    return {
      activeRooms: rooms || [],
      activeSessions: sessions || [],
    }
  }, [])

  // Utiliser usePolling pour le rafraîchissement automatique
  usePolling(
    () => asyncState.execute(fetchData),
    refreshInterval,
    {
      enabled: !!refreshInterval,
      immediate: true,
      namespace: 'ActiveRoomsPolling',
    }
  )

  // Fonctions utilitaires qui utilisent les données de asyncState
  const isCommercialOnline = useCallback(
    commercialId => {
      const commercialKey = `commercial-${commercialId}`
      const activeRooms = asyncState.data?.activeRooms || []

      // Vérifier si le commercial a une room active
      return activeRooms.some(room => room.participantNames.includes(commercialKey))
    },
    [asyncState.data]
  )

  const getOnlineCommercials = useCallback(() => {
    const onlineCommercials = []
    const activeRooms = asyncState.data?.activeRooms || []

    activeRooms.forEach(room => {
      room.participantNames.forEach(participantName => {
        if (participantName.startsWith('commercial-')) {
          const commercialId = parseInt(participantName.replace('commercial-', ''))
          if (!isNaN(commercialId)) {
            onlineCommercials.push({
              commercialId,
              roomName: room.roomName,
              participantName,
              connectedAt: room.createdAt,
              numParticipants: room.numParticipants,
            })
          }
        }
      })
    })

    return onlineCommercials
  }, [asyncState.data])

  const getActiveSessionsForCommercial = useCallback(
    commercialId => {
      const activeSessions = asyncState.data?.activeSessions || []
      return activeSessions.filter(
        session => session.commercialId === commercialId && session.status === 'ACTIVE'
      )
    },
    [asyncState.data]
  )

  return {
    // Données (avec fallback pour compatibilité)
    activeRooms: asyncState.data?.activeRooms || [],
    activeSessions: asyncState.data?.activeSessions || [],

    // État
    loading: asyncState.loading,
    error: asyncState.error,

    // Fonctions utilitaires
    isCommercialOnline,
    getOnlineCommercials,
    getActiveSessionsForCommercial,

    // Actions
    refetch: () => asyncState.execute(fetchData),
  }
}

export default useActiveRooms