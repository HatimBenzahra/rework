import { AdvancedDataTable } from '@/components/tableau'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import {
  useDirecteurs,
  useUpdateDirecteur,
} from '@/services'
import { useEntityPage } from '@/hooks/metier/useRoleBasedData'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { useMemo } from 'react'

const directeursColumns = [
  {
    header: 'Nom',
    accessor: 'nom',
    sortable: true,
    className: 'font-medium',
  },
  {
    header: 'Prénom',
    accessor: 'prenom',
    sortable: true,
    className: 'font-medium',
  },
  {
    header: 'Email',
    accessor: 'email',
    sortable: true,
    className: 'hidden sm:table-cell',
  },
  {
    header: 'Téléphone',
    accessor: 'numTelephone',
    className: 'hidden md:table-cell',
  },
  {
    header: 'Adresse',
    accessor: 'adresse',
    className: 'hidden lg:table-cell',
  },
]

// Configuration des champs du modal d'édition
const directeursEditFields = [
  {
    key: 'nom',
    label: 'Nom',
    type: 'text',
    required: true,
    section: 'Informations personnelles',
  },
  {
    key: 'prenom',
    label: 'Prénom',
    type: 'text',
    required: true,
    section: 'Informations personnelles',
  },
  {
    key: 'numTelephone',
    label: 'Téléphone',
    type: 'tel',
    section: 'Informations personnelles',
    placeholder: '+33 XX XXX XXX',
  },
  {
    key: 'adresse',
    label: 'Adresse',
    type: 'textarea',
    section: 'Informations personnelles',
    fullWidth: true,
    placeholder: 'Adresse complète',
  },
]

export default function Directeurs() {
  const { showError, showSuccess } = useErrorToast()

  // API hooks
  const { data: directeursApi, loading: directeursLoading, refetch } = useDirecteurs()
  const { mutate: updateDirecteur } = useUpdateDirecteur()

  // Utilisation du système de rôles pour filtrer les données
  const {
    data: filteredDirecteurs,
    permissions,
    description,
  } = useEntityPage('directeurs', directeursApi || [])

  // Préparation des données pour le tableau avec mapping API → UI
  const tableData = useMemo(() => {
    if (!filteredDirecteurs) return []
    return filteredDirecteurs.map(directeur => ({
      ...directeur,
      nom: directeur.nom,
      prenom: directeur.prenom,
      email: directeur.email || 'Non renseigné',
      numTelephone: directeur.numTelephone || 'Non renseigné',
      adresse: directeur.adresse || 'Non renseignée',
    }))
  }, [filteredDirecteurs])

  const handleEditDirecteur = async editedData => {
    try {
      const updateInput = {
        id: editedData.id,
        nom: editedData.nom,
        prenom: editedData.prenom,
        numTelephone: editedData.numTelephone,
        adresse: editedData.adresse,
      }

      await updateDirecteur(updateInput)
      await refetch()
      showSuccess('Directeur modifié avec succès')
    } catch (error) {
      showError(error, 'Directeurs.handleEditDirecteur')
      throw error
    }
  }

  if (directeursLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Directeurs</h1>
          <p className="text-muted-foreground text-base">{description}</p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Directeurs</h1>
        <p className="text-muted-foreground text-base">{description}</p>
      </div>

      <AdvancedDataTable
        showStatusColumn={false}
        title="Liste des Directeurs"
        description={description}
        data={tableData}
        columns={directeursColumns}
        searchKey="nom"
        detailsPath="/directeurs"
        editFields={directeursEditFields}
        onEdit={permissions.canEdit ? handleEditDirecteur : undefined}
      />
    </div>
  )
}
