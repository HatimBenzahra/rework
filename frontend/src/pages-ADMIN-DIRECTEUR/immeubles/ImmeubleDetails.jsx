import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useImmeuble, useCommercials, useManagers, usePortesByImmeuble } from '@/services'
import { useRole } from '@/contexts/userole'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'

export default function ImmeubleDetails() {
  const { id } = useParams()
  const { currentRole, currentUserId } = useRole()

  // API hooks
  const { data: immeuble, loading: immeubleLoading, error } = useImmeuble(parseInt(id))
  const { data: commercials } = useCommercials(parseInt(currentUserId, 10), currentRole)
  const { data: managers } = useManagers(parseInt(currentUserId, 10), currentRole)
  const { data: portes, loading: portesLoading } = usePortesByImmeuble(parseInt(id))

  // Transformation des données API vers format UI
  const immeubleData = useMemo(() => {
    if (!immeuble) return null

    const commercial = commercials?.find(c => c.id === immeuble.commercialId)
    const manager = managers?.find(m => m.id === immeuble.managerId)
    const totalDoors = portes?.length || immeuble.nbEtages * immeuble.nbPortesParEtage

    // Déterminer le responsable (commercial ou manager)
    let commercialName = 'Non assigné'
    if (commercial) {
      commercialName = `${commercial.prenom} ${commercial.nom}`
    } else if (manager) {
      commercialName = `${manager.prenom} ${manager.nom} (Manager)`
    }

    // Grouper les portes par étage à partir des vraies données
    const floorDetails = portes
      ? Array.from({ length: immeuble.nbEtages }, (_, index) => {
          const floorNumber = index + 1
          const portesEtage = portes.filter(p => p.etage === floorNumber)

          return {
            floor: floorNumber,
            totalDoors: portesEtage.length,
            doors: portesEtage.map(porte => ({
              id: porte.id,
              number: porte.numero,
              status: porte.statut.toLowerCase(),
              rdvDate: porte.rdvDate
                ? new Date(porte.rdvDate).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : null,
              rdvTime: porte.rdvTime || null,
              comment: porte.commentaire || null,
              lastVisit: porte.updatedAt ? new Date(porte.updatedAt).toLocaleDateString() : null,
              nbRepassages: porte.nbRepassages || 0,
            })),
          }
        })
      : []

    return {
      ...immeuble,
      name: `Immeuble ${immeuble.adresse.split(',')[0]}`,
      address: immeuble.adresse,
      floors: immeuble.nbEtages,
      apartments: totalDoors,
      commercial_name: commercialName,
      has_elevator: immeuble.ascenseurPresent,
      digital_code: immeuble.digitalCode || 'Non défini',
      zone: immeuble.adresse.split(',')[1]?.trim() || 'Non spécifiée',
      created_at: immeuble.createdAt,
      updated_at: immeuble.updatedAt,
      floorDetails,
    }
  }, [immeuble, commercials, managers, portes])

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

  if (immeubleLoading || portesLoading) return <DetailsPageSkeleton />
  if (error) return <div className="text-red-500">Erreur: {error}</div>
  if (!immeubleData) return <div>Immeuble non trouvé</div>

  const personalInfo = [
    { label: 'Adresse complète', value: immeubleData.address, icon: 'mapPin' },
    { label: 'Zone', value: immeubleData.zone, icon: 'mapPin' },
    { label: 'Commercial responsable', value: immeubleData.commercial_name, icon: 'users' },
    { label: "Nombre d'étages", value: immeubleData.floors, icon: 'building' },
    { label: 'Portes par étage', value: immeubleData.nbPortesParEtage, icon: 'building' },
    { label: 'Ascenseur', value: immeubleData.has_elevator ? 'Oui' : 'Non', icon: 'building' },
    { label: 'Code digital', value: immeubleData.digital_code, icon: 'key' },
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
        (acc, floor) => acc + floor.doors.filter(door => door.status === 'rendez_vous_pris').length,
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
      title: 'Repassages nécessaires',
      value: immeubleData.floorDetails.reduce(
        (acc, floor) =>
          acc + floor.doors.filter(door => door.status === 'necessite_repassage').length,
        0
      ),
      description: 'Portes à revoir',
      icon: 'refresh',
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
            case 'rendez_vous_pris':
              return 'bg-blue-100 text-blue-800'
            case 'curieux':
              return 'bg-yellow-100 text-yellow-800'
            case 'refus':
              return 'bg-red-100 text-red-800'
            case 'necessite_repassage':
              return 'bg-orange-100 text-orange-800'
            default:
              return 'bg-gray-100 text-gray-800'
          }
        }

        const getStatusLabel = status => {
          switch (status) {
            case 'contrat_signe':
              return 'Contrat signé'
            case 'rendez_vous_pris':
              return 'RDV programmé'
            case 'curieux':
              return 'Curieux'
            case 'refus':
              return 'Refus'
            case 'non_visite':
              return 'Non visité'
            case 'necessite_repassage':
              return 'Repassage nécessaire'
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
      header: 'Repassages',
      accessor: 'nbRepassages',
      sortable: true,
      cell: row => {
        const count = row.nbRepassages || 0
        if (count > 0) {
          return (
            <Badge className="bg-orange-100 text-orange-800">
              {count} repassage{count > 1 ? 's' : ''}
            </Badge>
          )
        }
        return <span className="text-muted-foreground">-</span>
      },
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
          { value: 'rendez_vous_pris', label: 'RDV programmés' },
          { value: 'curieux', label: 'Curieux' },
          { value: 'necessite_repassage', label: 'Repassages nécessaires' },
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
      status={'Immeuble'}
      data={immeubleData}
      personalInfo={personalInfo}
      statsCards={statsCards}
      additionalSections={additionalSections}
    />
  )
}
