import { AdvancedDataTable } from '@/components/tableau'
import { ZoneCreatorModal } from '@/components/ZoneCreatorModal'
import { ActionConfirmation } from '@/components/ActionConfirmation'
import { useEntityPermissions, useEntityDescription } from '@/hooks/metier/useRoleBasedData'
import { useRole } from '@/contexts/userole'
import {
  useZones,
  useCreateZone,
  useUpdateZone,
  useRemoveZone,
  useDirecteurs,
  useManagers,
  useCommercials,
  useAssignZone,
  useAssignZoneToDirecteur,
  useAssignZoneToManager,
  useAllCurrentAssignments,
} from '@/services'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { useState, useMemo } from 'react'

// Imported logic
import {
  getAssignedUserIdsFromZone,
  parseAssignedUserIds,
  removeRedundantAssignments,
} from './zones-utils'
import {
  useEnrichedZones,
  useAssignableUsers,
  useMapboxLoader,
} from './useZonesLogic'

export default function Zones() {
  const { showError, showSuccess } = useErrorToast()
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [isSubmittingZone, setIsSubmittingZone] = useState(false)
  const [confirmAction, setConfirmAction] = useState({
    isOpen: false,
    type: '',
    zone: null,
    isLoading: false,
  })

  // Récupération du rôle de l'utilisateur
  const { currentRole, currentUserId } = useRole()

  // API hooks
  const { data: zonesApi, refetch: refetchZones } = useZones()
  // Les données sont déjà filtrées côté serveur
  const zonesData = useMemo(() => zonesApi || [], [zonesApi])
  
  const { mutate: createZone } = useCreateZone()
  const { mutate: updateZone } = useUpdateZone()
  const { mutate: removeZone } = useRemoveZone()
  const { mutate: assignZoneToCommercial } = useAssignZone()
  const { mutate: assignZoneToDirecteur } = useAssignZoneToDirecteur()
  const { mutate: assignZoneToManager } = useAssignZoneToManager()
  
  const { data: directeurs } = useDirecteurs()
  const { data: managers } = useManagers()
  const { data: commercials } = useCommercials()
  const { data: allAssignments, refetch: refetchAssignments } = useAllCurrentAssignments()

  // Récupération des permissions et description
  const permissions = useEntityPermissions('zones')
  const description = useEntityDescription('zones')

  // Custom Hooks for Data Logic
  const enrichedZones = useEnrichedZones(zonesData, directeurs, managers, commercials, allAssignments)
  const assignableUsers = useAssignableUsers(permissions, currentUserId, currentRole, directeurs, managers, commercials)
  const mapboxLazyLoader = useMapboxLoader()

  // Actions Handlers
  const handleAddZone = () => {
    setEditingZone(null)
    setShowZoneModal(true)
  }

  const handleEditZone = zone => {
    setConfirmAction({
      isOpen: true,
      type: 'edit',
      zone,
      isLoading: false,
    })
  }

  const confirmEditZone = () => {
    // Enrichir la zone avec les utilisateurs assignés actuels
    const currentAssignments = getAssignedUserIdsFromZone(confirmAction.zone, allAssignments)
    const zoneWithAssignment = {
      ...confirmAction.zone,
      assignedUserId: currentAssignments[0] || '', // Pour compatibilité
      assignedUserIds: currentAssignments,
    }
    setEditingZone(zoneWithAssignment)
    setShowZoneModal(true)
    setConfirmAction({ isOpen: false, type: '', zone: null, isLoading: false })
  }

  const handleDeleteZone = zone => {
    setConfirmAction({
      isOpen: true,
      type: 'delete',
      zone,
      isLoading: false,
    })
  }

  const confirmDeleteZone = async () => {
    setConfirmAction(prev => ({ ...prev, isLoading: true }))
    try {
      await removeZone(confirmAction.zone.id)
      await refetchZones()
      showSuccess('Zone supprimée avec succès')
      setConfirmAction({ isOpen: false, type: '', zone: null, isLoading: false })
    } catch (error) {
      showError(error, 'Zones.confirmDeleteZone')
      setConfirmAction(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleCloseModal = () => {
    setShowZoneModal(false)
    setEditingZone(null)
  }

  const handleZoneValidate = async (zoneData, assignedUserIds) => {
    setIsSubmittingZone(true)
    try {
      const parsedAssignments = parseAssignedUserIds(assignedUserIds)
      // Filtrer les assignations redondantes (commerciaux dont le manager/directeur est déjà assigné)
      const assignments = removeRedundantAssignments(parsedAssignments, directeurs, managers, commercials)

      if (editingZone) {
        // Modifier la zone existante (sans directeurId/managerId)
        await updateZone({
          id: editingZone.id,
          ...zoneData,
        })
        await processAssignments(editingZone.id, assignments)
        console.log('Zone modifiée avec succès')
      } else {
        // Créer une nouvelle zone (sans directeurId/managerId)
        const newZone = await createZone(zoneData)
        if (newZone?.id) {
          await processAssignments(newZone.id, assignments)
        }
      }

      showSuccess(editingZone ? 'Zone modifiée avec succès' : 'Zone créée avec succès')

      // Rafraîchir la liste des zones
      await Promise.all([refetchZones(), refetchAssignments()])
      setShowZoneModal(false)
    } catch (error) {
      showError(error, 'Zones.handleZoneValidate')
    } finally {
      setIsSubmittingZone(false)
    }
  }

  // Helper local pour le traitement des assignations
  const processAssignments = async (zoneId, assignments) => {
    const assignmentPromises = assignments.map(assignment => {
      if (assignment.role === 'commercial') {
        return assignZoneToCommercial({
          commercialId: assignment.id,
          zoneId: zoneId,
        }).catch(err => {
          console.warn('Assignation commerciale échouée (ignorée):', err)
          return null
        })
      } else if (assignment.role === 'directeur') {
        return assignZoneToDirecteur({
          directeurId: assignment.id,
          zoneId: zoneId,
        }).catch(err => {
          console.warn('Assignation directeur échouée (ignorée):', err)
          return null
        })
      } else if (assignment.role === 'manager') {
        return assignZoneToManager({
          managerId: assignment.id,
          zoneId: zoneId,
        }).catch(err => {
          console.warn('Assignation manager échouée (ignorée):', err)
          return null
        })
      }
      return Promise.resolve()
    })

    await Promise.allSettled(assignmentPromises)
  }

  // Définition des colonnes du tableau
  const zonesColumns = [
    {
      header: 'Nom',
      accessor: 'nom',
      sortable: true,
      className: 'font-medium',
    },
    {
      header: 'Localisation',
      accessor: 'location',
      className: 'hidden sm:table-cell',
      cell: (row, { getLoadedData, isLoading }) => {
        // Utiliser les données chargées dynamiquement
        const loadedLocation = getLoadedData(row, 'mapbox-geocode')

        if (loadedLocation) return loadedLocation

        if (row.xOrigin && row.yOrigin) {
          const isCurrentlyLoading = isLoading(row, 'mapbox-geocode')
          if (isCurrentlyLoading) {
            return (
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>
                Chargement...
              </span>
            )
          }
          // Si pas encore chargé et pas en cours, afficher coordonnées temporaires
          return `${row.yOrigin.toFixed(2)}°N, ${row.xOrigin.toFixed(2)}°E`
        }

        return 'Coordonnées non disponibles'
      },
    },
    {
      header: 'Date de création de la zone:',
      accessor: 'createdAt',
      sortable: true,
      className: 'hidden md:table-cell',
      cell: row => new Date(row.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      header: 'Assigné à',
      accessor: 'assignedTo',
      className: 'hidden lg:table-cell max-w-xs',
      cell: row => {
        if (row.assignedUsersCount === 0) {
          return <span className="text-muted-foreground">Non assigné</span>
        }
        if (row.assignedUsersCount === 1) {
          return row.assignedTo
        }
        // Si plusieurs utilisateurs, afficher avec un indicateur
        return (
          <div className="flex items-center gap-2">
            <span className="truncate">{row.assignedTo}</span>
            <span className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5">
              {row.assignedUsersCount}
            </span>
          </div>
        )
      },
    },
    {
      header: 'Rayon (km)',
      accessor: 'rayon',
      sortable: true,
      className: 'hidden xl:table-cell text-start',
      cell: row => `${(row.rayon / 1000).toFixed(1)} km`,
    },
  ]

  return (
    <div className="space-y-6">
      <AdvancedDataTable
        showStatusColumn={false}
        title="Liste des Zones"
        description={description}
        data={enrichedZones}
        columns={zonesColumns}
        searchKey="nom"
        onAdd={permissions.canAdd ? handleAddZone : undefined}
        addButtonText="Nouvelle Zone"
        detailsPath="/zones"
        onEdit={permissions.canEdit ? handleEditZone : undefined}
        onDelete={permissions.canDelete ? handleDeleteZone : undefined}
        lazyLoaders={[mapboxLazyLoader]}
      />

      {showZoneModal && (
        <ZoneCreatorModal
          onValidate={handleZoneValidate}
          onClose={handleCloseModal}
          existingZones={zonesData}
          zoneToEdit={editingZone}
          userRole={currentRole}
          assignableUsers={assignableUsers}
          isSubmitting={isSubmittingZone}
        />
      )}

      <ActionConfirmation
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ isOpen: false, type: '', zone: null, isLoading: false })}
        onConfirm={confirmAction.type === 'delete' ? confirmDeleteZone : confirmEditZone}
        type={confirmAction.type}
        title={confirmAction.type === 'delete' ? 'Supprimer la zone' : 'Modifier la zone'}
        description={
          confirmAction.type === 'delete'
            ? 'Cette action supprimera définitivement la zone et toutes ses associations avec les commerciaux.'
            : 'Vous allez modifier les paramètres de cette zone.'
        }
        itemName={confirmAction.zone?.nom}
        confirmText={confirmAction.type === 'delete' ? 'Supprimer' : 'Modifier'}
        isLoading={confirmAction.isLoading}
      />
    </div>
  )
}
