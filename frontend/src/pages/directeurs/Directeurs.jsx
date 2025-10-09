import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import {
  useDirecteurs,
  useCreateDirecteur,
  useUpdateDirecteur,
  useRemoveDirecteur,
} from '@/services'
import { useEntityPage } from '@/hooks/useRoleBasedData'
import { useMemo } from 'react'

const directeursColumns = [
  {
    header: 'Nom Prénom',
    accessor: 'name',
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
    key: 'name',
    label: 'Nom complet',
    type: 'text',
    required: true,
    section: 'Informations personnelles',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    section: 'Informations personnelles',
    validate: value => {
      if (value && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
        return 'Email invalide'
      }
    },
  },
  {
    key: 'numTelephone',
    label: 'Téléphone',
    type: 'tel',
    section: 'Informations personnelles',
    placeholder: '+216 XX XXX XXX',
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
  const loading = useSimpleLoading(1000)

  // API hooks
  const { data: directeursApi, loading: directeursLoading, refetch } = useDirecteurs()
  const { mutate: createDirecteur } = useCreateDirecteur()
  const { mutate: updateDirecteur } = useUpdateDirecteur()
  const { mutate: removeDirecteur } = useRemoveDirecteur()

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
      name: `${directeur.prenom} ${directeur.nom}`,
      email: directeur.email || 'Non renseigné',
      numTelephone: directeur.numTelephone || 'Non renseigné',
      adresse: directeur.adresse || 'Non renseignée',
    }))
  }, [filteredDirecteurs])

  const handleAddDirecteur = async formData => {
    try {
      const [prenom, ...nomParts] = (formData.name || '').split(' ')
      const nom = nomParts.join(' ')

      const directeurInput = {
        nom: nom || formData.nom || '',
        prenom: prenom || formData.prenom || '',
        email: formData.email || null,
        numTelephone: formData.numTelephone || null,
        adresse: formData.adresse || null,
      }

      await createDirecteur(directeurInput)
      await refetch()
    } catch (error) {
      console.error('Erreur lors de la création du directeur:', error)
    }
  }

  const handleEditDirecteur = async editedData => {
    try {
      const [prenom, ...nomParts] = (editedData.name || '').split(' ')
      const nom = nomParts.join(' ')

      const updateInput = {
        id: editedData.id,
        nom: nom || editedData.nom,
        prenom: prenom || editedData.prenom,
        email: editedData.email,
        numTelephone: editedData.numTelephone,
        adresse: editedData.adresse,
      }

      await updateDirecteur(updateInput)
      await refetch()
    } catch (error) {
      console.error('Erreur lors de la modification du directeur:', error)
    }
  }

  const handleDeleteDirecteur = async id => {
    try {
      await removeDirecteur(id)
      await refetch()
    } catch (error) {
      console.error('Erreur lors de la suppression du directeur:', error)
    }
  }

  if (loading || directeursLoading) {
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
        title="Liste des Directeurs"
        description={description}
        data={tableData}
        columns={directeursColumns}
        searchKey="name"
        onAdd={permissions.canAdd ? handleAddDirecteur : undefined}
        addButtonText="Nouveau Directeur"
        detailsPath="/directeurs"
        editFields={directeursEditFields}
        onEdit={permissions.canEdit ? handleEditDirecteur : undefined}
        onDelete={permissions.canDelete ? handleDeleteDirecteur : undefined}
      />
    </div>
  )
}
