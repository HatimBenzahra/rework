# 🔗 Mapping Frontend-Backend - Re_work

Ce document fournit un mapping **exact** entre chaque page du frontend et les endpoints backend utilisés.

---

## 📱 Vue d'ensemble des pages

| Page Frontend      | Route              | Fichier                 | Endpoints Backend utilisés                                                                                                                         |
| ------------------ | ------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard          | `/dashboard`       | `Dashboard.jsx`         | Aucun                                                                                                                                              |
| Directeurs         | `/directeurs`      | `Directeurs.jsx`        | `directeurs`, `directeur(id)`, `createDirecteur`, `updateDirecteur`, `removeDirecteur`                                                             |
| Managers           | `/managers`        | `Managers.jsx`          | `managers`, `directeurs`, `createManager`, `updateManager`, `removeManager`                                                                        |
| Commerciaux        | `/commerciaux`     | `Commerciaux.jsx`       | `commercials`, `managers`, `directeurs`, `createCommercial`, `updateCommercial`, `removeCommercial`                                                |
| Détails Commercial | `/commerciaux/:id` | `CommercialDetails.jsx` | `commercial(id)` [FULL], `managers`                                                                                                                |
| Zones              | `/zones`           | `Zones.jsx`             | `zones`, `commercials`, `directeurs`, `managers`, `createZone`, `updateZone`, `removeZone`, `assignZoneToCommercial`, `unassignZoneFromCommercial` |
| Immeubles          | `/immeubles`       | `Immeubles.jsx`         | `immeubles`, `commercials`, `updateImmeuble`, `removeImmeuble`                                                                                     |

---

## 📄 Détail par page

### 1. Dashboard (`/dashboard`)

**Fichier**: `frontend/src/pages/dashboard/Dashboard.jsx`

```
┌──────────────────┐
│    Dashboard     │
│                  │
│  Page statique   │
│  Aucun backend   │
└──────────────────┘
```

**Backend**: Aucun endpoint utilisé

---

### 2. Directeurs (`/directeurs`)

**Fichier**: `frontend/src/pages/directeurs/Directeurs.jsx`

```
┌────────────────────────────────────────────┐
│              Page Directeurs               │
└────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  ┌──────────┐          ┌──────────────┐
  │ QUERIES  │          │  MUTATIONS   │
  └──────────┘          └──────────────┘
        │                       │
        ├─ directeurs            ├─ createDirecteur
        │  └─► GET_DIRECTEURS    │  └─► CREATE_DIRECTEUR
        │                        │
        └─ directeur(id)         ├─ updateDirecteur
           └─► GET_DIRECTEUR     │  └─► UPDATE_DIRECTEUR
                                 │
                                 └─ removeDirecteur
                                    └─► REMOVE_DIRECTEUR
```

#### Queries

| Hook React        | Query GraphQL    | Endpoint Backend | Variables  | Champs retournés                                                      |
| ----------------- | ---------------- | ---------------- | ---------- | --------------------------------------------------------------------- |
| `useDirecteurs()` | `GET_DIRECTEURS` | `directeurs`     | -          | `id, nom, prenom, email, numTelephone, adresse, createdAt, updatedAt` |
| -                 | `GET_DIRECTEUR`  | `directeur(id)`  | `id: Int!` | `id, nom, prenom, email, numTelephone, adresse, createdAt, updatedAt` |

#### Mutations

| Hook React             | Mutation GraphQL   | Endpoint Backend  | Input                  | Champs retournés                                                      |
| ---------------------- | ------------------ | ----------------- | ---------------------- | --------------------------------------------------------------------- |
| `useCreateDirecteur()` | `CREATE_DIRECTEUR` | `createDirecteur` | `CreateDirecteurInput` | `id, nom, prenom, email, numTelephone, adresse, createdAt, updatedAt` |
| `useUpdateDirecteur()` | `UPDATE_DIRECTEUR` | `updateDirecteur` | `UpdateDirecteurInput` | `id, nom, prenom, email, numTelephone, adresse, createdAt, updatedAt` |
| `useRemoveDirecteur()` | `REMOVE_DIRECTEUR` | `removeDirecteur` | `id: Int!`             | `id, nom, prenom, email, numTelephone, adresse, createdAt, updatedAt` |

#### Flux de données

