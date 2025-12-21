import { AdvancedDataTable } from '@/components/tableau'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import AssignedZoneCard from '@/components/AssignedZoneCard'
import { Button } from '@/components/ui/button'
import { LayoutList, Map } from 'lucide-react'
import { useImmeublesLogic } from './useImmeublesLogic'

export default function Immeubles() {
  const {
    viewMode,
    setViewMode,
    immeublesLoading,
    description,
    tableData,
    immeublesColumns,
    getImmeublesEditFields,
    permissions,
    handleEditImmeuble,
    handleDeleteImmeuble,
    filteredImmeubles,
  } = useImmeublesLogic()

  if (immeublesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Immeubles</h1>
          <p className="text-muted-foreground text-base">
            Gestion du patrimoine immobilier et suivi des propriétés
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {/* Toggle entre vue liste et vue carte */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <LayoutList className="h-4 w-4" />
            Vue Liste
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            className="gap-2"
          >
            <Map className="h-4 w-4" />
            Vue Carte
          </Button>
        </div>
      </div>

      {/* Affichage conditionnel basé sur viewMode */}
      {viewMode === 'list' ? (
        <AdvancedDataTable
          showStatusColumn={false}
          title="Liste des Immeubles"
          description={description}
          data={tableData}
          columns={immeublesColumns}
          searchKey="address"
          detailsPath="/immeubles"
          editFields={getImmeublesEditFields}
          onEdit={permissions.canEdit ? handleEditImmeuble : undefined}
          onDelete={permissions.canDelete ? handleDeleteImmeuble : undefined}
        />
      ) : (
        <AssignedZoneCard
          showAllImmeubles={true}
          allImmeubles={filteredImmeubles}
          fullWidth={true}
        />
      )}
    </div>
  )
}
