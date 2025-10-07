import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { TableSkeleton } from '@/components/LoadingSkeletons'

// Données exemple pour les zones
const zonesData = [
  {
    id: 1,
    name: 'Tunis Centre',
    region: 'Grand Tunis',
    immeubles_count: 12,
    total_apartments: 280,
    manager: 'Fatma Gharbi',
    status: 'actif',
    occupancy_rate: '91%',
    monthly_revenue: '485 000 TND',
    commercial_count: 5,
    description: 'Zone principale du centre-ville',
  },
  {
    id: 2,
    name: 'Les Berges du Lac',
    region: 'Grand Tunis',
    immeubles_count: 8,
    total_apartments: 320,
    manager: 'Mohamed Triki',
    status: 'actif',
    occupancy_rate: '95%',
    monthly_revenue: '720 000 TND',
    commercial_count: 4,
    description: 'Zone résidentielle premium',
  },
  {
    id: 3,
    name: 'Sfax',
    region: 'Centre',
    immeubles_count: 6,
    total_apartments: 156,
    manager: 'Nadia Karoui',
    status: 'actif',
    occupancy_rate: '82%',
    monthly_revenue: '285 000 TND',
    commercial_count: 3,
    description: 'Deuxième ville économique',
  },
  {
    id: 4,
    name: 'Sousse',
    region: 'Sahel',
    immeubles_count: 10,
    total_apartments: 245,
    manager: 'Tarek Sellami',
    status: 'actif',
    occupancy_rate: '88%',
    monthly_revenue: '425 000 TND',
    commercial_count: 6,
    description: 'Zone touristique et résidentielle',
  },
  {
    id: 5,
    name: 'Monastir',
    region: 'Sahel',
    immeubles_count: 4,
    total_apartments: 98,
    manager: 'Fatma Gharbi',
    status: 'actif',
    occupancy_rate: '93%',
    monthly_revenue: '175 000 TND',
    commercial_count: 2,
    description: 'Zone côtière résidentielle',
  },
  {
    id: 6,
    name: 'Bizerte',
    region: 'Nord',
    immeubles_count: 7,
    total_apartments: 182,
    manager: 'Mohamed Triki',
    status: 'actif',
    occupancy_rate: '85%',
    monthly_revenue: '315 000 TND',
    commercial_count: 4,
    description: 'Zone portuaire en développement',
  },
  {
    id: 7,
    name: 'Nabeul',
    region: 'Cap Bon',
    immeubles_count: 5,
    total_apartments: 125,
    manager: 'Amira Jebali',
    status: 'en_developpement',
    occupancy_rate: '78%',
    monthly_revenue: '195 000 TND',
    commercial_count: 3,
    description: 'Zone balnéaire en expansion',
  },
  {
    id: 8,
    name: 'Carthage',
    region: 'Grand Tunis',
    immeubles_count: 3,
    total_apartments: 72,
    manager: 'Fatma Gharbi',
    status: 'actif',
    occupancy_rate: '97%',
    monthly_revenue: '245 000 TND',
    commercial_count: 2,
    description: 'Zone historique haut standing',
  },
  {
    id: 9,
    name: 'Ariana',
    region: 'Grand Tunis',
    immeubles_count: 9,
    total_apartments: 215,
    manager: 'Mohamed Triki',
    status: 'actif',
    occupancy_rate: '89%',
    monthly_revenue: '380 000 TND',
    commercial_count: 5,
    description: 'Zone résidentielle dynamique',
  },
  {
    id: 10,
    name: 'Hammamet',
    region: 'Cap Bon',
    immeubles_count: 6,
    total_apartments: 168,
    manager: 'Tarek Sellami',
    status: 'saisonnier',
    occupancy_rate: '75%',
    monthly_revenue: '295 000 TND',
    commercial_count: 3,
    description: 'Zone touristique internationale',
  },
]

const zonesColumns = [
  {
    header: 'Nom',
    accessor: 'name',
    sortable: true,
    className: 'font-medium',
  },
  {
    header: 'Région',
    accessor: 'region',
    sortable: true,
    className: 'hidden sm:table-cell',
  },
  {
    header: 'Immeubles',
    accessor: 'immeubles_count',
    sortable: true,
    className: 'hidden md:table-cell text-center',
  },
  {
    header: 'Appartements',
    accessor: 'total_apartments',
    className: 'hidden md:table-cell text-center',
  },
  {
    header: 'Manager',
    accessor: 'manager',
    sortable: true,
    className: 'hidden lg:table-cell',
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
const zonesEditFields = [
  {
    key: 'name',
    label: 'Nom de la zone',
    type: 'text',
    required: true,
    section: 'Informations générales',
  },
  {
    key: 'region',
    label: 'Région',
    type: 'select',
    required: true,
    section: 'Informations générales',
    options: [
      { value: 'Grand Tunis', label: 'Grand Tunis' },
      { value: 'Centre', label: 'Centre' },
      { value: 'Sahel', label: 'Sahel' },
      { value: 'Nord', label: 'Nord' },
      { value: 'Cap Bon', label: 'Cap Bon' },
    ],
  },
  {
    key: 'description',
    label: 'Description',
    type: 'textarea',
    section: 'Informations générales',
    fullWidth: true,
    placeholder: 'Description de la zone',
  },
  {
    key: 'manager',
    label: 'Manager responsable',
    type: 'select',
    required: true,
    section: 'Gestion',
    options: [
      { value: 'Fatma Gharbi', label: 'Fatma Gharbi' },
      { value: 'Mohamed Triki', label: 'Mohamed Triki' },
      { value: 'Nadia Karoui', label: 'Nadia Karoui' },
      { value: 'Tarek Sellami', label: 'Tarek Sellami' },
      { value: 'Amira Jebali', label: 'Amira Jebali' },
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
      { value: 'en_developpement', label: 'En développement' },
      { value: 'saisonnier', label: 'Saisonnier' },
    ],
  },
  {
    key: 'immeubles_count',
    label: 'Nombre d\'immeubles',
    type: 'number',
    section: 'Statistiques',
  },
  {
    key: 'commercial_count',
    label: 'Nombre de commerciaux',
    type: 'number',
    section: 'Statistiques',
  },
]

export default function Zones() {
  const loading = useSimpleLoading(1000)

  const handleAddZone = () => {
    console.log('Ajouter une nouvelle zone')
  }

  const handleEditZone = editedData => {
    console.log('Zone modifiée:', editedData)
    // Appel API pour mettre à jour les données
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Zones</h1>
          <p className="text-muted-foreground text-base">
            Gestion des zones géographiques et suivi des performances territoriales
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Zones</h1>
        <p className="text-muted-foreground text-base">
          Gestion des zones géographiques et suivi des performances territoriales
        </p>
      </div>

      <AdvancedDataTable
        title="Liste des Zones"
        description="Toutes les zones de couverture avec leurs statistiques et performances"
        data={zonesData}
        columns={zonesColumns}
        searchKey="name"
        onAdd={handleAddZone}
        addButtonText="Nouvelle Zone"
        detailsPath="/zones"
        editFields={zonesEditFields}
        onEdit={handleEditZone}
      />
    </div>
  )
}