```
Chargement initial:
  useDirecteurs() → GET_DIRECTEURS → backend.directeurs → Affichage tableau

Création:
  Formulaire → useCreateDirecteur() → CREATE_DIRECTEUR → backend.createDirecteur
           → refetch() → GET_DIRECTEURS → Mise à jour tableau

Modification:
  Clic modifier → Modal → useUpdateDirecteur() → UPDATE_DIRECTEUR
                → refetch() → GET_DIRECTEURS → Mise à jour tableau

Suppression:
  Clic supprimer → Confirmation → useRemoveDirecteur() → REMOVE_DIRECTEUR
                 → refetch() → GET_DIRECTEURS → Mise à jour tableau
```

---

### 3. Managers (`/managers`)

**Fichier**: `frontend/src/pages/managers/Managers.jsx`

```
┌────────────────────────────────────────────┐
│               Page Managers                │
└────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  ┌──────────┐          ┌──────────────┐
  │ QUERIES  │          │  MUTATIONS   │
  └──────────┘          └──────────────┘
        │                       │
        ├─ managers              ├─ createManager
        │  └─► GET_MANAGERS      │  └─► CREATE_MANAGER
        │                        │
        └─ directeurs            ├─ updateManager
           └─► GET_DIRECTEURS    │  └─► UPDATE_MANAGER
              (pour dropdown)    │
                                 └─ removeManager
                                    └─► REMOVE_MANAGER
```

#### Queries

| Hook React        | Query GraphQL    | Endpoint Backend | Variables | Champs retournés                                                          |
| ----------------- | ---------------- | ---------------- | --------- | ------------------------------------------------------------------------- |
| `useManagers()`   | `GET_MANAGERS`   | `managers`       | -         | `id, nom, prenom, email, numTelephone, directeurId, createdAt, updatedAt` |
| `useDirecteurs()` | `GET_DIRECTEURS` | `directeurs`     | -         | `id, nom, prenom, email, numTelephone, adresse, createdAt, updatedAt`     |

#### Mutations

| Hook React           | Mutation GraphQL | Endpoint Backend | Input                | Champs retournés                                                          |
| -------------------- | ---------------- | ---------------- | -------------------- | ------------------------------------------------------------------------- |
| `useCreateManager()` | `CREATE_MANAGER` | `createManager`  | `CreateManagerInput` | `id, nom, prenom, email, numTelephone, directeurId, createdAt, updatedAt` |
| `useUpdateManager()` | `UPDATE_MANAGER` | `updateManager`  | `UpdateManagerInput` | `id, nom, prenom, email, numTelephone, directeurId, createdAt, updatedAt` |
| `useRemoveManager()` | `REMOVE_MANAGER` | `removeManager`  | `id: Int!`           | `id, nom, prenom, email, numTelephone, directeurId, createdAt, updatedAt` |

#### Particularités

- **Dépendance**: Cette page utilise `useDirecteurs()` pour peupler le dropdown "Directeur" dans le formulaire de création/modification
- **Enrichissement**: Le nom du directeur est affiché dans le tableau en faisant un `find()` côté frontend

---

### 4. Commerciaux (`/commerciaux`)

**Fichier**: `frontend/src/pages/commercial/Commerciaux.jsx`

```
┌────────────────────────────────────────────┐
│              Page Commerciaux              │
└────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  ┌──────────┐          ┌──────────────┐
  │ QUERIES  │          │  MUTATIONS   │
  └──────────┘          └──────────────┘
        │                       │
        ├─ commercials           ├─ createCommercial
        │  └─► GET_COMMERCIALS   │  └─► CREATE_COMMERCIAL
        │     (léger, sans       │
        │      relations)        ├─ updateCommercial
        │                        │  └─► UPDATE_COMMERCIAL
        ├─ managers              │
        │  └─► GET_MANAGERS      └─ removeCommercial
        │     (pour dropdown)       └─► REMOVE_COMMERCIAL
        │
        └─ directeurs
           └─► GET_DIRECTEURS
              (pour affichage)
```

#### Queries

| Hook React         | Query GraphQL     | Endpoint Backend | Variables | Champs retournés                                                                    |
| ------------------ | ----------------- | ---------------- | --------- | ----------------------------------------------------------------------------------- |
| `useCommercials()` | `GET_COMMERCIALS` | `commercials`    | -         | `id, nom, prenom, email, numTel, age, managerId, directeurId, createdAt, updatedAt` |
| `useManagers()`    | `GET_MANAGERS`    | `managers`       | -         | `id, nom, prenom, email, numTelephone, directeurId, createdAt, updatedAt`           |
| `useDirecteurs()`  | `GET_DIRECTEURS`  | `directeurs`     | -         | `id, nom, prenom, email, numTelephone, adresse, createdAt, updatedAt`               |

