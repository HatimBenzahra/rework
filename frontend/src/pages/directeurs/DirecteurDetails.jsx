import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'

const directeursData = {
  1: {
    id: 1,
    name: 'Samir Ben Mahmoud',
    email: 'samir.benmahmoud@company.com',
    phone: '+216 20 100 200',
    division: 'Division Nord & Sud',
    managers_count: 3,
    commerciaux_count: 17,
    status: 'actif',
    ca_division: '820 000 TND',
    objectif_division: '950 000 TND',
    date_nomination: '01/01/2019',
    experience: '15 ans',
    address: 'Siège social, Tunis',
    clients_total: 456,
    taux_atteinte: '86.3%',
  },
}

export default function DirecteurDetails() {
  const { id } = useParams()
  const loading = useSimpleLoading(1000)
  const directeur = directeursData[id] || directeursData[1]

  if (loading) return <DetailsPageSkeleton />

  const personalInfo = [
    { label: 'Email', value: directeur.email, icon: 'mail' },
    { label: 'Téléphone', value: directeur.phone, icon: 'phone' },
    { label: 'Division', value: directeur.division, icon: 'building' },
    { label: 'Date de nomination', value: directeur.date_nomination, icon: 'calendar' },
    { label: 'Expérience', value: directeur.experience, icon: 'calendar' },
    { label: 'Bureau', value: directeur.address, icon: 'mapPin' },
  ]

  const statsCards = [
    {
      title: 'CA de la division',
      value: directeur.ca_division,
      description: `Objectif: ${directeur.objectif_division}`,
      icon: 'trendingUp',
      trend: { type: 'positive', value: '+15% vs année dernière' },
    },
    {
      title: 'Managers',
      value: directeur.managers_count,
      description: 'Sous supervision',
      icon: 'users',
    },
    {
      title: 'Commerciaux',
      value: directeur.commerciaux_count,
      description: 'Dans la division',
      icon: 'users',
    },
    {
      title: 'Clients total',
      value: directeur.clients_total,
      description: 'Portfolio division',
      icon: 'users',
    },
    {
      title: "Taux d'atteinte",
      value: directeur.taux_atteinte,
      description: 'Performance globale',
      icon: 'trendingUp',
    },
  ]

  const additionalSections = [
    {
      title: 'Performance de la division',
      description: 'CA trimestriel 2024',
      type: 'list',
      items: [
        { label: 'Q1 2024', value: '2 100 000 TND' },
        { label: 'Q2 2024', value: '2 350 000 TND' },
        { label: 'Q3 2024 (prévision)', value: '2 500 000 TND' },
        { label: 'Q4 2024 (objectif)', value: '2 600 000 TND' },
      ],
    },
    {
      title: 'Structure de la division',
      description: 'Organisation et effectifs',
      type: 'grid',
      items: [
        { label: 'Nombre de managers', value: directeur.managers_count },
        { label: 'Nombre de commerciaux', value: directeur.commerciaux_count },
        { label: 'Zones couvertes', value: '8' },
        { label: 'Taux de satisfaction', value: '92%' },
      ],
    },
  ]

  return (
    <DetailsPage
      title={directeur.name}
      subtitle={`Directeur - ${directeur.division}`}
      status={directeur.status}
      data={directeur}
      personalInfo={personalInfo}
      statsCards={statsCards}
      additionalSections={additionalSections}
      backUrl="/directeurs"
    />
  )
}
