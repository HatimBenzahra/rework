import React from 'react'
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
import { Pagination } from '@/components/Pagination'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { Play, Square, User, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEcouteLiveLogic } from './useEcouteLiveLogic'

export default function EcouteLive() {
  const {
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
  } = useEcouteLiveLogic()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Écoute en Live</h1>
          <p className="text-muted-foreground text-base">
            Surveillance en temps réel des appels commerciaux
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
          <h1 className="text-3xl font-bold tracking-tight">Écoute en Live</h1>
          <p className="text-muted-foreground text-base">
            Surveillance en temps réel des appels commerciaux
          </p>
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
        <h1 className="text-3xl font-bold tracking-tight">Écoute en Live</h1>
        <p className="text-muted-foreground text-base">
          Surveillance en temps réel des appels commerciaux
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {filteredUsers.filter(u => isUserOnline(u.id, u.userType)).length}
            </div>
            <p className="text-xs text-muted-foreground">Commerciaux & Managers en ligne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUsers.length}</div>
            <p className="text-xs text-muted-foreground">Commerciaux & Managers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs Disponibles</CardTitle>
          <CardDescription>
            Sélectionnez un commercial ou manager pour démarrer l'écoute en live
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Statut
              </span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyOnline}
                onChange={e => setShowOnlyOnline(e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm font-medium">Uniquement en ligne</span>
            </label>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Utilisateur</TableHead>
                  <TableHead className="w-[20%]">Type</TableHead>
                  <TableHead className="w-[25%]">Statut</TableHead>
                  <TableHead className="w-[10%] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map(user => {
                    const userKey = `${user.userType}-${user.id}`
                    const isOnline = isUserOnline(user.id, user.userType)
                    const isCurrentlyListening = activeListeningRooms.has(userKey)
                    const listeningData = activeListeningRooms.get(userKey)

                    return (
                      <React.Fragment key={`user-${user.userType}-${user.id}`}>
                        <TableRow>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  isOnline ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                              />
                              {user.prenom} {user.nom}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.userType === 'manager' ? 'secondary' : 'outline'}>
                              {user.userType === 'manager' ? 'Manager' : 'Commercial'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isCurrentlyListening ? (
                              <Badge className="bg-red-100 text-red-800 animate-pulse">
                                <Mic className="w-3 h-3 mr-1" />
                                En écoute
                              </Badge>
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
                            <div className="flex items-center gap-2 justify-end">
                              {isCurrentlyListening ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleStopListening(userKey)}
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
                            </div>
                          </TableCell>
                        </TableRow>
                        {isCurrentlyListening && listeningData && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={4} className="p-4">
                              <div className="flex items-center justify-between border rounded-md p-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0" />
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
                  })
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
            totalItems={filteredUsers.length}
            itemLabel="utilisateurs"
            onPrevious={goToPreviousPage}
            onNext={goToNextPage}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
