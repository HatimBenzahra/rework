import { AdvancedDataTable } from "@/components/tableau"

// Données exemple pour les commerciaux
const commerciauxData = [
  {
    id: 1,
    name: "Ahmed Ben Ali",
    email: "ahmed.benali@company.com",
    phone: "+216 20 123 456",
    zone: "Tunis Centre",
    manager: "Fatma Gharbi",
    status: "actif",
    ventes_mois: "45 000 TND",
    objectif: "50 000 TND",
    date_embauche: "15/03/2022"
  },
  {
    id: 2,
    name: "Sarra Mejri",
    email: "sarra.mejri@company.com",
    phone: "+216 25 987 654",
    zone: "Sfax",
    manager: "Mohamed Triki",
    status: "actif",
    ventes_mois: "52 000 TND",
    objectif: "50 000 TND",
    date_embauche: "08/07/2021"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 3,
    name: "Karim Ouali",
    email: "karim.ouali@company.com",
    phone: "+216 22 456 789",
    zone: "Sousse",
    manager: "Fatma Gharbi",
    status: "en_conge",
    ventes_mois: "38 000 TND",
    objectif: "45 000 TND",
    date_embauche: "12/01/2023"
  },
  {
    id: 4,
    name: "Ines Khediri",
    email: "ines.khediri@company.com",
    phone: "+216 29 111 222",
    zone: "Bizerte",
    manager: "Mohamed Triki",
    status: "actif",
    ventes_mois: "41 000 TND",
    objectif: "40 000 TND",
    date_embauche: "20/09/2022"
  },
  {
    id: 5,
    name: "Youssef Hassine",
    email: "youssef.hassine@company.com",
    phone: "+216 24 333 444",
    zone: "Monastir",
    manager: "Fatma Gharbi",
    status: "inactif",
    ventes_mois: "12 000 TND",
    objectif: "35 000 TND",
    date_embauche: "05/11/2021"
  },
  {
    id: 6,
    name: "Rim Bouaziz",
    email: "rim.bouaziz@company.com",
    phone: "+216 27 555 666",
    zone: "Nabeul",
    manager: "Mohamed Triki",
    status: "actif",
    ventes_mois: "48 000 TND",
    objectif: "45 000 TND",
    date_embauche: "14/04/2023"
  }
]

const commerciauxColumns = [
  { 
    header: "Nom", 
    accessor: "name", 
    sortable: true,
    className: "font-medium"
  },
  { 
    header: "Email", 
    accessor: "email", 
    sortable: true 
  },
  
  { 
    header: "Téléphone", 
    accessor: "phone",
    className: "hidden sm:table-cell"
  },
  { 
    header: "Zone", 
    accessor: "zone", 
    sortable: true,
    className: "hidden md:table-cell"
  },
  { 
    header: "Manager", 
    accessor: "manager", 
    sortable: true,
    className: "hidden lg:table-cell"
  },
  { 
    header: "Ventes/Mois", 
    accessor: "ventes_mois",
    className: "hidden xl:table-cell text-right"
  },
  { 
    header: "Status", 
    accessor: "status", 
    sortable: true 
  }
]

export default function Commerciaux() {
  const handleAddCommercial = () => {
    console.log("Ajouter un nouveau commercial")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commerciaux</h1>
        <p className="text-muted-foreground">
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
      />
    </div>
  )
}