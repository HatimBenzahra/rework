import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'

const immeublesData = {
  1: {
    id: 1,
    name: 'Résidence Les Jasmins',
    address: '45 Avenue Habib Bourguiba, Tunis',
    zone: 'Tunis Centre',
    floors: 8,
    apartments: 24,
    status: 'actif',
    occupancy_rate: '95%',
    monthly_revenue: '42 000 TND',
    manager: 'Ahmed Ben Ali',
    year_built: '2018',
    total_surface: '3 200 m²',
    parking_spots: 32,
    elevator_count: 2,
    maintenance_cost: '5 000 TND',
  },
}

export default function ImmeubleDetails() {
  const { id } = useParams()
  const loading = useSimpleLoading(1000)
  const immeuble = immeublesData[id] || immeublesData[1]

  if (loading) return <DetailsPageSkeleton />

  const personalInfo = [
    { label: 'Adresse complète', value: immeuble.address, icon: 'mapPin' },
    { label: 'Zone', value: immeuble.zone, icon: 'mapPin' },
    { label: 'Gestionnaire', value: immeuble.manager, icon: 'users' },
    { label: 'Année de construction', value: immeuble.year_built, icon: 'calendar' },
    { label: 'Surface totale', value: immeuble.total_surface, icon: 'building' },
    { label: 'Places de parking', value: immeuble.parking_spots, icon: 'building' },
  ]

  const statsCards = [
    {
      title: 'Revenu mensuel',
      value: immeuble.monthly_revenue,
      description: 'Loyers collectés',
      icon: 'trendingUp',
      trend: { type: 'positive', value: '+5% vs mois dernier' },
    },
    {
      title: "Taux d'occupation",
      value: immeuble.occupancy_rate,
      description: `${Math.floor(immeuble.apartments * 0.95)}/${immeuble.apartments} appartements occupés`,
      icon: 'users',
    },
    {
      title: 'Appartements',
      value: immeuble.apartments,
      description: `Répartis sur ${immeuble.floors} étages`,
      icon: 'building',
    },
    {
      title: 'Coût maintenance',
      value: immeuble.maintenance_cost,
      description: 'Par mois',
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
        { label: "Nombre d'étages", value: immeuble.floors },
        { label: 'Ascenseurs', value: immeuble.elevator_count },
        { label: 'Parking', value: `${immeuble.parking_spots} places` },
        { label: 'Surface totale', value: immeuble.total_surface },
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
      title={immeuble.name}
      subtitle={`Immeuble - ${immeuble.zone}`}
      status={immeuble.status}
      data={immeuble}
      personalInfo={personalInfo}
      statsCards={statsCards}
      additionalSections={additionalSections}
      backUrl="/immeubles"
    />
  )
}
