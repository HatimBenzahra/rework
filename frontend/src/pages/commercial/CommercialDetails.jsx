import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useCommercialFull, useManagers } from '@/services'
import { useMemo } from 'react'

export default function CommercialDetails() {
  const { id } = useParams()
  // ⚡ Utilise useCommercialFull pour charger toutes les relations (immeubles, zones, statistics)
  const { data: commercial, loading, error } = useCommercialFull(parseInt(id))
  const { data: managers } = useManagers()

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
    }
  }, [commercial, managers])

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
      label: 'Date de création',
      value: new Date(commercialData.createdAt).toLocaleDateString('fr-FR'),
      icon: 'calendar',
    },
    {
      label: 'Zones assignées',
      value: `${commercialData.zonesCount} zone(s)`,
      icon: 'mapPin',
    },
  ]

  const statsCards = [
    {
      title: 'Contrats signés',
      value: commercialData.totalContratsSignes,
      description: 'Total historique',
      icon: 'fileText',
    },
    {
      title: 'Immeubles visités',
      value: commercialData.totalImmeublesVisites,
      description: 'Total historique',
      icon: 'building',
    },
    {
      title: 'Rendez-vous pris',
      value: commercialData.totalRendezVousPris,
      description: 'Total historique',
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
  ]

  const additionalSections = [
    {
      title: 'Statistiques détaillées',
      description: 'Historique des performances par période',
      type: 'list',
      items: commercialData.statistics?.map(stat => ({
        label: new Date(stat.createdAt).toLocaleDateString('fr-FR'),
        value: `${stat.contratsSignes} contrats, ${stat.immeublesVisites} immeubles, ${stat.rendezVousPris} RDV, ${stat.refus} refus`,
      })) || [{ label: 'Aucune donnée', value: 'Pas de statistiques disponibles' }],
    },
    {
      title: 'Zones et immeubles',
      description: 'Territoire et portfolio assignés',
      type: 'grid',
      items: [
        {
          label: 'Zones assignées',
          value: commercialData.zones?.map(zone => zone.nom).join(', ') || 'Aucune zone',
        },
        {
          label: 'Immeubles sous responsabilité',
          value: `${commercialData.immeublesCount} immeuble(s)`,
        },
        {
          label: 'Manager responsable',
          value: commercialData.managerName,
        },
        {
          label: 'Dernière mise à jour',
          value: new Date(commercialData.updatedAt).toLocaleDateString('fr-FR'),
        },
      ],
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
      additionalSections={additionalSections}
      backUrl="/commerciaux"
    />
  )
}
