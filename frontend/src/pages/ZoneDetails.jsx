import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'

const zonesData = {
  1: {
    id: 1,
    name: 'Tunis Centre',
    region: 'Grand Tunis',
    immeubles_count: 12,
    total_apartments: 280,
    manager: 'Fatma Gharbi',
    status: 'actif',
    occupancy_rate: '91%',
    monthly_revenue: '485 000 TND',
    commercial_count: 5,
    description: 'Zone principale du centre-ville',
    surface_area: '15 km²',
    population: '250 000',
    avg_rent: '1 800 TND',
  },
}

export default function ZoneDetails() {
  const { id } = useParams()
  const zone = zonesData[id] || zonesData[1]

  const personalInfo = [
    { label: 'Région', value: zone.region, icon: 'mapPin' },
    { label: 'Manager responsable', value: zone.manager, icon: 'users' },
    { label: 'Nombre de commerciaux', value: zone.commercial_count, icon: 'users' },
    { label: 'Surface', value: zone.surface_area, icon: 'mapPin' },
    { label: 'Population estimée', value: zone.population, icon: 'users' },
    { label: 'Description', value: zone.description, icon: 'building' },
  ]

  const statsCards = [
    {
      title: 'Revenu mensuel',
      value: zone.monthly_revenue,
      description: 'Total zone',
      icon: 'trendingUp',
      trend: { type: 'positive', value: '+7% vs mois dernier' },
    },
    {
      title: 'Taux d\'occupation',
      value: zone.occupancy_rate,
      description: `${Math.floor(zone.total_apartments * 0.91)}/${zone.total_apartments} appartements`,
      icon: 'users',
    },
    {
      title: 'Immeubles',
      value: zone.immeubles_count,
      description: 'Dans la zone',
      icon: 'building',
    },
    {
      title: 'Appartements',
      value: zone.total_apartments,
      description: 'Total disponibles',
      icon: 'building',
    },
    {
      title: 'Loyer moyen',
      value: zone.avg_rent,
      description: 'Par appartement',
      icon: 'trendingUp',
    },
  ]

  const additionalSections = [
    {
      title: 'Performance mensuelle',
      description: 'Revenus des 6 derniers mois',
      type: 'list',
      items: [
        { label: 'Janvier 2024', value: '450 000 TND' },
        { label: 'Février 2024', value: '455 000 TND' },
        { label: 'Mars 2024', value: '470 000 TND' },
        { label: 'Avril 2024', value: '475 000 TND' },
        { label: 'Mai 2024', value: '480 000 TND' },
        { label: 'Juin 2024', value: '485 000 TND' },
      ],
    },
    {
      title: 'Statistiques de la zone',
      description: 'Indicateurs clés',
      type: 'grid',
      items: [
        { label: 'Immeubles gérés', value: zone.immeubles_count },
        { label: 'Appartements totaux', value: zone.total_apartments },
        { label: 'Commerciaux actifs', value: zone.commercial_count },
        { label: 'Taux de satisfaction', value: '89%' },
      ],
    },
    {
      title: 'Analyse de marché',
      description: 'Tendances et perspectives',
      type: 'grid',
      items: [
        { label: 'Croissance annuelle', value: '+12%' },
        { label: 'Demande locative', value: 'Élevée' },
        { label: 'Potentiel développement', value: '3 nouveaux projets' },
        { label: 'Score attractivité', value: '9.2/10' },
      ],
    },
  ]

  return (
    <DetailsPage
      title={zone.name}
      subtitle={`Zone - ${zone.region}`}
      status={zone.status}
      data={zone}
      personalInfo={personalInfo}
      statsCards={statsCards}
      additionalSections={additionalSections}
      backUrl="/zones"
    />
  )
}

