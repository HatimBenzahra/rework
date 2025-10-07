import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { TableSkeleton } from '@/components/LoadingSkeletons'

// Données exemple pour les directeurs
const directeursData = [
  {
    id: 1,
    name: 'Samir Ben Mahmoud',
    email: 'samir.benmahmoud@company.com',
    phone: '+216 20 100 200',
    division: 'Division Nord & Sud',
    managers_count: 3,
    commerciaux_count: 17,
    status: 'actif',
    ca_division: '820 000 TND',
    objectif_division: '950 000 TND',
    date_nomination: '01/01/2019',
    experience: '15 ans',
  },
  {
    id: 2,
    name: 'Leila Mansouri',
    email: 'leila.mansouri@company.com',
    phone: '+216 25 300 400',
    division: 'Division Centre & Ouest',
    managers_count: 2,
    commerciaux_count: 11,
    status: 'actif',
    ca_division: '575 000 TND',
    objectif_division: '620 000 TND',
    date_nomination: '12/03/2020',
    experience: '12 ans',
  },
  {
    id: 3,
    name: 'Hichem Bousnina',
    email: 'hichem.bousnina@company.com',
    phone: '+216 22 500 600',
    division: 'Division Internationale',
    managers_count: 1,
    commerciaux_count: 5,
    status: 'en_conge',
    ca_division: '420 000 TND',
    objectif_division: '500 000 TND',
    date_nomination: '08/09/2021',
    experience: '18 ans',
  },
  {
    id: 4,
    name: 'Monia Dridi',
    email: 'monia.dridi@company.com',
    phone: '+216 29 700 800',
    division: 'Division Grands Comptes',
    managers_count: 2,
    commerciaux_count: 8,
    status: 'actif',
    ca_division: '1 200 000 TND',
    objectif_division: '1 150 000 TND',
    date_nomination: '20/05/2022',
    experience: '20 ans',
  },
]

const directeursColumns = [
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
    header: 'Division',
    accessor: 'division',
    sortable: true,
    className: 'hidden sm:table-cell',
  },
  {
    header: 'Managers',
    accessor: 'managers_count',
    className: 'hidden md:table-cell text-center',
  },
  {
    header: 'Commerciaux',
    accessor: 'commerciaux_count',
    className: 'hidden md:table-cell text-center',
  },
  {
    header: 'CA Division',
    accessor: 'ca_division',
    className: 'hidden lg:table-cell text-right',
  },
  {
    header: 'Expérience',
    accessor: 'experience',
    className: 'hidden xl:table-cell',
  },
  {
    header: 'Status',
    accessor: 'status',
    sortable: true,
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
    key: 'division',
    label: 'Division',
    type: 'text',
    required: true,
    section: 'Affectation',
    placeholder: 'Ex: Division Nord & Sud',
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
    key: 'objectif_division',
    label: 'Objectif division (TND)',
    type: 'text',
    section: 'Performance',
    placeholder: '950 000 TND',
  },
  {
    key: 'experience',
    label: 'Expérience',
    type: 'text',
    section: 'Performance',
    placeholder: 'Ex: 15 ans',
  },
  {
    key: 'date_nomination',
    label: 'Date de nomination',
    type: 'date',
    section: 'Informations personnelles',
  },
]

export default function Directeurs() {
  const loading = useSimpleLoading(1000)

  const handleAddDirecteur = () => {
    console.log('Ajouter un nouveau directeur')
  }

  const handleEditDirecteur = editedData => {
    console.log('Directeur modifié:', editedData)
    // Appel API pour mettre à jour les données
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Directeurs</h1>
          <p className="text-muted-foreground text-base">
            Gestion des directeurs de division et supervision stratégique
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Directeurs</h1>
        <p className="text-muted-foreground text-base">
          Gestion des directeurs de division et supervision stratégique
        </p>
      </div>

      <AdvancedDataTable
        title="Liste des Directeurs"
        description="Direction exécutive avec vue d'ensemble des divisions et performances"
        data={directeursData}
        columns={directeursColumns}
        searchKey="name"
        onAdd={handleAddDirecteur}
        addButtonText="Nouveau Directeur"
        detailsPath="/directeurs"
        editFields={directeursEditFields}
        onEdit={handleEditDirecteur}
      />
    </div>
  )
}
