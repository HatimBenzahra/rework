import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AudioPlayer from '@/components/AudioPlayer'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Pagination } from '@/components/Pagination'
import { useEcoutesUsers } from '@/hooks/ecoutes/useEcoutesUsers'
import { usePagination } from '@/hooks/utils/usePagination'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { RecordingService } from '@/services/audio'
import { Play, Download, Clock, User } from 'lucide-react'

export default function Enregistrement() {
  const { allUsers, loading, error, refetch } = useEcoutesUsers()
  const { showSuccess, showError } = useErrorToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCommercialForRecordings, setSelectedCommercialForRecordings] = useState(null)
  const [recordings, setRecordings] = useState([])
  const [loadingRecordings, setLoadingRecordings] = useState(false)
  const [playingRecording, setPlayingRecording] = useState(null)

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Enregistrements</h1>
          <p className="text-muted-foreground text-base">Consultation des enregistrements</p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Enregistrements</h1>
          <p className="text-muted-foreground text-base">Consultation des enregistrements</p>
        </div>
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">Erreur lors du chargement des données : {error}</p>
          <Button onClick={refetch} className="mt-2" variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Enregistrements</h1>
        <p className="text-muted-foreground text-base">Consultation des enregistrements</p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enregistrements</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recordings.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedCommercialForRecordings
                ? `Pour ${selectedCommercialForRecordings.prenom} ${selectedCommercialForRecordings.nom}`
                : 'Sélectionnez un utilisateur'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
            <p className="text-xs text-muted-foreground">Commerciaux & Managers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enregistrements</CardTitle>
          <CardDescription>
            Sélectionnez un commercial ou manager pour voir ses enregistrements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  {selectedCommercialForRecordings
                    ? `${selectedCommercialForRecordings.prenom} ${selectedCommercialForRecordings.nom}`
                    : 'Sélectionner un utilisateur'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCommercialForRecordings(null)
                    setRecordings([])
                  }}
                >
                  Aucun utilisateur
                </DropdownMenuItem>
                {allUsers.map(user => (
                  <DropdownMenuItem
                    key={`${user.userType}-${user.id}`}
                    onClick={() => {
                      setSelectedCommercialForRecordings(user)
                      loadRecordingsForCommercial(user)
                    }}
                  >
                    {user.prenom} {user.nom} (
                    {user.userType === 'manager' ? 'Manager' : 'Commercial'})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Input
              placeholder="Rechercher dans les enregistrements..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
              disabled={!selectedCommercialForRecordings}
            />
          </div>

          {loadingRecordings ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
                <span>Chargement des enregistrements...</span>
              </div>
            </div>
          ) : !selectedCommercialForRecordings ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Sélectionnez un utilisateur pour voir ses enregistrements</p>
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun enregistrement trouvé pour cet utilisateur</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fichier</TableHead>
                      <TableHead>Date & Heure</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead className="text-center`">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRecordings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Aucun enregistrement trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentRecordings.map(recording => (
                        <React.Fragment key={recording.id}>
                          <TableRow>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                {recording.filename}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{recording.date}</span>
                                <span className="text-sm text-muted-foreground">
                                  {recording.time}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{recording.duration}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePlayRecording(recording)}
                                  disabled={!recording.url && !recording.rawUrl}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  {playingRecording?.id === recording.id ? 'Masquer' : 'Écouter'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadRecording(recording)}
                                  disabled={!recording.url && !recording.rawUrl}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {playingRecording?.id === recording.id && playingRecording?.url && (
                            <TableRow className="bg-muted/20 hover:bg-muted/20">
                              <TableCell colSpan={4} className="p-2 sm:p-4">
                                <div className="w-full max-w-full">
                                  <AudioPlayer
                                    src={playingRecording.url}
                                    title={`Enregistrement - ${playingRecording.filename}`}
                                    onDownload={() => handleDownloadRecording(playingRecording)}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={filteredRecordings.length}
                itemLabel="enregistrements"
                onPrevious={goToPreviousPage}
                onNext={goToNextPage}
                hasPreviousPage={hasPreviousPage}
                hasNextPage={hasNextPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
