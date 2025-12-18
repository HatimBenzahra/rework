import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import {
  useManagerPersonal,
  useDirecteurs,
  useCommercials,
  useUpdateCommercial,
  useCurrentZoneAssignment,
} from '@/services'
import { useRole } from '@/contexts/userole'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { useDateFilter, filterStatisticsByDate } from '@/hooks/utils/useDateFilter'
import {
  usePersonalStats,
  useImmeublesTableData,
  useFilteredPortes,
} from '@/hooks/utils/useStatisticsFilter'
import { useMemo, useState } from 'react'
import { RANKS, calculateRank } from '@/share/ranks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DateRangeFilter from '@/components/DateRangeFilter'
import { AdvancedDataTable } from '@/components/tableau'
import { Award, TrendingUp, FileText, Building2, Calendar, X, Users, BookX } from 'lucide-react'
import { getStatusLabel, getStatusColor } from '@/constants/porte-status.constants'

export default function ManagerDetails() {
  const { id } = useParams()
  const { isAdmin } = useRole()
  const { showError, showSuccess } = useErrorToast()
  const [assigningCommercial, setAssigningCommercial] = useState(null)

  // Hook pour gérer les filtres de date
  const {
    startDate,
    endDate,
    appliedStartDate,
    appliedEndDate,
    setStartDate,
    setEndDate,
    handleApplyFilters,
    handleResetFilters,
  } = useDateFilter()

  // API hooks
  const {
    data: manager,
    loading: managerLoading,
    error,
    refetch,
  } = useManagerPersonal(parseInt(id))
  const { data: directeurs } = useDirecteurs()
  // useCommercials récupère TOUS les commerciaux avec leurs statistiques incluses
  // via la requête GET_COMMERCIALS qui inclut le champ 'statistics' pour chaque commercial
  const { data: allCommercials, refetch: refetchCommercials } = useCommercials()
  const { mutate: updateCommercial, loading: updatingCommercial } = useUpdateCommercial()
  const { data: currentManagerZone } = useCurrentZoneAssignment(parseInt(id), 'MANAGER')

  // Utiliser le hook pour calculer les stats personnelles du manager
  const { personalStats } = usePersonalStats(manager, appliedStartDate, appliedEndDate)

  // Filtrer les statistiques des commerciaux par date
  const filteredCommercialsStats = useMemo(() => {
    if (!allCommercials) return {}

    const filtered = {}
    allCommercials.forEach(commercial => {
      if (commercial.statistics) {
        filtered[commercial.id] = filterStatisticsByDate(
          commercial.statistics,
          appliedStartDate,
          appliedEndDate
        )
      }
    })
    return filtered
  }, [allCommercials, appliedStartDate, appliedEndDate])

  // Calculer le rang du manager basé sur TOUTES ses stats (non filtrées)
  const memoizedManagerRank = useMemo(() => {
    if (!manager?.statistics) return null

    const totalContratsSignes = manager.statistics.reduce(
      (sum, stat) => sum + stat.contratsSignes,
      0
    )
    const totalRendezVousPris = manager.statistics.reduce(
      (sum, stat) => sum + stat.rendezVousPris,
      0
    )
    const totalImmeublesVisites = manager.statistics.reduce(
      (sum, stat) => sum + stat.immeublesVisites,
      0
    )

    return calculateRank(totalContratsSignes, totalRendezVousPris, totalImmeublesVisites)
  }, [manager?.statistics])

  // Transformation des données API vers format UI (avec filtrage)
  const managerData = useMemo(() => {
    if (!manager) return null

    const directeur = directeurs?.find(d => d.id === manager.directeurId)
    const assignedCommercials = allCommercials?.filter(c => c.managerId === manager.id) || []

    // Trouver le meilleur commercial de l'équipe (avec stats filtrées)
    let meilleurCommercial = 'Aucun commercial'
    let meilleurBadge = 'Aucun'

    if (assignedCommercials.length > 0) {
      const commercialAvecRangs = assignedCommercials.map(commercial => {
        // Utiliser les stats filtrées du commercial
        const stats = filteredCommercialsStats[commercial.id] || []
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
      // Stats commerciales du manager (depuis personalStats)
      portesProspectees: personalStats.totalPortesProspectes,
      immeublesProspectes: personalStats.totalImmeublesProspectes,
      totalContratsSignes: personalStats.totalContratsSignes,
      totalImmeublesVisites: personalStats.totalImmeublesVisites,
      totalRendezVousPris: personalStats.totalRendezVousPris,
      totalRefus: personalStats.totalRefus,
      totalAbsents: personalStats.totalAbsents,
      totalArgumentes: personalStats.totalArgumentes,
      // Utiliser le rang permanent (basé sur toutes les stats)
      rank: memoizedManagerRank?.rank,
      points: memoizedManagerRank?.points,
      totalPortesProspectes: personalStats.totalPortesProspectes,
      totalImmeublesProspectes: personalStats.totalImmeublesProspectes,
      // Indicateurs de l'équipe
      meilleurCommercial,
      meilleurBadge,
    }
  }, [
    manager,
    directeurs,
    allCommercials,
    personalStats,
    filteredCommercialsStats,
    memoizedManagerRank,
  ])

  // Récupérer la zone actuellement assignée à ce manager depuis ZoneEnCours
  const managerZones = useMemo(() => {
    if (!currentManagerZone) return []

    // Utiliser directement les immeubles du manager (qui ont déjà les coordonnées)
    const managerImmeubles = manager?.immeubles || []

    return [
      {
        ...currentManagerZone.zone,
        immeubles: managerImmeubles, // Utiliser les immeubles du manager
        immeublesCount: managerImmeubles.length,
        assignmentDate: currentManagerZone.assignedAt,
      },
    ]
  }, [currentManagerZone, manager?.immeubles])

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

    const assignedCommercials = allCommercials
      .filter(c => c.managerId === manager.id)
      .map(c => ({
        id: c.id,
        name: `${c.prenom} ${c.nom}`,
        email: c.email || 'Non renseigné',
        numTel: c.numTel || 'Non renseigné',
        age: `${c.age} ans`,
      }))

    const unassignedCommercials = allCommercials
      .filter(c => !c.managerId)
      .map(c => ({
        id: c.id,
        name: `${c.prenom} ${c.nom}`,
        email: c.email || 'Non renseigné',
        numTel: c.numTel || 'Non renseigné',
        age: `${c.age} ans`,
        status: 'Non assigné',
      }))

    const commonColumns = [
      { header: 'Nom', accessor: 'name', sortable: true, className: 'font-medium' },
      { header: 'Email', accessor: 'email', sortable: true },
      { header: 'Téléphone', accessor: 'numTel' },
      { header: 'Age', accessor: 'age' },
    ]

    const assignedColumns = [
      ...commonColumns,
      {
        header: 'Action',
        accessor: 'action',
        sortable: false,
        className: 'text-center',
        cell: row => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUnassignCommercial(row.id)}
            disabled={assigningCommercial === row.id || updatingCommercial}
          >
            {assigningCommercial === row.id ? 'Retrait...' : 'Retirer'}
          </Button>
        ),
      },
    ]

    const unassignedColumns = [
      ...commonColumns,
      { header: 'Statut', accessor: 'status', className: 'hidden md:table-cell' },
      {
        header: 'Action',
        accessor: 'action',
        sortable: false,
        className: 'text-center',
        cell: row => (
          <Button
            variant="default"
            size="sm"
            onClick={() => handleAssignCommercial(row.id)}
            disabled={assigningCommercial === row.id || updatingCommercial}
          >
            {assigningCommercial === row.id ? 'Assignation...' : 'Assigner'}
          </Button>
        ),
      },
    ]

    return (
      <div className="space-y-6">
        <AdvancedDataTable
          showStatusColumn={false}
          title={`Commerciaux assignés (${assignedCommercials.length})`}
          data={assignedCommercials}
          columns={assignedColumns}
          searchKey="name"
          detailsPath="/commerciaux"
        />

        {unassignedCommercials.length > 0 && (
          <AdvancedDataTable
            showStatusColumn={false}
            title={`Commerciaux disponibles (${unassignedCommercials.length})`}
            data={unassignedCommercials}
            columns={unassignedColumns}
            searchKey="name"
            detailsPath="/commerciaux"
          />
        )}
      </div>
    )
  }

  // Calculer les stats par commercial de l'équipe (AVANT les early returns)
  // NOTE: Les stats des commerciaux proviennent de useCommercials (ligne 42-45)
  // La requête GET_COMMERCIALS inclut déjà le champ 'statistics' pour chaque commercial
  // via le GraphQL query (api-queries.ts ligne 312-321) et le backend Prisma include (ligne 58, 80, 103, 126)
  const commercialStats = useMemo(() => {
    if (!allCommercials || !manager) return []

    const assignedCommercials = allCommercials.filter(c => c.managerId === manager.id)

    return assignedCommercials
      .map(commercial => {
        // Utiliser les stats filtrées du commercial
        const stats = filteredCommercialsStats[commercial.id] || []
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
  }, [allCommercials, manager, filteredCommercialsStats])

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

  // Utiliser le hook pour préparer les données des immeubles
  const immeublesTableData = useImmeublesTableData(
    manager?.immeubles,
    appliedStartDate,
    appliedEndDate
  )

  // Utiliser le hook pour collecter toutes les portes filtrées
  const allPortes = useFilteredPortes(manager?.immeubles, appliedStartDate, appliedEndDate)

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
      label: 'Date de création de compte:',
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
      userX: Users,
      messageCircle: FileText,
    }
    const Icon = icons[iconName] || FileText
    return <Icon className="h-4 w-4 text-primary" />
  }

  // Stats personnelles du manager (basées sur ses propres stats)
  const personalStatsCards = [
    {
      title: 'Points totaux',
      value: managerData.points,
      description: 'Score personnel',
      icon: 'trendingUp',
      fullWidth: true,
    },
    {
      title: 'Contrats signés',
      value: managerData.totalContratsSignes,
      description: 'Total des contrats signés',
      icon: 'fileText',
    },
    {
      title: 'Rendez-vous pris',
      value: managerData.totalRendezVousPris,
      description: 'Total des rendez-vous',
      icon: 'calendar',
    },
    {
      title: 'Immeubles visités',
      value: managerData.totalImmeublesVisites,
      description: 'Total des immeubles visités',
      icon: 'building',
    },
    {
      title: 'Refus',
      value: managerData.totalRefus,
      description: 'Total des refus',
      icon: 'x',
    },
    {
      title: 'Absents',
      value: managerData.totalAbsents,
      description: 'Portes où personne n\'était présent',
      icon: 'userX',
    },
    {
      title: 'Argumentés',
      value: managerData.totalArgumentes,
      description: 'Refus après argumentation',
      icon: 'messageCircle',
    },
    {
      title: 'Portes prospectées',
      value: managerData.totalPortesProspectes,
      description: 'Total des portes prospectées',
      icon: 'fileText',
    },
    {
      title: 'Immeubles prospectés',
      value: managerData.totalImmeublesProspectes,
      description: 'Total des immeubles prospectés',
      icon: 'building',
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

  // Définir les colonnes du tableau de classement des commerciaux
  const commercialStatsColumns = [
    {
      header: 'Commercial',
      accessor: 'nom',
      sortable: true,
      className: 'font-medium',
    },
    {
      header: 'Contrats signés',
      accessor: 'contratsSignes',
      sortable: true,
      className: 'text-center',
      cell: row => <Badge className="bg-green-100 text-green-800">{row.contratsSignes || 0}</Badge>,
    },
    {
      header: 'RDV pris',
      accessor: 'rendezVous',
      sortable: true,
      className: 'text-center',
      cell: row => <Badge className="bg-blue-100 text-blue-800">{row.rendezVous || 0}</Badge>,
    },
    {
      header: 'Immeubles visités',
      accessor: 'immeubles',
      sortable: true,
      className: 'text-center',
      cell: row => <Badge className="bg-purple-100 text-purple-800">{row.immeubles || 0}</Badge>,
    },
    {
      header: 'Refus',
      accessor: 'refus',
      sortable: true,
      className: 'text-center',
      cell: row => <Badge className="bg-red-100 text-red-800">{row.refus || 0}</Badge>,
    },
    {
      header: 'Rang',
      accessor: 'rank',
      sortable: false,
      className: 'text-center',
      cell: row => (
        <Badge
          className={`${row.rank.bgColor} ${row.rank.textColor} ${row.rank.borderColor} border`}
        >
          {row.rank.name}
        </Badge>
      ),
    },
    {
      header: 'Points',
      accessor: 'points',
      sortable: true,
      className: 'text-center font-semibold',
      cell: row => `${row.points} pts`,
    },
  ]

  // Définir les colonnes du tableau des portes
  const doorsColumns = [
    {
      header: 'Porte',
      accessor: 'number',
      sortable: true,
      className: 'font-medium',
    },
    {
      header: 'Adresse',
      accessor: 'address',
      sortable: true,
      className: 'text-sm',
    },
    {
      header: 'Étage',
      accessor: 'etage',
      sortable: true,
      className: 'text-sm',
    },
    {
      header: 'Statut',
      accessor: 'status',
      sortable: true,
      cell: row => {
        const normalizedStatus = row.status?.toUpperCase()
        const label = getStatusLabel(normalizedStatus)
        const colorClasses = getStatusColor(normalizedStatus)
        return <Badge className={colorClasses}>{label}</Badge>
      },
    },
    {
      header: 'RDV',
      accessor: 'rdvDate',
      sortable: true,
      cell: row => {
        if (row.rdvDate && row.rdvTime) {
          return (
            <div className="text-sm">
              <div>{row.rdvDate}</div>
              <div className="text-muted-foreground">{row.rdvTime}</div>
            </div>
          )
        }
        return <span className="text-muted-foreground">-</span>
      },
    },
    {
      header: 'Dernière visite',
      accessor: 'lastVisit',
      sortable: true,
      cell: row => row.visitedAt || <span className="text-muted-foreground">-</span>,
    },
  ]

  // Définir les colonnes du tableau des immeubles
  const immeublesColumns = [
    {
      header: 'Adresse',
      accessor: 'address',
      sortable: true,
      className: 'font-medium',
    },
    {
      header: 'Étages',
      accessor: 'floors',
      className: 'hidden md:table-cell text-center',
      cell: row => `${row.floors} étages`,
    },
    {
      header: 'Total Portes',
      accessor: 'total_doors',
      className: 'hidden lg:table-cell text-center',
    },
    {
      header: 'Couverture',
      accessor: 'couverture',
      sortable: true,
      className: 'hidden lg:table-cell text-center',
      cell: row => {
        const couverture = row.couverture || 0
        const colorClass =
          couverture >= 80
            ? 'bg-green-100 text-green-800'
            : couverture >= 50
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
        return <Badge className={colorClass}>{couverture}%</Badge>
      },
    },
    {
      header: 'Contrats signés',
      accessor: 'contrats_signes',
      sortable: true,
      className: 'text-center',
      cell: row => (
        <Badge className="bg-green-100 text-green-800">{row.contrats_signes || 0}</Badge>
      ),
    },
    {
      header: 'RDV pris',
      accessor: 'rdv_pris',
      sortable: true,
      className: 'hidden xl:table-cell text-center',
      cell: row => <Badge className="bg-blue-100 text-blue-800">{row.rdv_pris || 0}</Badge>,
    },
    {
      header: 'Refus',
      accessor: 'refus',
      sortable: true,
      className: 'hidden xl:table-cell text-center',
      cell: row => <Badge className="bg-red-100 text-red-800">{row.refus || 0}</Badge>,
    },
    {
      header: 'Absents',
      accessor: 'absent',
      sortable: true,
      className: 'hidden xl:table-cell text-center',
      cell: row => <Badge className="bg-blue-100 text-blue-800">{row.absent || 0}</Badge>,
    },
    {
      header: 'Argumentés',
      accessor: 'argumente',
      sortable: true,
      className: 'hidden xl:table-cell text-center',
      cell: row => <Badge className="bg-orange-100 text-orange-800">{row.argumente || 0}</Badge>,
    },
  ]

  const additionalSections = [
    // Section des graphiques de prospection
    {
      title: 'Statistiques de prospection',
      description: "Analyse de l'activité de prospection",
      type: 'custom',
      component: 'ChartsSection',
      data: {
        charts: [
          {
            type: 'PortesStatusChart',
            props: {
              portes: allPortes,
              title: 'Répartition des statuts',
              description: 'État actuel de toutes les portes',
              showNonVisited: true,
            },
          },
          {
            type: 'PortesProspectionChart',
            props: {
              portes: allPortes,
              title: 'Portes prospectées par jour',
              description: 'Activité quotidienne des 7 derniers jours',
              daysToShow: 7,
            },
          },
          {
            type: 'PortesWeeklyChart',
            props: {
              portes: allPortes,
              title: 'Évolution hebdomadaire',
              description: 'Tendance sur les 4 dernières semaines',
              weeksToShow: 4,
            },
          },
        ],
      },
    },
    // Section des immeubles prospectés
    {
      title: 'Immeubles prospectés',
      description: 'Liste des immeubles prospectés par ce manager avec leurs statistiques',
      type: 'custom',
      component: 'ImmeublesTable',
      data: {
        immeubles: immeublesTableData,
        columns: immeublesColumns,
        nestedColumns: doorsColumns,
        showFilters: false,
      },
    },
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
              <AdvancedDataTable
                statusFilter={false}
                showStatusColumn={false}
                data={commercialStats}
                columns={commercialStatsColumns}
                detailsPath="/commerciaux"
                searchKey="nom"
                itemsPerPage={10}
              />
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
      status={'MANAGER'}
      data={managerData}
      personalInfo={personalInfo}
      statsCards={personalStatsCards}
      assignedZones={managerZones}
      statsFilter={
        <DateRangeFilter
          className="h-fit"
          startDate={startDate}
          endDate={endDate}
          appliedStartDate={appliedStartDate}
          appliedEndDate={appliedEndDate}
          onChangeStart={setStartDate}
          onChangeEnd={setEndDate}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          title="Filtres de période"
        />
      }
      additionalSections={additionalSections}
    />
  )
}