#### Mutations

| Hook React              | Mutation GraphQL    | Endpoint Backend   | Input                   | Champs retournés                                                                    |
| ----------------------- | ------------------- | ------------------ | ----------------------- | ----------------------------------------------------------------------------------- |
| `useCreateCommercial()` | `CREATE_COMMERCIAL` | `createCommercial` | `CreateCommercialInput` | `id, nom, prenom, email, numTel, age, managerId, directeurId, createdAt, updatedAt` |
| `useUpdateCommercial()` | `UPDATE_COMMERCIAL` | `updateCommercial` | `UpdateCommercialInput` | `id, nom, prenom, email, numTel, age, managerId, directeurId, createdAt, updatedAt` |
| `useRemoveCommercial()` | `REMOVE_COMMERCIAL` | `removeCommercial` | `id: Int!`              | `id, nom, prenom, email, numTel, age, managerId, directeurId, createdAt, updatedAt` |

#### Particularités

- **Query optimisée**: Utilise `GET_COMMERCIALS` (version légère sans relations) pour afficher la liste
- **Dépendances multiples**: Utilise `useManagers()` ET `useDirecteurs()` pour afficher les noms dans le tableau
- **Filtrage côté frontend**: Les données sont filtrées selon le rôle de l'utilisateur:
  - Manager: voit uniquement ses commerciaux (`managerId` === current user ID)
  - Directeur: voit tous les commerciaux de son périmètre
  - Admin: voit tous les commerciaux

---

### 5. Détails Commercial (`/commerciaux/:id`)

**Fichier**: `frontend/src/pages/commercial/CommercialDetails.jsx`

```
┌────────────────────────────────────────────┐
│         Page Détails Commercial            │
└────────────────────────────────────────────┘
                    │
                    ▼
           ┌──────────────┐
           │   QUERIES    │
           └──────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  commercial(id)           managers
  └─► GET_COMMERCIAL_FULL  └─► GET_MANAGERS
      (avec toutes les         (pour afficher
       relations)               le nom du manager)
           │
           ├─► immeubles[]
           ├─► zones[]
           └─► statistics[]
```

#### Queries

| Hook React              | Query GraphQL         | Endpoint Backend | Variables  | Champs retournés                                                                                                                                             |
| ----------------------- | --------------------- | ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useCommercialFull(id)` | `GET_COMMERCIAL_FULL` | `commercial(id)` | `id: Int!` | **Complet avec relations**: `id, nom, prenom, email, numTel, age, managerId, directeurId, createdAt, updatedAt` + `immeubles[]` + `zones[]` + `statistics[]` |
| `useManagers()`         | `GET_MANAGERS`        | `managers`       | -          | `id, nom, prenom, email, numTelephone, directeurId, createdAt, updatedAt`                                                                                    |

#### Relations chargées (GET_COMMERCIAL_FULL)

```graphql
commercial(id: $id) {
  # Infos de base
  id, nom, prenom, email, numTel, age, managerId, directeurId

  # Relations
  immeubles {
    id, adresse, nbEtages, nbPortesParEtage, commercialId
  }

  zones {
    id, nom, xOrigin, yOrigin, rayon, directeurId, managerId
    commercials {
      id, commercialId, zoneId
    }
  }

  statistics {
    id, commercialId, contratsSignes, immeublesVisites
    rendezVousPris, refus, createdAt, updatedAt
  }
}
```

#### Calculs côté frontend

À partir des données reçues, la page calcule:

- **Total contrats signés**: `sum(statistics.contratsSignes)`
- **Total immeubles visités**: `sum(statistics.immeublesVisites)`
- **Total RDV pris**: `sum(statistics.rendezVousPris)`
- **Total refus**: `sum(statistics.refus)`
- **Taux de conversion**: `(contratsSignes / rendezVousPris) * 100`
- **Nombre de zones**: `zones.length`
- **Nombre d'immeubles**: `immeubles.length`

---

### 6. Zones (`/zones`)

**Fichier**: `frontend/src/pages/zones/Zones.jsx`

```
┌────────────────────────────────────────────┐
│                 Page Zones                 │
└────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  ┌──────────┐          ┌──────────────┐
  │ QUERIES  │          │  MUTATIONS   │
  └──────────┘          └──────────────┘
        │                       │
        ├─ zones                 ├─ createZone
        │  └─► GET_ZONES         │  └─► CREATE_ZONE
        │                        │
        ├─ commercials           ├─ updateZone
        │  └─► GET_COMMERCIALS   │  └─► UPDATE_ZONE
        │     (pour assignation  │
        │      et filtrage)      ├─ removeZone
        │                        │  └─► REMOVE_ZONE
        ├─ managers              │
        │  └─► GET_MANAGERS      ├─ assignZoneToCommercial
        │     (pour assignation) │  └─► ASSIGN_ZONE_TO_COMMERCIAL
        │                        │
        └─ directeurs            └─ unassignZoneFromCommercial
           └─► GET_DIRECTEURS       └─► UNASSIGN_ZONE_FROM_COMMERCIAL
              (pour assignation)
