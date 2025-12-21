import { AdvancedDataTable } from '@/components/tableau'
import { ZoneCreatorModal } from '@/components/ZoneCreatorModal'
import { ActionConfirmation } from '@/components/ActionConfirmation'
import { useZonesLogic } from './useZonesLogic'

export default function Zones() {
  const {
    description,
    enrichedZones,
    zonesColumns,
    permissions,
    mapboxLazyLoader,
    handleAddZone,
    handleEditZone,
    handleDeleteZone,
    showZoneModal,
    handleZoneValidate,
    handleCloseModal,
    zonesData,
    editingZone,
    currentRole,
    assignableUsers,
    isSubmittingZone,
    confirmAction,
    setConfirmAction,
    confirmDeleteZone,
    confirmEditZone,
  } = useZonesLogic()

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
