import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { TableSkeleton } from '@/components/LoadingSkeletons'

// Données exemple pour les immeubles
const immeublesData = [
  {
    id: 1,
    name: 'Résidence Les Jasmins',
    address: '45 Avenue Habib Bourguiba, Tunis',
    zone: 'Tunis Centre',
    floors: 8,
    apartments: 24,
    status: 'actif',
    occupancy_rate: '95%',
    monthly_revenue: '42 000 TND',
    manager: 'Ahmed Ben Ali',
    year_built: '2018',
  },
  {
    id: 2,
    name: 'Tour du Lac',
    address: '12 Rue du Lac Victoria, Tunis',
    zone: 'Les Berges du Lac',
    floors: 15,
    apartments: 60,
    status: 'actif',
    occupancy_rate: '88%',
    monthly_revenue: '125 000 TND',
    manager: 'Fatma Gharbi',
    year_built: '2020',
  },
  {
    id: 3,
    name: 'Immeuble El Manar',
    address: '78 Avenue de la République, Sfax',
    zone: 'Sfax',
    floors: 6,
    apartments: 18,
    status: 'en_renovation',
    occupancy_rate: '50%',
    monthly_revenue: '15 000 TND',
    manager: 'Sarra Mejri',
    year_built: '2010',
  },
  {
    id: 4,
    name: 'Résidence Corniche',
    address: '23 Boulevard de la Corniche, Sousse',
    zone: 'Sousse',
    floors: 10,
    apartments: 40,
    status: 'actif',
    occupancy_rate: '92%',
    monthly_revenue: '68 000 TND',
    manager: 'Karim Ouali',
    year_built: '2019',
  },
  {
    id: 5,
    name: 'Résidence Palmiers',
    address: '56 Rue des Palmiers, Monastir',
    zone: 'Monastir',
    floors: 5,
    apartments: 15,
    status: 'actif',
    occupancy_rate: '100%',
    monthly_revenue: '28 000 TND',
    manager: 'Youssef Hassine',
    year_built: '2021',
  },
  {
    id: 6,
    name: 'Tour Panorama',
    address: '89 Avenue Farhat Hached, Bizerte',
    zone: 'Bizerte',
    floors: 12,
    apartments: 48,
    status: 'actif',
    occupancy_rate: '85%',
    monthly_revenue: '82 000 TND',
    manager: 'Ines Khediri',
    year_built: '2017',
  },
  {
    id: 7,
    name: 'Résidence El Amal',
    address: '34 Rue de la Liberté, Nabeul',
    zone: 'Nabeul',
    floors: 4,
    apartments: 12,
    status: 'complet',
    occupancy_rate: '100%',
    monthly_revenue: '22 000 TND',
    manager: 'Rim Bouaziz',
    year_built: '2022',
  },
  {
    id: 8,
    name: 'Immeuble Al Fajr',
    address: '67 Boulevard 7 Novembre, Tunis',
    zone: 'Tunis Centre',
    floors: 7,
    apartments: 21,
    status: 'actif',
    occupancy_rate: '78%',
    monthly_revenue: '35 000 TND',
    manager: 'Ahmed Ben Ali',
    year_built: '2015',
  },
  {
    id: 9,
    name: 'Résidence Carthage',
    address: '101 Route de La Marsa, Carthage',
    zone: 'Carthage',
    floors: 6,
    apartments: 18,
    status: 'en_maintenance',
    occupancy_rate: '83%',
    monthly_revenue: '45 000 TND',
    manager: 'Mohamed Triki',
    year_built: '2016',
  },
  {
    id: 10,
    name: 'Tour Business Center',
    address: '15 Avenue Mohamed V, Tunis',
    zone: 'Tunis Centre',
    floors: 20,
    apartments: 80,
    status: 'actif',
    occupancy_rate: '97%',
    monthly_revenue: '185 000 TND',
    manager: 'Fatma Gharbi',
    year_built: '2021',
  },
]

