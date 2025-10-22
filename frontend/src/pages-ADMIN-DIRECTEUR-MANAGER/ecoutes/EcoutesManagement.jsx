import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AudioWaveform from '@/components/AudioWaveform'
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
import { useCommercials } from '@/services'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { useErrorToast } from '@/hooks/use-error-toast'
import { useActiveRooms } from '@/hooks/useActiveRooms'
import { AudioMonitoringService, LiveKitUtils } from '@/services/audio-monitoring'
import {
  Play,
  Square,
  Download,
  Eye,
  MoreHorizontal,
  PhoneCall,
  Clock,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Filter,
} from 'lucide-react'

export default function EcoutesManagement() {
  const { currentRole, currentUserId } = useRole()
  const {
    data: commercials,
    loading,
    error,
    refetch,
  } = useCommercials(parseInt(currentUserId, 10), currentRole)
  const { showSuccess, showError } = useErrorToast()

  // Hook pour surveiller les rooms actives et les commerciaux en ligne
  const {
    activeRooms,
    activeSessions,
    loading: roomsLoading,
    isCommercialOnline,
    getActiveSessionsForCommercial,
    refetch: refetchRooms,
  } = useActiveRooms(3000) // Rafraîchir toutes les 3 secondes

  const [activeTab, setActiveTab] = useState('live')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCommercial, setSelectedCommercial] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [activeListeningRooms, setActiveListeningRooms] = useState(new Map()) // Map<commercialId, { room, sessionId }>

  // État pour les écoutes en live
  const [recordings] = useState([
    {
      id: 1,
      commercialId: 10,
      commercialName: 'Ahmed Ben Ali',
      date: '2024-10-20',
      time: '14:30',
      duration: '00:15:23',
      clientPhone: '+216 20 123 456',
      status: 'completed',
      quality: 'high',
      notes: 'Appel prospection - client intéressé',
    },
    {
      id: 2,
      commercialId: 11,
      commercialName: 'Sarra Mejri',
      date: '2024-10-20',
      time: '10:15',
      duration: '00:08:45',
      clientPhone: '+216 55 987 654',
      status: 'completed',
      quality: 'medium',
      notes: 'Suivi contrat - signature prévue',
    },
  ])

  // Filtrer les commerciaux selon le rôle (directeur ne voit que ses commerciaux)
  const filteredCommercials = useMemo(() => {
    if (!commercials) return []
    return commercials.filter(commercial => {
      const searchMatch =
        commercial.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commercial.prenom?.toLowerCase().includes(searchTerm.toLowerCase())

      return searchMatch
    })
  }, [commercials, searchTerm])

  // Filtrer les enregistrements
  const filteredRecordings = useMemo(() => {
    return recordings.filter(recording => {
      const searchMatch =
        recording.commercialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.clientPhone?.includes(searchTerm)

      const statusMatch = statusFilter === 'all' || recording.status === statusFilter

      return searchMatch && statusMatch
    })
  }, [recordings, searchTerm, statusFilter])

  const handleStartListening = async commercial => {
    try {
      // Vérifier si le commercial est en ligne
      if (!isCommercialOnline(commercial.id)) {
        showError('Ce commercial n\'est pas actuellement en ligne')
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
      const room = await LiveKitUtils.connectAsSupervisor(
        connectionDetails,
        audioContainer
      )

      // Stocker la room et session
      setActiveListeningRooms(prev => 
        new Map(prev).set(commercial.id, { 
          room, 
          sessionId: connectionDetails.sessionId || `session-${Date.now()}`,
          startTime: new Date().toLocaleTimeString(),
          connectionDetails,
          audioContainer
        })
      )

      setSelectedCommercial(commercial)
      showSuccess(`Écoute en live démarrée pour ${commercial.prenom} ${commercial.nom}`)
      
      // Rafraîchir les données
      refetchRooms()
    } catch (error) {
      console.error('Erreur démarrage écoute:', error)
      showError('Erreur lors du démarrage de l\'écoute: ' + error.message)
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
      showError('Erreur lors de l\'arrêt de l\'écoute')
    }
  }

  const handleDownloadRecording = recording => {
    showSuccess(`Téléchargement de l'enregistrement ${recording.id} démarré`)
  }

  const getStatusBadge = status => {
    const statusConfig = {
      completed: { label: 'Terminé', variant: 'default', className: 'bg-green-100 text-green-800' },
      active: { label: 'En cours', variant: 'secondary', className: 'bg-blue-100 text-blue-800' },
      failed: { label: 'Échec', variant: 'destructive', className: 'bg-red-100 text-red-800' },
    }

    const config = statusConfig[status] || statusConfig.completed
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getQualityBadge = quality => {
    const qualityConfig = {
      high: { label: 'Haute', className: 'bg-green-100 text-green-800' },
      medium: { label: 'Moyenne', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Faible', className: 'bg-red-100 text-red-800' },
    }

    const config = qualityConfig[quality] || qualityConfig.medium
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (loading) {
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Écoutes</h1>
          <p className="text-muted-foreground text-base">
            Surveillance et enregistrement des appels commerciaux
          </p>
        </div>
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">Erreur lors du chargement des données : {error}</p>
          <Button onClick={() => refetch()} className="mt-2" variant="outline">
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
            <CardTitle className="text-sm font-medium">Commerciaux Disponibles</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredCommercials.filter(c => isCommercialOnline(c.id)).length}
            </div>
            <p className="text-xs text-muted-foreground">En ligne maintenant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enregistrements</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recordings.length}</div>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
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
                <CardTitle>Commerciaux Disponibles</CardTitle>
                <CardDescription>
                  Sélectionnez un commercial pour démarrer l'écoute en live
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Rechercher un commercial..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Commercial</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right p-0.5">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCommercials.map(commercial => {
                        const isOnline = isCommercialOnline(commercial.id)
                        const isCurrentlyListening = activeListeningRooms.has(commercial.id)
                        const listeningData = activeListeningRooms.get(commercial.id)
                        
                        return (
                          <React.Fragment key={`commercial-${commercial.id}`}>
                            <TableRow>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                                  {commercial.prenom} {commercial.nom}
                                </div>
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
                                    onClick={() => handleStopListening(commercial.id)}
                                  >
                                    <Square className="w-4 h-4 mr-2" />
                                    Arrêter
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!isOnline}
                                    onClick={() => handleStartListening(commercial)}
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
                                          {commercial.prenom} {commercial.nom}
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
                                        onClick={() => handleStopListening(commercial.id)}
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
                  Historique des appels enregistrés de vos commerciaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <Input
                    placeholder="Rechercher par commercial ou téléphone..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Statut
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                        Tous
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                        Terminés
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                        En cours
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
                        Échecs
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Commercial</TableHead>
                        <TableHead>Date & Heure</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Qualité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecordings.map(recording => (
                        <TableRow key={recording.id}>
                          <TableCell className="font-medium">{recording.commercialName}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{recording.date}</span>
                              <span className="text-sm text-muted-foreground">
                                {recording.time}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{recording.duration}</TableCell>
                          <TableCell>{recording.clientPhone}</TableCell>
                          <TableCell>{getQualityBadge(recording.quality)}</TableCell>
                          <TableCell>{getStatusBadge(recording.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Play className="mr-2 h-4 w-4" />
                                  Écouter
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownloadRecording(recording)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Télécharger
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Détails
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
