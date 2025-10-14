# ⚡ Référence Rapide - Frontend/Backend Mapping

Guide ultra-rapide pour savoir quels endpoints utiliser pour chaque page.

---

## 📄 Pages Frontend → Endpoints Backend

### `/dashboard` - Dashboard

```
Aucun endpoint utilisé (page statique)
```

---

### `/directeurs` - Liste des Directeurs

**Fichier**: `frontend/src/pages/directeurs/Directeurs.jsx`

#### Lecture

```graphql
✓ directeurs          # Liste complète
✓ directeur(id)       # Un seul (si détails)
```

#### Écriture

```graphql
✓ createDirecteur     # Créer
✓ updateDirecteur     # Modifier
✓ removeDirecteur     # Supprimer
```

#### Hooks

```javascript
useDirecteurs(); // Lecture
useCreateDirecteur(); // Créer
useUpdateDirecteur(); // Modifier
useRemoveDirecteur(); // Supprimer
```

---

### `/managers` - Liste des Managers

**Fichier**: `frontend/src/pages/managers/Managers.jsx`

#### Lecture

```graphql
✓ managers            # Liste complète
✓ directeurs          # Pour dropdown d'assignation
```

#### Écriture

```graphql
✓ createManager       # Créer
✓ updateManager       # Modifier
✓ removeManager       # Supprimer
```

#### Hooks

```javascript
useManagers(); // Lecture managers
useDirecteurs(); // Lecture directeurs (dropdown)
useCreateManager(); // Créer
useUpdateManager(); // Modifier
useRemoveManager(); // Supprimer
```

---

### `/commerciaux` - Liste des Commerciaux

**Fichier**: `frontend/src/pages/commercial/Commerciaux.jsx`

#### Lecture

```graphql
✓ commercials         # Liste légère (sans relations)
✓ managers            # Pour dropdown d'assignation
✓ directeurs          # Pour affichage dans tableau
```

#### Écriture

```graphql
✓ createCommercial    # Créer
✓ updateCommercial    # Modifier
✓ removeCommercial    # Supprimer
```

#### Hooks

```javascript
useCommercials(); // Lecture commerciaux
useManagers(); // Lecture managers (dropdown + affichage)
useDirecteurs(); // Lecture directeurs (affichage)
useCreateCommercial(); // Créer
useUpdateCommercial(); // Modifier
useRemoveCommercial(); // Supprimer
```

---

### `/commerciaux/:id` - Détails d'un Commercial

**Fichier**: `frontend/src/pages/commercial/CommercialDetails.jsx`

#### Lecture

```graphql
✓ commercial(id)      # Détails complets avec:
    ├─ immeubles[]      # Ses immeubles
    ├─ zones[]          # Ses zones
    └─ statistics[]     # Ses statistiques

✓ managers            # Pour afficher le nom du manager
```

#### Écriture

```
Aucune (page lecture seule)
```

#### Hooks

```javascript
useCommercialFull(id); // Lecture détails complets
useManagers(); // Lecture managers (affichage nom)
```

#### Calculs frontend

```javascript
totalContratsSignes = sum(statistics.contratsSignes);
totalImmeublesVisites = sum(statistics.immeublesVisites);
totalRendezVousPris = sum(statistics.rendezVousPris);
totalRefus = sum(statistics.refus);
tauxConversion = (contratsSignes / rendezVousPris) * 100;
zonesCount = zones.length;
immeublesCount = immeubles.length;
```

---

### `/zones` - Liste des Zones

**Fichier**: `frontend/src/pages/zones/Zones.jsx`

#### Lecture

```graphql
✓ zones               # Liste complète avec commercials[]
✓ commercials         # Pour assignation + filtrage
✓ managers            # Pour assignation + affichage
✓ directeurs          # Pour assignation + affichage
```

#### Écriture

```graphql
✓ createZone                    # Créer une zone
✓ updateZone                    # Modifier une zone
✓ removeZone                    # Supprimer (avec cascade)
✓ assignZoneToCommercial        # Assigner zone → commercial
✓ unassignZoneFromCommercial    # Désassigner zone ← commercial
```

#### Hooks

```javascript
useZones(); // Lecture zones
useCommercials(); // Lecture commerciaux
useManagers(); // Lecture managers
useDirecteurs(); // Lecture directeurs
useCreateZone(); // Créer
useUpdateZone(); // Modifier
useRemoveZone(); // Supprimer
useAssignZone(); // Assigner à commercial
```

#### APIs externes

```
Mapbox Geocoding API        # Coordonnées → Nom de lieu
Mapbox GL JS                # Carte interactive
```

---

### `/immeubles` - Liste des Immeubles

**Fichier**: `frontend/src/pages/immeubles/Immeubles.jsx`

#### Lecture

```graphql
✓ immeubles           # Liste complète
✓ commercials         # Pour dropdown assignation + filtrage
```

#### Écriture

```graphql
✗ createImmeuble      # Non implémenté dans l'UI
✓ updateImmeuble      # Modifier
✓ removeImmeuble      # Supprimer
```

#### Hooks

```javascript
useImmeubles(); // Lecture immeubles
useCommercials(); // Lecture commerciaux (dropdown + filtrage)
useUpdateImmeuble(); // Modifier
useRemoveImmeuble(); // Supprimer
```

