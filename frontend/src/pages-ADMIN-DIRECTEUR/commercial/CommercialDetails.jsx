import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useCommercialFull, useManagers, useCurrentZoneAssignment } from '@/services'
import { useMemo } from 'react'
import { calculateRank } from '@/share/ranks'
import { Badge } from '@/components/ui/badge'
import DateRangeFilter from '@/components/DateRangeFilter'
import { useDateFilter } from '@/hooks/utils/useDateFilter'
import { getStatusLabel, getStatusColor } from '@/constants/porte-status.constants'
import {
  usePersonalStats,
  useImmeublesTableData,
  useFilteredPortes,
} from '@/hooks/utils/useStatisticsFilter'

export default function CommercialDetails() {
  const { id } = useParams()
  const { data: commercial, loading, error } = useCommercialFull(parseInt(id))
  const { data: managers } = useManagers()
  const { data: currentZone } = useCurrentZoneAssignment(parseInt(id), 'COMMERCIAL')

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

  // Utiliser le hook pour calculer les stats personnelles du commercial
  const { personalStats } = usePersonalStats(commercial, appliedStartDate, appliedEndDate)

  // Calculer le rang du commercial basé sur TOUTES ses stats (non filtrées) - comme pour le manager
  const memoizedCommercialRank = useMemo(() => {
    if (!commercial?.statistics) return null

    const totalContratsSignes = commercial.statistics.reduce(
      (sum, stat) => sum + stat.contratsSignes,
      0
    )
    const totalRendezVousPris = commercial.statistics.reduce(
      (sum, stat) => sum + stat.rendezVousPris,
      0
    )
    const totalImmeublesVisites = commercial.statistics.reduce(
      (sum, stat) => sum + stat.immeublesVisites,
      0
    )

    return calculateRank(totalContratsSignes, totalRendezVousPris, totalImmeublesVisites)
  }, [commercial?.statistics])
  // Préparer les données pour l'affichage
  const commercialData = useMemo(() => {
    if (!commercial) return null

    // Trouver le manager
    const manager = managers?.find(m => m.id === commercial.managerId)
    const managerName = manager ? `${manager.prenom} ${manager.nom}` : 'Aucun manager assigné'

    return {
      ...commercial,
      name: `${commercial.prenom} ${commercial.nom}`,
      managerName,
      // Stats depuis personalStats (filtrées)
      totalContratsSignes: personalStats.totalContratsSignes,
      totalImmeublesVisites: personalStats.totalImmeublesVisites,
      totalRendezVousPris: personalStats.totalRendezVousPris,
      totalRefus: personalStats.totalRefus,
      totalAbsents: personalStats.totalAbsents,
      totalArgumentes: personalStats.totalArgumentes,
      totalPortesProspectes: personalStats.totalPortesProspectes,
      totalImmeublesProspectes: personalStats.totalImmeublesProspectes,
      zonesCount: currentZone ? 1 : 0,
      immeublesCount: commercial.immeubles?.length || 0,
      // Utiliser le rang permanent (basé sur toutes les stats)
      rank: memoizedCommercialRank?.rank,
      points: memoizedCommercialRank?.points,
    }
  }, [commercial, managers, personalStats, memoizedCommercialRank, currentZone])

  // Préparer les zones avec dates d'assignation et nombre d'immeubles
  const assignedZones = useMemo(() => {
    if (!currentZone) return []

    // Filtrer les immeubles de la zone pour ne garder que ceux créés par ce commercial
    const immeublesCreatedByCommercial = currentZone.zone?.immeubles?.filter(
      imm => imm.commercialId === commercial?.id
    ) || []

    return [
      {
        ...currentZone.zone,
        immeubles: immeublesCreatedByCommercial, // Remplacer par les immeubles filtrés
        assignmentDate: currentZone.assignedAt,
        immeublesCount: immeublesCreatedByCommercial.length,
      },
    ]
  }, [currentZone, commercial?.id])

  // Utiliser le hook pour préparer les données des immeubles (avec filtrage par date)
  const immeublesTableData = useImmeublesTableData(
    commercial?.immeubles,
    appliedStartDate,
    appliedEndDate
  )

  // Utiliser le hook pour collecter toutes les portes filtrées par date
  const allPortes = useFilteredPortes(commercial?.immeubles, appliedStartDate, appliedEndDate)

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

  // Préparer les données pour le tableau des portes
  const doorsData = useMemo(() => {
    if (!allPortes) return []

    return allPortes.map(porte => {
      // Retrouver l'immeuble associé pour l'adresse et le code postal
      const immeuble = commercial?.immeubles?.find(i => i.id === porte.immeubleId)
      
      return {
        ...porte,
        id: porte.id,
        porteId: porte.id, // ID pour le timeline
        tableId: `door-${porte.id}`, // Clé unique pour le tableau
        number: porte.numero,
        address: immeuble ? `${immeuble.adresse}` : 'Non spécifié',
        etage: `Étage ${porte.etage}`,
        status: porte.statut.toLowerCase(),
        rdvDate: porte.rdvDate
          ? new Date(porte.rdvDate).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : null,
        rdvTime: porte.rdvTime || null,
        lastVisit: porte.updatedAt ? new Date(porte.updatedAt).toLocaleDateString() : null,
      }
    })
  }, [allPortes, commercial?.immeubles])

  if (loading) return <DetailsPageSkeleton />

  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-800">Erreur lors du chargement des données : {error}</p>
      </div>
    )
  }

  if (!commercialData) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-800">Commercial non trouvé</p>
      </div>
    )
  }

  const personalInfo = [
    {
      label: 'Email',
      value: commercialData.email,
      icon: 'mail',
    },
    {
      label: 'Téléphone',
      value: commercialData.numTel,
      icon: 'phone',
    },
    {
      label: 'Age',
      value: `${commercialData.age} ans`,
      icon: 'user',
    },
    {
      label: 'Manager',
      value: commercialData.managerName,
      icon: 'users',
    },
    {
      label: 'Rang',
      value: (
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${commercialData.rank.bgColor} ${commercialData.rank.textColor} ${commercialData.rank.borderColor} border font-semibold`}
        >
          <span className="text-lg">🏆</span>
          {commercialData.rank.name}
          <span className="text-xs opacity-75">({commercialData.points} pts)</span>
        </span>
      ),
      icon: 'award',
    },
    {
      label: 'Date de création de compte',
      value: new Date(commercialData.createdAt).toLocaleDateString('fr-FR'),
      icon: 'calendar',
    },
  ]

  const statsCards = [
    {
      title: 'Points totaux',
      value: commercialData.points,
      description: 'Score personnel',
      icon: 'trendingUp',
      fullWidth: true,
    },
    {
      title: 'Contrats signés',
      value: commercialData.totalContratsSignes,
      description: 'Total des contrats signés',
      icon: 'fileText',
    },
    {
      title: 'Rendez-vous pris',
      value: commercialData.totalRendezVousPris,
      description: 'Total des rendez-vous',
      icon: 'calendar',
    },
    {
      title: 'Immeubles visités',
      value: commercialData.totalImmeublesVisites,
      description: 'Total des immeubles visités',
      icon: 'building',
    },
    {
      title: 'Refus',
      value: commercialData.totalRefus,
      description: 'Total des refus',
      icon: 'x',
    },
    {
      title: 'Absents',
      value: commercialData.totalAbsents,
      description: 'Portes où personne n\'était présent',
      icon: 'userX',
    },
    {
      title: 'Argumentés',
      value: commercialData.totalArgumentes,
      description: 'Refus après argumentation',
      icon: 'messageCircle',
    },
    {
      title: 'Portes prospectées',
      value: commercialData.totalPortesProspectes,
      description: 'Total des portes prospectées',
      icon: 'fileText',
    },
    {
      title: 'Immeubles prospectés',
      value: commercialData.totalImmeublesProspectes,
      description: 'Total des immeubles prospectés',
      icon: 'building',
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
    {
      title: 'Immeubles prospectés',
      description: 'Liste des immeubles prospectés par ce commercial avec leurs statistiques',
      type: 'custom',
      component: 'ImmeublesTable',
      data: {
        immeubles: immeublesTableData,
        columns: immeublesColumns,
        nestedColumns: doorsColumns,
        showFilters: false,
      },
    },
  ]

  return (
    <DetailsPage
      title={commercialData.name}
      subtitle={`Commercial - ID: ${commercialData.id}`}
      status={'Commercial'}
      data={commercialData}
      personalInfo={personalInfo}
      statsCards={statsCards}
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
      assignedZones={assignedZones}
      additionalSections={additionalSections}
      backUrl="/commerciaux"
    />
  )
}
