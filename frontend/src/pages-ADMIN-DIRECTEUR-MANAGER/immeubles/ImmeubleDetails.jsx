import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useImmeuble, useCommercials } from '@/services'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'

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

    // Informations de prospection pour l'immeuble
    const prospectionMode = Math.random() < 0.6 ? 'solo' : 'duo'
    const commercialNames = [
      'Ahmed Ben Ali',
      'Fatma Trabelsi',
      'Mohamed Khelifi',
      'Samia Gharbi',
      'Karim Sassi',
    ]
    const prospectedBy = commercialNames[Math.floor(Math.random() * commercialNames.length)]
    const duoPartner =
      prospectionMode === 'duo'
        ? commercialNames.filter(name => name !== prospectedBy)[
            Math.floor(Math.random() * (commercialNames.length - 1))
          ]
        : null

    // Génération des données de portes par étage avec nouveaux statuts
    const floorDetails = Array.from({ length: immeuble.nbEtages }, (_, index) => {
      const floorNumber = index + 1
      const statusOptions = ['contrat_signe', 'refus', 'curieux', 'rdv_pris', 'non_visite']

      return {
        floor: floorNumber,
        totalDoors: immeuble.nbPortesParEtage,
        doors: Array.from({ length: immeuble.nbPortesParEtage }, (_, doorIndex) => {
          const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)]
          const futureDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) // 30 jours dans le futur

          return {
            number: `${floorNumber}${String(doorIndex + 1).padStart(2, '0')}`,
            status: randomStatus,
            rdvDate: randomStatus === 'rdv_pris' ? futureDate.toLocaleDateString() : null,
            rdvTime:
              randomStatus === 'rdv_pris'
                ? `${Math.floor(Math.random() * 12) + 8}:${Math.random() < 0.5 ? '00' : '30'}`
                : null,
            comment:
              Math.random() < 0.3
                ? `Commentaire pour la porte ${floorNumber}${String(doorIndex + 1).padStart(2, '0')}`
                : null,
            lastVisit:
              randomStatus !== 'non_visite'
                ? new Date(
                    Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()
                : null,
          }
        }),
      }
    })

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
      prospectedBy,
      prospectionMode,
      duoPartner,
      floorDetails,
    }
  }, [immeuble, commercials])

  // Préparer les données pour le tableau - DOIT être après immeubleData mais avant les returns conditionnels
  const doorsData = useMemo(() => {
    if (!immeubleData?.floorDetails) return []

    const allDoors = []
    immeubleData.floorDetails.forEach(floor => {
      floor.doors.forEach(door => {
        allDoors.push({
          ...door,
          floor: floor.floor,
          id: `${floor.floor}-${door.number}`, // Clé unique pour le tableau
          etage: `Étage ${floor.floor}`,
        })
      })
    })
    return allDoors
  }, [immeubleData?.floorDetails])

  if (loading || immeubleLoading) return <DetailsPageSkeleton />
  if (error) return <div className="text-red-500">Erreur: {error}</div>
  if (!immeubleData) return <div>Immeuble non trouvé</div>

  const personalInfo = [
    { label: 'Adresse complète', value: immeubleData.address, icon: 'mapPin' },
    { label: 'Zone', value: immeubleData.zone, icon: 'mapPin' },
    { label: 'Commercial responsable', value: immeubleData.commercial_name, icon: 'users' },
    {
      label: 'Prospecté par',
      value:
        immeubleData.prospectionMode === 'duo'
          ? `${immeubleData.prospectedBy} + ${immeubleData.duoPartner} (Duo)`
          : `${immeubleData.prospectedBy} (Solo)`,
      icon: 'users',
    },
    { label: "Nombre d'étages", value: immeubleData.floors, icon: 'building' },
    { label: 'Portes par étage', value: immeubleData.nbPortesParEtage, icon: 'building' },
  ]

  const statsCards = [
    {
      title: 'Contrats signés',
      value: immeubleData.floorDetails.reduce(
        (acc, floor) => acc + floor.doors.filter(door => door.status === 'contrat_signe').length,
        0
      ),
      description: `Sur ${immeubleData.apartments} portes totales`,
      icon: 'trendingUp',
    },
    {
      title: 'RDV programmés',
      value: immeubleData.floorDetails.reduce(
        (acc, floor) => acc + floor.doors.filter(door => door.status === 'rdv_pris').length,
        0
      ),
      description: 'Rendez-vous à venir',
      icon: 'calendar',
    },
    {
      title: 'Prospects curieux',
      value: immeubleData.floorDetails.reduce(
        (acc, floor) => acc + floor.doors.filter(door => door.status === 'curieux').length,
        0
      ),
      description: 'Intérêt manifesté',
      icon: 'users',
    },
    {
      title: 'Refus',
      value: immeubleData.floorDetails.reduce(
        (acc, floor) => acc + floor.doors.filter(door => door.status === 'refus').length,
        0
      ),
      description: 'Propositions refusées',
      icon: 'building',
    },
  ]

  // Définir les colonnes du tableau
  const columns = [
    {
      header: 'Porte',
      accessor: 'number',
      sortable: true,
      className: 'font-medium',
    },
    {
      header: 'Étage',
      accessor: 'etage',
      sortable: true,
      className: 'text-sm',
    },
    {
      header: 'Statut',
      accessor: 'status',
      sortable: true,
      cell: row => {
        const getStatusColor = status => {
          switch (status) {
            case 'contrat_signe':
              return 'bg-green-100 text-green-800'
            case 'rdv_pris':
              return 'bg-blue-100 text-blue-800'
            case 'curieux':
              return 'bg-yellow-100 text-yellow-800'
            case 'refus':
              return 'bg-red-100 text-red-800'
            default:
              return 'bg-gray-100 text-gray-800'
          }
        }

        const getStatusLabel = status => {
          switch (status) {
            case 'contrat_signe':
              return 'Contrat signé'
            case 'rdv_pris':
              return 'RDV programmé'
            case 'curieux':
              return 'Curieux'
            case 'refus':
              return 'Refus'
            case 'non_visite':
              return 'Non visité'
            default:
              return status
          }
        }

        return <Badge className={getStatusColor(row.status)}>{getStatusLabel(row.status)}</Badge>
      },
    },
    {
      header: 'RDV',
      accessor: 'rdvDate',
      sortable: true,
      cell: row => {
        if (row.rdvDate && row.rdvTime) {
          return (
            <div className="text-sm">
              <div>{row.rdvDate}</div>
              <div className="text-muted-foreground">{row.rdvTime}</div>
            </div>
          )
        }
        return <span className="text-muted-foreground">-</span>
      },
    },
    {
      header: 'Dernière visite',
      accessor: 'lastVisit',
      sortable: true,
      cell: row => row.lastVisit || <span className="text-muted-foreground">-</span>,
    },
    {
      header: 'Commentaire',
      accessor: 'comment',
      cell: row => {
        if (row.comment) {
          return (
            <div className="max-w-xs truncate text-sm" title={row.comment}>
              {row.comment}
            </div>
          )
        }
        return <span className="text-muted-foreground">-</span>
      },
    },
  ]

  const additionalSections = [
    {
      title: 'Tableau des portes',
      description: 'Statut de prospection pour chaque porte',
      type: 'custom',
      component: 'DoorsTable',
      data: {
        doors: doorsData,
        columns,
        customFilters: [
          { value: 'all', label: 'Tous les statuts' },
          { value: 'contrat_signe', label: 'Contrats signés' },
          { value: 'rdv_pris', label: 'RDV programmés' },
          { value: 'curieux', label: 'Curieux' },
          { value: 'refus', label: 'Refus' },
          { value: 'non_visite', label: 'Non visités' },
        ],
      },
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
