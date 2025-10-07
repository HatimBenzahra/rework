import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'

const managersData = {
  1: {
    id: 1,
    name: 'Fatma Gharbi',
    email: 'fatma.gharbi@company.com',
    phone: '+216 20 789 123',
    region: 'Nord',
    equipe_taille: 8,
    directeur: 'Samir Ben Mahmoud',
    status: 'actif',
    ca_equipe: '350 000 TND',
    objectif_equipe: '400 000 TND',
    date_promotion: '10/01/2021',
    address: '12 Avenue de la Liberté, Tunis',
    commerciaux_actifs: 8,
    clients_total: 234,
    taux_atteinte: '87.5%',
  },
}

export default function ManagerDetails() {
  const { id } = useParams()
  const loading = useSimpleLoading(1000)
  const manager = managersData[id] || managersData[1]

  if (loading) return <DetailsPageSkeleton />

  const personalInfo = [
    { label: 'Email', value: manager.email, icon: 'mail' },
    { label: 'Téléphone', value: manager.phone, icon: 'phone' },
    { label: 'Région', value: manager.region, icon: 'mapPin' },
    { label: 'Directeur', value: manager.directeur, icon: 'users' },
    { label: 'Date de promotion', value: manager.date_promotion, icon: 'calendar' },
    { label: 'Adresse', value: manager.address, icon: 'mapPin' },
  ]

  const statsCards = [
    {
      title: 'CA de l\'équipe',
      value: manager.ca_equipe,
      description: `Objectif: ${manager.objectif_equipe}`,
      icon: 'trendingUp',
      trend: { type: 'positive', value: '+8% vs mois dernier' },
    },
    {
      title: 'Taille de l\'équipe',
      value: manager.equipe_taille,
      description: 'Commerciaux actifs',
      icon: 'users',
    },
    {
      title: 'Clients total',
      value: manager.clients_total,
      description: 'Portfolio de l\'équipe',
      icon: 'users',
    },
    {
      title: 'Taux d\'atteinte',
      value: manager.taux_atteinte,
      description: 'Performance équipe',
      icon: 'trendingUp',
    },
  ]

  const additionalSections = [
    {
      title: 'Performance de l\'équipe',
      description: 'CA mensuel des 6 derniers mois',
      type: 'list',
      items: [
        { label: 'Janvier 2024', value: '320 000 TND' },
        { label: 'Février 2024', value: '310 000 TND' },
        { label: 'Mars 2024', value: '335 000 TND' },
        { label: 'Avril 2024', value: '342 000 TND' },
        { label: 'Mai 2024', value: '358 000 TND' },
        { label: 'Juin 2024', value: '350 000 TND' },
      ],
    },
    {
      title: 'Composition de l\'équipe',
      description: 'Détails des commerciaux sous supervision',
      type: 'grid',
      items: [
        { label: 'Commerciaux seniors', value: '3' },
        { label: 'Commerciaux juniors', value: '5' },
        { label: 'En formation', value: '2' },
        { label: 'Top performer', value: 'Ahmed Ben Ali' },
      ],
    },
  ]

  return (
    <DetailsPage
      title={manager.name}
      subtitle={`Manager Régional - ${manager.region}`}
      status={manager.status}
      data={manager}
      personalInfo={personalInfo}
      statsCards={statsCards}
      additionalSections={additionalSections}
      backUrl="/managers"
    />
  )
}

