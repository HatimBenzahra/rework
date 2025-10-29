import { AdvancedDataTable } from '@/components/tableau'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { useImmeubles, useUpdateImmeuble, useRemoveImmeuble, useCommercials } from '@/services'
import { useEntityPermissions, useEntityDescription } from '@/hooks/metier/useRoleBasedData'
import { useRole } from '@/contexts/userole'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { useMemo } from 'react'

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
    header: 'Portes/Étage',
    accessor: 'doors_per_floor',
    className: 'hidden md:table-cell text-center',
  },
  {
    header: 'Total Portes',
    accessor: 'total_doors',
    className: 'hidden lg:table-cell text-center',
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
  {
    header: 'Status',
    accessor: 'status',
    sortable: true,
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
    max: 50,
  },
  {
    key: 'doors_per_floor',
    label: 'Portes par étage',
    type: 'number',
    required: true,
    section: 'Caractéristiques',
    min: 1,
    max: 20,
  },
  {
    key: 'commercial_name',
    label: 'Commercial responsable',
    type: 'select',
    required: true,
    section: 'Gestion',
    options:
      commercials.map(c => ({
        value: `${c.prenom} ${c.nom}`,
        label: `${c.prenom} ${c.nom}`,
      })) || [],
  },
]

export default function Immeubles() {
  const { showError, showSuccess } = useErrorToast()

  // Récupération du rôle de l'utilisateur
  const { currentRole, currentUserId } = useRole()

  // API hooks
  const {
    data: immeublesApi,
    loading: immeublesLoading,
    refetch,
  } = useImmeubles(parseInt(currentUserId, 10), currentRole)
  const { data: commercials } = useCommercials(parseInt(currentUserId, 10), currentRole)
  const { mutate: updateImmeuble } = useUpdateImmeuble()
  const { mutate: removeImmeuble } = useRemoveImmeuble()

  // Les données sont déjà filtrées côté serveur, pas besoin de filtrer côté client
  const filteredImmeubles = useMemo(() => immeublesApi || [], [immeublesApi])

  // Récupération des permissions et description
  const permissions = useEntityPermissions('immeubles')
  const description = useEntityDescription('immeubles')

  // Préparation des données pour le tableau avec mapping API → UI
  const tableData = useMemo(() => {
    if (!filteredImmeubles) return []
    const sortedImmeubles = [...filteredImmeubles].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
    return sortedImmeubles.map(immeuble => {
      const commercial = commercials?.find(c => c.id === immeuble.commercialId)
      const portesImmeuble = immeuble.portes || []
      const totalDoors = immeuble.nbEtages * immeuble.nbPortesParEtage
      const portesProspectees = portesImmeuble.filter(p => p.statut !== 'NON_VISITE').length
      const couverture = totalDoors > 0 ? Math.round((portesProspectees / totalDoors) * 100) : 0

      return {
        ...immeuble,
        address: immeuble.adresse,
        floors: immeuble.nbEtages,
        doors_per_floor: immeuble.nbPortesParEtage,
        total_doors: totalDoors,
        couverture: couverture,
        commercial_name: commercial ? `${commercial.prenom} ${commercial.nom}` : 'Non assigné',
        status: 'actif', // Valeur par défaut
      }
    })
  }, [filteredImmeubles, commercials])

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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Immeubles</h1>
        <p className="text-muted-foreground text-base">{description}</p>
      </div>

      <AdvancedDataTable
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
    </div>
  )
}
