import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useCommercialFull, useManagers } from '@/services'
import { useRole } from '@/contexts/userole'
import { useMemo } from 'react'
import { RANKS, calculateRank } from '@/share/ranks'

export default function CommercialDetails() {
  const { id } = useParams()
  const { currentRole, currentUserId } = useRole()
  const { data: commercial, loading, error } = useCommercialFull(parseInt(id))
  const { data: managers } = useManagers(parseInt(currentUserId, 10), currentRole)

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

    // Calculer le rang du commercial
    const { rank, points } = calculateRank(
      totalContratsSignes,
      totalRendezVousPris,
      totalImmeublesVisites
    )

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
      rank,
      points,
    }
  }, [commercial, managers])

  // Préparer les zones avec dates d'assignation et nombre d'immeubles
  const assignedZones = useMemo(() => {
    if (!commercialData?.zones) return []
    return commercialData.zones.map(zone => {
      const assignment = zone.commercials?.find(c => c.commercialId === commercialData.id)
      // Compter les immeubles de cette zone assignés au commercial
      const immeublesCount =
        zone.immeubles?.filter(immeuble => immeuble.commercialId === commercialData.id).length || 0
      return {
        ...zone,
        assignmentDate: assignment?.createdAt || zone.createdAt,
        immeublesCount,
      }
    })
  }, [commercialData])

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
      label: 'Rang',
      value: (
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${commercialData.rank.bgColor} ${commercialData.rank.textColor} ${commercialData.rank.borderColor} border font-semibold`}
        >
          <span className="text-lg">🏆</span>
          {commercialData.rank.name}
          <span className="text-xs opacity-75">({commercialData.points} pts)</span>
        </span>
      ),
      icon: 'award',
    },
    {
      label: 'Date de création',
      value: new Date(commercialData.createdAt).toLocaleDateString('fr-FR'),
      icon: 'calendar',
    },
  ]

  const statsCards = [
    {
      title: 'Contrats signés',
      value: commercialData.totalContratsSignes,
      description: 'Total historique (50 pts/contrat)',
      icon: 'fileText',
    },
    {
      title: 'Immeubles visités',
      value: commercialData.totalImmeublesVisites,
      description: 'Total historique (5 pts/immeuble)',
      icon: 'building',
    },
    {
      title: 'Rendez-vous pris',
      value: commercialData.totalRendezVousPris,
      description: 'Total historique (10 pts/RDV)',
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
    {
      title: 'La zone actuellement assignée',
      value: commercialData.zones.map(zone => zone.nom).join(', '),
      icon: 'mapPin',
    },
  ]

  const additionalSections = []

  return (
    <DetailsPage
      title={commercialData.name}
      subtitle={`Commercial - ID: ${commercialData.id}`}
      status="actif"
      data={commercialData}
      personalInfo={personalInfo}
      statsCards={statsCards}
      assignedZones={assignedZones}
      additionalSections={additionalSections}
      backUrl="/commerciaux"
    />
  )
}
