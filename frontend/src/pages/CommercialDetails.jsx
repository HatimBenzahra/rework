import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'

// Données exemple (à remplacer par un appel API)
const commerciauxData = {
  1: {
    id: 1,
    name: 'Ahmed Ben Ali',
    email: 'ahmed.benali@company.com',
    phone: '+216 20 123 456',
    zone: 'Tunis Centre',
    manager: 'Fatma Gharbi',
    status: 'actif',
    ventes_mois: '45 000 TND',
    objectif: '50 000 TND',
    date_embauche: '15/03/2022',
    address: '23 Avenue Habib Bourguiba, Tunis',
    contracts_signed: 28,
    clients_actifs: 45,
    taux_conversion: '62%',
    commission: '4 500 TND',
  },
  2: {
    id: 2,
    name: 'Sarra Mejri',
    email: 'sarra.mejri@company.com',
    phone: '+216 25 987 654',
    zone: 'Sfax',
    manager: 'Mohamed Triki',
    status: 'actif',
    ventes_mois: '52 000 TND',
    objectif: '50 000 TND',
    date_embauche: '08/07/2021',
    address: '45 Rue de la République, Sfax',
    contracts_signed: 32,
    clients_actifs: 58,
    taux_conversion: '68%',
    commission: '5 200 TND',
  },
}

export default function CommercialDetails() {
  const { id } = useParams()
  const loading = useSimpleLoading(1000)
  const commercial = commerciauxData[id] || commerciauxData[1]

  if (loading) return <DetailsPageSkeleton />

  const personalInfo = [
    {
      label: 'Email',
      value: commercial.email,
      icon: 'mail',
    },
    {
      label: 'Téléphone',
      value: commercial.phone,
      icon: 'phone',
    },
    {
      label: 'Zone',
      value: commercial.zone,
      icon: 'mapPin',
    },
    {
      label: 'Manager',
      value: commercial.manager,
      icon: 'users',
    },
    {
      label: 'Date d\'embauche',
      value: commercial.date_embauche,
      icon: 'calendar',
    },
    {
      label: 'Adresse',
      value: commercial.address,
      icon: 'mapPin',
    },
  ]

  const statsCards = [
    {
      title: 'Ventes du mois',
      value: commercial.ventes_mois,
      description: `Objectif: ${commercial.objectif}`,
      icon: 'trendingUp',
      trend: {
        type: 'positive',
        value: '+12% vs mois dernier',
      },
    },
    {
      title: 'Contrats signés',
      value: commercial.contracts_signed,
      description: 'Ce mois-ci',
      icon: 'users',
    },
    {
      title: 'Clients actifs',
      value: commercial.clients_actifs,
      description: 'Portfolio total',
      icon: 'users',
    },
    {
      title: 'Taux de conversion',
      value: commercial.taux_conversion,
      description: 'Performance globale',
      icon: 'trendingUp',
    },
    {
      title: 'Commission',
      value: commercial.commission,
      description: 'Ce mois-ci',
      icon: 'trendingUp',
    },
  ]

  const additionalSections = [
    {
      title: 'Performance mensuelle',
      description: 'Évolution des ventes sur les 6 derniers mois',
      type: 'list',
      items: [
        { label: 'Janvier 2024', value: '42 000 TND' },
        { label: 'Février 2024', value: '38 000 TND' },
        { label: 'Mars 2024', value: '45 000 TND' },
        { label: 'Avril 2024', value: '48 000 TND' },
        { label: 'Mai 2024', value: '51 000 TND' },
        { label: 'Juin 2024', value: '45 000 TND' },
      ],
    },
    {
      title: 'Objectifs et réalisations',
      description: 'Comparaison avec les objectifs fixés',
      type: 'grid',
      items: [
        { label: 'Objectif annuel', value: '600 000 TND' },
        { label: 'Réalisé à ce jour', value: '269 000 TND' },
        { label: 'Pourcentage atteint', value: '45%' },
        { label: 'Prévision fin d\'année', value: '620 000 TND' },
      ],
    },
  ]

  return (
    <DetailsPage
      title={commercial.name}
      subtitle={`Commercial - ${commercial.zone}`}
      status={commercial.status}
      data={commercial}
      personalInfo={personalInfo}
      statsCards={statsCards}
      additionalSections={additionalSections}
      backUrl="/commerciaux"
    />
  )
}

