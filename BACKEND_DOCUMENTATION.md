# Documentation Backend - Re_work

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Schéma de base de données](#schéma-de-base-de-données)
4. [API GraphQL](#api-graphql)
5. [Correspondance Frontend-Backend](#correspondance-frontend-backend)
6. [Services Backend](#services-backend)

---

## 🎯 Vue d'ensemble

**Backend**: NestJS + GraphQL + Prisma + PostgreSQL
**Frontend**: React + Apollo/GraphQL Client
**Port**: 3000 (backend) | 5173 (frontend)
**GraphQL Playground**: http://localhost:3000/graphql

### Technologies utilisées

- **Framework**: NestJS
- **API**: GraphQL (Apollo Server)
- **ORM**: Prisma
- **Base de données**: PostgreSQL
- **Authentification**: CORS activé pour les origines locales

---

## 🏗️ Architecture

### Structure des modules

```
backend/
├── src/
│   ├── commercial/          # Gestion des commerciaux
│   │   ├── commercial.service.ts
│   │   ├── commercial.resolver.ts
│   │   ├── commercial.dto.ts
│   │   └── commercial.module.ts
│   ├── directeur/           # Gestion des directeurs
│   ├── manager/             # Gestion des managers
│   ├── zone/                # Gestion des zones géographiques
│   ├── immeuble/            # Gestion des immeubles
│   ├── statistic/           # Gestion des statistiques
│   ├── prisma.service.ts    # Service Prisma global
│   ├── app.module.ts        # Module principal
│   ├── schema.gql           # Schéma GraphQL auto-généré
│   └── main.ts              # Point d'entrée
└── prisma/
    ├── schema.prisma         # Schéma de la base de données
    └── seed.ts               # Données de test
```

### Configuration CORS

```typescript
app.enableCors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});
```

---

## 🗄️ Schéma de base de données

### Modèles Prisma

#### 1. **Directeur** (Directeur commercial)

```prisma
model Directeur {
  id            Int         @id @default(autoincrement())
  nom           String
  prenom        String
  adresse       String?
  email         String?     @unique
  numTelephone  String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  managers      Manager[]
  commercials   Commercial[]
  zones         Zone[]
}
```

**Relations**:

- Un directeur peut gérer plusieurs managers
- Un directeur peut superviser plusieurs commerciaux
- Un directeur peut être assigné à plusieurs zones

---

#### 2. **Manager** (Manager régional)

```prisma
model Manager {
  id            Int         @id @default(autoincrement())
  nom           String
  prenom        String
  email         String?     @unique
  numTelephone  String?
  directeurId   Int?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  directeur     Directeur?  @relation(fields: [directeurId], references: [id])
  commercials   Commercial[]
  zones         Zone[]
}
```

**Relations**:

- Un manager appartient à un directeur (optionnel)
- Un manager peut gérer plusieurs commerciaux
- Un manager peut être assigné à plusieurs zones

---

#### 3. **Commercial** (Agent commercial)

```prisma
model Commercial {
  id            Int         @id @default(autoincrement())
  nom           String
  prenom        String
  email         String?     @unique
  numTel        String?
  age           Int?
  managerId     Int?
  directeurId   Int?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  manager       Manager?         @relation(fields: [managerId], references: [id])
  directeur     Directeur?       @relation(fields: [directeurId], references: [id])
  immeubles     Immeuble[]
  zones         CommercialZone[]
  statistics    Statistic[]
}
```

**Relations**:

- Un commercial peut avoir un manager (optionnel)
- Un commercial peut avoir un directeur (optionnel)
- Un commercial peut gérer plusieurs immeubles
- Un commercial peut être assigné à plusieurs zones (many-to-many via CommercialZone)
- Un commercial a plusieurs statistiques

---

#### 4. **Zone** (Zone géographique)

```prisma
model Zone {
  id            Int         @id @default(autoincrement())
  nom           String
  xOrigin       Float       // Longitude du centre
  yOrigin       Float       // Latitude du centre
  rayon         Float       // Rayon en mètres
  directeurId   Int?
  managerId     Int?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  directeur     Directeur?       @relation(fields: [directeurId], references: [id])
  manager       Manager?         @relation(fields: [managerId], references: [id])
  commercials   CommercialZone[]
  statistics    Statistic[]
}
```

**Relations**:

- Une zone peut être assignée à un directeur (optionnel)
- Une zone peut être assignée à un manager (optionnel)
- Une zone peut avoir plusieurs commerciaux (many-to-many)
- Une zone a plusieurs statistiques

**Note**: La zone est définie par un cercle (xOrigin, yOrigin, rayon) pour la géolocalisation.

---

#### 5. **Immeuble** (Bâtiment à prospecter)

```prisma
model Immeuble {
  id                Int         @id @default(autoincrement())
  adresse           String
  nbEtages          Int
  nbPortesParEtage  Int
  commercialId      Int?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  commercial        Commercial? @relation(fields: [commercialId], references: [id])
  statistics        Statistic[]
}
```

**Relations**:

- Un immeuble est assigné à un commercial (optionnel)
- Un immeuble a plusieurs statistiques

---

#### 6. **Statistic** (Statistiques de prospection)

```prisma
model Statistic {
  id                      Int         @id @default(autoincrement())
  commercialId            Int?
  immeubleId              Int?
  zoneId                  Int?
  contratsSignes          Int         // Nombre de contrats signés
  immeublesVisites        Int         // Nombre d'immeubles visités
  rendezVousPris          Int         // Nombre de rendez-vous pris
  refus                   Int         // Nombre de refus
  nbImmeublesProspectes   Int         // Nombre d'immeubles prospectés
  nbPortesProspectes      Int         // Nombre de portes prospectées
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt

  // Relations
  commercial              Commercial? @relation(fields: [commercialId], references: [id])
  immeuble                Immeuble?   @relation(fields: [immeubleId], references: [id])
  zone                    Zone?       @relation(fields: [zoneId], references: [id])
}
```

**Relations**:

- Une statistique peut être liée à un commercial (optionnel)
- Une statistique peut être liée à un immeuble (optionnel)
- Une statistique peut être liée à une zone (optionnel)

---

#### 7. **CommercialZone** (Table de liaison many-to-many)

```prisma
model CommercialZone {
  id            Int        @id @default(autoincrement())
  commercialId  Int
  zoneId        Int
  createdAt     DateTime   @default(now())

  commercial    Commercial @relation(fields: [commercialId], references: [id])
  zone          Zone       @relation(fields: [zoneId], references: [id])

  @@unique([commercialId, zoneId])
}
```

**Relations**:

- Table de jonction pour la relation many-to-many entre Commercial et Zone
- Un commercial peut être assigné à plusieurs zones
- Une zone peut avoir plusieurs commerciaux

---

## 📡 API GraphQL

### Queries (Lecture de données)

#### Directeurs

```graphql
# Récupérer tous les directeurs
query GetDirecteurs {
  directeurs {
    id
    nom
    prenom
    email
    numTelephone
    adresse
    createdAt
    updatedAt
  }
}

# Récupérer un directeur par ID
query GetDirecteur($id: Int!) {
  directeur(id: $id) {
    id
    nom
    prenom
    email
    numTelephone
    adresse
    createdAt
    updatedAt
  }
}
```

#### Managers

```graphql
# Récupérer tous les managers
query GetManagers {
  managers {
    id
    nom
    prenom
    email
    numTelephone
    directeurId
    createdAt
    updatedAt
  }
}

# Récupérer un manager par ID
query GetManager($id: Int!) {
  manager(id: $id) {
    id
    nom
    prenom
    email
    numTelephone
    directeurId
    createdAt
    updatedAt
  }
}
```

#### Commerciaux

```graphql
# Récupérer tous les commerciaux (légère, sans relations)
query GetCommercials {
  commercials {
    id
    nom
    prenom
    email
    numTel
    age
    managerId
    directeurId
    createdAt
    updatedAt
  }
}

# Récupérer un commercial avec toutes ses relations (détails complets)
query GetCommercialFull($id: Int!) {
  commercial(id: $id) {
    id
    nom
    prenom
    email
    numTel
    age
    managerId
    directeurId
    createdAt
    updatedAt
    immeubles {
      id
      adresse
      nbEtages
      nbPortesParEtage
      commercialId
      createdAt
      updatedAt
    }
    zones {
      id
      nom
      xOrigin
      yOrigin
      rayon
      directeurId
      managerId
      commercials {
        id
        commercialId
        zoneId
      }
      createdAt
      updatedAt
    }
    statistics {
      id
      commercialId
      contratsSignes
      immeublesVisites
      rendezVousPris
      refus
      createdAt
      updatedAt
    }
  }
}
```

#### Zones

```graphql
# Récupérer toutes les zones
query GetZones {
  zones {
    id
    nom
    xOrigin
    yOrigin
    rayon
    directeurId
    managerId
    commercials {
      id
      commercialId
      zoneId
    }
    createdAt
    updatedAt
  }
}

# Récupérer une zone par ID
query GetZone($id: Int!) {
  zone(id: $id) {
    id
    nom
    xOrigin
    yOrigin
    rayon
    directeurId
    managerId
    commercials {
      id
      commercialId
      zoneId
    }
    createdAt
    updatedAt
  }
}

# Récupérer les zones avec leurs commerciaux
query GetZonesWithCommercials {
  commercials {
    id
    nom
    prenom
    zones {
      id
      nom
      xOrigin
      yOrigin
      rayon
      directeurId
      managerId
      commercials {
        id
        commercialId
        zoneId
      }
      createdAt
      updatedAt
    }
  }
}
```

#### Immeubles

```graphql
# Récupérer tous les immeubles
query GetImmeubles {
  immeubles {
    id
    adresse
    nbEtages
    nbPortesParEtage
    commercialId
    createdAt
    updatedAt
  }
}

# Récupérer un immeuble par ID
query GetImmeuble($id: Int!) {
  immeuble(id: $id) {
    id
    adresse
    nbEtages
    nbPortesParEtage
    commercialId
    createdAt
    updatedAt
  }
}
```

#### Statistiques

```graphql
# Récupérer toutes les statistiques
query GetStatistics {
  statistics {
    id
    commercialId
    contratsSignes
    immeublesVisites
    rendezVousPris
    refus
    createdAt
    updatedAt
  }
}

# Récupérer une statistique par ID
query GetStatistic($id: Int!) {
  statistic(id: $id) {
    id
    commercialId
    contratsSignes
    immeublesVisites
    rendezVousPris
    refus
    createdAt
    updatedAt
  }
}
```

---

### Mutations (Création, modification, suppression)

#### Directeurs

```graphql
# Créer un directeur
mutation CreateDirecteur($createDirecteurInput: CreateDirecteurInput!) {
  createDirecteur(createDirecteurInput: $createDirecteurInput) {
    id
    nom
    prenom
    email
    numTelephone
    adresse
    createdAt
    updatedAt
  }
}

# Modifier un directeur
mutation UpdateDirecteur($updateDirecteurInput: UpdateDirecteurInput!) {
  updateDirecteur(updateDirecteurInput: $updateDirecteurInput) {
    id
    nom
    prenom
    email
    numTelephone
    adresse
    createdAt
    updatedAt
  }
}

# Supprimer un directeur
mutation RemoveDirecteur($id: Int!) {
  removeDirecteur(id: $id) {
    id
    nom
    prenom
  }
}
```

#### Managers

```graphql
# Créer un manager
mutation CreateManager($createManagerInput: CreateManagerInput!) {
  createManager(createManagerInput: $createManagerInput) {
    id
    nom
    prenom
    email
    numTelephone
    directeurId
    createdAt
    updatedAt
  }
}

# Modifier un manager
mutation UpdateManager($updateManagerInput: UpdateManagerInput!) {
  updateManager(updateManagerInput: $updateManagerInput) {
    id
    nom
    prenom
    email
    numTelephone
    directeurId
    createdAt
    updatedAt
  }
}

# Supprimer un manager
mutation RemoveManager($id: Int!) {
  removeManager(id: $id) {
    id
    nom
    prenom
  }
}
```

#### Commerciaux

```graphql
# Créer un commercial
mutation CreateCommercial($createCommercialInput: CreateCommercialInput!) {
  createCommercial(createCommercialInput: $createCommercialInput) {
    id
    nom
    prenom
    email
    numTel
    age
    managerId
    directeurId
    createdAt
    updatedAt
  }
}

# Modifier un commercial
mutation UpdateCommercial($updateCommercialInput: UpdateCommercialInput!) {
  updateCommercial(updateCommercialInput: $updateCommercialInput) {
    id
    nom
    prenom
    email
    numTel
    age
    managerId
    directeurId
    createdAt
    updatedAt
  }
}

# Supprimer un commercial
mutation RemoveCommercial($id: Int!) {
  removeCommercial(id: $id) {
    id
    nom
    prenom
  }
}
```

#### Zones

```graphql
# Créer une zone
mutation CreateZone($createZoneInput: CreateZoneInput!) {
  createZone(createZoneInput: $createZoneInput) {
    id
    nom
    xOrigin
    yOrigin
    rayon
    directeurId
    managerId
    commercials {
      id
      commercialId
      zoneId
    }
    createdAt
    updatedAt
  }
}

# Modifier une zone
mutation UpdateZone($updateZoneInput: UpdateZoneInput!) {
  updateZone(updateZoneInput: $updateZoneInput) {
    id
    nom
    xOrigin
    yOrigin
    rayon
    directeurId
    managerId
    commercials {
      id
      commercialId
      zoneId
    }
    createdAt
    updatedAt
  }
}

# Supprimer une zone
mutation RemoveZone($id: Int!) {
  removeZone(id: $id) {
    id
    nom
  }
}

# Assigner une zone à un commercial
mutation AssignZoneToCommercial($commercialId: Int!, $zoneId: Int!) {
  assignZoneToCommercial(commercialId: $commercialId, zoneId: $zoneId)
}

# Désassigner une zone d'un commercial
mutation UnassignZoneFromCommercial($commercialId: Int!, $zoneId: Int!) {
  unassignZoneFromCommercial(commercialId: $commercialId, zoneId: $zoneId)
}
```

#### Immeubles

```graphql
# Créer un immeuble
mutation CreateImmeuble($createImmeubleInput: CreateImmeubleInput!) {
  createImmeuble(createImmeubleInput: $createImmeubleInput) {
    id
    adresse
    nbEtages
    nbPortesParEtage
    commercialId
    createdAt
    updatedAt
  }
}

# Modifier un immeuble
mutation UpdateImmeuble($updateImmeubleInput: UpdateImmeubleInput!) {
  updateImmeuble(updateImmeubleInput: $updateImmeubleInput) {
    id
    adresse
    nbEtages
    nbPortesParEtage
    commercialId
    createdAt
    updatedAt
  }
}

# Supprimer un immeuble
mutation RemoveImmeuble($id: Int!) {
  removeImmeuble(id: $id) {
    id
    adresse
  }
}
```

#### Statistiques

```graphql
# Créer une statistique
mutation CreateStatistic($createStatisticInput: CreateStatisticInput!) {
  createStatistic(createStatisticInput: $createStatisticInput) {
    id
    commercialId
    contratsSignes
    immeublesVisites
    rendezVousPris
    refus
    createdAt
    updatedAt
  }
}

# Modifier une statistique
mutation UpdateStatistic($updateStatisticInput: UpdateStatisticInput!) {
  updateStatistic(updateStatisticInput: $updateStatisticInput) {
    id
    commercialId
    contratsSignes
    immeublesVisites
    rendezVousPris
    refus
    createdAt
    updatedAt
  }
}

# Supprimer une statistique
mutation RemoveStatistic($id: Int!) {
  removeStatistic(id: $id) {
    id
  }
}
```

---

## 🔗 Correspondance Frontend-Backend

### Page: **Dashboard** (`/dashboard`)

**Fichier**: `frontend/src/pages/dashboard/Dashboard.jsx`

**Backend utilisé**: Aucun (page statique d'accueil)

---

### Page: **Directeurs** (`/directeurs`)

**Fichier**: `frontend/src/pages/directeurs/Directeurs.jsx`

#### Queries utilisées:

| Query            | Endpoint GraphQL | Utilisation                                             |
| ---------------- | ---------------- | ------------------------------------------------------- |
| `GET_DIRECTEURS` | `directeurs`     | Charge la liste complète des directeurs pour le tableau |
| `GET_DIRECTEUR`  | `directeur(id)`  | Charge un directeur spécifique (si page détails)        |

#### Mutations utilisées:

| Mutation           | Endpoint GraphQL  | Utilisation                                  |
| ------------------ | ----------------- | -------------------------------------------- |
| `CREATE_DIRECTEUR` | `createDirecteur` | Création d'un nouveau directeur via le modal |
| `UPDATE_DIRECTEUR` | `updateDirecteur` | Modification d'un directeur existant         |
| `REMOVE_DIRECTEUR` | `removeDirecteur` | Suppression d'un directeur                   |

#### Hooks React utilisés:

- `useDirecteurs()` - Récupère la liste des directeurs
- `useCreateDirecteur()` - Crée un directeur
- `useUpdateDirecteur()` - Modifie un directeur
- `useRemoveDirecteur()` - Supprime un directeur

#### Fonctionnalités:

- ✅ Affichage de la liste des directeurs dans un tableau
- ✅ Recherche par nom
- ✅ Tri des colonnes
- ✅ Ajout d'un nouveau directeur
- ✅ Modification d'un directeur
- ✅ Suppression d'un directeur
- ✅ Filtrage basé sur les rôles (Admin, Directeur, Manager, Commercial)

---

### Page: **Managers** (`/managers`)

**Fichier**: `frontend/src/pages/managers/Managers.jsx`

#### Queries utilisées:

| Query            | Endpoint GraphQL | Utilisation                              |
| ---------------- | ---------------- | ---------------------------------------- |
| `GET_MANAGERS`   | `managers`       | Charge la liste complète des managers    |
| `GET_DIRECTEURS` | `directeurs`     | Charge les directeurs pour l'assignation |

#### Mutations utilisées:

| Mutation         | Endpoint GraphQL | Utilisation                        |
| ---------------- | ---------------- | ---------------------------------- |
| `CREATE_MANAGER` | `createManager`  | Création d'un nouveau manager      |
| `UPDATE_MANAGER` | `updateManager`  | Modification d'un manager existant |
| `REMOVE_MANAGER` | `removeManager`  | Suppression d'un manager           |

#### Hooks React utilisés:

- `useManagers()` - Récupère la liste des managers
- `useDirecteurs()` - Récupère la liste des directeurs (pour assignation)
- `useCreateManager()` - Crée un manager
- `useUpdateManager()` - Modifie un manager
- `useRemoveManager()` - Supprime un manager

#### Fonctionnalités:

- ✅ Affichage de la liste des managers dans un tableau
- ✅ Affichage du directeur assigné à chaque manager
- ✅ Recherche par nom
- ✅ Tri des colonnes
- ✅ Ajout d'un nouveau manager avec sélection du directeur
- ✅ Modification d'un manager
- ✅ Suppression d'un manager
- ✅ Filtrage basé sur les rôles

---

### Page: **Commerciaux** (`/commerciaux`)

**Fichier**: `frontend/src/pages/commercial/Commerciaux.jsx`

#### Queries utilisées:

| Query             | Endpoint GraphQL | Utilisation                                                      |
| ----------------- | ---------------- | ---------------------------------------------------------------- |
| `GET_COMMERCIALS` | `commercials`    | Charge la liste complète des commerciaux (léger, sans relations) |
| `GET_MANAGERS`    | `managers`       | Charge les managers pour l'assignation                           |
| `GET_DIRECTEURS`  | `directeurs`     | Charge les directeurs pour affichage                             |

#### Mutations utilisées:

| Mutation            | Endpoint GraphQL   | Utilisation                           |
| ------------------- | ------------------ | ------------------------------------- |
| `CREATE_COMMERCIAL` | `createCommercial` | Création d'un nouveau commercial      |
| `UPDATE_COMMERCIAL` | `updateCommercial` | Modification d'un commercial existant |
| `REMOVE_COMMERCIAL` | `removeCommercial` | Suppression d'un commercial           |

#### Hooks React utilisés:

- `useCommercials()` - Récupère la liste des commerciaux
- `useManagers()` - Récupère la liste des managers (pour assignation)
- `useDirecteurs()` - Récupère la liste des directeurs (pour affichage)
- `useCreateCommercial()` - Crée un commercial
- `useUpdateCommercial()` - Modifie un commercial
- `useRemoveCommercial()` - Supprime un commercial

#### Fonctionnalités:

- ✅ Affichage de la liste des commerciaux dans un tableau
- ✅ Affichage du manager et directeur assignés
- ✅ Recherche par nom
- ✅ Tri des colonnes
- ✅ Ajout d'un nouveau commercial avec sélection du manager
- ✅ Modification d'un commercial
- ✅ Suppression d'un commercial
- ✅ Filtrage basé sur les rôles (un manager ne voit que ses commerciaux)
- ✅ Colonnes adaptatives selon le rôle (Admin, Directeur, Manager)

---

### Page: **Détails Commercial** (`/commerciaux/:id`)

**Fichier**: `frontend/src/pages/commercial/CommercialDetails.jsx`

#### Queries utilisées:

| Query                 | Endpoint GraphQL | Utilisation                                                                     |
| --------------------- | ---------------- | ------------------------------------------------------------------------------- |
| `GET_COMMERCIAL_FULL` | `commercial(id)` | Charge un commercial avec toutes ses relations (immeubles, zones, statistiques) |
| `GET_MANAGERS`        | `managers`       | Charge les managers pour afficher le nom du manager assigné                     |

#### Hooks React utilisés:

- `useCommercialFull(id)` - Récupère les détails complets du commercial
- `useManagers()` - Récupère la liste des managers

#### Fonctionnalités:

- ✅ Affichage des informations personnelles du commercial
- ✅ Affichage des statistiques agrégées:
  - Total contrats signés
  - Total immeubles visités
  - Total rendez-vous pris
  - Total refus
  - Taux de conversion (contrats / RDV)
- ✅ Affichage de l'historique des statistiques par période
- ✅ Liste des zones assignées au commercial
- ✅ Liste des immeubles sous sa responsabilité
- ✅ Affichage du manager responsable

---

### Page: **Zones** (`/zones`)

**Fichier**: `frontend/src/pages/zones/Zones.jsx`

#### Queries utilisées:

| Query             | Endpoint GraphQL | Utilisation                                                |
| ----------------- | ---------------- | ---------------------------------------------------------- |
| `GET_ZONES`       | `zones`          | Charge la liste complète des zones avec leurs assignations |
| `GET_DIRECTEURS`  | `directeurs`     | Charge les directeurs pour l'assignation                   |
| `GET_MANAGERS`    | `managers`       | Charge les managers pour l'assignation                     |
| `GET_COMMERCIALS` | `commercials`    | Charge les commerciaux pour l'assignation et le filtrage   |

#### Mutations utilisées:

| Mutation                        | Endpoint GraphQL             | Utilisation                                                            |
| ------------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| `CREATE_ZONE`                   | `createZone`                 | Création d'une nouvelle zone                                           |
| `UPDATE_ZONE`                   | `updateZone`                 | Modification d'une zone existante                                      |
| `REMOVE_ZONE`                   | `removeZone`                 | Suppression d'une zone (avec transaction pour supprimer les relations) |
| `ASSIGN_ZONE_TO_COMMERCIAL`     | `assignZoneToCommercial`     | Assigne une zone à un commercial                                       |
| `UNASSIGN_ZONE_FROM_COMMERCIAL` | `unassignZoneFromCommercial` | Désassigne une zone d'un commercial                                    |

#### Hooks React utilisés:

- `useZones()` - Récupère la liste des zones
- `useDirecteurs()` - Récupère la liste des directeurs
- `useManagers()` - Récupère la liste des managers
- `useCommercials()` - Récupère la liste des commerciaux
- `useCreateZone()` - Crée une zone
- `useUpdateZone()` - Modifie une zone
- `useRemoveZone()` - Supprime une zone
- `useAssignZone()` - Assigne une zone à un commercial

#### Fonctionnalités:

- ✅ Affichage de la liste des zones dans un tableau
- ✅ Affichage de la localisation (reverse geocoding via Mapbox)
- ✅ Lazy loading des adresses avec cache et déduplication
- ✅ Affichage des utilisateurs assignés (Directeur, Manager, Commercial)
- ✅ Création d'une zone avec carte interactive (Mapbox)
- ✅ Modification d'une zone
- ✅ Suppression d'une zone avec confirmation
- ✅ Assignation de zone à un utilisateur (directeur/manager/commercial)
- ✅ Filtrage basé sur les rôles:
  - Commercial: voit uniquement ses zones
  - Manager: voit ses zones et celles de ses commerciaux
  - Directeur: voit toutes les zones de son périmètre
  - Admin: voit toutes les zones

#### APIs externes:

- **Mapbox Geocoding API**: Conversion coordonnées → nom de lieu
- **Mapbox GL JS**: Carte interactive pour sélectionner la zone

---

### Page: **Immeubles** (`/immeubles`)

**Fichier**: `frontend/src/pages/immeubles/Immeubles.jsx`

#### Queries utilisées:

| Query             | Endpoint GraphQL | Utilisation                                              |
| ----------------- | ---------------- | -------------------------------------------------------- |
| `GET_IMMEUBLES`   | `immeubles`      | Charge la liste complète des immeubles                   |
| `GET_COMMERCIALS` | `commercials`    | Charge les commerciaux pour l'assignation et le filtrage |

#### Mutations utilisées:

| Mutation          | Endpoint GraphQL | Utilisation                         |
| ----------------- | ---------------- | ----------------------------------- |
| `CREATE_IMMEUBLE` | `createImmeuble` | Création d'un nouvel immeuble       |
| `UPDATE_IMMEUBLE` | `updateImmeuble` | Modification d'un immeuble existant |
| `REMOVE_IMMEUBLE` | `removeImmeuble` | Suppression d'un immeuble           |

#### Hooks React utilisés:

- `useImmeubles()` - Récupère la liste des immeubles
- `useCommercials()` - Récupère la liste des commerciaux
- `useUpdateImmeuble()` - Modifie un immeuble
- `useRemoveImmeuble()` - Supprime un immeuble

#### Fonctionnalités:

- ✅ Affichage de la liste des immeubles dans un tableau
- ✅ Calcul automatique du nombre total de portes (étages × portes par étage)
- ✅ Affichage de la couverture (% de portes prospectées) - TODO: basé sur les statistiques
- ✅ Affichage du commercial responsable
- ✅ Recherche par adresse
- ✅ Tri des colonnes
- ✅ Modification d'un immeuble (adresse, étages, portes, commercial)
- ✅ Suppression d'un immeuble
- ✅ Filtrage basé sur les rôles:
  - Commercial: voit uniquement ses immeubles
  - Manager: voit les immeubles de ses commerciaux
  - Directeur: voit tous les immeubles de son périmètre
  - Admin: voit tous les immeubles

**Note**: La création d'immeubles n'est pas implémentée dans l'interface (pas de bouton "Ajouter").

---

## 🛠️ Services Backend

### 1. **CommercialService**

**Fichier**: `backend/src/commercial/commercial.service.ts`

#### Méthodes disponibles:

##### `create(data: CreateCommercialInput)`

Crée un nouveau commercial avec les relations manager et directeur.

**Retour**: Commercial créé avec relations incluses

---

##### `findAll()`

Récupère tous les commerciaux avec toutes leurs relations:

- Manager
- Directeur
- Immeubles
- Zones (via CommercialZone)
- Statistiques

**Retour**: Liste complète des commerciaux avec relations

---

##### `findOne(id: number)`

Récupère un commercial spécifique avec toutes ses relations.

**Retour**: Commercial avec toutes ses relations

---

##### `update(data: UpdateCommercialInput)`

Met à jour un commercial existant.

**Retour**: Commercial modifié avec relations

---

##### `remove(id: number)`

Supprime un commercial.

**Retour**: Commercial supprimé

**⚠️ Note**: La suppression d'un commercial ne supprime pas automatiquement:

- Les immeubles qui lui sont assignés (ils restent orphelins)
- Les relations CommercialZone (peuvent causer des erreurs)
- Les statistiques liées

**Amélioration recommandée**: Utiliser une transaction Prisma pour gérer les relations.

---

### 2. **ZoneService**

**Fichier**: `backend/src/zone/zone.service.ts`

#### Méthodes disponibles:

##### `create(data: CreateZoneInput)`

Crée une nouvelle zone géographique.

**Retour**: Zone créée

---

##### `findAll()`

Récupère toutes les zones avec leurs commerciaux assignés.

**Retour**: Liste des zones avec relations CommercialZone

---

##### `findOne(id: number)`

Récupère une zone spécifique avec ses commerciaux.

**Retour**: Zone avec relations

---

##### `assignToCommercial(zoneId: number, commercialId: number)`

Assigne une zone à un commercial (crée une relation CommercialZone).

**Retour**: Relation créée avec zone et commercial inclus

---

##### `unassignFromCommercial(zoneId: number, commercialId: number)`

Désassigne une zone d'un commercial.

**Retour**: Relation supprimée

---

##### `update(data: UpdateZoneInput)`

Met à jour une zone existante.

**Retour**: Zone modifiée

---

##### `remove(id: number)`

Supprime une zone avec toutes ses relations (transaction Prisma).

**Étapes**:

1. Supprime toutes les relations CommercialZone
2. Supprime toutes les statistiques liées à la zone
3. Supprime la zone elle-même

**Retour**: Zone supprimée

**✅ Bonne pratique**: Utilisation de transactions pour garantir la cohérence.

---

### 3. **DirecteurService**

**Fichier**: `backend/src/directeur/directeur.service.ts` (non lu mais structure similaire)

Méthodes présumées:

- `create(data: CreateDirecteurInput)`
- `findAll()`
- `findOne(id: number)`
- `update(data: UpdateDirecteurInput)`
- `remove(id: number)`

---

### 4. **ManagerService**

**Fichier**: `backend/src/manager/manager.service.ts` (non lu mais structure similaire)

Méthodes présumées:

- `create(data: CreateManagerInput)`
- `findAll()`
- `findOne(id: number)`
- `update(data: UpdateManagerInput)`
- `remove(id: number)`

---

### 5. **ImmeubleService**

**Fichier**: `backend/src/immeuble/immeuble.service.ts` (non lu mais structure similaire)

Méthodes présumées:

- `create(data: CreateImmeubleInput)`
- `findAll()`
- `findOne(id: number)`
- `update(data: UpdateImmeubleInput)`
- `remove(id: number)`

---

### 6. **StatisticService**

**Fichier**: `backend/src/statistic/statistic.service.ts` (non lu mais structure similaire)

Méthodes présumées:

- `create(data: CreateStatisticInput)`
- `findAll()`
- `findOne(id: number)`
- `update(data: UpdateStatisticInput)`
- `remove(id: number)`

---

## 📊 Diagramme des relations

```
┌─────────────┐
│  Directeur  │
└──────┬──────┘
       │
       ├─── manages ───► Manager
       │
       ├─── supervises ──► Commercial
       │
       └─── assigned_to ──► Zone
                              │
                              │
┌──────────┐                 │
│ Manager  │                 │
└────┬─────┘                 │
     │                       │
     ├─── manages ───► Commercial
     │                       │
     └─── assigned_to ────► Zone
                              │
                              │
┌────────────┐               │
│ Commercial │◄──────────────┘
└──────┬─────┘         (many-to-many)
       │               via CommercialZone
       │
       ├─── manages ───► Immeuble
       │
       ├─── has ───► Statistic
       │
       └─── assigned_to ───► Zone

┌───────────┐
│ Immeuble  │
└─────┬─────┘
      │
      └─── has ───► Statistic

┌──────┐
│ Zone │
└───┬──┘
    │
    └─── has ───► Statistic
```

---

## 🚀 Optimisations implémentées

### Frontend

1. **Lazy Loading des adresses** (Zones.jsx):

   - Chargement progressif des noms de lieux via Mapbox
   - Cache des résultats pour éviter les appels API répétés
   - Déduplication des requêtes en cours
   - Délai entre les appels (200ms) pour respecter les limites d'API

2. **Queries optimisées**:

   - `GET_COMMERCIALS`: Version légère sans relations (pour les listes)
   - `GET_COMMERCIAL_FULL`: Version complète avec toutes les relations (pour les détails)

3. **Filtrage basé sur les rôles**:
   - Système de filtrage côté frontend pour n'afficher que les données pertinentes
   - Permissions adaptatives selon le rôle (canAdd, canEdit, canDelete, canView)

### Backend

1. **Transactions Prisma** (ZoneService.remove):

   - Suppression en cascade des relations
   - Garantit la cohérence des données

2. **Include selectifs**:
   - Les queries incluent uniquement les relations nécessaires
   - Optimisation des performances

---

## 📝 Améliorations recommandées

### Backend

1. **Authentification & Autorisation**:

   - Ajouter JWT ou session-based auth
   - Implémenter des guards NestJS pour les rôles
   - Filtrer les données côté backend selon le rôle

2. **Validation des données**:

   - Ajouter des validators sur les DTOs
   - Vérifier les contraintes métier (ex: un commercial ne peut pas être son propre manager)

3. **Gestion des erreurs**:

   - Implémenter un exception filter global
   - Retourner des erreurs structurées

4. **Transactions pour les suppressions**:

   - Appliquer le pattern de ZoneService.remove aux autres services
   - Gérer les relations en cascade

5. **Pagination**:
   - Ajouter la pagination pour les grandes listes
   - Éviter de charger toutes les données en une fois

### Frontend

1. **Gestion du cache Apollo**:

   - Optimiser le cache pour éviter les re-fetches inutiles
   - Implémenter des policies de cache

2. **Optimistic Updates**:

   - Mettre à jour l'UI immédiatement avant la réponse du serveur
   - Améliorer la réactivité

3. **Statistiques en temps réel**:
   - Implémenter les vraies statistiques de couverture pour les immeubles
   - Calculer les métriques agrégées côté backend

---

## 🔐 Variables d'environnement

### Backend (.env)

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/rework_db"
PORT=3000
```

### Frontend (.env)

```bash
VITE_GRAPHQL_ENDPOINT=http://localhost:3000/graphql
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

---

## 📚 Ressources

- **NestJS**: https://nestjs.com/
- **Prisma**: https://www.prisma.io/
- **GraphQL**: https://graphql.org/
- **Apollo**: https://www.apollographql.com/
- **Mapbox**: https://www.mapbox.com/

---

## 📞 Support

Pour toute question ou problème:

1. Consulter les logs du backend: `npm run start:dev`
2. Tester les queries dans le Playground: http://localhost:3000/graphql
3. Vérifier les migrations Prisma: `npx prisma studio`

---

**Dernière mise à jour**: 13 octobre 2025
**Version**: 1.0.0
