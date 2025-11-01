import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useZone, useStatisticsByZone, useCommercials, useZoneStatistics } from '@/services'
import { useEntityPermissions } from '@/hooks/metier/useRoleBasedData'
import { useRole } from '@/contexts/userole'
import { useMemo } from 'react'
import AssignedZoneCard from '@/components/AssignedZoneCard'

export default function ZoneDetails() {
  const { id } = useParams()
  const { currentRole, currentUserId } = useRole()

  // API hooks
  const { data: zone, loading: zoneLoading, error } = useZone(parseInt(id))
  const { data: statistics, loading: statsLoading } = useStatisticsByZone(
    parseInt(id),
    parseInt(currentUserId, 10),
    currentRole
  )
  const { data: allZoneStats, loading: zoneStatsLoading } = useZoneStatistics(
    parseInt(currentUserId, 10),
    currentRole
  )
  const { data: commercials } = useCommercials(parseInt(currentUserId, 10), currentRole)
  const permissions = useEntityPermissions('zones')

  // Transformation des données API vers format UI
  const zoneData = useMemo(() => {
    if (!zone) return null

    // Trouver les commercials assignés à cette zone via la relation commercials
    const assignedCommercialIds = zone.commercials?.map(cz => cz.commercialId) || []
    const assignedCommercials = commercials?.filter(c => assignedCommercialIds.includes(c.id)) || []

    // Compter les immeubles dans cette zone
    const immeubles_count = zone.immeubles?.length || 0

    return {
      ...zone,
      name: zone.nom,
      region: `Zone ${zone.nom}`,
      immeubles_count,
      manager:
        assignedCommercials.length > 0
          ? assignedCommercials.map(c => `${c.prenom} ${c.nom}`).join(', ')
          : 'Non assigné',
      status: 'actif',
      commercial_count: assignedCommercials.length,
      description: `Zone géographique ${zone.nom}`,
      surface_area: `${(zone.rayon / 1000).toFixed(1)} km de rayon`,
      population: 'Non définie',
      avg_rent: 'Non défini',
    }
  }, [zone, commercials])

  // Obtenir les statistiques agrégées de la zone depuis l'API
  const zoneStats = useMemo(() => {
    if (!allZoneStats || !id) return null
    return allZoneStats.find(stat => stat.zoneId === parseInt(id))
  }, [allZoneStats, id])

  // Calculer les statistiques agrégées de la zone (fallback si API pas disponible)
  const aggregatedStats = useMemo(() => {
    // Utiliser les stats de l'API si disponibles
    if (zoneStats) {
      return {
        contratsSignes: zoneStats.totalContratsSignes,
        immeublesVisites: zoneStats.totalImmeublesVisites,
        rendezVousPris: zoneStats.totalRendezVousPris,
        refus: zoneStats.totalRefus,
        nbImmeublesProspectes: zoneStats.totalImmeublesProspectes,
        nbPortesProspectes: zoneStats.totalPortesProspectes,
        tauxConversion: zoneStats.tauxConversion,
        tauxSuccesRdv: zoneStats.tauxSuccesRdv,
        nombreCommerciaux: zoneStats.nombreCommerciaux,
        performanceGlobale: zoneStats.performanceGlobale,
      }
    }

    // Fallback vers le calcul manuel si API pas disponible
    if (!statistics || statistics.length === 0) {
      return {
        contratsSignes: 0,
        immeublesVisites: 0,
        rendezVousPris: 0,
        refus: 0,
        nbImmeublesProspectes: 0,
        nbPortesProspectes: 0,
        tauxConversion: 0,
        tauxSuccesRdv: 0,
        nombreCommerciaux: 0,
        performanceGlobale: 0,
      }
    }

    const totals = statistics.reduce(
      (acc, stat) => ({
        contratsSignes: acc.contratsSignes + (stat.contratsSignes || 0),
        immeublesVisites: acc.immeublesVisites + (stat.immeublesVisites || 0),
        rendezVousPris: acc.rendezVousPris + (stat.rendezVousPris || 0),
        refus: acc.refus + (stat.refus || 0),
        nbImmeublesProspectes: acc.nbImmeublesProspectes + (stat.nbImmeublesProspectes || 0),
        nbPortesProspectes: acc.nbPortesProspectes + (stat.nbPortesProspectes || 0),
      }),
      {
        contratsSignes: 0,
        immeublesVisites: 0,
        rendezVousPris: 0,
        refus: 0,
        nbImmeublesProspectes: 0,
        nbPortesProspectes: 0,
      }
    )

    // Calcul des taux
    const tauxConversion =
      totals.nbPortesProspectes > 0 ? (totals.contratsSignes / totals.nbPortesProspectes) * 100 : 0
    const tauxSuccesRdv =
      totals.immeublesVisites > 0 ? (totals.rendezVousPris / totals.immeublesVisites) * 100 : 0

    return {
      ...totals,
      tauxConversion: Math.round(tauxConversion * 100) / 100,
      tauxSuccesRdv: Math.round(tauxSuccesRdv * 100) / 100,
      nombreCommerciaux: new Set(statistics.map(s => s.commercialId).filter(Boolean)).size,
      performanceGlobale: Math.round((tauxConversion * 0.4 + tauxSuccesRdv * 0.6) * 100) / 100,
    }
  }, [zoneStats, statistics])

  if (zoneLoading || statsLoading || zoneStatsLoading) return <DetailsPageSkeleton />
  if (error) return <div className="text-red-500">Erreur: {error}</div>
  if (!zoneData) return <div>Zone non trouvée</div>

  // Vérification des permissions d'accès
  if (!permissions.canView) {
    return <div className="text-red-500">Vous n'avez pas l'autorisation de voir cette zone</div>
  }

  const personalInfo = [
    { label: 'Région', value: zoneData.region, icon: 'mapPin' },
    { label: 'Commerciaux assignés', value: zoneData.manager, icon: 'users' },
    { label: 'Nombre de commerciaux', value: zoneData.commercial_count, icon: 'users' },
    { label: "Nombre d'immeubles", value: zoneData.immeubles_count, icon: 'building' },
    { label: 'Rayon de couverture', value: zoneData.surface_area, icon: 'mapPin' },
    {
      label: 'Coordonnées centre',
      value: `${zone.yOrigin.toFixed(4)}°N, ${zone.xOrigin.toFixed(4)}°E`,
      icon: 'mapPin',
    },
    { label: 'Description', value: zoneData.description, icon: 'building' },
  ]

  const additionalSections = []

  // Statistiques personnalisées pour la zone
  const customStatsCards = [
    {
      title: 'Contrats signés',
      value: aggregatedStats.contratsSignes,
      description: 'Total des contrats dans cette zone',
      icon: 'fileText',
    },
    {
      title: 'Rendez-vous pris',
      value: aggregatedStats.rendezVousPris,
      description: 'Total des rendez-vous dans cette zone',
      icon: 'calendar',
    },
    {
      title: 'Immeubles visités',
      value: aggregatedStats.immeublesVisites,
      description: 'Immeubles visités dans cette zone',
      icon: 'building',
    },
    {
      title: 'Refus',
      value: aggregatedStats.refus,
      description: 'Total des refus dans cette zone',
      icon: 'x',
    },
    {
      title: 'Taux de conversion',
      value: `${aggregatedStats.tauxConversion || 0}%`,
      description: 'Pourcentage de contrats signés / portes prospectées',
      icon: 'trendingUp',
    },
    {
      title: 'Taux succès RDV',
      value: `${aggregatedStats.tauxSuccesRdv || 0}%`,
      description: 'Pourcentage de RDV obtenus / immeubles visités',
      icon: 'target',
    },
    {
      title: 'Performance globale',
      value: `${aggregatedStats.performanceGlobale || 0} pts`,
      description: 'Score de performance composite de la zone',
      icon: 'award',
    },
    {
      title: 'Portes prospectées',
      value: aggregatedStats.nbPortesProspectes,
      description: 'Total des portes prospectées dans cette zone',
      icon: 'door',
    },
  ]

  // Sections personnalisées avec la carte de zone
  const customSections = [
    {
      title: 'Visualisation de la zone',
      description: 'Carte interactive avec limites géographiques',
      type: 'custom',
      render: () => (
        <AssignedZoneCard
          zone={zone}
          assignmentDate={zone?.createdAt}
          className="w-full"
          fullWidth={true}
        />
      ),
    },
    ...additionalSections,
  ]

  return (
    <DetailsPage
      title={zoneData.name}
      subtitle={`Zone - ${zoneData.region}`}
      status={zoneData.status}
      data={zoneData}
      personalInfo={personalInfo}
      statsCards={customStatsCards}
      additionalSections={customSections}
    />
  )
}