#### Calculs frontend

```javascript
totalPortes = nbEtages × nbPortesParEtage
couverture  = (portesProspectees / totalPortes) * 100  // ⚠️ Simulé
```

---

## 🔄 Patterns d'utilisation

### Pattern 1: Page simple CRUD

```
Directeurs, Managers
└─ Queries:  GET_ENTITY, GET_ENTITIES
└─ Mutations: CREATE, UPDATE, REMOVE
```

### Pattern 2: Page avec assignation

```
Commerciaux, Zones
└─ Queries:  GET_ENTITY + GET_RELATED_ENTITIES
└─ Mutations: CREATE, UPDATE, REMOVE
```

### Pattern 3: Page avec assignation complexe

```
Zones
└─ Queries:  GET_ZONES + GET_COMMERCIALS + GET_MANAGERS + GET_DIRECTEURS
└─ Mutations: CREATE, UPDATE, REMOVE + ASSIGN + UNASSIGN
```

### Pattern 4: Page détails (read-only)

```
CommercialDetails
└─ Queries:  GET_ENTITY_FULL (avec relations) + GET_RELATED
└─ Mutations: Aucune
```

---

## 📊 Matrice de dépendances

| Page                  | directeurs   | managers     | commercials   | zones        | immeubles    | statistics |
| --------------------- | ------------ | ------------ | ------------- | ------------ | ------------ | ---------- |
| **Directeurs**        | ✓ Read/Write | -            | -             | -            | -            | -          |
| **Managers**          | ✓ Read       | ✓ Read/Write | -             | -            | -            | -          |
| **Commerciaux**       | ✓ Read       | ✓ Read       | ✓ Read/Write  | -            | -            | -          |
| **CommercialDetails** | -            | ✓ Read       | ✓ Read (Full) | -            | -            | -          |
| **Zones**             | ✓ Read       | ✓ Read       | ✓ Read        | ✓ Read/Write | -            | -          |
| **Immeubles**         | -            | -            | ✓ Read        | -            | ✓ Read/Write | -          |

**Légende**:

- ✓ Read = Lecture seule (query)
- ✓ Read/Write = Lecture + Écriture (query + mutations)
- ✓ Read (Full) = Lecture avec toutes les relations

---

## 🎯 Endpoints par fréquence d'utilisation

### Très utilisés (3+ pages)

```
commercials      → Commerciaux, Zones, Immeubles
managers         → Managers, Commerciaux, Zones, CommercialDetails
directeurs       → Directeurs, Managers, Zones
```

### Moyennement utilisés (1-2 pages)

```
zones            → Zones
immeubles        → Immeubles, CommercialDetails
statistics       → CommercialDetails
```

---

## 🚨 Mutations critiques (avec side effects)

### removeZone

```typescript
// Backend: Transaction Prisma
1. Delete CommercialZone relations
2. Delete Statistics relations
3. Delete Zone itself

// ⚠️ Utiliser uniquement si sûr
```

### removeCommercial

```typescript
// Backend: Simple delete
// ⚠️ Laisse orphelins:
- Immeubles (commercialId reste)
- CommercialZone relations
- Statistics

// TODO: Implémenter transaction
```

---

## 🔍 Queries optimisées

### Légères (pour listes)

```graphql
GET_COMMERCIALS      # Sans relations
GET_MANAGERS         # Sans relations
GET_DIRECTEURS       # Sans relations
GET_IMMEUBLES        # Sans relations
```

### Complètes (pour détails)

```graphql
GET_COMMERCIAL_FULL  # Avec immeubles + zones + statistics
GET_ZONE             # Avec commercials[]
```

---

## 🛠️ Commandes utiles

### Tester un endpoint

```bash
# GraphQL Playground
open http://localhost:3000/graphql
```

### Voir les données en DB

```bash
cd backend
npx prisma studio
```

### Lancer le backend

```bash
cd backend
npm run start:dev
```

### Lancer le frontend

```bash
cd frontend
npm run dev
```

---

## 📝 Checklist avant modification

### Avant de modifier un endpoint backend:

- [ ] Vérifier quelles pages l'utilisent (voir matrice ci-dessus)
- [ ] Vérifier les relations Prisma
- [ ] Tester dans GraphQL Playground
- [ ] Vérifier les tests (si existants)

### Avant d'ajouter une nouvelle page:

- [ ] Identifier les queries nécessaires
- [ ] Identifier les mutations nécessaires
- [ ] Vérifier si les hooks existent déjà
- [ ] Déterminer le système de filtrage (rôle)

---

## 💡 Tips

### Trouver quel endpoint utilise une page

```bash
# Rechercher dans le code
grep -r "useCommercials\|useManagers" frontend/src/pages/
```

### Voir toutes les queries disponibles

```bash
cat frontend/src/services/api-queries.ts
```

### Voir toutes les mutations disponibles

```bash
cat frontend/src/services/api-mutations.ts
```

### Voir le schéma GraphQL complet

```bash
cat backend/src/schema.gql
```

---

**Dernière mise à jour**: 13 octobre 2025
**Version**: 1.0.0
