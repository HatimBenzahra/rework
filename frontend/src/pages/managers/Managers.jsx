import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { useManagers } from '@/services'
import { useEntityPage } from '@/hooks/useRoleBasedData'
import { useMemo } from 'react'

// Données exemple pour les managers
const managersData = [
  {
    id: 1,
    name: 'Fatma Gharbi',
    email: 'fatma.gharbi@company.com',
    phone: '+216 20 789 123',
    region: 'Nord',
    equipe_taille: 8,
    directeur: 'Samir Ben Mahmoud',
    status: 'actif',
    ca_equipe: '350 000 TND',
    objectif_equipe: '400 000 TND',
    date_promotion: '10/01/2021',
  },
  {
    id: 2,
    name: 'Mohamed Triki',
    email: 'mohamed.triki@company.com',
    phone: '+216 25 456 789',
    region: 'Centre',
    equipe_taille: 6,
    directeur: 'Leila Mansouri',
    status: 'actif',
    ca_equipe: '280 000 TND',
    objectif_equipe: '320 000 TND',
    date_promotion: '22/06/2020',
  },
  {
    id: 3,
    name: 'Nadia Karoui',
    email: 'nadia.karoui@company.com',
    phone: '+216 22 987 654',
    region: 'Sud',
    equipe_taille: 4,
    directeur: 'Samir Ben Mahmoud',
    status: 'en_conge',
    ca_equipe: '180 000 TND',
    objectif_equipe: '220 000 TND',
    date_promotion: '15/11/2022',
  },
  {
    id: 4,
    name: 'Tarek Sellami',
    email: 'tarek.sellami@company.com',
    phone: '+216 29 321 654',
    region: 'Ouest',
    equipe_taille: 5,
    directeur: 'Leila Mansouri',
    status: 'actif',
    ca_equipe: '295 000 TND',
    objectif_equipe: '300 000 TND',
    date_promotion: '03/09/2021',
  },
  {
    id: 5,
    name: 'Amira Jebali',
    email: 'amira.jebali@company.com',
    phone: '+216 24 159 753',
    region: 'Est',
    equipe_taille: 7,
    directeur: 'Samir Ben Mahmoud',
    status: 'suspendu',
    ca_equipe: '120 000 TND',
    objectif_equipe: '350 000 TND',
    date_promotion: '18/04/2022',
  },
]

const managersColumns = [
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
    header: 'Région',
    accessor: 'region',
    sortable: true,
    className: 'hidden sm:table-cell',
  },
  {
    header: 'Équipe',
    accessor: 'equipe_taille',
    className: 'hidden md:table-cell text-center',
    cell: row => `${row.equipe_taille} personnes`,
  },
  {
    header: 'Directeur',
    accessor: 'directeur',
    sortable: true,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'CA Équipe',
    accessor: 'ca_equipe',
    className: 'hidden xl:table-cell text-right',
  },
  {
    header: 'Status',
    accessor: 'status',
    sortable: true,
  },
]

// Configuration des champs du modal d'édition
const managersEditFields = [
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
    required: true,
    section: 'Informations personnelles',
    validate: value => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email invalide'
      }
    },
  },
  {
    key: 'phone',
    label: 'Téléphone',
    type: 'tel',
    required: true,
    section: 'Informations personnelles',
    placeholder: '+216 XX XXX XXX',
  },
  {
    key: 'region',
    label: 'Région',
    type: 'select',
    required: true,
    section: 'Affectation',
    options: [
      { value: 'Nord', label: 'Nord' },
      { value: 'Centre', label: 'Centre' },
      { value: 'Sud', label: 'Sud' },
      { value: 'Est', label: 'Est' },
      { value: 'Ouest', label: 'Ouest' },
    ],
  },
  {
    key: 'directeur',
    label: 'Directeur',
    type: 'select',
    required: true,
    section: 'Affectation',
    options: [
      { value: 'Samir Ben Mahmoud', label: 'Samir Ben Mahmoud' },
      { value: 'Leila Mansouri', label: 'Leila Mansouri' },
    ],
  },
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    required: true,
    section: 'Affectation',
    options: [
      { value: 'actif', label: 'Actif' },
      { value: 'inactif', label: 'Inactif' },
      { value: 'en_conge', label: 'En congé' },
      { value: 'suspendu', label: 'Suspendu' },
    ],
  },
  {
    key: 'objectif_equipe',
    label: 'Objectif équipe (TND)',
    type: 'text',
    section: 'Performance',
    placeholder: '400 000 TND',
  },
  {
    key: 'date_promotion',
    label: 'Date de promotion',
    type: 'date',
    section: 'Informations personnelles',
  },
]

export default function Managers() {
  const loading = useSimpleLoading(1000)

  // Utilisation de l'API réelle
  const { data: managersApi } = useManagers()

  // Utilisation du système de rôles pour filtrer les données
  const {
    data: filteredManagers,
    permissions,
    description,
  } = useEntityPage('managers', managersApi || managersData)
  // Préparation des données pour le tableau
  const tableData = useMemo(() => {
    if (!filteredManagers) return []
    return filteredManagers.map(manager => ({
      ...manager,
      name: manager.nom && manager.prenom ? `${manager.prenom} ${manager.nom}` : manager.name,
    }))
  }, [filteredManagers])

  const handleAddManager = () => {
    console.log('Ajouter un nouveau manager')
  }

  const handleEditManager = editedData => {
    console.log('Manager modifié:', editedData)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Managers</h1>
          <p className="text-muted-foreground text-base">
            Gestion des managers régionaux et suivi de leurs équipes
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Managers</h1>
        <p className="text-muted-foreground text-base">{description}</p>
      </div>

      <AdvancedDataTable
        title="Liste des Managers"
        description={description}
        data={tableData}
        columns={managersColumns}
        searchKey="name"
        onAdd={permissions.canAdd ? handleAddManager : undefined}
        addButtonText="Nouveau Manager"
        detailsPath="/managers"
        editFields={managersEditFields}
        onEdit={permissions.canEdit ? handleEditManager : undefined}
        onDelete={permissions.canDelete ? id => console.log('Delete manager', id) : undefined}
      />
    </div>
  )
}
