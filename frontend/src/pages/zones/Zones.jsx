import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { ZoneCreatorModal } from '@/components/ZoneCreatorModal'
import { useRole } from '@/contexts/RoleContext'
import { useZones, useCreateZone, useDirecteurs, useManagers, useCommercials } from '@/services'
import { useState } from 'react'

const zonesColumns = [
  {
    header: 'Nom',
    accessor: 'name',
    sortable: true,
    className: 'font-medium',
  },
  {
    header: 'Région',
    accessor: 'region',
    sortable: true,
    className: 'hidden sm:table-cell',
  },
  {
    header: 'Immeubles',
    accessor: 'immeubles_count',
    sortable: true,
    className: 'hidden md:table-cell text-center',
  },
  {
    header: 'Appartements',
    accessor: 'total_apartments',
    className: 'hidden md:table-cell text-center',
  },
  {
    header: 'Manager',
    accessor: 'manager',
    sortable: true,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Taux Occupation',
    accessor: 'occupancy_rate',
    sortable: true,
    className: 'hidden xl:table-cell text-right',
  },
  {
    header: 'Revenu/Mois',
    accessor: 'monthly_revenue',
    className: 'hidden xl:table-cell text-right',
  },
  {
    header: 'Status',
    accessor: 'status',
    sortable: true,
  },
]

export default function Zones() {
  const loading = useSimpleLoading(1000)
  const { currentRole } = useRole()
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [editingZone, setEditingZone] = useState(null)

  // API hooks
  const { data: zones, refetch: refetchZones } = useZones()
  const { mutate: createZone } = useCreateZone()
  const { data: directeurs } = useDirecteurs()
  const { data: managers } = useManagers()
  const { data: commercials } = useCommercials()

  // Préparer les utilisateurs assignables selon le rôle (seulement pour admin et directeur)
  const getAssignableUsers = () => {
    const users = []

    if (currentRole === 'admin') {
      if (directeurs) {
        users.push(
          ...directeurs.map(d => ({
            id: d.id,
            name: `${d.prenom} ${d.nom}`,
            role: 'directeur',
          }))
        )
      }
      if (managers) {
        users.push(
          ...managers.map(m => ({
            id: m.id,
            name: `${m.prenom} ${m.nom}`,
            role: 'manager',
          }))
        )
      }
      if (commercials) {
        users.push(
          ...commercials.map(c => ({
            id: c.id,
            name: `${c.prenom} ${c.nom}`,
            role: 'commercial',
          }))
        )
      }
    } else if (currentRole === 'directeur') {
      // Directeur peut assigner à ses managers et commerciaux
      if (managers) {
        users.push(
          ...managers.map(m => ({
            id: m.id,
            name: `${m.prenom} ${m.nom}`,
            role: 'manager',
          }))
        )
      }
      if (commercials) {
        users.push(
          ...commercials.map(c => ({
            id: c.id,
            name: `${c.prenom} ${c.nom}`,
            role: 'commercial',
          }))
        )
      }
    }
    // Manager ne peut pas créer de zones, donc pas de cas pour 'manager'

    return users
  }

  const handleAddZone = () => {
    setEditingZone(null)
    setShowZoneModal(true)
  }

  const handleZoneValidate = async (zoneData, assignedUserId) => {
    try {
      // Créer la zone via l'API
      const newZone = await createZone(zoneData)

      // TODO: Assigner la zone à l'utilisateur sélectionné si nécessaire
      if (assignedUserId && newZone?.id) {
        console.log("Zone à assigner à l'utilisateur:", assignedUserId)
        // await assignZoneToUser(newZone.id, assignedUserId)
      }

      // Rafraîchir la liste des zones
      await refetchZones()

      setShowZoneModal(false)
      console.log('Zone créée avec succès:', zoneData)
    } catch (error) {
      console.error('Erreur lors de la création de la zone:', error)
    }
  }

  const handleCloseModal = () => {
    setShowZoneModal(false)
    setEditingZone(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Zones</h1>
          <p className="text-muted-foreground text-base">
            Gestion des zones géographiques et suivi des performances territoriales
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Zones</h1>
        <p className="text-muted-foreground text-base">
          Gestion des zones géographiques et suivi des performances territoriales
        </p>
      </div>

      <AdvancedDataTable
        title="Liste des Zones"
        description="Toutes les zones de couverture avec leurs statistiques et performances"
        data={zones || []}
        columns={zonesColumns}
        searchKey="name"
        onAdd={currentRole !== 'manager' ? handleAddZone : undefined}
        addButtonText="Nouvelle Zone"
        detailsPath="/zones"
        onEdit={undefined}
      />

      {showZoneModal && (
        <ZoneCreatorModal
          onValidate={handleZoneValidate}
          onClose={handleCloseModal}
          existingZones={zones || []}
          zoneToEdit={editingZone}
          userRole={currentRole}
          assignableUsers={getAssignableUsers()}
        />
      )}
    </div>
  )
}
