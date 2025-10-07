import { AdvancedDataTable } from '@/components/tableau'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import {
  useCommercials,
  useCreateCommercial,
  useUpdateCommercial,
  useRemoveCommercial,
  useManagers,
} from '@/services'
import { useMemo } from 'react'
import { useEntityPage } from '@/hooks/useRoleBasedData'

const commerciauxColumns = [
  {
    header: 'Nom',
    accessor: 'name',
    sortable: true,
    className: 'font-medium',
  },
  {
    header: 'Email',
    accessor: 'email',
    sortable: true,
  },
  {
    header: 'Téléphone',
    accessor: 'numTel',
    className: 'hidden sm:table-cell',
  },
  {
    header: 'Age',
    accessor: 'age',
    sortable: true,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Manager',
    accessor: 'managerName',
    sortable: true,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Date création',
    accessor: 'createdAt',
    className: 'hidden xl:table-cell',
  },
]

export default function Commerciaux() {
  const { data: commercials, loading, error, refetch } = useCommercials()
  const { data: managers } = useManagers()
  const { mutate: createCommercial, loading: creating } = useCreateCommercial()
  const { mutate: updateCommercial, loading: updating } = useUpdateCommercial()
  const { mutate: removeCommercial, loading: deleting } = useRemoveCommercial()

  // Utilisation du nouveau système de rôles
  const {
    data: filteredCommercials,
    permissions,
    description,
  } = useEntityPage('commerciaux', commercials, { managers })

  // Préparer les données pour le tableau
  const tableData = useMemo(() => {
    if (!filteredCommercials) return []

    return filteredCommercials.map(commercial => {
      // Trouver le nom du manager
      const manager = managers?.find(m => m.id === commercial.managerId)
      const managerName = manager ? `${manager.prenom} ${manager.nom}` : 'N/A'

      return {
        ...commercial,
        name: `${commercial.prenom} ${commercial.nom}`,
        managerName,
        createdAt: new Date(commercial.createdAt).toLocaleDateString('fr-FR'),
      }
    })
  }, [filteredCommercials, managers])

  // Préparer les options pour les formulaires
  const managerOptions = useMemo(() => {
    if (!managers) return []
    return managers.map(manager => ({
      value: manager.id,
      label: `${manager.prenom} ${manager.nom}`,
    }))
  }, [managers])

  // Configuration des champs du modal d'édition
  const commerciauxEditFields = [
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
      key: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      section: 'Informations personnelles',
      validate: value => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Email invalide'
        }
      },
    },
    {
      key: 'numTel',
      label: 'Téléphone',
      type: 'tel',
      required: true,
      section: 'Informations personnelles',
      placeholder: '+216 XX XXX XXX',
    },
    {
      key: 'age',
      label: 'Age',
      type: 'number',
      required: true,
      section: 'Informations personnelles',
      min: 18,
      max: 65,
    },
    {
      key: 'managerId',
      label: 'Manager',
      type: 'select',
      section: 'Affectation',
      options: managerOptions,
    },
  ]

  const handleAddCommercial = async formData => {
    try {
      await createCommercial({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        numTel: formData.numTel,
        age: parseInt(formData.age),
        managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
      })
      refetch()
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    }
  }

  const handleEditCommercial = async editedData => {
    try {
      await updateCommercial({
        id: editedData.id,
        nom: editedData.nom,
        prenom: editedData.prenom,
        email: editedData.email,
        numTel: editedData.numTel,
        age: editedData.age ? parseInt(editedData.age) : undefined,
        managerId: editedData.managerId ? parseInt(editedData.managerId) : undefined,
      })
      refetch()
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
    }
  }

  const handleDeleteCommercial = async id => {
    try {
      await removeCommercial(id)
      refetch()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Commerciaux</h1>
          <p className="text-muted-foreground text-base">
            Gestion de l'équipe commerciale et suivi des performances
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Commerciaux</h1>
          <p className="text-muted-foreground text-base">
            Gestion de l'équipe commerciale et suivi des performances
          </p>
        </div>
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">Erreur lors du chargement des données : {error}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Commerciaux</h1>
        <p className="text-muted-foreground text-base">
          Gestion de l'équipe commerciale et suivi des performances
        </p>
      </div>

      <AdvancedDataTable
        title="Liste des Commerciaux"
        description={description}
        data={tableData}
        columns={commerciauxColumns}
        searchKey="name"
        onAdd={permissions.canAdd ? handleAddCommercial : undefined}
        addButtonText="Nouveau Commercial"
        detailsPath="/commerciaux"
        editFields={commerciauxEditFields}
        onEdit={permissions.canEdit ? handleEditCommercial : undefined}
        onDelete={permissions.canDelete ? handleDeleteCommercial : undefined}
        loading={creating || updating || deleting}
      />
    </div>
  )
}
