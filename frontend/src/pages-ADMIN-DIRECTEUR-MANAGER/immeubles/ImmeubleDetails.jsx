import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useImmeuble, useCommercials } from '@/services'
import { useMemo } from 'react'

export default function ImmeubleDetails() {
  const { id } = useParams()
  const loading = useSimpleLoading(1000)

  // API hooks
  const { data: immeuble, loading: immeubleLoading, error } = useImmeuble(parseInt(id))
  const { data: commercials } = useCommercials()

  // Transformation des données API vers format UI
  const immeubleData = useMemo(() => {
    if (!immeuble) return null

    const commercial = commercials?.find(c => c.id === immeuble.commercialId)
    const totalDoors = immeuble.nbEtages * immeuble.nbPortesParEtage

    return {
      ...immeuble,
      name: `Immeuble ${immeuble.adresse.split(',')[0]}`,
      address: immeuble.adresse,
      floors: immeuble.nbEtages,
      apartments: totalDoors,
      commercial_name: commercial ? `${commercial.prenom} ${commercial.nom}` : 'Non assigné',
      status: 'actif',
      occupancy_rate: '85%',
      monthly_revenue: `${(totalDoors * 500).toLocaleString()} TND`,
      year_built: new Date(immeuble.createdAt).getFullYear(),
      total_surface: `${totalDoors * 120} m²`,
      parking_spots: Math.floor(totalDoors * 0.8),
      elevator_count: Math.max(1, Math.floor(immeuble.nbEtages / 4)),
      maintenance_cost: `${Math.floor(totalDoors * 50)} TND`,
      zone: immeuble.adresse.split(',')[1]?.trim() || 'Non spécifiée',
    }
  }, [immeuble, commercials])

  if (loading || immeubleLoading) return <DetailsPageSkeleton />
  if (error) return <div className="text-red-500">Erreur: {error}</div>
  if (!immeubleData) return <div>Immeuble non trouvé</div>

  const personalInfo = [
    { label: 'Adresse complète', value: immeubleData.address, icon: 'mapPin' },
    { label: 'Zone', value: immeubleData.zone, icon: 'mapPin' },
    { label: 'Commercial responsable', value: immeubleData.commercial_name, icon: 'users' },
    { label: 'Année de création', value: immeubleData.year_built, icon: 'calendar' },
    { label: 'Surface totale', value: immeubleData.total_surface, icon: 'building' },
    { label: 'Places de parking', value: immeubleData.parking_spots, icon: 'building' },
  ]

  const statsCards = [
    {
      title: 'Revenu mensuel estimé',
      value: immeubleData.monthly_revenue,
      description: 'Estimation basée sur occupation',
      icon: 'trendingUp',
      trend: { type: 'positive', value: '+5% vs mois dernier' },
    },
    {
      title: "Taux d'occupation",
      value: immeubleData.occupancy_rate,
      description: `${Math.floor(immeubleData.apartments * 0.85)}/${immeubleData.apartments} portes occupées`,
      icon: 'users',
    },
    {
      title: 'Total portes',
      value: immeubleData.apartments,
      description: `Réparties sur ${immeubleData.floors} étages`,
      icon: 'building',
    },
    {
      title: 'Coût maintenance',
      value: immeubleData.maintenance_cost,
      description: 'Par mois (estimé)',
      icon: 'trendingUp',
    },
  ]

  const additionalSections = [
    {
      title: 'Revenus mensuels',
      description: 'Évolution sur les 6 derniers mois',
      type: 'list',
      items: [
        { label: 'Janvier 2024', value: '40 000 TND' },
        { label: 'Février 2024', value: '40 500 TND' },
        { label: 'Mars 2024', value: '41 000 TND' },
        { label: 'Avril 2024', value: '41 500 TND' },
        { label: 'Mai 2024', value: '42 000 TND' },
        { label: 'Juin 2024', value: '42 000 TND' },
      ],
    },
    {
      title: 'Caractéristiques techniques',
      description: "Détails de l'immeuble",
      type: 'grid',
      items: [
        { label: "Nombre d'étages", value: immeubleData.floors },
        { label: 'Portes par étage', value: immeubleData.nbPortesParEtage },
        { label: 'Ascenseurs', value: immeubleData.elevator_count },
        { label: 'Parking', value: `${immeubleData.parking_spots} places` },
      ],
    },
    {
      title: 'Informations financières',
      description: 'Détails économiques',
      type: 'grid',
      items: [
        { label: 'Revenu annuel estimé', value: '504 000 TND' },
        { label: 'Coût maintenance annuel', value: '60 000 TND' },
        { label: 'Bénéfice net estimé', value: '444 000 TND' },
        { label: 'ROI annuel', value: '8.5%' },
      ],
    },
  ]

  return (
    <DetailsPage
      title={immeubleData.name}
      subtitle={`Immeuble - ${immeubleData.zone}`}
      status={immeubleData.status}
      data={immeubleData}
      personalInfo={personalInfo}
      statsCards={statsCards}
      additionalSections={additionalSections}
      backUrl="/immeubles"
    />
  )
}
