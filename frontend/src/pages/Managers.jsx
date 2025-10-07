import { AdvancedDataTable } from '@/components/tableau'

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

export default function Managers() {
  const handleAddManager = () => {
    console.log('Ajouter un nouveau manager')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Managers</h1>
        <p className="text-muted-foreground text-base">
          Gestion des managers régionaux et suivi de leurs équipes
        </p>
      </div>

      <AdvancedDataTable
        title="Liste des Managers"
        description="Tous les managers avec leurs équipes et performances régionales"
        data={managersData}
        columns={managersColumns}
        searchKey="name"
        onAdd={handleAddManager}
        addButtonText="Nouveau Manager"
        detailsPath="/managers"
      />
    </div>
  )
}
