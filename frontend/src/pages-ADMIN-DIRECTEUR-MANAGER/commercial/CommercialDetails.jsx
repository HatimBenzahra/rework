import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useCommercialFull, useManagers } from '@/services'
import { useRole } from '@/contexts/userole'
import { useMemo } from 'react'
import { RANKS, calculateRank } from '@/share/ranks'
import { Badge } from '@/components/ui/badge'
import PortesProspectionChart from '@/components/charts/PortesProspectionChart'
import PortesWeeklyChart from '@/components/charts/PortesWeeklyChart'

export default function CommercialDetails() {
  const { id } = useParams()
  const { currentRole, currentUserId } = useRole()
  const { data: commercial, loading, error } = useCommercialFull(parseInt(id))
  const { data: managers } = useManagers(parseInt(currentUserId, 10), currentRole)

  // Préparer les données pour l'affichage
  const commercialData = useMemo(() => {
    if (!commercial) return null

    // Trouver le manager
    const manager = managers?.find(m => m.id === commercial.managerId)
    const managerName = manager ? `${manager.prenom} ${manager.nom}` : 'Aucun manager assigné'

    // Calculer quelques statistiques basiques basées sur les données disponibles
    const totalStatistics = commercial.statistics || []
    const totalContratsSignes = totalStatistics.reduce((sum, stat) => sum + stat.contratsSignes, 0)
    const totalImmeublesVisites = totalStatistics.reduce(
      (sum, stat) => sum + stat.immeublesVisites,
      0
    )
    const totalRendezVousPris = totalStatistics.reduce((sum, stat) => sum + stat.rendezVousPris, 0)
    const totalRefus = totalStatistics.reduce((sum, stat) => sum + stat.refus, 0)

    // Taux de conversion : contrats signés / rendez-vous pris
    const tauxConversion =
      totalRendezVousPris > 0 ? ((totalContratsSignes / totalRendezVousPris) * 100).toFixed(1) : '0'

    // Calculer le rang du commercial
    const { rank, points } = calculateRank(
      totalContratsSignes,
      totalRendezVousPris,
      totalImmeublesVisites
    )

    return {
      ...commercial,
      name: `${commercial.prenom} ${commercial.nom}`,
      managerName,
      totalContratsSignes,
      totalImmeublesVisites,
      totalRendezVousPris,
      totalRefus,
      tauxConversion: `${tauxConversion}%`,
      zonesCount: commercial.zones?.length || 0,
      immeublesCount: commercial.immeubles?.length || 0,
      rank,
      points,
    }
  }, [commercial, managers])

  // Préparer les zones avec dates d'assignation et nombre d'immeubles
  const assignedZones = useMemo(() => {
    if (!commercialData?.zones) return []
    return commercialData.zones.map(zone => {
      const assignment = zone.commercials?.find(c => c.commercialId === commercialData.id)
      // Compter les immeubles de cette zone assignés au commercial
      const immeublesCount =
        zone.immeubles?.filter(immeuble => immeuble.commercialId === commercialData.id).length || 0
      return {
        ...zone,
        assignmentDate: assignment?.createdAt || zone.createdAt,
        immeublesCount,
      }
    })
  }, [commercialData])

  // Préparer les données des immeubles avec statistiques calculées à partir des portes
  const immeublesTableData = useMemo(() => {
    if (!commercial?.immeubles) return []

    // Trier les immeubles du plus récent au plus ancien
    const sortedImmeubles = [...commercial.immeubles].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return sortedImmeubles.map(immeuble => {
      // Utiliser les portes de l'immeuble directement (chargées avec l'immeuble)
      const portesImmeuble = immeuble.portes || []
      const totalDoors = immeuble.nbEtages * immeuble.nbPortesParEtage

      // Calculer les statistiques à partir des portes
      const contratsSignes = portesImmeuble.filter(p => p.statut === 'CONTRAT_SIGNE').length
      const rdvPris = portesImmeuble.filter(p => p.statut === 'RENDEZ_VOUS_PRIS').length
      const refus = portesImmeuble.filter(p => p.statut === 'REFUS').length
      const curieux = portesImmeuble.filter(p => p.statut === 'CURIEUX').length
      const repassages = portesImmeuble.reduce((sum, p) => sum + (p.nbRepassages || 0), 0)
      const portesProspectees = portesImmeuble.filter(p => p.statut !== 'NON_VISITE').length
      const couverture = totalDoors > 0 ? Math.round((portesProspectees / totalDoors) * 100) : 0

      return {
        id: immeuble.id,
        address: immeuble.adresse,
        floors: immeuble.nbEtages,
        doors_per_floor: immeuble.nbPortesParEtage,
        total_doors: totalDoors,
        couverture: couverture,
        contrats_signes: contratsSignes,
        rdv_pris: rdvPris,
        refus: refus,
        curieux: curieux,
        repassages: repassages,
        portes_prospectees: portesProspectees,
        status: 'actif',
        createdAt: immeuble.createdAt,
      }
    })
  }, [commercial])

  // Préparer toutes les portes du commercial pour les graphiques
  const allPortes = useMemo(() => {
    if (!commercial?.immeubles) return []
    
    // Collecter toutes les portes de tous les immeubles du commercial
    return commercial.immeubles.reduce((acc, immeuble) => {
      if (immeuble.portes) {
        return [...acc, ...immeuble.portes]
      }
      return acc
    }, [])
  }, [commercial])

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
      label: 'Date de création',
      value: new Date(commercialData.createdAt).toLocaleDateString('fr-FR'),
      icon: 'calendar',
    },
  ]

  const statsCards = [
    {
      title: 'Contrats signés',
      value: commercialData.totalContratsSignes,
      description: 'Total historique (50 pts/contrat)',
      icon: 'fileText',
    },
    {
      title: 'Immeubles visités',
      value: commercialData.totalImmeublesVisites,
      description: 'Total historique (5 pts/immeuble)',
      icon: 'building',
    },
    {
      title: 'Rendez-vous pris',
      value: commercialData.totalRendezVousPris,
      description: 'Total historique (10 pts/RDV)',
      icon: 'calendar',
    },
    {
      title: 'Refus',
      value: commercialData.totalRefus,
      description: 'Total historique',
      icon: 'x',
    },
    {
      title: 'Taux de conversion',
      value: commercialData.tauxConversion,
      description: 'Contrats / RDV pris',
      icon: 'trendingUp',
    },
    {
      title: 'La zone actuellement assignée',
      value: commercialData.zones.map(zone => zone.nom).join(', '),
      icon: 'mapPin',
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
      header: 'Repassages',
      accessor: 'repassages',
      sortable: true,
      className: 'hidden xl:table-cell text-center',
      cell: row => {
        const count = row.repassages || 0
        return count > 0 ? (
          <Badge className="bg-orange-100 text-orange-800">{count}</Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        )
      },
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
      description: 'Liste des immeubles assignés à ce commercial avec leurs statistiques',
      type: 'custom',
      component: 'ImmeublesTable',
      data: {
        immeubles: immeublesTableData,
        columns: immeublesColumns,
        customFilters: [
          { value: 'all', label: 'Tous les immeubles' },
          { value: 'actif', label: 'Actifs' },
        ],
      },
    },
  ]

  return (
    <DetailsPage
      title={commercialData.name}
      subtitle={`Commercial - ID: ${commercialData.id}`}
      status="actif"
      data={commercialData}
      personalInfo={personalInfo}
      statsCards={statsCards}
      assignedZones={assignedZones}
      additionalSections={additionalSections}
      backUrl="/commerciaux"
    />
  )
}
