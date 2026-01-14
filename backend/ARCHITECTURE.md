# Architecture Détaillée du Backend Rework

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentication & Authorization](#authentication--authorization)
3. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
4. [Gestion des Portes](#gestion-des-portes)
5. [Gestion des Zones](#gestion-des-zones)
6. [Gestion des Immeubles](#gestion-des-immeubles)
7. [Enregistrements Audio/Vidéo](#enregistrements-audiovideo)
8. [Statistiques & Analytics](#statistiques--analytics)
9. [Flux de Données](#flux-de-donn%C3%A9es)

---

## Vue d'ensemble

Le backend Rework est une application **NestJS + GraphQL** conçue pour gérer des opérations de prospection commerciale avec :

- **Authentification** via Keycloak
- **Hiérarchie d'utilisateurs** : Admin → Directeur → Manager → Commercial
- **Gestion géographique** : Zones avec rayon et coordonnées
- **Suivi des portes** : Statuts, RDV, historique
- **Enregistrement audio/vidéo** : Intégration LiveKit + AWS S3
- **Analytics** : Statistiques par utilisateur, zone, immeuble

### Stack technologique

```
┌─────────────────────────────────────────┐
│         Frontend (React/Vite)            │
│      WebSocket (WSS) + GraphQL          │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │  NestJS Backend  │
        │  GraphQL Server  │
        └────────┬────────┘
         │       │        │
    ┌────▼┐  ┌──▼──┐  ┌──▼──┐
    │ Auth│  │Live │  │ AWS │
    │ Kcy │  │ Kit │  │  S3 │
    └────┘  └─────┘  └─────┘
         │
    ┌────▼────────┐
    │ PostgreSQL   │
    │ + Prisma ORM │
    └─────────────┘
```

---

## Authentication & Authorization

### Flux d'authentification

```
1. Frontend → Backend: login(username, password)
   ↓
2. Backend → Keycloak: Valide credentials + récupère token
   ↓
3. Keycloak → Backend: access_token + refresh_token + groupes
   ↓
4. Backend: 
   - Décoder le token
   - Extraire les groupes
   - Mapper groupe → rôle
   - Créer/récupérer utilisateur en BD local
   ↓
5. Backend → Frontend: AuthResponse { 
     access_token, 
     refresh_token, 
     role, 
     userId, 
     email 
   }
```

### Rôles et permissions

**Hiérarchie des rôles** :

```
┌─────────┐
│  ADMIN  │  Contrôle total du système
└────┬────┘
     │
┌────▼────────────┐
│  DIRECTEUR      │  Gère les managers, zones, stats globales
└────┬────────────┘
     │
┌────▼────────────┐
│  MANAGER        │  Gère les commerciaux, zones assignées
└────┬────────────┘
     │
┌────▼────────────┐
│  COMMERCIAL     │  Visite les portes, signe contrats
└─────────────────┘
```

**Mapping Keycloak → Rôles** :

| Groupe Keycloak | Rôle App | Entité BD |
|-----------------|----------|----------|
| Prospection-Admin | admin | N/A |
| Prospection-Directeur | directeur | Directeur |
| Prospection-Manager | manager | Manager |
| Prospection-Commercial | commercial | Commercial |

### Mutations d'authentification

#### 1. **login** - Authentifier un utilisateur

**Rôles autorisés** : Public (pas de guard)

```graphql
mutation Login {
  login(loginInput: {
    username: "john.doe@example.com"
    password: "password123"
  }) {
    access_token: String!        # JWT token pour les requêtes suivantes
    refresh_token: String!       # Token pour renouveler l'access_token
    expires_in: Int!             # Durée de vie en secondes
    token_type: String           # "Bearer"
    role: String!                # "commercial", "manager", "directeur", "admin"
    userId: Int!                 # ID local du commercial/manager/directeur
    email: String!               # Email de l'utilisateur
    groups: [String!]!           # Groupes Keycloak
  }
}
```

**Logique** :
1. Valide les credentials avec Keycloak
2. Récupère les groupes et le rôle
3. Crée ou récupère l'utilisateur en BD locale
4. Retourne tokens JWT + infos utilisateur

**Codes d'erreur** :
- `UnauthorizedException` : Credentials invalides
- `ForbiddenException("UNAUTHORIZED_GROUP")` : Groupe Keycloak non autorisé

---

#### 2. **refreshToken** - Renouveler le token

**Rôles autorisés** : Public

```graphql
mutation RefreshToken {
  refreshToken(refreshToken: "eyJhbGc...") {
    access_token: String!
    refresh_token: String!
    expires_in: Int!
    token_type: String
    role: String!
    userId: Int!
    email: String!
    groups: [String!]!
  }
}
```

**Logique** :
1. Valide le refresh_token avec Keycloak
2. Récupère un nouveau access_token
3. Retourne la nouvelle paire de tokens

---

### Query d'authentification

#### 1. **me** - Récupérer l'utilisateur connecté

**Rôles autorisés** : Tous (JwtAuthGuard)

```graphql
query GetCurrentUser {
  me {
    id: Int!              # ID local du commercial/manager/directeur
    role: String!         # Rôle de l'utilisateur
    email: String!        # Email Keycloak
  }
}
```

**Logique** :
1. Valide le JWT du header `Authorization`
2. Extrait l'ID et le rôle du token
3. Retourne les infos de l'utilisateur connecté

---

## Gestion des Utilisateurs

### Entités

```
Directeur
├─ id, nom, prenom, email, numTelephone, adresse
├─ Managers []
├─ Commerciaux []
├─ Zones []
└─ Statistics []

Manager
├─ id, nom, prenom, email, numTelephone
├─ directeurId (FK)
├─ Commerciaux []
├─ Immeubles []
├─ Zones []
└─ Statistics []

Commercial
├─ id, nom, prenom, email, numTel, age
├─ managerId (FK)
├─ directeurId (FK)
├─ Immeubles []
├─ Zones [] (via ZoneEnCours)
└─ Statistics []
```

### Commerciaux API

#### Mutations

##### 1. **createCommercial** - Créer un commercial

**Rôles autorisés** : admin, directeur

```graphql
mutation CreateCommercial {
  createCommercial(createCommercialInput: {
    nom: "Dupont"
    prenom: "Jean"
    email: "jean.dupont@example.com"
    numTel: "0612345678"
    age: 28
    managerId: 5                    # Optionnel: assigner à un manager
    directeurId: 2                  # Optionnel: assigner à un directeur
  }) {
    id: Int!
    nom: String!
    prenom: String!
    email: String
    numTel: String
    age: Int
    managerId: Int
    directeurId: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    zones: [Zone!]!               # Zone actuelle (via ZoneEnCours)
    immeubles: [Immeuble!]!       # Immeubles assignés
    statistics: [Statistic!]!     # Stats du commercial
  }
}
```

**Logique** :
1. Valide les champs obligatoires
2. Vérifie l'unicité de l'email
3. Crée le commercial en BD
4. Retourne le commercial avec relations

---

##### 2. **updateCommercial** - Mettre à jour un commercial

**Rôles autorisés** : admin, directeur

```graphql
mutation UpdateCommercial {
  updateCommercial(updateCommercialInput: {
    id: 10
    nom: "Durand"
    prenom: "Jane"
    email: "jane.durand@example.com"
    numTel: "0698765432"
    age: 30
    managerId: 6
  }) {
    id: Int!
    nom: String!
    prenom: String!
    # ... autres champs
  }
}
```

**Logique** :
1. Vérifie que le commercial existe
2. Valide les permissions (directeur peut modifier ses commerciaux)
3. Vérifie l'unicité du nouvel email
4. Met à jour le commercial
5. Retourne les données mises à jour

---

##### 3. **removeCommercial** - Supprimer un commercial

**Rôles autorisés** : admin, directeur

```graphql
mutation DeleteCommercial {
  removeCommercial(id: 10) {
    id: Int!
    nom: String!
    prenom: String!
  }
}
```

**Logique** :
1. Vérifie que le commercial existe
2. Vérifie les permissions
3. Supprime le commercial et ses dépendances
4. Retourne le commercial supprimé

---

#### Queries

##### 1. **commercials** - Lister tous les commerciaux

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetAllCommercials {
  commercials {
    id: Int!
    nom: String!
    prenom: String!
    email: String
    age: Int
    zones: [Zone!]!              # Zone actuelle
    immeubles: [Immeuble!]!      # Immeubles assignés
    statistics: [Statistic!]!    # Ses statistiques
  }
}
```

**Logique** :
- **Admin** : Voir tous les commerciaux
- **Directeur** : Voir ses commerciaux et ceux de ses managers
- **Manager** : Voir ses commerciaux
- **Commercial** : Voir seulement lui-même

---

##### 2. **commercial** - Récupérer un commercial spécifique

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetCommercial {
  commercial(id: 10) {
    id: Int!
    nom: String!
    prenom: String!
    email: String
    age: Int
    managerId: Int
    directeurId: Int
    zones: [Zone!]!              # Zone actuelle
    immeubles: [Immeuble!]!      # Immeubles assignés
    statistics: [Statistic!]!    # Ses statistiques
    createdAt: DateTime!
    updatedAt: DateTime!
  }
}
```

---

##### 3. **commercialTeamRanking** - Classement de l'équipe du commercial

**Rôles autorisés** : commercial

```graphql
query GetTeamRanking {
  commercialTeamRanking(commercialId: 10) {
    position: Int!               # Position du commercial (1er, 2e, etc.)
    total: Int!                  # Nombre total de commerciaux
    ranking: [
      {
        id: Int!                 # ID du commercial
        nom: String!
        prenom: String!
        contratsSignes: Int!      # Nombre de contrats
        immeublesVisites: Int!    # Immeubles visités
        tauxConversion: Float!    # Taux de conversion (%)
      }
    ]
  }
}
```

**Logique** :
1. Récupère les stats de tous les commerciaux de l'équipe
2. Classe par nombre de contrats signés
3. Calcule la position du commercial demandé
4. Retourne le classement complet

---

## Gestion des Portes

### Concepts clés

Une **porte** représente un appartement/logement à visiter. Elle a :
- **Statut** : NON_VISITE, CONTRAT_SIGNE, REFUS, RENDEZ_VOUS_PRIS, ABSENT, ARGUMENTE, NECESSITE_REPASSAGE
- **Historique** : Chaque changement de statut est enregistré dans StatusHistorique
- **Métriques** : nbRepassages, nbContrats, derniereVisite

### Statuts de porte

```
NON_VISITE ──→ ABSENT ──────────┐
   ↓              ↓              │
   ├─→ RENDEZ_VOUS_PRIS         │
   ├─→ REFUS ──→ ARGUMENTE       │
   ├─→ CONTRAT_SIGNE            │
   └─→ NECESSITE_REPASSAGE ──────→ [revenir à NON_VISITE]
```

### Mutations

#### 1. **createPorte** - Créer une porte

**Rôles autorisés** : admin, directeur, manager

```graphql
mutation CreatePorte {
  createPorte(createPorteInput: {
    numero: "101"                        # Identifiant unique par immeuble
    nomPersonnalise: "Porte à droite"  # Description optionnelle
    etage: 1
    immeubleId: 5
    statut: NON_VISITE                 # Optionnel, défaut: NON_VISITE
    nbRepassages: 0                    # Optionnel, défaut: 0
    nbContrats: 1                      # Optionnel, défaut: 1
    rdvDate: "2024-01-15T14:30:00Z"   # Optionnel
    rdvTime: "14:30"                   # Optionnel
    commentaire: "À visiter après 18h"  # Optionnel
  }) {
    id: Int!
    numero: String!
    nomPersonnalise: String
    etage: Int!
    immeubleId: Int!
    statut: StatutPorte!
    nbRepassages: Int!
    nbContrats: Int!
    rdvDate: DateTime
    rdvTime: String
    commentaire: String
    derniereVisite: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }
}
```

**Validation** :
- `immeubleId` doit exister
- `numero` doit être unique par immeuble
- `etage` doit être valide (1 à nbEtages de l'immeuble)

---

#### 2. **updatePorte** - Mettre à jour une porte

**Rôles autorisés** : admin, directeur, manager

```graphql
mutation UpdatePorte {
  updatePorte(updatePorteInput: {
    id: 42
    numero: "101A"
    nomPersonnalise: "Apt principal"
    etage: 1
    statut: RENDEZ_VOUS_PRIS
    nbRepassages: 1
    rdvDate: "2024-01-20T10:00:00Z"
    rdvTime: "10:00"
    commentaire: "RDV confirmé"
  }) {
    id: Int!
    numero: String!
    # ... autres champs
  }
}
```

---

#### 3. **updatePorteStatut** - Changer le statut d'une porte

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
mutation UpdatePorteStatus {
  updatePorteStatut(
    id: 42
    statut: CONTRAT_SIGNE
    userId: 10                            # ID du commercial/manager qui change le statut
    userType: COMMERCIAL                  # Type d'utilisateur
    commentaire: "Contrat signé le 15/01" # Optionnel
    rdvDate: "2024-01-15T14:30:00Z"      # Optionnel
    rdvTime: "14:30"                      # Optionnel
  ) {
    id: Int!
    statut: StatutPorte!
    nbRepassages: Int!
    derniereVisite: DateTime!
    rdvDate: DateTime
    rdvTime: String
    commentaire: String
  }
}
```

**Logique** :
1. Vérifie que la porte existe
2. Valide la transition de statut
3. Enregistre la modification dans `StatusHistorique`
4. Met à jour `derniereVisite` et `nbRepassages` si nécessaire
5. Incrémente les compteurs de contrats si statut = CONTRAT_SIGNE

**Transitions valides** :
```
NON_VISITE → CONTRAT_SIGNE       (visite réussie)
NON_VISITE → REFUS               (refus client)
NON_VISITE → ABSENT              (personne absente)
NON_VISITE → RENDEZ_VOUS_PRIS    (RDV pris)
REFUS → ARGUMENTE                (argumentation)
N'IMPORTE_QUEL → NECESSITE_REPASSAGE (repassage)
NECESS... → NON_VISITE           (retour à la visite)
```

---

#### 4. **removePorte** - Supprimer une porte

**Rôles autorisés** : admin, directeur

```graphql
mutation DeletePorte {
  removePorte(id: 42) {
    id: Int!
    numero: String!
  }
}
```

---

### Queries

#### 1. **portes** - Lister toutes les portes

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetAllDoors {
  portes {
    id: Int!
    numero: String!
    nomPersonnalise: String
    etage: Int!
    immeubleId: Int!
    statut: StatutPorte!
    nbRepassages: Int!
    nbContrats: Int!
    rdvDate: DateTime
    rdvTime: String
    commentaire: String
    derniereVisite: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }
}
```

---

#### 2. **porte** - Récupérer une porte spécifique

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetDoor {
  porte(id: 42) {
    id: Int!
    numero: String!
    nomPersonnalise: String
    etage: Int!
    immeubleId: Int!
    statut: StatutPorte!
    nbRepassages: Int!
    nbContrats: Int!
    rdvDate: DateTime
    rdvTime: String
    commentaire: String
    derniereVisite: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }
}
```

---

#### 3. **portesByImmeuble** - Portes d'un immeuble

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetBuildingDoors {
  portesByImmeuble(immeubleId: 5) {
    id: Int!
    numero: String!
    etage: Int!
    statut: StatutPorte!
    nbRepassages: Int!
    nbContrats: Int!
    derniereVisite: DateTime
  }
}
```

---

#### 4. **portesByStatut** - Portes par statut

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetDoorsByStatus {
  portesByStatut(
    immeubleId: 5
    statut: NON_VISITE
  ) {
    id: Int!
    numero: String!
    etage: Int!
    nbRepassages: Int!
    derniereVisite: DateTime
  }
}
```

---

#### 5. **porteStatistics** - Statistiques des portes d'un immeuble

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetDoorStats {
  porteStatistics(immeubleId: 5) {
    totalPortes: Int!               # Total de portes
    contratsSigne: Int!             # Contrats signés
    rdvPris: Int!                   # RDV pris
    absent: Int!                    # Absents
    argumente: Int!                 # Argumentés
    refus: Int!                     # Refus
    nonVisitees: Int!               # Non visitées
    necessiteRepassage: Int!        # À repasser
    portesVisitees: Int!            # Portes visitées (≠ NON_VISITE)
    tauxConversion: String!         # Ex: "25.5%"
    portesParEtage: [
      {
        etage: Int!
        count: Int!
      }
    ]
  }
}
```

**Exemple de réponse** :
```json
{
  "totalPortes": 40,
  "contratsSigne": 10,
  "rdvPris": 5,
  "absent": 8,
  "nonVisitees": 15,
  "portesVisitees": 25,
  "tauxConversion": "40.0%",
  "portesParEtage": [
    { "etage": 1, "count": 8 },
    { "etage": 2, "count": 8 },
    { "etage": 3, "count": 8 },
    { "etage": 4, "count": 8 },
    { "etage": 5, "count": 8 }
  ]
}
```

---

#### 6. **statusHistorique** - Historique des changements de statut

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetStatusHistory {
  statusHistorique(porteId: 42) {
    id: Int!
    porteId: Int!
    statut: StatutPorte!
    commentaire: String
    rdvDate: DateTime
    rdvTime: String
    createdAt: DateTime!
    commercial: {
      id: Int!
      nom: String!
      prenom: String!
    }
    manager: {
      id: Int!
      nom: String!
      prenom: String!
    }
  }
}
```

---

## Gestion des Zones

### Concepts clés

Une **zone** est un secteur géographique défini par :
- **Coordonnées** : xOrigin, yOrigin (centre)
- **Rayon** : Distance de couverture
- **Assignation** : Une zone peut être assignée à un commercial/manager/directeur
- **Historique** : Suivi des assignations et des stats par période

### Modèle de données

```
Zone
├─ id, nom, xOrigin, yOrigin, rayon
├─ directeurId, managerId
├─ Immeubles[]          # Immeubles dans cette zone
├─ ZoneEnCours[]        # Assignation actuelle
└─ HistoriqueZone[]     # Historique d'assignations

ZoneEnCours (Assignation actuelle)
├─ zoneId (FK Zone)
├─ userId (ID commercial/manager/directeur)
├─ userType (COMMERCIAL, MANAGER, DIRECTEUR)
└─ assignedAt (DateTime)

HistoriqueZone (Snapshot d'assignation)
├─ zoneId (FK Zone)
├─ userId
├─ userType
├─ assignedAt
├─ unassignedAt
└─ Snapshot des stats:
   ├─ totalContratsSignes
   ├─ totalImmeublesVisites
   ├─ totalRendezVousPris
   └─ ...
```

### Mutations

#### 1. **createZone** - Créer une zone

**Rôles autorisés** : admin, directeur

```graphql
mutation CreateZone {
  createZone(createZoneInput: {
    nom: "Paris 16 - Ouest"
    xOrigin: 48.8550        # Latitude (Paris)
    yOrigin: 2.2761         # Longitude (Paris)
    rayon: 2.5              # Rayon en km
    directeurId: 2          # Optionnel
    managerId: 5            # Optionnel
  }) {
    id: Int!
    nom: String!
    xOrigin: Float!
    yOrigin: Float!
    rayon: Float!
    directeurId: Int
    managerId: Int
    immeubles: [Immeuble!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
}
```

---

#### 2. **updateZone** - Mettre à jour une zone

**Rôles autorisés** : admin, directeur

```graphql
mutation UpdateZone {
  updateZone(updateZoneInput: {
    id: 7
    nom: "Paris 16 - Ouest (Modifié)"
    rayon: 3.0
    managerId: 6
  }) {
    id: Int!
    nom: String!
    rayon: Float!
    # ...
  }
}
```

---

#### 3. **assignZone** - Assigner une zone à un utilisateur

**Rôles autorisés** : admin, directeur, manager

```graphql
mutation AssignZone {
  assignZone(assignZoneInput: {
    zoneId: 7
    userId: 10              # ID du commercial/manager/directeur
    userType: COMMERCIAL   # Type d'utilisateur
  }) {
    id: Int!
    zoneId: Int!
    userId: Int!
    userType: UserType!
    assignedAt: DateTime!
    zone: {
      id: Int!
      nom: String!
      rayon: Float!
    }
  }
}
```

**Logique** :
1. Vérifie que la zone existe
2. Vérifie que l'utilisateur existe (commercial, manager ou directeur)
3. Récupère l'assignation précédente (si existe)
4. **Crée un HistoriqueZone** avec les stats de la période précédente
5. Crée une nouvelle assignation dans ZoneEnCours
6. Retourne la nouvelle assignation

**Snapshot des stats** :
Lors de la désassignation, le système crée un enregistrement HistoriqueZone avec :
- Dates d'assignation/désassignation
- Totalité des stats accumulées pendant cette période

---

#### 4. **unassignZone** - Retirer une zone

**Rôles autorisés** : admin, directeur, manager

```graphql
mutation UnassignZone {
  unassignZone(
    userId: 10
    userType: COMMERCIAL
  ) {
    id: Int!
    zoneId: Int!
    userId: Int!
    userType: UserType!
    assignedAt: DateTime!
    zone: {
      id: Int!
      nom: String!
    }
  }
}
```

**Logique** :
1. Récupère l'assignation actuelle
2. Crée un HistoriqueZone avec les stats accumulées
3. Supprime l'assignation de ZoneEnCours
4. Retourne l'assignation supprimée

---

### Queries

#### 1. **zones** - Lister toutes les zones

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetAllZones {
  zones {
    id: Int!
    nom: String!
    xOrigin: Float!
    yOrigin: Float!
    rayon: Float!
    immeubles: [Immeuble!]!     # Immeubles dans la zone
    createdAt: DateTime!
    updatedAt: DateTime!
  }
}
```

---

#### 2. **zone** - Récupérer une zone

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetZone {
  zone(id: 7) {
    id: Int!
    nom: String!
    xOrigin: Float!
    yOrigin: Float!
    rayon: Float!
    immeubles: [Immeuble!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
}
```

---

#### 3. **zonesByManager** - Zones gérées par un manager

**Rôles autorisés** : admin, directeur, manager

```graphql
query GetManagerZones {
  zonesByManager(managerId: 5) {
    id: Int!
    nom: String!
    rayon: Float!
    immeubles: [Immeuble!]!
  }
}
```

---

#### 4. **currentZone** - Zone assignée actuellement

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetCurrentZone {
  currentZone(
    userId: 10
    userType: COMMERCIAL
  ) {
    id: Int!
    nom: String!
    xOrigin: Float!
    yOrigin: Float!
    rayon: Float!
    immeubles: [Immeuble!]!     # Immeubles à visiter
  }
}
```

Retourne `null` si aucune zone assignée.

---

#### 5. **zoneHistory** - Historique d'assignations

**Rôles autorisés** : admin, directeur

```graphql
query GetZoneHistory {
  zoneHistory(zoneId: 7) {
    id: Int!
    zoneId: Int!
    userId: Int!
    userType: UserType!
    assignedAt: DateTime!
    unassignedAt: DateTime!
    totalContratsSignes: Int!
    totalImmeublesVisites: Int!
    totalRendezVousPris: Int!
    totalRefus: Int!
    totalImmeublesProspectes: Int!
    totalPortesProspectes: Int!
  }
}
```

---

## Gestion des Immeubles

### Concepts clés

Un **immeuble** représente un bâtiment avec plusieurs portes/étages :
- **Structure** : Nombre d'étages, portes par étage
- **Localisation** : Latitude/longitude pour la géolocalisation
- **Accès** : Code d'accès digital optionnel
- **Portes** : Génération automatique des portes

### Mutations

#### 1. **createImmeuble** - Créer un immeuble

**Rôles autorisés** : admin, directeur, manager

```graphql
mutation CreateBuilding {
  createImmeuble(createImmeubleInput: {
    adresse: "42 Avenue des Champs-Élysées, 75008 Paris"
    latitude: 48.8697
    longitude: 2.3076
    nbEtages: 5
    nbPortesParEtage: 8
    ascenseurPresent: true
    digitalCode: "2024#ABCD"
    zoneId: 7              # Optionnel: zone géographique
    commercialId: 10       # Optionnel: assigner à un commercial
    managerId: 5           # Optionnel: assigner à un manager
  }) {
    id: Int!
    adresse: String!
    latitude: Float
    longitude: Float
    nbEtages: Int!
    nbPortesParEtage: Int!
    ascenseurPresent: Boolean!
    digitalCode: String
    zoneId: Int
    commercialId: Int
    managerId: Int
    portes: [Porte!]!      # Les portes créées
    createdAt: DateTime!
    updatedAt: DateTime!
  }
}
```

**Logique de création des portes** :
```
Pour chaque étage de 1 à nbEtages {
  Pour chaque porte de 1 à nbPortesParEtage {
    Créer une porte {
      numero: "<etage><index>"   // Ex: 101, 102, ..., 501
      etage: <étage>
      statut: NON_VISITE
      immeubleId: <id du nouvel immeuble>
    }
  }
}

Ex: 2 étages, 3 portes/étage
  → 101, 102, 103 (étage 1)
  → 201, 202, 203 (étage 2)
```

---

#### 2. **updateImmeuble** - Mettre à jour un immeuble

**Rôles autorisés** : admin, directeur, manager

```graphql
mutation UpdateBuilding {
  updateImmeuble(updateImmeubleInput: {
    id: 5
    adresse: "42 Avenue des Champs-Élysées, 75008 Paris"
    latitude: 48.8697
    digitalCode: "2024#DCBA"
    zoneId: 8
    commercialId: 11
  }) {
    id: Int!
    adresse: String!
    # ...
  }
}
```

**Note** : `nbEtages` et `nbPortesParEtage` ne peuvent pas être modifiés (sinon casse les portes existantes)

---

#### 3. **removeImmeuble** - Supprimer un immeuble

**Rôles autorisés** : admin, directeur

```graphql
mutation DeleteBuilding {
  removeImmeuble(id: 5) {
    id: Int!
    adresse: String!
  }
}
```

**Logique** : Supprime aussi toutes les portes et leurs historiques (CASCADE)

---

### Queries

#### 1. **immeubles** - Lister tous les immeubles

```graphql
query GetAllBuildings {
  immeubles {
    id: Int!
    adresse: String!
    latitude: Float
    longitude: Float
    nbEtages: Int!
    nbPortesParEtage: Int!
    ascenseurPresent: Boolean!
    zoneId: Int
    portes: [Porte!]!      # Toutes les portes
  }
}
```

---

#### 2. **immeuble** - Récupérer un immeuble

```graphql
query GetBuilding {
  immeuble(id: 5) {
    id: Int!
    adresse: String!
    latitude: Float
    longitude: Float
    portes: [Porte!]!
  }
}
```

---

#### 3. **immeublesByZone** - Immeubles d'une zone

```graphql
query GetBuildingsByZone {
  immeublesByZone(zoneId: 7) {
    id: Int!
    adresse: String!
    latitude: Float
    longitude: Float
    nbEtages: Int!
    nbPortesParEtage: Int!
  }
}
```

---

#### 4. **immeubleStatistics** - Stats d'un immeuble

```graphql
query GetBuildingStats {
  immeubleStatistics(immeubleId: 5) {
    totalPortes: Int!
    contratsSigne: Int!
    rdvPris: Int!
    nonVisitees: Int!
    tauxConversion: String!    # Ex: "25.0%"
  }
}
```

---

## Enregistrements Audio/Vidéo

### Architecture LiveKit + AWS S3

```
┌──────────────┐
│   Frontend   │
│   (React)    │
└────────┬─────┘
         │ WebSocket (WSS)
         ↓
┌──────────────────────────┐
│   LiveKit Server         │
│  (Enregistrement)        │
└────────┬─────────────────┘
         │ Webhook (fin enregistrement)
         ↓
┌──────────────────────────┐
│   Backend NestJS         │
│  (Recording Service)     │
└────────┬─────────────────┘
         │ Upload
         ↓
┌──────────────────────────┐
│    AWS S3 Bucket         │
│  (Stockage des vidéos)   │
└──────────────────────────┘
```

### Mutations

#### 1. **startRecording** - Démarrer un enregistrement

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
mutation StartRecording {
  startRecording(input: {
    roomName: "commercial-meeting-001"   # Nom unique de la room LiveKit
    commercialId: 10                      # Optionnel: ID du commercial
  }) {
    egressId: String!              # ID unique de l'enregistrement
    roomName: String!
    startedAt: DateTime!
    status: String!                # "STARTING", "ACTIVE", etc.
    s3Bucket: String              # Bucket S3 où sera stocké
    s3Key: String                 # Clé S3 du fichier
  }
}
```

**Logique** :
1. Valide que la room LiveKit est active
2. Crée une nouvelle égression LiveKit pour l'enregistrement
3. Configure le webhook LiveKit pour notifier la fin
4. Retourne l'ID d'enregistrement

**Webhook LiveKit** :
LiveKit notifiera le backend à :
```
POST /webhook/recording-completed
{
  "event": "egress.finished",
  "egressId": "EG_xxx",
  "status": "FINISHED",
  "result": {
    "s3": {
      "bucket": "rework-recordings",
      "key": "commercial-meeting-001/video.mp4"
    }
  }
}
```

Le backend alors :
1. Télécharge le fichier de LiveKit
2. L'upload vers AWS S3
3. Enregistre les métadonnées en BD

---

#### 2. **stopRecording** - Arrêter un enregistrement

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
mutation StopRecording {
  stopRecording(input: {
    egressId: "EG_xxx"
  }) {
    success: Boolean!
  }
}
```

**Logique** :
1. Valide que l'enregistrement existe
2. Demande l'arrêt à LiveKit
3. Attend le webhook de fin
4. Upload le fichier vers S3
5. Crée l'enregistrement en BD

---

### Queries

#### 1. **listRecordings** - Lister les enregistrements

**Rôles autorisés** : admin, directeur

```graphql
query GetRecordings {
  listRecordings(roomName: "commercial-meeting-001") {
    id: String!
    roomName: String!
    startedAt: DateTime!
    endedAt: DateTime
    duration: Int             # Durée en secondes
    s3Key: String             # Clé S3 pour accès
    fileSize: Int            # Taille en bytes
    status: String           # "ACTIVE", "COMPLETED", "FAILED"
  }
}
```

---

#### 2. **egressState** - État d'un enregistrement

**Rôles autorisés** : admin, directeur

```graphql
query GetEgressState {
  egressState(egressId: "EG_xxx") {
    egressId: String!
    status: String!          # "STARTING", "ACTIVE", "COMPLETED", "FAILED"
    startedAt: DateTime!
    endedAt: DateTime
    error: String            # Message d'erreur si FAILED
  }
}
```

---

#### 3. **getStreamingUrl** - Obtenir l'URL de streaming

**Rôles autorisés** : admin, directeur

```graphql
query GetStreamingUrl {
  getStreamingUrl(key: "commercial-meeting-001/video.mp4") {
    url: String!             # URL S3 pré-signée valide 24h
    expiresAt: DateTime!
  }
}
```

**Logique** :
1. Génère une URL pré-signée AWS S3
2. Valide pour 24 heures (paramétrable)
3. Retourne l'URL directe pour lecture

---

## Statistiques & Analytics

### Modèle de données

```
Statistic
├─ Id unique
├─ Qui : commercialId, managerId, directeurId
├─ Où : immeubleId, zoneId
└─ Métriques :
   ├─ contratsSignes
   ├─ immeublesVisites
   ├─ rendezVousPris
   ├─ refus
   ├─ absents
   ├─ argumentes
   ├─ nbImmeublesProspectes
   └─ nbPortesProspectes
```

### Queries

#### 1. **statistics** - Récupérer les statistiques avec filtres

**Rôles autorisés** : admin, directeur, manager, commercial

```graphql
query GetStatistics {
  statistics(filters: {
    commercialId: 10          # Optionnel
    managerId: 5              # Optionnel
    directeurId: 2            # Optionnel
    zoneId: 7                 # Optionnel
    immeubleId: 5             # Optionnel
    startDate: "2024-01-01"  # Optionnel
    endDate: "2024-01-31"    # Optionnel
  }) {
    id: Int!
    contratsSignes: Int!
    immeublesVisites: Int!
    rendezVousPris: Int!
    refus: Int!
    absents: Int!
    argumentes: Int!
    nbImmeublesProspectes: Int!
    nbPortesProspectes: Int!
    createdAt: DateTime!
  }
}
```

---

#### 2. **statisticsByCommercial** - Stats agrégées d'un commercial

**Rôles autorisés** : admin, directeur, manager, commercial (lui-même)

```graphql
query GetCommercialStats {
  statisticsByCommercial(
    commercialId: 10
    startDate: "2024-01-01"
    endDate: "2024-01-31"
  ) {
    totalContratsSignes: Int!
    totalImmeublesVisites: Int!
    totalRendezVousPris: Int!
    totalRefus: Int!
    totalAbsents: Int!
    totalArgumentes: Int!
    totalImmeublesProspectes: Int!
    totalPortesProspectes: Int!
    
    # Taux calculés
    tauxConversion: Float!      # (contrats / portes prospectes) * 100
    tauxRendezVous: Float!      # (RDV / portes prospectes) * 100
    tauxRefus: Float!           # (refus / portes prospectes) * 100
  }
}
```

---

#### 3. **statisticsByManager** - Stats agrégées d'un manager

**Rôles autorisés** : admin, directeur, manager (lui-même)

```graphql
query GetManagerStats {
  statisticsByManager(
    managerId: 5
    startDate: "2024-01-01"
    endDate: "2024-01-31"
  ) {
    totalContratsSignes: Int!
    totalImmeublesVisites: Int!
    totalRendezVousPris: Int!
    # ... même structure que Commercial
    
    # Plus:
    nbCommerciaux: Int!         # Nombre de commerciaux gérés
    commercialStats: [
      {
        commercialId: Int!
        nom: String!
        prenom: String!
        contratsSignes: Int!
        immeublesVisites: Int!
        tauxConversion: Float!
      }
    ]
  }
}
```

---

#### 4. **statisticsByZone** - Stats d'une zone

```graphql
query GetZoneStats {
  statisticsByZone(
    zoneId: 7
    startDate: "2024-01-01"
    endDate: "2024-01-31"
  ) {
    totalContratsSignes: Int!
    totalImmeublesVisites: Int!
    totalPortesProspectes: Int!
    tauxConversion: Float!
  }
}
```

---

## Flux de Données

### Cas d'usage 1 : Visite d'un immeuble

```
1. Commercial voit sa zone assignée
   Query: currentZone(userId, userType: COMMERCIAL)
   ↓ Récupère les immeubles de sa zone
   
2. Commercial récupère les portes de l'immeuble
   Query: portesByImmeuble(immeubleId)
   Query: porteStatistics(immeubleId)
   ↓ Voir quelles portes visiter
   
3. Commercial visite la première porte
   Mutation: updatePorteStatut(
     porteId,
     statut: CONTRAT_SIGNE | REFUS | RENDEZ_VOUS_PRIS | ABSENT,
     userId,
     userType: COMMERCIAL,
     commentaire
   )
   ↓ Met à jour le statut + crée historique
   
4. Système met à jour automatiquement :
   - derniereVisite (timestamp)
   - nbRepassages (si NECESSITE_REPASSAGE)
   - StatusHistorique (enregistrement)
   - Recalcule les statistiques
   
5. Commercial voit ses stats mises à jour
   Query: commercialTeamRanking(commercialId)
   Query: statisticsByCommercial(commercialId)
```

### Cas d'usage 2 : Assignation de zone

```
1. Manager assigne une zone à un commercial
   Mutation: assignZone(
     zoneId: 7,
     userId: 10,
     userType: COMMERCIAL
   )
   ↓
   
2. Backend:
   - Vérifie qu'il n'y a pas d'assignation actuelle
   - Si oui, crée HistoriqueZone avec snapshot des stats
   - Crée nouvelle assignation dans ZoneEnCours
   
3. Commercial voit sa nouvelle zone
   Query: currentZone(userId: 10, userType: COMMERCIAL)
   ↓ Récupère les immeubles à visiter
   
4. Commercial peut voir l'historique
   Query: zoneHistory(zoneId: 7)
   ↓ Voir qui a eu la zone et quand
```

### Cas d'usage 3 : Enregistrement d'une visite

```
1. Commercial démarre un appel (LiveKit room créée)
   Frontend établit WebSocket avec LiveKit
   
2. Manager démarre l'enregistrement
   Mutation: startRecording(
     roomName: "meeting-123",
     commercialId: 10
   )
   ↓ Retourne egressId
   
3. LiveKit enregistre l'audio/vidéo
   En temps réel, relayé au frontend
   
4. Manager arrête l'enregistrement
   Mutation: stopRecording(egressId)
   ↓ Demande l'arrêt à LiveKit
   
5. LiveKit notifie le webhook
   POST /webhook/recording-completed
   {
     "egressId": "EG_xxx",
     "status": "FINISHED",
     "result": {
       "s3": { "bucket": "...", "key": "..." }
     }
   }
   ↓
   
6. Backend enregistre en BD
   Recording { 
     egressId, 
     roomName, 
     s3Key, 
     commercialId,
     status: COMPLETED 
   }
   
7. Manager récupère l'URL de lecture
   Query: getStreamingUrl(key: "...")
   ↓ Retourne URL S3 pré-signée
   
8. Frontend peut lire la vidéo
```

---

## Guards et Decorators

### JwtAuthGuard

Vérifie que l'utilisateur est authentifié.

```typescript
@UseGuards(JwtAuthGuard)
async myQuery() { ... }
```

**Process** :
1. Récupère le token du header `Authorization: Bearer <token>`
2. Valide le JWT
3. Décode le payload
4. Ajoute l'utilisateur au contexte GraphQL
5. Si invalide ou absent → `UnauthorizedException`

### RolesGuard

Vérifie que l'utilisateur a les rôles requis.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'directeur')
async myMutation() { ... }
```

**Process** :
1. Récupère les rôles requis du décorateur `@Roles`
2. Vérifie que le rôle de l'utilisateur est dans la liste
3. Si non autorisé → `ForbiddenException`

### @CurrentUser()

Injure l'utilisateur connecté dans le resolver.

```typescript
@Query()
@UseGuards(JwtAuthGuard)
async myQuery(
  @CurrentUser() user: { id: number; role: string; email: string }
) {
  // user contient les infos du JWT
}
```

---

## Gestion des erreurs

### Codes HTTP/GraphQL

| Situation | Code | Message |
|-----------|------|----------|
| Credentials invalides | 401 | `UnauthorizedException` |
| Groupe Keycloak non autorisé | 403 | `ForbiddenException("UNAUTHORIZED_GROUP")` |
| Permissions insuffisantes | 403 | `ForbiddenException` |
| Ressource non trouvée | 404 | Null ou erreur dans resolver |
| Validation échouée | 400 | Erreurs des validateurs class-validator |
| Token expiré | 401 | `UnauthorizedException` |

---

## Performance & Optimisations

### Indexing

```prisma
// Index sur les champs fréquemment filtrés
model Commercial {
  // ...
  @@index([managerId])
  @@index([email])  // Unique index de facto
}

model Porte {
  // ...
  @@unique([immeubleId, numero])
  @@index([statut])
}

model StatusHistorique {
  // ...
  @@index([porteId])
  @@index([createdAt])
}

model ZoneEnCours {
  // ...
  @@unique([userId, userType])
}
```

### Pagination (recommandée pour listes)

```graphql
query GetCommercials(
  $skip: Int = 0
  $take: Int = 20
) {
  commercials(skip: $skip, take: $take) {
    # ...
  }
}
```

### Select/Include pour limiter les champs

Lorsque vous n'avez besoin que de certains champs :

```prisma
// ✅ Bon: récupère juste les champs nécessaires
const commercial = await prisma.commercial.findUnique({
  where: { id },
  select: {
    id: true,
    nom: true,
    prenom: true,
    email: true
  }
});

// ❌ Mauvais: charge toutes les relations
const commercial = await prisma.commercial.findUnique({
  where: { id },
  include: {
    immeubles: true,
    statistics: true,
    manager: true
  }
});
```

---

## Ressources & Références

- [NestJS GraphQL](https://docs.nestjs.com/graphql/quick-start)
- [Prisma Relations](https://www.prisma.io/docs/concepts/relations)
- [LiveKit Egress](https://docs.livekit.io/home/egress/)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Keycloak Admin API](https://www.keycloak.org/docs/latest/server_admin/)

---

**Dernière mise à jour** : Janvier 2026  
**Version** : 1.0.0  
**Auteur** : Équipe Backend Rework
