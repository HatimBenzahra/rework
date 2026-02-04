import { useState, useMemo, useEffect, useCallback } from 'react'
import { useEcoutesUsers } from '@/hooks/ecoutes/useEcoutesUsers'
import { usePagination } from '@/hooks/utils/data/usePagination'
import { useErrorToast } from '@/hooks/utils/ui/use-error-toast'
import { RecordingService } from '@/services/audio'

const USER_STATUS_OPTIONS = [
  { value: 'ACTIF', label: 'Actif' },
  { value: 'CONTRAT_FINIE', label: 'Contrat terminé' },
  { value: 'UTILISATEUR_TEST', label: 'Utilisateur test' },
]

export function useEnregistrementLogic() {
  const { allUsers, loading, error, refetch } = useEcoutesUsers()
  const { showSuccess, showError } = useErrorToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCommercialForRecordings, setSelectedCommercialForRecordings] = useState(null)
  const [recordings, setRecordings] = useState([])
  const [loadingRecordings, setLoadingRecordings] = useState(false)
  const [playingRecording, setPlayingRecording] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ACTIF')

  const statusFilterOptions = useMemo(
    () => [{ value: 'ALL', label: 'Tous' }, ...USER_STATUS_OPTIONS],
    []
  )

  const filteredUsers = useMemo(() => {
    if (!allUsers) return []
    return allUsers.filter(user =>
      statusFilter === 'ALL' ? true : user?.status === statusFilter
    )
  }, [allUsers, statusFilter])

  const resetSelection = useCallback(() => {
    setSelectedCommercialForRecordings(null)
    setRecordings([])
  }, [])

  useEffect(() => {
    if (!selectedCommercialForRecordings) return

    const stillVisible = filteredUsers.some(
      user =>
        user.id === selectedCommercialForRecordings.id &&
        user.userType === selectedCommercialForRecordings.userType
    )

    if (!stillVisible) {
      resetSelection()
    }
  }, [filteredUsers, selectedCommercialForRecordings, resetSelection])

  // Charger les enregistrements pour un utilisateur sélectionné
  const loadRecordingsForCommercial = async commercial => {
    if (!commercial) {
      setRecordings([])
      return
    }

    setLoadingRecordings(true)
    try {
      // Utiliser userType pour charger les bons enregistrements (manager ou commercial)
      const userType = commercial.userType
      const recordingsData = await RecordingService.getRecordingsForUser(commercial.id, userType)
      setRecordings(recordingsData)
      showSuccess(
        `${recordingsData.length} enregistrement(s) chargé(s) pour ${commercial.prenom} ${commercial.nom}`
      )
    } catch (error) {
      console.error('Erreur chargement enregistrements:', error)
      showError('Erreur lors du chargement des enregistrements')
      setRecordings([])
    } finally {
      setLoadingRecordings(false)
    }
  }

  // Filtrer les enregistrements selon la recherche
  const filteredRecordings = useMemo(() => {
    if (!recordings) return []
    return recordings.filter(
      recording =>
        !searchTerm || recording.filename.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [recordings, searchTerm])

  // Utiliser le hook de pagination
  const {
    currentItems: currentRecordings,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
  } = usePagination(filteredRecordings, 10)

  const handleDownloadRecording = recording => {
    const url = recording.url || recording.rawUrl
    if (url) {
      RecordingService.downloadRecording(url, recording.filename)
      showSuccess(`Téléchargement de ${recording.filename} démarré`)
    } else {
      showError('URL de téléchargement non disponible')
    }
  }

  const handlePlayRecording = async recording => {
    if (playingRecording?.id === recording.id) {
      setPlayingRecording(null)
      return
    }

    try {
      const streamingUrl = await RecordingService.getStreamingUrl(recording.key)

      if (!streamingUrl) {
        showError("Impossible de générer l'URL de streaming")
        return
      }

      const recordingWithStreamingUrl = {
        ...recording,
        url: streamingUrl,
      }

      setPlayingRecording(recordingWithStreamingUrl)
    } catch (error) {
      console.error('Erreur génération URL streaming:', error)
      showError('Erreur lors de la préparation de la lecture')
    }
  }

  const handleUserSelection = user => {
    setSelectedCommercialForRecordings(user)
    loadRecordingsForCommercial(user)
  }

  return {
    filteredUsers,
    allUsers,
    loading,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    selectedCommercialForRecordings,
    recordings,
    loadingRecordings,
    playingRecording,
    currentRecordings,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    filteredRecordingsCount: filteredRecordings.length,
    handleDownloadRecording,
    handlePlayRecording,
    resetSelection,
    handleUserSelection,
    statusFilter,
    setStatusFilter,
    statusFilterOptions,
  }
}
