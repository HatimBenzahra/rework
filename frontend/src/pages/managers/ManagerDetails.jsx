import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useManager, useDirecteurs } from '@/services'
import { useMemo } from 'react'


export default function ManagerDetails() {
  const { id } = useParams()
  const loading = useSimpleLoading(1000)
  
  // API hooks
  const { data: manager, loading: managerLoading, error } = useManager(parseInt(id))
  const { data: directeurs } = useDirecteurs()
  
  // Transformation des données API vers format UI
  const managerData = useMemo(() => {
    if (!manager) return null
    
    const directeur = directeurs?.find(d => d.id === manager.directeurId)
    
    return {
      ...manager,
      name: `${manager.prenom} ${manager.nom}`,
      directeur: directeur ? `${directeur.prenom} ${directeur.nom}` : 'Aucun directeur',
      email: 'manager@company.com',
      phone: '+216 XX XXX XXX',
      region: 'Non assignée',
      equipe_taille: 0,
      status: 'actif',
      ca_equipe: '0 TND',
      objectif_equipe: '0 TND',
      date_promotion: new Date(manager.createdAt).toLocaleDateString('fr-FR'),
      address: 'Adresse non renseignée',
      commerciaux_actifs: 0,
      clients_total: 0,
      taux_atteinte: '0%'
    }
  }, [manager, directeurs])

  if (loading || managerLoading) return <DetailsPageSkeleton />
  if (error) return <div className="text-red-500">Erreur: {error}</div>
  if (!managerData) return <div>Manager non trouvé</div>

  const personalInfo = [
    { label: 'Email', value: managerData.email, icon: 'mail' },
    { label: 'Téléphone', value: managerData.phone, icon: 'phone' },
    { label: 'Région', value: managerData.region, icon: 'mapPin' },
    { label: 'Directeur', value: managerData.directeur, icon: 'users' },
    { label: 'Date de création', value: managerData.date_promotion, icon: 'calendar' },
    { label: 'Adresse', value: managerData.address, icon: 'mapPin' },
  ]

  const statsCards = [
    {
      title: "CA de l'équipe",
      value: managerData.ca_equipe,
      description: `Objectif: ${managerData.objectif_equipe}`,
      icon: 'trendingUp',
      trend: { type: 'positive', value: '+8% vs mois dernier' },
    },
    {
      title: "Taille de l'équipe",
      value: managerData.equipe_taille,
      description: 'Commerciaux actifs',
      icon: 'users',
    },
    {
      title: 'Clients total',
      value: managerData.clients_total,
      description: "Portfolio de l'équipe",
      icon: 'users',
    },
    {
      title: "Taux d'atteinte",
      value: managerData.taux_atteinte,
      description: 'Performance équipe',
      icon: 'trendingUp',
    },
  ]

  const additionalSections = [
    {
      title: "Performance de l'équipe",
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
      title: "Composition de l'équipe",
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
      title={managerData.name}
      subtitle={`Manager Régional - ${managerData.region}`}
      status={managerData.status}
      data={managerData}
      personalInfo={personalInfo}
      statsCards={statsCards}
      additionalSections={additionalSections}
      backUrl="/managers"
    />
  )
}
