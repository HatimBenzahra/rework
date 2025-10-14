import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useZone, useCommercials } from '@/services'
import { useEntityPermissions } from '@/hooks/useRoleBasedData'
import { useMemo } from 'react'

export default function ZoneDetails() {
  const { id } = useParams()
  const loading = useSimpleLoading(1000)

  // API hooks
  const { data: zone, loading: zoneLoading, error } = useZone(parseInt(id))
  const { data: commercials } = useCommercials()
  const permissions = useEntityPermissions('zones')

  // Transformation des données API vers format UI
  const zoneData = useMemo(() => {
    if (!zone) return null

    // Trouver les commercials assignés à cette zone
    const assignedCommercials =
      commercials?.filter(commercial => commercial.zones?.some(z => z.id === zone.id)) || []

    return {
      ...zone,
      name: zone.nom,
      region: `Zone ${zone.nom}`,
      immeubles_count: 0, // TODO: Calculer depuis les immeubles
      total_apartments: 0, // TODO: Calculer depuis les immeubles
      manager:
        assignedCommercials.length > 0
          ? assignedCommercials.map(c => `${c.prenom} ${c.nom}`).join(', ')
          : 'Non assigné',
      status: 'actif',
      occupancy_rate: '0%', // TODO: Calculer depuis les statistiques
      monthly_revenue: '0 TND', // TODO: Calculer depuis les statistiques
      commercial_count: assignedCommercials.length,
      description: `Zone géographique ${zone.nom}`,
      surface_area: `${(zone.rayon / 1000).toFixed(1)} km de rayon`,
      population: 'Non définie',
      avg_rent: 'Non défini',
    }
  }, [zone, commercials])

  if (loading || zoneLoading) return <DetailsPageSkeleton />
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
    { label: 'Rayon de couverture', value: zoneData.surface_area, icon: 'mapPin' },
    {
      label: 'Coordonnées centre',
      value: `${zone.yOrigin.toFixed(4)}°N, ${zone.xOrigin.toFixed(4)}°E`,
      icon: 'mapPin',
    },
    { label: 'Description', value: zoneData.description, icon: 'building' },
  ]

  const statsCards = [
    {
      title: 'Revenu mensuel',
      value: zoneData.monthly_revenue,
      description: 'Total zone (à calculer)',
      icon: 'trendingUp',
      trend: { type: 'neutral', value: 'Données en cours' },
    },
    {
      title: "Taux d'occupation",
      value: zoneData.occupancy_rate,
      description: 'À calculer depuis les immeubles',
      icon: 'users',
    },
    {
      title: 'Immeubles',
      value: zoneData.immeubles_count,
      description: 'Dans la zone (à calculer)',
      icon: 'building',
    },
    {
      title: 'Commerciaux actifs',
      value: zoneData.commercial_count,
      description: 'Assignés à cette zone',
      icon: 'users',
    },
    {
      title: 'Surface couverte',
      value: `${Math.PI * Math.pow(zone.rayon / 1000, 2).toFixed(1)} km²`,
      description: 'Zone circulaire',
      icon: 'mapPin',
    },
  ]

  const additionalSections = [
    {
      title: 'Détails techniques',
      description: 'Paramètres de la zone',
      type: 'grid',
      items: [
        { label: 'Latitude centre', value: `${zone.yOrigin.toFixed(6)}°` },
        { label: 'Longitude centre', value: `${zone.xOrigin.toFixed(6)}°` },
        { label: 'Rayon (mètres)', value: `${zone.rayon.toLocaleString()} m` },
        { label: 'Créée le', value: new Date(zone.createdAt).toLocaleDateString('fr-FR') },
      ],
    },
    {
      title: 'Commerciaux assignés',
      description: 'Équipe commerciale de la zone',
      type: 'list',
      items:
        zoneData.commercial_count > 0
          ? commercials
              ?.filter(c => c.zones?.some(z => z.id === zone.id))
              ?.map(commercial => ({
                label: `${commercial.prenom} ${commercial.nom}`,
                value: commercial.email || 'Email non renseigné',
              })) || []
          : [{ label: 'Aucun commercial assigné', value: 'Zone non attribuée' }],
    },
    {
      title: 'Actions possibles',
      description: 'Selon vos permissions',
      type: 'grid',
      items: [
        {
          label: 'Voir les détails',
          value: permissions.canView ? '✅ Autorisé' : '❌ Non autorisé',
        },
        {
          label: 'Modifier la zone',
          value: permissions.canEdit ? '✅ Autorisé' : '❌ Non autorisé',
        },
        {
          label: 'Supprimer la zone',
          value: permissions.canDelete ? '✅ Autorisé' : '❌ Non autorisé',
        },
        {
          label: 'Assigner commerciaux',
          value: permissions.canEdit ? '✅ Autorisé' : '❌ Non autorisé',
        },
      ],
    },
  ]

  return (
    <DetailsPage
      title={zoneData.name}
      subtitle={`Zone - ${zoneData.region}`}
      status={zoneData.status}
      data={zoneData}
      personalInfo={personalInfo}
      statsCards={statsCards}
      additionalSections={additionalSections}
      backUrl="/zones"
    />
  )
}
