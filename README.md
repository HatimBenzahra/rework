# 🚀 Re_work - Système de Gestion Commerciale

Plateforme complète de gestion d'équipes commerciales avec suivi des performances, gestion des zones géographiques et prospection d'immeubles.

---

## 📋 Vue d'ensemble

**Re_work** est une application full-stack moderne permettant de :

- 👥 Gérer les équipes commerciales (Directeurs, Managers, Commerciaux)
- 🗺️ Définir et assigner des zones géographiques
- 🏢 Suivre la prospection d'immeubles
- 📊 Analyser les performances commerciales
- 🔐 Gérer les permissions par rôle

---

## 🏗️ Stack technique

### Backend

- **Framework**: NestJS
- **API**: GraphQL (Apollo Server)
- **ORM**: Prisma
- **Base de données**: PostgreSQL
- **Port**: 3000

### Frontend

- **Framework**: React + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **État**: Hooks React + Apollo Client
- **Cartes**: Mapbox GL JS
- **Port**: 5173

---

## 🚀 Installation et démarrage

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend

```bash
# Installation
cd backend
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos paramètres

# Base de données
npx prisma migrate dev
npx prisma db seed

# Démarrage
npm run start:dev
```

**URLs Backend**:

- API: http://localhost:3000
- GraphQL Playground: http://localhost:3000/graphql
- Prisma Studio: `npx prisma studio`

### Frontend

```bash
# Installation
cd frontend
npm install

# Configuration
cp .env.example .env
# Éditer .env avec votre token Mapbox

# Démarrage
npm run dev
```

**URL Frontend**: http://localhost:5173

---

## 📚 Documentation

### 📖 Documentation complète disponible

Nous avons créé une documentation exhaustive du projet. Voici comment naviguer :

#### 🎯 Point d'entrée

**[`DOCUMENTATION_INDEX.md`](./DOCUMENTATION_INDEX.md)** - Index complet de toute la documentation

#### ⚡ Pour démarrer rapidement

**[`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)** - Référence rapide des endpoints par page

#### 🔗 Pour comprendre les flux de données

**[`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md)** - Mapping détaillé Frontend ↔ Backend

#### 🏗️ Pour l'architecture et les endpoints