```

#### Queries

| Hook React         | Query GraphQL     | Endpoint Backend | Variables | Champs retournés                                                                                |
| ------------------ | ----------------- | ---------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `useZones()`       | `GET_ZONES`       | `zones`          | -         | `id, nom, xOrigin, yOrigin, rayon, directeurId, managerId, commercials[], createdAt, updatedAt` |
| `useCommercials()` | `GET_COMMERCIALS` | `commercials`    | -         | `id, nom, prenom, email, numTel, age, managerId, directeurId, createdAt, updatedAt`             |
| `useManagers()`    | `GET_MANAGERS`    | `managers`       | -         | `id, nom, prenom, email, numTelephone, directeurId, createdAt, updatedAt`                       |
| `useDirecteurs()`  | `GET_DIRECTEURS`  | `directeurs`     | -         | `id, nom, prenom, email, numTelephone, adresse, createdAt, updatedAt`                           |

#### Mutations

| Hook React        | Mutation GraphQL                | Endpoint Backend             | Input                              | Champs retournés                                                                                |
| ----------------- | ------------------------------- | ---------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `useCreateZone()` | `CREATE_ZONE`                   | `createZone`                 | `CreateZoneInput`                  | `id, nom, xOrigin, yOrigin, rayon, directeurId, managerId, commercials[], createdAt, updatedAt` |
| `useUpdateZone()` | `UPDATE_ZONE`                   | `updateZone`                 | `UpdateZoneInput`                  | `id, nom, xOrigin, yOrigin, rayon, directeurId, managerId, commercials[], createdAt, updatedAt` |
| `useRemoveZone()` | `REMOVE_ZONE`                   | `removeZone`                 | `id: Int!`                         | `id, nom, xOrigin, yOrigin, rayon, createdAt, updatedAt`                                        |
| `useAssignZone()` | `ASSIGN_ZONE_TO_COMMERCIAL`     | `assignZoneToCommercial`     | `commercialId: Int!, zoneId: Int!` | `Boolean`                                                                                       |
| -                 | `UNASSIGN_ZONE_FROM_COMMERCIAL` | `unassignZoneFromCommercial` | `commercialId: Int!, zoneId: Int!` | `Boolean`                                                                                       |

#### APIs externes utilisées

| API                      | Utilisation                                | Endpoint                                                                        | Paramètres                      |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------- |
| **Mapbox Geocoding API** | Conversion coordonnées → nom de lieu       | `https://api.mapbox.com/geocoding/v5/mapbox.places/{longitude},{latitude}.json` | `access_token, types, language` |
| **Mapbox GL JS**         | Carte interactive pour créer/modifier zone | Librairie JavaScript                                                            | -                               |

#### Particularités

1. **Lazy Loading des adresses**:

   - Les adresses sont chargées progressivement via Mapbox Geocoding API
   - Cache implémenté pour éviter les appels répétés
   - Déduplication des requêtes en cours
   - Délai de 200ms entre chaque appel

2. **Assignation complexe**:

   - Une zone peut être assignée à:
     - Un directeur (via `directeurId`)
     - Un manager (via `managerId`)
     - Un ou plusieurs commerciaux (via `assignZoneToCommercial`)

3. **Filtrage avancé**:

   - Commercial: voit uniquement ses zones
   - Manager: voit ses zones + celles de ses commerciaux
   - Directeur: voit toutes les zones de son périmètre
   - Admin: voit toutes les zones

