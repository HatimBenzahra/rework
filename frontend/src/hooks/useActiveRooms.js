import { useState, useEffect, useCallback } from 'react'
import { AudioMonitoringService } from '@/services/audio-monitoring'

/**
 * Hook pour récupérer et surveiller les rooms actives et les commerciaux en ligne
 */
export function useActiveRooms(refreshInterval = 5000) {
  const [activeRooms, setActiveRooms] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fonction pour récupérer les données
  const fetchData = useCallback(async () => {
    try {
      setError(null)
      
      // Récupérer les rooms actives et les sessions en parallèle
      const [rooms, sessions] = await Promise.all([
        AudioMonitoringService.getActiveRooms(),
        AudioMonitoringService.getActiveSessions(),
      ])

      setActiveRooms(rooms || [])
      setActiveSessions(sessions || [])
    } catch (err) {
      console.error('Erreur récupération données audio:', err)
      setError(err.message || 'Erreur de récupération des données')
    } finally {
      setLoading(false)
    }
  }, [])

  // Récupération initiale
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Rafraîchissement automatique
  useEffect(() => {
    if (!refreshInterval) return

    const interval = setInterval(() => {
      fetchData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchData, refreshInterval])

  // Fonction pour déterminer si un commercial est en ligne
  const isCommercialOnline = useCallback((commercialId) => {
    const commercialKey = `commercial-${commercialId}`
    
    // Vérifier si le commercial a une room active
    return activeRooms.some(room => 
      room.participantNames.includes(commercialKey)
    )
  }, [activeRooms])

  // Fonction pour récupérer les commerciaux en ligne
  const getOnlineCommercials = useCallback(() => {
    const onlineCommercials = []
    
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
  }, [activeRooms])

  // Fonction pour récupérer les sessions d'écoute actives pour un commercial
  const getActiveSessionsForCommercial = useCallback((commercialId) => {
    return activeSessions.filter(session => 
      session.commercialId === commercialId && session.status === 'ACTIVE'
    )
  }, [activeSessions])

  return {
    // Données
    activeRooms,
    activeSessions,
    
    // État
    loading,
    error,
    
    // Fonctions utilitaires
    isCommercialOnline,
    getOnlineCommercials,
    getActiveSessionsForCommercial,
    
    // Actions
    refetch: fetchData,
  }
}

export default useActiveRooms