**[`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md)** - Documentation technique complète du backend

#### ⚡ Pour les optimisations

**[`OPTIMIZATION_GRAPHQL.md`](./OPTIMIZATION_GRAPHQL.md)** - Guide d'optimisation GraphQL

#### 🧪 Pour les tests et permissions

**[`TESTS_FILTRAGE_ROLES.md`](./TESTS_FILTRAGE_ROLES.md)** - Tests du système de rôles

---

## 🎯 Fonctionnalités principales

### 👥 Gestion des utilisateurs

- **Directeurs**: Niveau hiérarchique supérieur
- **Managers**: Gestion d'équipes régionales
- **Commerciaux**: Agents de terrain

### 🗺️ Zones géographiques

- Création de zones circulaires sur carte interactive
- Assignation aux directeurs/managers/commerciaux
- Reverse geocoding automatique (Mapbox)
- Filtrage selon les rôles

### 🏢 Immeubles

- Gestion du patrimoine immobilier
- Calcul automatique du nombre de portes
- Suivi de la couverture de prospection
- Assignation aux commerciaux

### 📊 Statistiques

- Contrats signés
- Immeubles visités
- Rendez-vous pris
- Taux de conversion
- Historique des performances

### 🔐 Système de rôles

- **Admin**: Accès complet
- **Directeur**: Gestion de son périmètre
- **Manager**: Gestion de son équipe
- **Commercial**: Accès à ses données uniquement

---

## 📊 Structure du projet

```
Re_work/
├── backend/                     # Backend NestJS + GraphQL
│   ├── src/
│   │   ├── commercial/         # Module commerciaux
│   │   ├── directeur/          # Module directeurs
│   │   ├── manager/            # Module managers
│   │   ├── zone/               # Module zones
│   │   ├── immeuble/           # Module immeubles
│   │   ├── statistic/          # Module statistiques
│   │   └── prisma.service.ts   # Service Prisma
│   ├── prisma/
│   │   └── schema.prisma       # Schéma base de données
│   └── package.json
│
├── frontend/                    # Frontend React
│   ├── src/
│   │   ├── pages/              # Pages (7 pages)
│   │   ├── components/         # Composants réutilisables
│   │   ├── services/           # Services API
│   │   ├── hooks/              # Hooks personnalisés
│   │   └── contexts/           # Contexts React
│   └── package.json
│
└── Documentation/               # 📚 Documentation
    ├── DOCUMENTATION_INDEX.md           # Index
    ├── QUICK_REFERENCE.md               # Référence rapide
    ├── FRONTEND_BACKEND_MAPPING.md      # Mapping détaillé
    ├── BACKEND_DOCUMENTATION.md         # Doc backend
    ├── OPTIMIZATION_GRAPHQL.md          # Optimisations
    ├── TESTS_FILTRAGE_ROLES.md          # Tests rôles
    └── BEFORE_AFTER_COMPARISON.md       # Comparaison
```

---

## 🗄️ Modèle de données

### Entités principales

- **Directeur** (1) ← (n) **Manager** (1) ← (n) **Commercial**
- **Commercial** (n) ↔ (n) **Zone** (via CommercialZone)
- **Commercial** (1) ← (n) **Immeuble**
- **Commercial/Immeuble/Zone** (1) ← (n) **Statistic**

### Relations

- Un directeur peut gérer plusieurs managers
- Un manager peut gérer plusieurs commerciaux
- Un commercial peut être assigné à plusieurs zones
- Un commercial peut gérer plusieurs immeubles
- Chaque entité peut avoir des statistiques

**Voir le diagramme complet dans**: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#-diagramme-des-relations)

---

## 🎨 Pages de l'application

| Page               | Route              | Description                             |
| ------------------ | ------------------ | --------------------------------------- |
| Dashboard          | `/dashboard`       | Page d'accueil                          |
| Directeurs         | `/directeurs`      | Gestion des directeurs                  |
| Managers           | `/managers`        | Gestion des managers                    |
| Commerciaux        | `/commerciaux`     | Gestion des commerciaux                 |
| Détails Commercial | `/commerciaux/:id` | Détails et statistiques d'un commercial |
| Zones              | `/zones`           | Gestion des zones géographiques         |
| Immeubles          | `/immeubles`       | Gestion du patrimoine immobilier        |

**Voir le mapping complet**: [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md#-vue-densemble-des-pages)

---

## 📡 Endpoints GraphQL

### Queries (Lecture)

```graphql
directeurs, directeur(id)
managers, manager(id)
commercials, commercial(id)
zones, zone(id)
immeubles, immeuble(id)
statistics, statistic(id)
```

### Mutations (Écriture)

```graphql
create*, update*, remove*    # Pour toutes les entités
assignZoneToCommercial       # Assignation zone → commercial
unassignZoneFromCommercial   # Désassignation
```

**Voir la liste complète**: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#-api-graphql)

---

## ⚡ Optimisations

### Backend

- ✅ Transactions Prisma pour suppressions en cascade
- ✅ Includes selectifs pour les relations
- ✅ Schéma GraphQL auto-généré

### Frontend

- ✅ Queries légères vs complètes (GET_COMMERCIALS vs GET_COMMERCIAL_FULL)
- ✅ Lazy loading des adresses avec cache (Zones)
- ✅ Déduplication des requêtes Mapbox
- ✅ Filtrage basé sur les rôles côté client

**Voir le guide complet**: [`OPTIMIZATION_GRAPHQL.md`](./OPTIMIZATION_GRAPHQL.md)

---

## 🧪 Tests

### Tests de rôles

Le système de permissions a été testé pour les 4 rôles :

- Admin (accès complet)
- Directeur (son périmètre)
- Manager (son équipe)
- Commercial (ses données)

**Voir les scénarios de test**: [`TESTS_FILTRAGE_ROLES.md`](./TESTS_FILTRAGE_ROLES.md)

---

## 🔒 Sécurité

### Actuel

- ✅ CORS configuré
- ✅ Validation des inputs (DTOs)
- ✅ Filtrage côté frontend selon rôle

### À implémenter

- ⚠️ Authentification JWT
- ⚠️ Guards NestJS pour les rôles
- ⚠️ Filtrage côté backend selon rôle
- ⚠️ Rate limiting

---

## 🛠️ Commandes utiles

### Backend

```bash
# Développement
npm run start:dev

# Build
npm run build

# Prisma
npx prisma studio              # Interface graphique DB
npx prisma migrate dev         # Créer une migration
npx prisma db seed             # Seed la DB
npx prisma generate            # Générer le client

# Tests
npm run test
npm run test:e2e
```

### Frontend

```bash
# Développement
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

---

## 📦 APIs externes

### Mapbox

Utilisé pour les zones géographiques :

- **Mapbox GL JS**: Carte interactive
- **Geocoding API**: Coordonnées → Nom de lieu

**Configuration**:

```bash
# frontend/.env
VITE_MAPBOX_ACCESS_TOKEN=your_token_here
```

**Obtenir un token**: https://account.mapbox.com/

---

## 🐛 Debugging

### Backend ne démarre pas

```bash
# Vérifier PostgreSQL
psql -U postgres

# Recréer la DB
npx prisma migrate reset
```

### Frontend ne se connecte pas au backend

```bash
# Vérifier que le backend tourne
curl http://localhost:3000/graphql

# Vérifier CORS dans backend/src/main.ts
```

### Erreur Prisma

```bash
# Régénérer le client
npx prisma generate

# Vérifier les migrations
npx prisma migrate status
```

---

## 🚀 Déploiement

### Backend

1. Build: `npm run build`
2. Variables d'environnement: `DATABASE_URL`, `PORT`
3. Migrations: `npx prisma migrate deploy`
4. Démarrer: `node dist/main.js`

### Frontend

1. Build: `npm run build`
2. Variables d'environnement: `VITE_GRAPHQL_ENDPOINT`, `VITE_MAPBOX_ACCESS_TOKEN`
3. Servir: `dist/` avec un serveur statique (Nginx, Vercel, etc.)

---

## 📝 Roadmap

### À court terme

- [ ] Ajouter l'authentification JWT
- [ ] Implémenter la pagination
- [ ] Ajouter les vraies statistiques de couverture
- [ ] Tests unitaires et e2e
- [ ] CI/CD

### À moyen terme

- [ ] Dashboard avec graphiques
- [ ] Export Excel/PDF
- [ ] Notifications en temps réel
- [ ] Application mobile
- [ ] Mode hors-ligne

### À long terme

- [ ] IA pour recommandations de zones
- [ ] Analyse prédictive des performances
- [ ] Intégration CRM externe
- [ ] Module de planification de tournées

---

## 🤝 Contribution

### Pour contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de code

- ESLint configuré sur backend et frontend
- Prettier pour le formatage
- Conventions de nommage:
  - Backend: PascalCase pour les classes, camelCase pour les méthodes
  - Frontend: PascalCase pour les composants, camelCase pour les fonctions

---

## 📄 Licence

Ce projet est sous licence MIT.

---

## 📞 Support

### Documentation

- 📖 [Documentation complète](./DOCUMENTATION_INDEX.md)
- ⚡ [Référence rapide](./QUICK_REFERENCE.md)
- 🔗 [Mapping Frontend-Backend](./FRONTEND_BACKEND_MAPPING.md)

### Liens utiles

- [NestJS Docs](https://nestjs.com/)
- [Prisma Docs](https://www.prisma.io/)
- [GraphQL Docs](https://graphql.org/)
- [React Docs](https://react.dev/)
- [Mapbox Docs](https://docs.mapbox.com/)

---

## ✨ Remerciements

- NestJS pour le framework backend robuste
- Prisma pour l'ORM moderne
- React et Vite pour l'expérience développeur
- Mapbox pour les cartes interactives
- shadcn/ui pour les composants UI

---

**Version**: 1.0.0  
**Dernière mise à jour**: 13 octobre 2025  
**Statut**: En développement actif 🚧

---

## 🎯 Quick Start pour nouveaux développeurs

1. **Lire la documentation**:

   - Commencer par [`DOCUMENTATION_INDEX.md`](./DOCUMENTATION_INDEX.md)
   - Parcourir [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)

2. **Installer le projet**:

   ```bash
   # Backend
   cd backend && npm install
   npx prisma migrate dev
   npx prisma db seed
   npm run start:dev

   # Frontend
   cd frontend && npm install
   npm run dev
   ```

3. **Tester l'application**:

   - Ouvrir http://localhost:5173
   - Explorer GraphQL Playground: http://localhost:3000/graphql
   - Voir les données: `npx prisma studio`

4. **Créer votre première feature**:
   - Consulter [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md) pour les patterns
   - Suivre la structure existante
   - Tester dans GraphQL Playground avant d'implémenter le frontend

---

Bonne chance avec **Re_work** ! 🚀