4. **Suppression en cascade**:
   - Le backend utilise une transaction pour:
     - Supprimer les relations `CommercialZone`
     - Supprimer les `Statistics` liées
     - Supprimer la `Zone` elle-même

---

### 7. Immeubles (`/immeubles`)

**Fichier**: `frontend/src/pages/immeubles/Immeubles.jsx`

```
┌────────────────────────────────────────────┐
│              Page Immeubles                │
└────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  ┌──────────┐          ┌──────────────┐
  │ QUERIES  │          │  MUTATIONS   │
  └──────────┘          └──────────────┘
        │                       │
        ├─ immeubles             ├─ updateImmeuble
        │  └─► GET_IMMEUBLES     │  └─► UPDATE_IMMEUBLE
        │                        │
        └─ commercials           └─ removeImmeuble
           └─► GET_COMMERCIALS      └─► REMOVE_IMMEUBLE
              (pour assignation
               et filtrage)
```

#### Queries

| Hook React         | Query GraphQL     | Endpoint Backend | Variables | Champs retournés                                                                    |
| ------------------ | ----------------- | ---------------- | --------- | ----------------------------------------------------------------------------------- |
| `useImmeubles()`   | `GET_IMMEUBLES`   | `immeubles`      | -         | `id, adresse, nbEtages, nbPortesParEtage, commercialId, createdAt, updatedAt`       |
| `useCommercials()` | `GET_COMMERCIALS` | `commercials`    | -         | `id, nom, prenom, email, numTel, age, managerId, directeurId, createdAt, updatedAt` |

#### Mutations

| Hook React            | Mutation GraphQL  | Endpoint Backend | Input                 | Champs retournés                                                              |
| --------------------- | ----------------- | ---------------- | --------------------- | ----------------------------------------------------------------------------- |
| `useUpdateImmeuble()` | `UPDATE_IMMEUBLE` | `updateImmeuble` | `UpdateImmeubleInput` | `id, adresse, nbEtages, nbPortesParEtage, commercialId, createdAt, updatedAt` |
| `useRemoveImmeuble()` | `REMOVE_IMMEUBLE` | `removeImmeuble` | `id: Int!`            | `id, adresse, nbEtages, nbPortesParEtage, commercialId, createdAt, updatedAt` |

#### Particularités

1. **Pas de création via UI**:

   - Le bouton "Ajouter immeuble" n'est pas implémenté
   - Mutation `CREATE_IMMEUBLE` existe mais n'est pas utilisée dans cette page

2. **Calculs côté frontend**:

   - **Total portes**: `nbEtages × nbPortesParEtage`
   - **Couverture**: `(portesProspectees / totalPortes) × 100`
     - ⚠️ Note: La couverture est actuellement simulée, pas basée sur les vraies statistiques

3. **Filtrage par rôle**:
   - Commercial: voit uniquement ses immeubles (`commercialId` === current user ID)
   - Manager: voit les immeubles de ses commerciaux
   - Directeur: voit tous les immeubles de son périmètre
   - Admin: voit tous les immeubles

---

## 🔄 Flux de données typiques

### Flux 1: Chargement d'une page avec liste

```
1. Component Mount
   └─► useEntity() hook
       └─► GraphQL Query (GET_ENTITIES)
           └─► Backend Service (findAll)
               └─► Prisma Query (findMany)
                   └─► PostgreSQL
                       └─► Data returned
                           └─► Frontend state updated
                               └─► UI rendered
```

### Flux 2: Création d'une entité

```
1. User clicks "Add" button
   └─► Modal opens with form
       └─► User fills form
           └─► User clicks "Save"
               └─► useCreateEntity() hook
                   └─► GraphQL Mutation (CREATE_ENTITY)
                       └─► Backend Service (create)
                           └─► Prisma Create (create)
                               └─► PostgreSQL INSERT
                                   └─► Entity created
                                       └─► refetch() called
                                           └─► GET_ENTITIES query
                                               └─► List updated
                                                   └─► Modal closed
```

### Flux 3: Modification d'une entité

```
1. User clicks "Edit" icon
   └─► Modal opens with pre-filled form
       └─► User modifies fields
           └─► User clicks "Save"
               └─► useUpdateEntity() hook
                   └─► GraphQL Mutation (UPDATE_ENTITY)
                       └─► Backend Service (update)
                           └─► Prisma Update (update)
                               └─► PostgreSQL UPDATE
                                   └─► Entity updated
                                       └─► refetch() called
                                           └─► GET_ENTITIES query
                                               └─► List updated
                                                   └─► Modal closed
```

