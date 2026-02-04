import { useState, useMemo } from 'react'
import { useEcoutesUsers } from '@/hooks/ecoutes/useEcoutesUsers'
import { usePagination } from '@/hooks/utils/data/usePagination'
import { useErrorToast } from '@/hooks/utils/ui/use-error-toast'
import { useActiveRooms } from '@/hooks/audio/useActiveRooms'
import { AudioMonitoringService, LiveKitUtils } from '@/services/audio'

const USER_STATUS_OPTIONS = [
  { value: 'ACTIF', label: 'Actif' },
  { value: 'CONTRAT_FINIE', label: 'Contrat terminé' },
  { value: 'UTILISATEUR_TEST', label: 'Utilisateur test' },
]

export function useEcouteLiveLogic() {
  const { allUsers, loading, error, refetch } = useEcoutesUsers()
  const { showSuccess, showError } = useErrorToast()

  // Hook pour surveiller les rooms actives et les utilisateurs en ligne
  const { isUserOnline, refetch: refetchRooms } = useActiveRooms(3000)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCommercial, setSelectedCommercial] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [activeListeningRooms, setActiveListeningRooms] = useState(new Map())
  const [showOnlyOnline, setShowOnlyOnline] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ACTIF')

  const statusFilterOptions = useMemo(
    () => [{ value: 'ALL', label: 'Tous' }, ...USER_STATUS_OPTIONS],
    []
  )

  // Filtrer les utilisateurs selon la recherche et le statut en ligne
  const filteredUsers = useMemo(() => {
    if (!allUsers) return []
    return allUsers.filter(user => {
      const searchMatch =
        user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom?.toLowerCase().includes(searchTerm.toLowerCase())

      const onlineMatch = showOnlyOnline ? isUserOnline(user.id, user.userType) : true
      const statusMatch = statusFilter === 'ALL' ? true : user?.status === statusFilter

      return searchMatch && onlineMatch && statusMatch
    })
  }, [allUsers, searchTerm, showOnlyOnline, isUserOnline, statusFilter])

  // Utiliser le hook de pagination
  const {
    currentItems: currentUsers,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
  } = usePagination(filteredUsers, 10)

  const handleStartListening = async user => {
    try {
      if (!isUserOnline(user.id, user.userType)) {
        showError("Cet utilisateur n'est pas actuellement en ligne")
        return
      }

      // Arrêter toutes les écoutes en cours
      for (const [userKey] of activeListeningRooms) {
        await handleStopListening(userKey)
      }

      const connectionDetails = await AudioMonitoringService.startMonitoring(user.id, user.userType)

      // Utiliser une clé unique combinant type et id
      const userKey = `${user.userType}-${user.id}`
      const audioContainer = document.createElement('div')
      audioContainer.id = `audio-container-${userKey}`
      document.body.appendChild(audioContainer)

      const room = await LiveKitUtils.connectAsSupervisor(connectionDetails, audioContainer)

      setActiveListeningRooms(prev =>
        new Map(prev).set(userKey, {
          room,
          sessionId: connectionDetails.sessionId || `session-${Date.now()}`,
          startTime: new Date().toLocaleTimeString(),
          connectionDetails,
          audioContainer,
        })
      )

      setSelectedCommercial(user)
      showSuccess(`Écoute en live démarrée pour ${user.prenom} ${user.nom}`)
      refetchRooms()
    } catch (error) {
      console.error('Erreur démarrage écoute:', error)
      showError("Erreur lors du démarrage de l'écoute: " + error.message)
    }
  }

  const handleStopListening = async userKey => {
    try {
      const listeningData = activeListeningRooms.get(userKey)
      if (!listeningData) return

      if (listeningData.room) {
        await LiveKitUtils.disconnect(listeningData.room)
      }

      if (listeningData.audioContainer) {
        listeningData.audioContainer.remove()
      }

      if (listeningData.sessionId) {
        try {
          await AudioMonitoringService.stopMonitoring(listeningData.sessionId)
        } catch (err) {
          console.log('ℹ️ Session déjà fermée:', err.message)
        }
      }

      setActiveListeningRooms(prev => {
        const newMap = new Map(prev)
        newMap.delete(userKey)
        return newMap
      })

      if (
        selectedCommercial &&
        `${selectedCommercial.userType}-${selectedCommercial.id}` === userKey
      ) {
        setSelectedCommercial(null)
      }

      showSuccess('Écoute arrêtée')
      refetchRooms()
    } catch (error) {
      console.error('Erreur arrêt écoute:', error)
      showError("Erreur lors de l'arrêt de l'écoute")
    }
  }

  return {
    allUsers,
    filteredUsers,
    currentUsers,
    loading,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    showOnlyOnline,
    setShowOnlyOnline,
    activeListeningRooms,
    isMuted,
    setIsMuted,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isUserOnline,
    handleStartListening,
    handleStopListening,
    statusFilter,
    setStatusFilter,
    statusFilterOptions,
  }
}
