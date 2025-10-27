import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AudioWaveform from '@/components/AudioWaveform'
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
import { useRole } from '@/contexts/userole'
import { useCommercials, useManagers } from '@/services'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { useActiveRooms } from '@/hooks/audio/useActiveRooms'
import { AudioMonitoringService, LiveKitUtils } from '@/services/audio-monitoring'
import { RecordingService } from '@/services/recordings'
import {
  Play,
  Square,
  Download,
  PhoneCall,
  Clock,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react'

export default function EcoutesManagement() {
  const { currentRole, currentUserId } = useRole()
  const {
    data: commercials,
    loading: commercialsLoading,
    error: commercialsError,
    refetch: refetchCommercials,
  } = useCommercials(parseInt(currentUserId, 10), currentRole)

  const {
    data: managers,
    loading: managersLoading,
    error: managersError,
    refetch: refetchManagers,
  } = useManagers(parseInt(currentUserId, 10), currentRole)
  const { showSuccess, showError } = useErrorToast()

  // Hook pour surveiller les rooms actives et les commerciaux en ligne
  const { isCommercialOnline, refetch: refetchRooms } = useActiveRooms(3000) // Rafraîchir toutes les 3 secondes

  const [activeTab, setActiveTab] = useState('live')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCommercial, setSelectedCommercial] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [activeListeningRooms, setActiveListeningRooms] = useState(new Map()) // Map<commercialId, { room, sessionId }>

  // États pour les enregistrements
  const [selectedCommercialForRecordings, setSelectedCommercialForRecordings] = useState(null)
  const [recordings, setRecordings] = useState([])
  const [loadingRecordings, setLoadingRecordings] = useState(false)
  const [playingRecording, setPlayingRecording] = useState(null)

  // Charger les enregistrements pour un commercial sélectionné
  const loadRecordingsForCommercial = async commercial => {
    if (!commercial) {
      setRecordings([])
      return
    }

    setLoadingRecordings(true)
    try {
      const recordingsData = await RecordingService.getRecordingsForCommercial(commercial.id)
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

  // Combiner commerciaux et managers avec type
  const allUsers = useMemo(() => {
    const commercialUsers = (commercials || []).map(user => ({ ...user, userType: 'commercial' }))
    const managerUsers = (managers || []).map(user => ({ ...user, userType: 'manager' }))
    return [...commercialUsers, ...managerUsers]
  }, [commercials, managers])

  // Filtrer les utilisateurs selon le rôle et la recherche
  const filteredUsers = useMemo(() => {
    if (!allUsers) return []
    return allUsers.filter(user => {
      const searchMatch =
        user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom?.toLowerCase().includes(searchTerm.toLowerCase())

      return searchMatch
    })
  }, [allUsers, searchTerm])

  // Garder l'ancienne variable pour compatibilité
  const filteredCommercials = filteredUsers

  const handleStartListening = async commercial => {
    try {
      // Vérifier si le commercial est en ligne
      if (!isCommercialOnline(commercial.id)) {
        showError("Ce commercial n'est pas actuellement en ligne")
        return
      }

      // Arrêter toutes les écoutes en cours avant d'en démarrer une nouvelle
      for (const [commercialId] of activeListeningRooms) {
        await handleStopListening(commercialId)
      }

      // Démarrer la session de monitoring
      const connectionDetails = await AudioMonitoringService.startMonitoring(
        commercial.id,
        parseInt(currentUserId)
      )

      // Créer un conteneur audio pour ce commercial
      const audioContainer = document.createElement('div')
      audioContainer.id = `audio-container-${commercial.id}`
      document.body.appendChild(audioContainer)

      // Se connecter à LiveKit comme superviseur
      const room = await LiveKitUtils.connectAsSupervisor(connectionDetails, audioContainer)

      // Stocker la room et session
      setActiveListeningRooms(prev =>
        new Map(prev).set(commercial.id, {
          room,
          sessionId: connectionDetails.sessionId || `session-${Date.now()}`,
          startTime: new Date().toLocaleTimeString(),
          connectionDetails,
          audioContainer,
        })
      )

      setSelectedCommercial(commercial)
      showSuccess(`Écoute en live démarrée pour ${commercial.prenom} ${commercial.nom}`)

      // Rafraîchir les données
      refetchRooms()
    } catch (error) {
      console.error('Erreur démarrage écoute:', error)
      showError("Erreur lors du démarrage de l'écoute: " + error.message)
    }
  }

  const handleStopListening = async commercialId => {
    try {
      const listeningData = activeListeningRooms.get(commercialId)
      if (!listeningData) return

      // Déconnecter de LiveKit
      if (listeningData.room) {
        await LiveKitUtils.disconnect(listeningData.room)
      }

      // Nettoyer le conteneur audio
      if (listeningData.audioContainer) {
        listeningData.audioContainer.remove()
      }

      // Arrêter la session de monitoring si on a un sessionId
      if (listeningData.sessionId) {
        try {
          await AudioMonitoringService.stopMonitoring(listeningData.sessionId)
          console.log('✅ Session de monitoring arrêtée')
        } catch (err) {
          // Gestion d'erreur silencieuse - session déjà fermée est normal
          console.log('ℹ️ Session déjà fermée:', err.message)
        }
      }

      // Retirer de la map
      setActiveListeningRooms(prev => {
        const newMap = new Map(prev)
        newMap.delete(commercialId)
        return newMap
      })

      if (selectedCommercial?.id === commercialId) {
        setSelectedCommercial(null)
      }

      showSuccess('Écoute arrêtée')
      refetchRooms()
    } catch (error) {
      console.error('Erreur arrêt écoute:', error)
      showError("Erreur lors de l'arrêt de l'écoute")
    }
  }

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
      console.log('🔄 Génération URL streaming pour:', recording.filename)

      // Utiliser l'URL de streaming optimisée
      const streamingUrl = await RecordingService.getStreamingUrl(recording.key)

      if (!streamingUrl) {
        showError("Impossible de générer l'URL de streaming")
        return
      }

      console.log('✅ URL streaming générée:', streamingUrl)

      // Créer un nouvel objet avec l'URL de streaming
      const recordingWithStreamingUrl = {
        ...recording,
        url: streamingUrl,
      }

      setPlayingRecording(recordingWithStreamingUrl)
      console.log('🎵 État playingRecording mis à jour:', recordingWithStreamingUrl)
    } catch (error) {
      console.error('❌ Erreur génération URL streaming:', error)
      showError('Erreur lors de la préparation de la lecture')
    }
  }

  if (commercialsLoading || managersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Écoutes</h1>
          <p className="text-muted-foreground text-base">
            Surveillance et enregistrement des appels commerciaux
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  if (commercialsError || managersError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Écoutes</h1>
          <p className="text-muted-foreground text-base">
            Surveillance et enregistrement des appels commerciaux
          </p>
        </div>
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">
            Erreur lors du chargement des données : {commercialsError || managersError}
          </p>
          <Button
            onClick={() => {
              refetchCommercials()
              refetchManagers()
            }}
            className="mt-2"
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Écoutes</h1>
        <p className="text-muted-foreground text-base">
          Surveillance et enregistrement des appels commerciaux
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Écoutes Actives</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeListeningRooms.size}</div>
            <p className="text-xs text-muted-foreground">En cours maintenant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Disponibles</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredUsers.filter(u => isCommercialOnline(u.id)).length}
            </div>
            <p className="text-xs text-muted-foreground">Commerciaux & Managers en ligne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enregistrements</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recordings.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedCommercialForRecordings
                ? `Pour ${selectedCommercialForRecordings.prenom}`
                : 'Sélectionnez un commercial'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée Totale</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h 14min</div>
            <p className="text-xs text-muted-foreground">Temps d'écoute</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Navigation par boutons */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === 'live' ? 'default' : 'outline'}
            onClick={() => setActiveTab('live')}
          >
            Écoutes en Live
          </Button>
          <Button
            variant={activeTab === 'recordings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('recordings')}
          >
            Enregistrements
          </Button>
        </div>

        {/* Contenu Live */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs Disponibles</CardTitle>
                <CardDescription>
                  Sélectionnez un commercial ou manager pour démarrer l'écoute en live
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right p-0.5">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCommercials.map(user => {
                        const isOnline = isCommercialOnline(user.id)
                        const isCurrentlyListening = activeListeningRooms.has(user.id)
                        const listeningData = activeListeningRooms.get(user.id)

                        return (
                          <React.Fragment key={`user-${user.userType}-${user.id}`}>
                            <TableRow>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      isOnline ? 'bg-green-500' : 'bg-gray-400'
                                    }`}
                                  />
                                  {user.prenom} {user.nom}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={user.userType === 'manager' ? 'secondary' : 'outline'}
                                >
                                  {user.userType === 'manager' ? 'Manager' : 'Commercial'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {isCurrentlyListening ? (
                                  <div className="flex items-center space-x-2">
                                    <Badge className="bg-red-100 text-red-800 animate-pulse">
                                      <Mic className="w-3 h-3 mr-1" />
                                      En écoute
                                    </Badge>
                                  </div>
                                ) : isOnline ? (
                                  <Badge className="bg-green-100 text-green-800">En ligne</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                    <MicOff className="w-3 h-3 mr-1" />
                                    Hors ligne
                                  </Badge>
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                {isCurrentlyListening ? (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleStopListening(user.id)}
                                  >
                                    <Square className="w-4 h-4 mr-2" />
                                    Arrêter
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!isOnline}
                                    onClick={() => handleStartListening(user)}
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Écouter
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            {isCurrentlyListening && listeningData && (
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={3}>
                                  <div className="flex items-center justify-between p-4 border rounded-md">
                                    <div className="flex items-center gap-4 flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                        <span className="font-medium">
                                          {user.prenom} {user.nom}
                                        </span>
                                      </div>
                                      <Badge variant="outline">
                                        {listeningData.connectionDetails?.roomName}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground">
                                        Depuis {listeningData.startTime}
                                      </span>
                                    </div>
                                    <div className="flex-1 w-full mx-16">
                                      <AudioWaveform
                                        isActive={true}
                                        intensity="voice"
                                        className="h-10"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsMuted(!isMuted)}
                                      >
                                        {isMuted ? (
                                          <VolumeX className="w-4 h-4" />
                                        ) : (
                                          <Volume2 className="w-4 h-4" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleStopListening(user.id)}
                                      >
                                        <Square className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contenu Enregistrements */}
        {activeTab === 'recordings' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enregistrements des Appels</CardTitle>
                <CardDescription>
                  Sélectionnez un commercial pour voir ses enregistrements
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
                          : 'Sélectionner un commercial'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCommercialForRecordings(null)
                          setRecordings([])
                        }}
                      >
                        Aucun commercial
                      </DropdownMenuItem>
                      {filteredUsers.map(user => (
                        <DropdownMenuItem
                          key={user.id}
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
                    <p>Sélectionnez un commercial pour voir ses enregistrements</p>
                  </div>
                ) : recordings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun enregistrement trouvé pour ce commercial</p>
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
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recordings
                            .filter(
                              recording =>
                                !searchTerm ||
                                recording.filename.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(recording => (
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
                                        {playingRecording?.id === recording.id
                                          ? 'Masquer'
                                          : 'Écouter'}
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
                                  <TableRow className="bg-muted/30">
                                    <TableCell colSpan={4}>
                                      <div className="p-4">
                                        <AudioPlayer
                                          src={playingRecording.url}
                                          title={`Enregistrement - ${playingRecording.filename}`}
                                          onDownload={() =>
                                            handleDownloadRecording(playingRecording)
                                          }
                                          className="border-0 shadow-none bg-transparent"
                                        />
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