const immeublesColumns = [
  {
    header: 'Nom',
    accessor: 'name',
    sortable: true,
    className: 'font-medium',
  },
  {
    header: 'Adresse',
    accessor: 'address',
    sortable: true,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Zone',
    accessor: 'zone',
    sortable: true,
    className: 'hidden sm:table-cell',
  },
  {
    header: 'Étages',
    accessor: 'floors',
    className: 'hidden md:table-cell text-center',
  },
  {
    header: 'Appartements',
    accessor: 'apartments',
    className: 'hidden md:table-cell text-center',
  },
  {
    header: 'Taux Occupation',
    accessor: 'occupancy_rate',
    sortable: true,
    className: 'hidden xl:table-cell text-right',
  },
  {
    header: 'Revenu/Mois',
    accessor: 'monthly_revenue',
    className: 'hidden xl:table-cell text-right',
  },
  {
    header: 'Status',
    accessor: 'status',
    sortable: true,
  },
]

// Configuration des champs du modal d'édition
const immeublesEditFields = [
  {
    key: 'name',
    label: "Nom de l'immeuble",
    type: 'text',
    required: true,
    section: 'Informations générales',
  },
  {
    key: 'address',
    label: 'Adresse',
    type: 'textarea',
    required: true,
    section: 'Informations générales',
    fullWidth: true,
    placeholder: 'Adresse complète',
  },
  {
    key: 'zone',
    label: 'Zone',
    type: 'select',
    required: true,
    section: 'Informations générales',
    options: [
      { value: 'Tunis Centre', label: 'Tunis Centre' },
      { value: 'Les Berges du Lac', label: 'Les Berges du Lac' },
      { value: 'Sfax', label: 'Sfax' },
      { value: 'Sousse', label: 'Sousse' },
      { value: 'Monastir', label: 'Monastir' },
      { value: 'Bizerte', label: 'Bizerte' },
      { value: 'Nabeul', label: 'Nabeul' },
      { value: 'Carthage', label: 'Carthage' },
    ],
  },
  {
    key: 'floors',
    label: "Nombre d'étages",
    type: 'number',
    required: true,
    section: 'Caractéristiques',
  },
  {
    key: 'apartments',
    label: "Nombre d'appartements",
    type: 'number',
    required: true,
    section: 'Caractéristiques',
  },
  {
    key: 'manager',
    label: 'Gestionnaire',
    type: 'select',
    section: 'Gestion',
    options: [
      { value: 'Ahmed Ben Ali', label: 'Ahmed Ben Ali' },
      { value: 'Fatma Gharbi', label: 'Fatma Gharbi' },
      { value: 'Mohamed Triki', label: 'Mohamed Triki' },
    ],
  },
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    required: true,
    section: 'Gestion',
    options: [
      { value: 'actif', label: 'Actif' },
      { value: 'en_renovation', label: 'En rénovation' },
      { value: 'en_maintenance', label: 'En maintenance' },
      { value: 'complet', label: 'Complet' },
    ],
  },
  {
    key: 'year_built',
    label: 'Année de construction',
    type: 'text',
    section: 'Caractéristiques',
    placeholder: '2020',
  },
]

export default function Immeubles() {
  const loading = useSimpleLoading(1000)

  const handleAddImmeuble = () => {
    console.log('Ajouter un nouveau immeuble')
  }

  const handleEditImmeuble = editedData => {
    console.log('Immeuble modifié:', editedData)
    // Appel API pour mettre à jour les données
  }

  if (loading) {
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
        <p className="text-muted-foreground text-base">
          Gestion du patrimoine immobilier et suivi des propriétés
        </p>
      </div>

      <AdvancedDataTable
        title="Liste des Immeubles"
        description="Tous les immeubles du portefeuille avec leurs caractéristiques et performances"
        data={immeublesData}
        columns={immeublesColumns}
        searchKey="name"
        onAdd={handleAddImmeuble}
        addButtonText="Nouvel Immeuble"
        detailsPath="/immeubles"
        editFields={immeublesEditFields}
        onEdit={handleEditImmeuble}
      />
    </div>
  )
}
