import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import {
  useManagerPersonal,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, TrendingUp, FileText, Building2, Calendar, X, Users } from 'lucide-react'

export default function ManagerDetails() {
  const { id } = useParams()
  const { isAdmin, currentRole, currentUserId } = useRole()
  const { showError, showSuccess } = useErrorToast()
  const [assigningCommercial, setAssigningCommercial] = useState(null)

  // API hooks
  const {
    data: manager,
    loading: managerLoading,
    error,
    refetch,
  } = useManagerPersonal(parseInt(id))
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
    const totalContratsSignes =
      manager.statistics?.reduce((sum, stat) => sum + stat.contratsSignes, 0) || 0

    const totalImmeublesVisites =
      manager.statistics?.reduce((sum, stat) => sum + stat.immeublesVisites, 0) || 0

    const totalRendezVousPris =
      manager.statistics?.reduce((sum, stat) => sum + stat.rendezVousPris, 0) || 0

    const totalRefus = manager.statistics?.reduce((sum, stat) => sum + stat.refus, 0) || 0
    const totalPortesProspectes =
      manager.statistics?.reduce((sum, stat) => sum + stat.nbPortesProspectes, 0) || 0
    // Taux de conversion
    const tauxConversion_portes_prospectes =
      totalPortesProspectes > 0
        ? ((totalContratsSignes / totalPortesProspectes) * 100).toFixed(1)
        : '0'

    const tauxConversion_rdv_pris =
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
      tauxConversion_portes_prospectes: `${tauxConversion_portes_prospectes}%`,
      tauxConversion_rdv_pris: `${tauxConversion_rdv_pris}%`,
      rank,
      points,
      // Indicateurs de l'équipe
      meilleurCommercial,
      meilleurBadge,
    }
  }, [manager, directeurs, allCommercials])

  // Récupérer la zone actuellement assignée à ce manager
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

  // Calculer les stats par commercial de l'équipe (AVANT les early returns)
  const commercialStats = useMemo(() => {
    if (!allCommercials || !manager) return []

    const assignedCommercials = allCommercials.filter(c => c.managerId === manager.id)

    return assignedCommercials
      .map(commercial => {
        const stats = commercial.statistics || []
        const contratsSignes = stats.reduce((sum, stat) => sum + stat.contratsSignes, 0)
        const rendezVous = stats.reduce((sum, stat) => sum + stat.rendezVousPris, 0)
        const immeubles = stats.reduce((sum, stat) => sum + stat.immeublesVisites, 0)
        const refus = stats.reduce((sum, stat) => sum + stat.refus, 0)
        const { rank: commercialRank, points: commercialPoints } = calculateRank(
          contratsSignes,
          rendezVous,
          immeubles
        )

        return {
          id: commercial.id,
          nom: `${commercial.prenom} ${commercial.nom}`,
          contratsSignes,
          rendezVous,
          immeubles,
          refus,
          rank: commercialRank,
          points: commercialPoints,
        }
      })
      .sort((a, b) => b.points - a.points) // Trier par points décroissants
  }, [allCommercials, manager])

  // Calculer les totaux de l'équipe depuis les commerciaux (AVANT les early returns)
  const teamTotals = useMemo(() => {
    const totalContrats = commercialStats.reduce((sum, c) => sum + c.contratsSignes, 0)
    const totalRDV = commercialStats.reduce((sum, c) => sum + c.rendezVous, 0)
    const totalImmeubles = commercialStats.reduce((sum, c) => sum + c.immeubles, 0)
    const totalRefus = commercialStats.reduce((sum, c) => sum + c.refus, 0)

    return {
      totalContrats,
      totalRDV,
      totalImmeubles,
      totalRefus,
    }
  }, [commercialStats])

  // Early returns APRÈS tous les hooks
  if (managerLoading) return <DetailsPageSkeleton />
  if (error) return <div className="text-red-500">Erreur: {error}</div>
  if (!managerData) return <div>Manager non trouvé</div>

  const personalInfo = [
    {
      label: 'Email :',
      value: managerData.email,
      icon: 'mail',
    },
    {
      label: 'Téléphone :',
      value: managerData.phone,
      icon: 'phone',
    },
    {
      label: 'Directeur :',
      value: managerData.directeur,
      icon: 'users',
    },
    {
      label: 'Rang :',
      value: (
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${managerData.rank.bgColor} ${managerData.rank.textColor} ${managerData.rank.borderColor} border-text-primary font-semibold`}
        >
          <span className="text-lg">🏆</span>
          {managerData.rank.name}
          <span className="text-xs opacity-75">({managerData.points} pts)</span>
        </span>
      ),
      icon: 'award',
    },
    {
      label: 'Date de création :',
      value: managerData.date_promotion,
      icon: 'calendar',
    },
  ]

  // Fonction helper pour obtenir les icônes
  const getIcon = iconName => {
    const icons = {
      award: Award,
      trendingUp: TrendingUp,
      fileText: FileText,
      building: Building2,
      calendar: Calendar,
      x: X,
      users: Users,
    }
    const Icon = icons[iconName] || FileText
    return <Icon className="h-4 w-4 text-primary" />
  }

  // Stats personnelles du manager (basées sur ses propres stats)
  const personalStatsCards = [
    {
      title: 'Rang personnel',
      value: managerData.rank.name,
      description: `${managerData.points} points`,
      icon: 'award',
    },
    {
      title: 'Points totaux',
      value: managerData.points,
      description: 'Score personnel',
      icon: 'trendingUp',
    },
    {
      title: 'Taux de conversion par portes prospectées',
      value: managerData.tauxConversion_portes_prospectes,
      description: 'Contrats / Portes prospectées',
      icon: 'trendingUp',
    },
    {
      title: 'Taux de conversion par rendez-vous pris',
      value: managerData.tauxConversion_rdv_pris,
      description: 'Contrats / RDV pris',
      icon: 'trendingUp',
    },
  ]

  // Stats en rapport avec l'équipe
  const teamStatsCards = [
    {
      title: 'Meilleur commercial',
      value: managerData.meilleurCommercial,
      description: `Badge: ${managerData.meilleurBadge}`,
      icon: 'award',
    },
    {
      title: "Taille de l'équipe",
      value: managerData.equipe_taille,
      description: 'Commerciaux assignés',
      icon: 'users',
    },
    {
      title: "Contrats signés par l'équipe",
      value: teamTotals.totalContrats,
      description: `Total de ${commercialStats.length} commercial${commercialStats.length > 1 ? 'aux' : ''}`,
      icon: 'fileText',
    },
    {
      title: "Rendez-vous pris par l'équipe",
      value: teamTotals.totalRDV,
      description: `Total de ${commercialStats.length} commercial${commercialStats.length > 1 ? 'aux' : ''}`,
      icon: 'calendar',
    },
    {
      title: "Immeubles visités par l'équipe",
      value: teamTotals.totalImmeubles,
      description: `Total de ${commercialStats.length} commercial${commercialStats.length > 1 ? 'aux' : ''}`,
      icon: 'building',
    },
    {
      title: "Refus par l'équipe",
      value: teamTotals.totalRefus,
      description: `Total de ${commercialStats.length} commercial${commercialStats.length > 1 ? 'aux' : ''}`,
      icon: 'x',
    },
  ]

  const additionalSections = [
    // Section des stats de l'équipe (cartes + tableau)
    {
      title: "Statistiques de l'équipe",
      description: "Performances globales de l'équipe et classement des commerciaux",
      type: 'custom',
      render: () => (
        <div className="space-y-6">
          {/* Cartes de stats équipe */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teamStatsCards.map((stat, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  {stat.icon && <div className="h-4 w-4">{getIcon(stat.icon)}</div>}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                  {stat.description && (
                    <div className="mt-2 inline-block">
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                      <div className="border-t-2 border-primary mt-2"></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tableau de classement des commerciaux */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Classement des commerciaux</h3>
            {commercialStats.length === 0 ? (
              <Card className="border-2">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    Aucun commercial assigné dans cette équipe
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commercial</TableHead>
                      <TableHead className="text-center">Contrats signés</TableHead>
                      <TableHead className="text-center">RDV pris</TableHead>
                      <TableHead className="text-center">Immeubles visités</TableHead>
                      <TableHead className="text-center">Refus</TableHead>
                      <TableHead className="text-center">Rang</TableHead>
                      <TableHead className="text-center">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commercialStats.map(commercial => (
                      <TableRow key={commercial.id}>
                        <TableCell className="font-medium">{commercial.nom}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-800">
                            {commercial.contratsSignes}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-100 text-blue-800">
                            {commercial.rendezVous}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-purple-100 text-purple-800">
                            {commercial.immeubles}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-red-100 text-red-800">{commercial.refus}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`${commercial.rank.bgColor} ${commercial.rank.textColor} ${commercial.rank.borderColor} border`}
                          >
                            {commercial.rank.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {commercial.points} pts
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ]

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
      statsCards={personalStatsCards}
      assignedZones={managerData.equipe_taille > 0 ? managerZones : null}
      additionalSections={additionalSections}
      backUrl="/managers"
    />
  )
}
