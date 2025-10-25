import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { useSimpleLoading } from '@/hooks/utils/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import {
  useManager,
  useDirecteurs,
  useCommercials,
  useUpdateCommercial,
  useZones,
} from '@/services'
import { useRole } from '@/contexts/userole'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { useMemo, useState } from 'react'
import { RANKS, calculateRank } from '@/share/ranks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ManagerDetails() {
  const { id } = useParams()
  const loading = useSimpleLoading(1000)
  const { isAdmin, currentRole, currentUserId } = useRole()
  const { showError, showSuccess } = useErrorToast()
  const [assigningCommercial, setAssigningCommercial] = useState(null)

  // API hooks
  const { data: manager, loading: managerLoading, error, refetch } = useManager(parseInt(id))
  const { data: directeurs } = useDirecteurs(parseInt(currentUserId, 10), currentRole)
  const { data: allCommercials, refetch: refetchCommercials } = useCommercials(
    parseInt(currentUserId, 10),
    currentRole
  )
  const { mutate: updateCommercial, loading: updatingCommercial } = useUpdateCommercial()
  const { data: allZones } = useZones(parseInt(currentUserId, 10), currentRole)

  // Transformation des données API vers format UI
  const managerData = useMemo(() => {
    if (!manager) return null

    const directeur = directeurs?.find(d => d.id === manager.directeurId)
    const assignedCommercials = allCommercials?.filter(c => c.managerId === manager.id) || []

    // Calculer les statistiques agrégées du manager depuis son équipe
    const totalContratsSignes = assignedCommercials.reduce((sum, commercial) => {
      const commercialStats = commercial.statistics || []
      return sum + commercialStats.reduce((statSum, stat) => statSum + stat.contratsSignes, 0)
    }, 0)

    const totalImmeublesVisites = assignedCommercials.reduce((sum, commercial) => {
      const commercialStats = commercial.statistics || []
      return sum + commercialStats.reduce((statSum, stat) => statSum + stat.immeublesVisites, 0)
    }, 0)

    const totalRendezVousPris = assignedCommercials.reduce((sum, commercial) => {
      const commercialStats = commercial.statistics || []
      return sum + commercialStats.reduce((statSum, stat) => statSum + stat.rendezVousPris, 0)
    }, 0)

    const totalRefus = assignedCommercials.reduce((sum, commercial) => {
      const commercialStats = commercial.statistics || []
      return sum + commercialStats.reduce((statSum, stat) => statSum + stat.refus, 0)
    }, 0)

    // Taux de conversion
    const tauxConversion =
      totalRendezVousPris > 0 ? ((totalContratsSignes / totalRendezVousPris) * 100).toFixed(1) : '0'

    // Calculer le rang du manager basé sur ses stats agrégées
    const { rank, points } = calculateRank(
      totalContratsSignes,
      totalRendezVousPris,
      totalImmeublesVisites
    )

    // Trouver le meilleur commercial de l'équipe
    let meilleurCommercial = 'Aucun commercial'
    let meilleurBadge = 'Aucun'

    if (assignedCommercials.length > 0) {
      const commercialAvecRangs = assignedCommercials.map(commercial => {
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
      meilleurBadge = meilleur.rank.name
    }

    return {
      ...manager,
      name: `${manager.prenom} ${manager.nom}`,
      directeur: directeur ? `${directeur.prenom} ${directeur.nom}` : 'Aucun directeur',
      email: manager.email || 'Non renseigné',
      phone: manager.numTelephone || 'Non renseigné',
      equipe_taille: assignedCommercials.length,
      status: 'actif',
      date_promotion: new Date(manager.createdAt).toLocaleDateString('fr-FR'),
      // Stats commerciales du manager
      totalContratsSignes,
      totalImmeublesVisites,
      totalRendezVousPris,
      totalRefus,
      tauxConversion: `${tauxConversion}%`,
      rank,
      points,
      // Indicateurs de l'équipe
      meilleurCommercial,
      meilleurBadge,
    }
  }, [manager, directeurs, allCommercials])

  // Récupérer les zones assignées à ce manager
  const managerZones = useMemo(() => {
    if (!allZones || !manager) return []
    const filtered = allZones.filter(zone => zone.managerId === manager.id)

    // Calculer le nombre d'immeubles par zone
    return filtered.map(zone => {
      // Compter directement les immeubles de la zone
      const immeublesCount = zone.immeubles?.length || 0

      return {
        ...zone,
        immeublesCount,
      }
    })
  }, [allZones, manager])

  // Gestion de l'assignation/désassignation
  const handleAssignCommercial = async commercialId => {
    setAssigningCommercial(commercialId)
    try {
      await updateCommercial({
        id: commercialId,
        managerId: manager.id,
      })
      await refetchCommercials()
      await refetch()
      showSuccess('Commercial assigné avec succès')
    } catch (error) {
      showError(error, 'ManagerDetails.handleAssignCommercial')
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
      })
      await refetchCommercials()
      await refetch()
      showSuccess('Commercial désassigné avec succès')
    } catch (error) {
      showError(error, 'ManagerDetails.handleUnassignCommercial')
    } finally {
      setAssigningCommercial(null)
    }
  }

  // Tableau des commerciaux pour les admins
  const renderCommercialsTable = () => {
    if (!isAdmin || !allCommercials) return null

    const assignedCommercials = allCommercials.filter(c => c.managerId === manager.id)
    const unassignedCommercials = allCommercials.filter(c => !c.managerId)

    return (
      <div className="space-y-6">
        {/* Commerciaux assignés */}
        <div>
          <h4 className="text-lg font-semibold mb-3">
            Commerciaux assignés ({assignedCommercials.length})
          </h4>
          {assignedCommercials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedCommercials.map(commercial => (
                  <TableRow key={commercial.id}>
                    <TableCell className="font-medium">
                      {commercial.prenom} {commercial.nom}
                    </TableCell>
                    <TableCell>{commercial.email || 'Non renseigné'}</TableCell>
                    <TableCell>{commercial.numTel || 'Non renseigné'}</TableCell>
                    <TableCell>{commercial.age} ans</TableCell>
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
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Aucun commercial assigné à ce manager
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
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAssignCommercial(commercial.id)}
                        disabled={assigningCommercial === commercial.id || updatingCommercial}
                      >
                        {assigningCommercial === commercial.id ? 'Assignation...' : 'Assigner'}
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

  if (loading || managerLoading) return <DetailsPageSkeleton />
  if (error) return <div className="text-red-500">Erreur: {error}</div>
  if (!managerData) return <div>Manager non trouvé</div>

  const personalInfo = [
    {
      label: 'Email',
      value: managerData.email,
      icon: 'mail',
    },
    {
      label: 'Téléphone',
      value: managerData.phone,
      icon: 'phone',
    },
    {
      label: 'Directeur',
      value: managerData.directeur,
      icon: 'users',
    },
    {
      label: 'Rang',
      value: (
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${managerData.rank.bgColor} ${managerData.rank.textColor} ${managerData.rank.borderColor} border font-semibold`}
        >
          <span className="text-lg">🏆</span>
          {managerData.rank.name}
          <span className="text-xs opacity-75">({managerData.points} pts)</span>
        </span>
      ),
      icon: 'award',
    },
    {
      label: 'Date de création',
      value: managerData.date_promotion,
      icon: 'calendar',
    },
  ]

  const statsCards = [
    {
      title: 'Contrats signés',
      value: managerData.totalContratsSignes,
      description: 'Total de l’équipe (50 pts/contrat)',
      icon: 'fileText',
    },
    {
      title: 'Immeubles visités',
      value: managerData.totalImmeublesVisites,
      description: 'Total de l’équipe (5 pts/immeuble)',
      icon: 'building',
    },
    {
      title: 'Rendez-vous pris',
      value: managerData.totalRendezVousPris,
      description: 'Total de l’équipe (10 pts/RDV)',
      icon: 'calendar',
    },
    {
      title: 'Refus',
      value: managerData.totalRefus,
      description: 'Total de l’équipe',
      icon: 'x',
    },
    {
      title: 'Taux de conversion',
      value: managerData.tauxConversion,
      description: 'Contrats / RDV pris',
      icon: 'trendingUp',
    },
    {
      title: 'Meilleur commercial',
      value: managerData.meilleurCommercial,
      description: `Badge: ${managerData.meilleurBadge}`,
      icon: 'award',
    },
    {
      title: 'Taille de l’équipe',
      value: managerData.equipe_taille,
      description: 'Commerciaux assignés',
      icon: 'users',
    },
    {
      title: 'Zones actuellement assignées',
      value: managerZones.map(zone => zone.nom).join(', ') || 'Aucune zone assignée',
      icon: 'mapPin',
    },
  ]

  const additionalSections = []

  // Ajouter la section d'assignation des commerciaux pour les admins
  if (isAdmin) {
    additionalSections.push({
      title: 'Gestion des commerciaux',
      description: 'Assignation et gestion des commerciaux de cette équipe',
      type: 'custom',
      render: () => renderCommercialsTable(),
    })
  }

  return (
    <DetailsPage
      title={managerData.name}
      subtitle={`Manager - ID: ${managerData.id}`}
      status={managerData.status}
      data={managerData}
      personalInfo={personalInfo}
      statsCards={statsCards}
      assignedZones={managerZones}
      additionalSections={additionalSections}
      backUrl="/managers"
    />
  )
}
