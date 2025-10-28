import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import {
  useDirecteur,
  useManagers,
  useUpdateManager,
  useZones,
  useCommercials,
  useUpdateCommercial,
} from '@/services'
import { useRole } from '@/contexts/userole'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { useMemo, useState } from 'react'
import { calculateRank } from '@/share/ranks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function DirecteurDetails() {
  const { id } = useParams()
  const { isAdmin, currentRole, currentUserId } = useRole()
  const { showError, showSuccess } = useErrorToast()
  const [assigningManager, setAssigningManager] = useState(null)
  const [assigningCommercial, setAssigningCommercial] = useState(null)

  // API hooks
  const { data: directeur, loading: directeurLoading, error, refetch } = useDirecteur(parseInt(id))
  const { data: allManagers, refetch: refetchManagers } = useManagers(
    parseInt(currentUserId, 10),
    currentRole
  )
  const { data: allCommercials, refetch: refetchCommercials } = useCommercials(
    parseInt(currentUserId, 10),
    currentRole
  )
  const { mutate: updateManager, loading: updatingManager } = useUpdateManager()
  const { mutate: updateCommercial, loading: updatingCommercial } = useUpdateCommercial()
  const { data: allZones } = useZones(parseInt(currentUserId, 10), currentRole)

  // Transformation des données API vers format UI
  const directeurData = useMemo(() => {
    if (!directeur) return null

    const assignedManagers = allManagers?.filter(m => m.directeurId === directeur.id) || []

    // Tous les commerciaux sous la supervision de ce directeur (via les managers ou directement)
    const allDirecteurCommercials =
      allCommercials?.filter(
        c => c.directeurId === directeur.id || assignedManagers.some(m => m.id === c.managerId)
      ) || []

    // Calculer les statistiques agrégées du directeur depuis toute sa division
    const totalContratsSignes = allDirecteurCommercials.reduce((sum, commercial) => {
      const commercialStats = commercial.statistics || []
      return sum + commercialStats.reduce((statSum, stat) => statSum + stat.contratsSignes, 0)
    }, 0)

    const totalImmeublesVisites = allDirecteurCommercials.reduce((sum, commercial) => {
      const commercialStats = commercial.statistics || []
      return sum + commercialStats.reduce((statSum, stat) => statSum + stat.immeublesVisites, 0)
    }, 0)

    const totalRendezVousPris = allDirecteurCommercials.reduce((sum, commercial) => {
      const commercialStats = commercial.statistics || []
      return sum + commercialStats.reduce((statSum, stat) => statSum + stat.rendezVousPris, 0)
    }, 0)

    const totalRefus = allDirecteurCommercials.reduce((sum, commercial) => {
      const commercialStats = commercial.statistics || []
      return sum + commercialStats.reduce((statSum, stat) => statSum + stat.refus, 0)
    }, 0)

    // Taux de conversion
    const tauxConversion =
      totalRendezVousPris > 0 ? ((totalContratsSignes / totalRendezVousPris) * 100).toFixed(1) : '0'

    // Trouver le meilleur manager
    let meilleurManager = 'Aucun manager'
    let meilleurManagerBadge = 'Aucun'

    if (assignedManagers.length > 0) {
      const managersAvecStats = assignedManagers.map(manager => {
        const managerCommercials = allCommercials?.filter(c => c.managerId === manager.id) || []
        const managerContratsSignes = managerCommercials.reduce((sum, commercial) => {
          const stats = commercial.statistics || []
          return sum + stats.reduce((statSum, stat) => statSum + stat.contratsSignes, 0)
        }, 0)
        const managerRendezVous = managerCommercials.reduce((sum, commercial) => {
          const stats = commercial.statistics || []
          return sum + stats.reduce((statSum, stat) => statSum + stat.rendezVousPris, 0)
        }, 0)
        const managerImmeubles = managerCommercials.reduce((sum, commercial) => {
          const stats = commercial.statistics || []
          return sum + stats.reduce((statSum, stat) => statSum + stat.immeublesVisites, 0)
        }, 0)

        const { rank: managerRank, points: managerPoints } = calculateRank(
          managerContratsSignes,
          managerRendezVous,
          managerImmeubles
        )

        return {
          ...manager,
          totalPoints: managerPoints,
          rank: managerRank,
        }
      })

      if (managersAvecStats.length > 0) {
        const meilleur = managersAvecStats.reduce((prev, current) =>
          current.totalPoints > prev.totalPoints ? current : prev
        )

        meilleurManager = `${meilleur.prenom} ${meilleur.nom}`
        meilleurManagerBadge = meilleur.rank.name
      }
    }

    // Trouver le meilleur commercial global
    let meilleurCommercial = 'Aucun commercial'
    let meilleurCommercialBadge = 'Aucun'

    if (allDirecteurCommercials.length > 0) {
      const commercialAvecRangs = allDirecteurCommercials.map(commercial => {
        const stats = commercial.statistics || []
        const contratsSignes = stats.reduce((sum, stat) => sum + stat.contratsSignes, 0)
        const rendezVous = stats.reduce((sum, stat) => sum + stat.rendezVousPris, 0)
        const immeubles = stats.reduce((sum, stat) => sum + stat.immeublesVisites, 0)
        const { rank: commercialRank, points: commercialPoints } = calculateRank(
          contratsSignes,
          rendezVous,
          immeubles
        )

        return {
          ...commercial,
          totalPoints: commercialPoints,
          rank: commercialRank,
        }
      })

      const meilleur = commercialAvecRangs.reduce((prev, current) =>
        current.totalPoints > prev.totalPoints ? current : prev
      )

      meilleurCommercial = `${meilleur.prenom} ${meilleur.nom}`
      meilleurCommercialBadge = meilleur.rank.name
    }

    return {
      ...directeur,
      name: `${directeur.prenom} ${directeur.nom}`,
      email: directeur.email || 'Non renseigné',
      phone: directeur.numTelephone || 'Non renseigné',
      managers_count: assignedManagers.length,
      commerciaux_count: allDirecteurCommercials.length,
      status: 'actif',
      date_nomination: new Date(directeur.createdAt).toLocaleDateString('fr-FR'),
      // Stats commerciales du directeur
      totalContratsSignes,
      totalImmeublesVisites,
      totalRendezVousPris,
      totalRefus,
      tauxConversion: `${tauxConversion}%`,
      // Indicateurs de la division
      meilleurManager,
      meilleurManagerBadge,
      meilleurCommercial,
      meilleurCommercialBadge,
    }
  }, [directeur, allManagers, allCommercials])

  // Récupérer les zones assignées à ce directeur
  const directeurZones = useMemo(() => {
    if (!allZones || !directeur) return []

    // DEBUG: Vérifier les zones
    console.log('🔍 DirecteurDetails - Toutes les zones:', allZones)
    console.log('👤 Directeur ID:', directeur.id)
    const filtered = allZones.filter(zone => zone.directeurId === directeur.id)
    console.log('🗺️ Zones filtrées pour ce directeur:', filtered)

    // Calculer le nombre d'immeubles par zone
    return filtered.map(zone => ({
      ...zone,
      immeublesCount: zone.immeubles?.length || 0,
    }))
  }, [allZones, directeur])

  // Gestion de l'assignation/désassignation
  const handleAssignManager = async managerId => {
    setAssigningManager(managerId)
    try {
      await updateManager({
        id: managerId,
        directeurId: directeur.id,
      })
      await refetchManagers()
      await refetch()
      showSuccess('Manager assigné avec succès')
    } catch (error) {
      showError(error, 'DirecteurDetails.handleAssignManager')
    } finally {
      setAssigningManager(null)
    }
  }

  const handleUnassignManager = async managerId => {
    setAssigningManager(managerId)
    try {
      await updateManager({
        id: managerId,
        directeurId: null,
      })
      await refetchManagers()
      await refetch()
      showSuccess('Manager désassigné avec succès')
    } catch (error) {
      showError(error, 'DirecteurDetails.handleUnassignManager')
    } finally {
      setAssigningManager(null)
    }
  }

  // Gestion de l'assignation/désassignation des commerciaux
  const handleAssignCommercial = async (
    commercialId,
    directAssignMode = false,
    targetManagerId = null
  ) => {
    setAssigningCommercial(commercialId)
    try {
      if (directAssignMode) {
        // Assignation directe au directeur
        await updateCommercial({
          id: commercialId,
          directeurId: directeur.id,
          managerId: null, // Retirer de tout manager
        })
      } else if (targetManagerId) {
        // Assignation à un manager spécifique
        await updateCommercial({
          id: commercialId,
          managerId: targetManagerId,
          directeurId: null, // Le directeur sera automatiquement déduit du manager
        })
      }
      await refetchCommercials()
      await refetch()
      showSuccess('Commercial assigné avec succès')
    } catch (error) {
      showError(error, 'DirecteurDetails.handleAssignCommercial')
    } finally {
      setAssigningCommercial(null)
    }
  }

  const handleUnassignCommercial = async commercialId => {
    setAssigningCommercial(commercialId)
    try {
      await updateCommercial({
        id: commercialId,
        managerId: null,
        directeurId: null,
      })
      await refetchCommercials()
      await refetch()
      showSuccess('Commercial désassigné avec succès')
    } catch (error) {
      showError(error, 'DirecteurDetails.handleUnassignCommercial')
    } finally {
      setAssigningCommercial(null)
    }
  }

  // Tableau des managers pour les admins
  const renderManagersTable = () => {
    if (!isAdmin || !allManagers) return null

    const assignedManagers = allManagers.filter(m => m.directeurId === directeur.id)
    const unassignedManagers = allManagers.filter(m => !m.directeurId)

    return (
      <div className="space-y-6">
        {/* Managers assignés */}
        <div>
          <h4 className="text-lg font-semibold mb-3">
            Managers assignés ({assignedManagers.length})
          </h4>
          {assignedManagers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedManagers.map(manager => (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">
                      {manager.prenom} {manager.nom}
                    </TableCell>
                    <TableCell>{manager.email || 'Non renseigné'}</TableCell>
                    <TableCell>{manager.numTelephone || 'Non renseigné'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignManager(manager.id)}
                        disabled={assigningManager === manager.id || updatingManager}
                      >
                        {assigningManager === manager.id ? 'Retrait...' : 'Retirer'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Aucun manager assigné à ce directeur
            </p>
          )}
        </div>

        {/* Managers disponibles */}
        {unassignedManagers.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-3">
              Managers disponibles ({unassignedManagers.length})
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedManagers.map(manager => (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">
                      {manager.prenom} {manager.nom}
                    </TableCell>
                    <TableCell>{manager.email || 'Non renseigné'}</TableCell>
                    <TableCell>{manager.numTelephone || 'Non renseigné'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Non assigné</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAssignManager(manager.id)}
                        disabled={assigningManager === manager.id || updatingManager}
                      >
                        {assigningManager === manager.id ? 'Assignation...' : 'Assigner'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  // Tableau des commerciaux pour les admins
  const renderCommercialsTable = () => {
    if (!isAdmin || !allCommercials) return null

    // Commerciaux directement assignés au directeur ou via ses managers
    const assignedManagers = allManagers?.filter(m => m.directeurId === directeur.id) || []
    const directeurCommercials = allCommercials.filter(
      c => c.directeurId === directeur.id || assignedManagers.some(m => m.id === c.managerId)
    )

    // Commerciaux non assignés (ni à un directeur ni à un manager)
    const unassignedCommercials = allCommercials.filter(c => !c.directeurId && !c.managerId)

    return (
      <div className="space-y-6">
        {/* Commerciaux assignés */}
        <div>
          <h4 className="text-lg font-semibold mb-3">
            Commerciaux assignés ({directeurCommercials.length})
          </h4>
          {directeurCommercials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directeurCommercials.map(commercial => {
                  const manager = allManagers?.find(m => m.id === commercial.managerId)
                  return (
                    <TableRow key={commercial.id}>
                      <TableCell className="font-medium">
                        {commercial.prenom} {commercial.nom}
                      </TableCell>
                      <TableCell>{commercial.email || 'Non renseigné'}</TableCell>
                      <TableCell>{commercial.numTel || 'Non renseigné'}</TableCell>
                      <TableCell>{commercial.age} ans</TableCell>
                      <TableCell>
                        {manager ? `${manager.prenom} ${manager.nom}` : 'Direct'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnassignCommercial(commercial.id)}
                          disabled={assigningCommercial === commercial.id || updatingCommercial}
                        >
                          {assigningCommercial === commercial.id ? 'Retrait...' : 'Retirer'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Aucun commercial assigné à cette division
            </p>
          )}
        </div>

        {/* Commerciaux disponibles */}
        {unassignedCommercials.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-3">
              Commerciaux disponibles ({unassignedCommercials.length})
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedCommercials.map(commercial => (
                  <TableRow key={commercial.id}>
                    <TableCell className="font-medium">
                      {commercial.prenom} {commercial.nom}
                    </TableCell>
                    <TableCell>{commercial.email || 'Non renseigné'}</TableCell>
                    <TableCell>{commercial.numTel || 'Non renseigné'}</TableCell>
                    <TableCell>{commercial.age} ans</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Non assigné</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAssignCommercial(commercial.id, true)}
                          disabled={assigningCommercial === commercial.id || updatingCommercial}
                        >
                          {assigningCommercial === commercial.id
                            ? 'Assignation...'
                            : 'Assigner direct'}
                        </Button>
                        {assignedManagers.length > 0 && (
                          <Select
                            onValueChange={value => {
                              if (value) {
                                handleAssignCommercial(commercial.id, false, parseInt(value))
                              }
                            }}
                            disabled={assigningCommercial === commercial.id || updatingCommercial}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Assigner à un manager..." />
                            </SelectTrigger>
                            <SelectContent>
                              {assignedManagers.map(manager => (
                                <SelectItem key={manager.id} value={manager.id.toString()}>
                                  {manager.prenom} {manager.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  if (directeurLoading) return <DetailsPageSkeleton />
  if (error) return <div className="text-red-500">Erreur: {error}</div>
  if (!directeurData) return <div>Directeur non trouvé</div>

  const personalInfo = [
    {
      label: 'Email',
      value: directeurData.email,
      icon: 'mail',
    },
    {
      label: 'Téléphone',
      value: directeurData.phone,
      icon: 'phone',
    },

    {
      label: 'Date de nomination',
      value: directeurData.date_nomination,
      icon: 'calendar',
    },
  ]

  const statsCards = [
    {
      title: 'Contrats signés',
      value: directeurData.totalContratsSignes,
      description: 'Total de la division (50 pts/contrat)',
      icon: 'fileText',
    },
    {
      title: 'Immeubles visités',
      value: directeurData.totalImmeublesVisites,
      description: 'Total de la division (5 pts/immeuble)',
      icon: 'building',
    },
    {
      title: 'Rendez-vous pris',
      value: directeurData.totalRendezVousPris,
      description: 'Total de la division (10 pts/RDV)',
      icon: 'calendar',
    },
    {
      title: 'Refus',
      value: directeurData.totalRefus,
      description: 'Total de la division',
      icon: 'x',
    },
    {
      title: 'Taux de conversion',
      value: directeurData.tauxConversion,
      description: 'Contrats / RDV pris',
      icon: 'trendingUp',
    },
    {
      title: 'Meilleur manager',
      value: directeurData.meilleurManager,
      description: `Badge: ${directeurData.meilleurManagerBadge}`,
      icon: 'award',
    },
    {
      title: 'Meilleur commercial',
      value: directeurData.meilleurCommercial,
      description: `Badge: ${directeurData.meilleurCommercialBadge}`,
      icon: 'star',
    },
    {
      title: 'Managers',
      value: directeurData.managers_count,
      description: 'Sous supervision',
      icon: 'users',
    },
    {
      title: 'Commerciaux',
      value: directeurData.commerciaux_count,
      description: 'Dans la division',
      icon: 'users',
    },
    {
      title: 'Zones actuellement assignées',
      value: directeurZones.map(zone => zone.nom).join(', ') || 'Aucune zone assignée',
      icon: 'mapPin',
    },
  ]

  const additionalSections = []

  // Ajouter les sections de gestion pour les admins
  if (isAdmin) {
    additionalSections.push(
      {
        title: 'Gestion des managers',
        description: 'Assignation et gestion des managers de cette division',
        type: 'custom',
        render: () => renderManagersTable(),
      },
      {
        title: 'Gestion des commerciaux',
        description: 'Assignation et gestion des commerciaux de cette division',
        type: 'custom',
        render: () => renderCommercialsTable(),
      }
    )
  }

  return (
    <DetailsPage
      title={directeurData.name}
      subtitle={`Directeur - ID: ${directeurData.id}`}
      status={directeurData.status}
      data={directeurData}
      personalInfo={personalInfo}
      statsCards={statsCards}
      assignedZones={directeurZones}
      additionalSections={additionalSections}
      backUrl="/directeurs"
    />
  )
}