### Flux 4: Suppression d'une entité

```
1. User clicks "Delete" icon
   └─► Confirmation modal opens
       └─► User confirms deletion
           └─► useRemoveEntity() hook
               └─► GraphQL Mutation (REMOVE_ENTITY)
                   └─► Backend Service (remove)
                       └─► Prisma Delete (delete or transaction)
                           └─► PostgreSQL DELETE
                               └─► Entity deleted
                                   └─► refetch() called
                                       └─► GET_ENTITIES query
                                           └─► List updated
                                               └─► Confirmation closed
```

---

## 📊 Récapitulatif des endpoints par entité

### Directeur

- **Queries**: `directeurs`, `directeur(id)`
- **Mutations**: `createDirecteur`, `updateDirecteur`, `removeDirecteur`
- **Utilisé par**: Page Directeurs, Pages Managers/Commerciaux/Zones (pour assignation)

### Manager

- **Queries**: `managers`, `manager(id)`
- **Mutations**: `createManager`, `updateManager`, `removeManager`
- **Utilisé par**: Page Managers, Pages Commerciaux/Zones (pour assignation)

### Commercial

- **Queries**: `commercials` (léger), `commercial(id)` (complet)
- **Mutations**: `createCommercial`, `updateCommercial`, `removeCommercial`
- **Utilisé par**: Page Commerciaux, Page Détails Commercial, Pages Immeubles/Zones (pour assignation/filtrage)

### Zone

- **Queries**: `zones`, `zone(id)`
- **Mutations**: `createZone`, `updateZone`, `removeZone`, `assignZoneToCommercial`, `unassignZoneFromCommercial`
- **Utilisé par**: Page Zones

### Immeuble

- **Queries**: `immeubles`, `immeuble(id)`
- **Mutations**: `createImmeuble`, `updateImmeuble`, `removeImmeuble`
- **Utilisé par**: Page Immeubles, Page Détails Commercial (affichage)

### Statistic

- **Queries**: `statistics`, `statistic(id)`
- **Mutations**: `createStatistic`, `updateStatistic`, `removeStatistic`
- **Utilisé par**: Page Détails Commercial (affichage)

---

## 🎯 Endpoints les plus utilisés

### Top 5 des queries

1. **`commercials`** - Utilisé par 3 pages (Commerciaux, Zones, Immeubles)
2. **`managers`** - Utilisé par 3 pages (Managers, Commerciaux, Zones)
3. **`directeurs`** - Utilisé par 3 pages (Directeurs, Managers, Zones)
4. **`zones`** - Utilisé par 1 page (Zones)
5. **`immeubles`** - Utilisé par 1 page (Immeubles)

### Queries critiques (avec relations)

- **`commercial(id)` [FULL]** - Charge toutes les relations (immeubles, zones, statistics)
- **`zones`** - Charge les relations CommercialZone

---

## ⚠️ Points d'attention

### 1. Requêtes N+1 potentielles

- Page Zones: Pour chaque zone, on cherche les directeurs/managers/commerciaux côté frontend
- **Solution**: Le backend inclut déjà les relations, mais l'enrichissement se fait côté frontend

### 2. Chargement de données inutiles

- `GET_COMMERCIALS` charge tous les commerciaux, même si le rôle ne peut voir qu'une partie
- **Solution recommandée**: Filtrer côté backend selon le rôle

### 3. Pas de pagination

- Toutes les listes chargent toutes les données en une fois
- **Solution recommandée**: Implémenter la pagination sur les grandes collections

### 4. Statistiques simulées

- La couverture des immeubles est simulée, pas basée sur les vraies stats
- **Solution**: Calculer la couverture depuis les statistiques réelles

---

## 🔐 Sécurité et autorisations

### Filtrage actuel

- **Côté frontend uniquement** via `useEntityPage` hook
- Les données complètes sont envoyées du backend, puis filtrées côté client

### Recommandations

1. **Implémenter des Guards NestJS** pour les rôles
2. **Filtrer les queries côté backend** selon l'utilisateur connecté
3. **Ajouter une authentification JWT** pour sécuriser les endpoints
4. **Valider les permissions** avant chaque mutation

---

**Dernière mise à jour**: 13 octobre 2025
**Version**: 1.0.0
