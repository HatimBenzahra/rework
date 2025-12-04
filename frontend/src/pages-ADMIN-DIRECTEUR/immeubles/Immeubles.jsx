import { AdvancedDataTable } from '@/components/tableau'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import {
  useImmeubles,
  useUpdateImmeuble,
  useRemoveImmeuble,
  useCommercials,
  useManagers,
} from '@/services'
import { useEntityPermissions, useEntityDescription } from '@/hooks/metier/useRoleBasedData'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { useMemo, useState } from 'react'
import AssignedZoneCard from '@/components/AssignedZoneCard'
import { Button } from '@/components/ui/button'
import { LayoutList, Map } from 'lucide-react'

const immeublesColumns = [
  {
    header: 'Adresse',
    accessor: 'address',
    sortable: true,
    className: 'font-medium',
  },
  {
    header: 'Étages',
    accessor: 'floors',
    className: 'hidden md:table-cell text-center',
    cell: row => `${row.floors} étages`,
  },
  {
    header: 'contrats signés',
    accessor: 'contrats_signes',
    sortable: true,
    className: 'hidden md:table-cell text-center',
    cell: row => `${row.contrats_signes} contrats`,
  },
  {
    header: 'Couverture',
    accessor: 'couverture',
    sortable: true,
    className: 'hidden lg:table-cell text-center',
    cell: row => `${row.couverture}%`,
  },
  {
    header: 'Commercial',
    accessor: 'commercial_name',
    sortable: true,
    className: 'hidden xl:table-cell',
  },
]

// Configuration des champs du modal d'édition
const getImmeublesEditFields = (commercials = []) => [
  {
    key: 'address',
    label: 'Adresse',
    type: 'textarea',
    required: true,
    section: 'Informations générales',
    fullWidth: true,
    placeholder: "Adresse complète de l'immeuble",
  },
  {
    key: 'floors',
    label: "Nombre d'étages",
    type: 'number',
    required: true,
    section: 'Caractéristiques',
    min: 1,
    max: 100,
  },
  {
    key: 'doors_per_floor',
    label: 'Portes par étage',
    type: 'number',
    required: true,
    section: 'Caractéristiques',
    min: 1,
    max: 100,
  },
  {
    key: 'commercial_name',
    label: 'Commercial responsable',
    type: 'select',
    required: true,
    section: 'Gestion',
    options: (commercials || []).map(c => ({
      value: `${c.prenom} ${c.nom}`,
      label: `${c.prenom} ${c.nom}`,
    })),
  },
]

export default function Immeubles() {
  const { showError, showSuccess } = useErrorToast()
  const [viewMode, setViewMode] = useState('list') // 'list' ou 'map'

  // API hooks
  const { data: immeublesApi, loading: immeublesLoading, refetch } = useImmeubles()
  const { data: commercials } = useCommercials()
  const { data: managers } = useManagers()
  const { mutate: updateImmeuble } = useUpdateImmeuble()
  const { mutate: removeImmeuble } = useRemoveImmeuble()

  // Les données sont déjà filtrées côté serveur, pas besoin de filtrer côté client
  const filteredImmeubles = useMemo(() => immeublesApi || [], [immeublesApi])

  // Récupération des permissions et description
  const permissions = useEntityPermissions('immeubles')
  const description = useEntityDescription('immeubles')

  function calculnbcontrats(immeuble) {
    return (immeuble.portes || []).filter(p => p.statut === 'CONTRAT_SIGNE').length
  }

  // Préparation des données pour le tableau avec mapping API → UI
  const tableData = useMemo(() => {
    if (!filteredImmeubles) return []
    const sortedImmeubles = [...filteredImmeubles].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
    return sortedImmeubles.map(immeuble => {
      const commercial = commercials?.find(c => c.id === immeuble.commercialId)
      const manager = managers?.find(m => m.id === immeuble.managerId)
      const portesImmeuble = immeuble.portes || []
      const totalDoors = portesImmeuble.length
      const portesProspectees = portesImmeuble.filter(p => p.statut !== 'NON_VISITE').length
      const couverture = parseFloat(((portesProspectees / totalDoors) * 100).toFixed(1))

      // Déterminer le nom du responsable
      let responsibleName = 'N/A'
      if (commercial) {
        responsibleName = `${commercial.prenom} ${commercial.nom}`
      } else if (manager) {
        responsibleName = `${manager.prenom} ${manager.nom} (Manager)`
      }

      return {
        ...immeuble,
        address: immeuble.adresse,
        floors: immeuble.nbEtages,
        doors_per_floor: immeuble.nbPortesParEtage,
        total_doors: totalDoors,
        contrats_signes: calculnbcontrats(immeuble),
        couverture: couverture,
        commercial_name: responsibleName,
      }
    })
  }, [filteredImmeubles, commercials, managers])

  const handleEditImmeuble = async editedData => {
    try {
      const commercial = commercials?.find(
        c => `${c.prenom} ${c.nom}` === editedData.commercial_name
      )

      const updateInput = {
        id: editedData.id,
        adresse: editedData.address,
        nbEtages: parseInt(editedData.floors),
        nbPortesParEtage: parseInt(editedData.doors_per_floor),
        commercialId: commercial?.id,
      }

      await updateImmeuble(updateInput)
      await refetch()
      showSuccess('Immeuble modifié avec succès')
    } catch (error) {
      showError(error, 'Immeubles.handleEditImmeuble')
      throw error
    }
  }

  const handleDeleteImmeuble = async id => {
    try {
      await removeImmeuble(id)
      await refetch()
      showSuccess('Immeuble supprimé avec succès')
    } catch (error) {
      showError(error, 'Immeubles.handleDeleteImmeuble')
      throw error
    }
  }

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
          editFields={getImmeublesEditFields(commercials)}
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
