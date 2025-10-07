import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { TableSkeleton } from '@/components/LoadingSkeletons'

// Données exemple pour les commerciaux
const commerciauxData = [
  {
    id: 1,
    name: 'Ahmed Ben Ali',
    email: 'ahmed.benali@company.com',
    phone: '+216 20 123 456',
    zone: 'Tunis Centre',
    manager: 'Fatma Gharbi',
    status: 'actif',
    ventes_mois: '45 000 TND',
    objectif: '50 000 TND',
    date_embauche: '15/03/2022',
  },
  {
    id: 2,
    name: 'Sarra Mejri',
    email: 'sarra.mejri@company.com',
    phone: '+216 25 987 654',
    zone: 'Sfax',
    manager: 'Mohamed Triki',
    status: 'actif',
    ventes_mois: '52 000 TND',
    objectif: '50 000 TND',
    date_embauche: '08/07/2021',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 3,
    name: 'Karim Ouali',
    email: 'karim.ouali@company.com',
    phone: '+216 22 456 789',
    zone: 'Sousse',
    manager: 'Fatma Gharbi',
    status: 'en_conge',
    ventes_mois: '38 000 TND',
    objectif: '45 000 TND',
    date_embauche: '12/01/2023',
  },
  {
    id: 4,
    name: 'Ines Khediri',
    email: 'ines.khediri@company.com',
    phone: '+216 29 111 222',
    zone: 'Bizerte',
    manager: 'Mohamed Triki',
    status: 'actif',
    ventes_mois: '41 000 TND',
    objectif: '40 000 TND',
    date_embauche: '20/09/2022',
  },
  {
    id: 5,
    name: 'Youssef Hassine',
    email: 'youssef.hassine@company.com',
    phone: '+216 24 333 444',
    zone: 'Monastir',
    manager: 'Fatma Gharbi',
    status: 'inactif',
    ventes_mois: '12 000 TND',
    objectif: '35 000 TND',
    date_embauche: '05/11/2021',
  },
  {
    id: 6,
    name: 'Rim Bouaziz',
    email: 'rim.bouaziz@company.com',
    phone: '+216 27 555 666',
    zone: 'Nabeul',
    manager: 'Mohamed Triki',
    status: 'actif',
    ventes_mois: '48 000 TND',
    objectif: '45 000 TND',
    date_embauche: '14/04/2023',
  },
]

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
    accessor: 'phone',
    className: 'hidden sm:table-cell',
  },
  {
    header: 'Zone',
    accessor: 'zone',
    sortable: true,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Manager',
    accessor: 'manager',
    sortable: true,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Ventes/Mois',
    accessor: 'ventes_mois',
    className: 'hidden xl:table-cell text-right',
  },
  {
    header: 'Status',
    accessor: 'status',
    sortable: true,
  },
]

// Configuration des champs du modal d'édition
const commerciauxEditFields = [
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
    key: 'zone',
    label: 'Zone',
    type: 'select',
    required: true,
    section: 'Affectation',
    options: [
      { value: 'Tunis Centre', label: 'Tunis Centre' },
      { value: 'Sfax', label: 'Sfax' },
      { value: 'Sousse', label: 'Sousse' },
      { value: 'Bizerte', label: 'Bizerte' },
      { value: 'Monastir', label: 'Monastir' },
      { value: 'Nabeul', label: 'Nabeul' },
    ],
  },
  {
    key: 'manager',
    label: 'Manager',
    type: 'select',
    required: true,
    section: 'Affectation',
    options: [
      { value: 'Fatma Gharbi', label: 'Fatma Gharbi' },
      { value: 'Mohamed Triki', label: 'Mohamed Triki' },
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
    key: 'objectif',
    label: 'Objectif (TND)',
    type: 'text',
    section: 'Performance',
    placeholder: '50 000 TND',
  },
  {
    key: 'date_embauche',
    label: 'Date d\'embauche',
    type: 'date',
    section: 'Informations personnelles',
  },
]

export default function Commerciaux() {
  const loading = useSimpleLoading(1000)

  const handleAddCommercial = () => {
    console.log('Ajouter un nouveau commercial')
  }

  const handleEditCommercial = editedData => {
    console.log('Commercial modifié:', editedData)
    // Ici, vous ferez un appel API pour mettre à jour les données
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
        description="Tous les commerciaux de l'entreprise avec leurs informations et performances"
        data={commerciauxData}
        columns={commerciauxColumns}
        searchKey="name"
        onAdd={handleAddCommercial}
        addButtonText="Nouveau Commercial"
        detailsPath="/commerciaux"
        editFields={commerciauxEditFields}
        onEdit={handleEditCommercial}
      />
    </div>
  )
}
