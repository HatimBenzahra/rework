# 📚 Documentation Re_work - Index

Bienvenue dans la documentation complète du projet **Re_work** (Système de gestion commerciale).

---

## 🚨 NOUVEAU : Corrections du Système de Rôles

**⭐ Commencez par lire** : [`POUR_VOUS_LIRE_EN_PREMIER.md`](./POUR_VOUS_LIRE_EN_PREMIER.md)

Un bug critique dans le système de rôles a été identifié et corrigé. Les directeurs ne pouvaient pas voir leurs commerciaux. Tout est maintenant réparé ! Consultez le guide ci-dessus pour appliquer les corrections (5 minutes).

---

## 📖 Documents disponibles

### 1. 🎯 **Référence Rapide** ⚡

**Fichier**: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)

**Pour qui**: Développeurs qui veulent rapidement savoir quel endpoint utiliser

**Contenu**:

- Mapping ultra-rapide page → endpoints
- Patterns d'utilisation
- Matrice de dépendances
- Commandes utiles
- Tips pratiques

**Quand l'utiliser**:

- ✅ "Quelle query dois-je utiliser pour la page Zones ?"
- ✅ "Quels hooks existent déjà pour les commerciaux ?"
- ✅ "Cette page utilise quels endpoints ?"

---

### 2. 🔗 **Mapping Frontend-Backend Détaillé**

**Fichier**: [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md)

**Pour qui**: Développeurs qui veulent comprendre en détail les flux de données

**Contenu**:

- Mapping complet pour chaque page (7 pages)
- Queries et mutations utilisées avec exemples
- Hooks React pour chaque endpoint
- Flux de données détaillés (création, modification, suppression)
- Particularités de chaque page
- APIs externes utilisées (Mapbox)

**Quand l'utiliser**:

- ✅ "Comment fonctionne la création d'une zone ?"
- ✅ "Quelles sont les relations chargées dans GET_COMMERCIAL_FULL ?"
- ✅ "Comment s'effectue l'assignation d'un commercial à une zone ?"

---

### 2.5 🔐 **Gestion des Rôles et Hiérarchie** 🆕

**Fichiers**:

- [`VERIFICATION_ROLES_RAPPORT.md`](./VERIFICATION_ROLES_RAPPORT.md) - Rapport d'analyse complet
- [`ROLE_HIERARCHY_FIX.md`](./ROLE_HIERARCHY_FIX.md) - Documentation technique de la correction

**Pour qui**: Développeurs travaillant sur les permissions et le filtrage des données

**Contenu**:

- ✅ Architecture hiérarchique : Admin → Directeur → Manager → Commercial
- ✅ Analyse complète du système de filtrage par rôle
- ✅ Correction du problème d'assignation du directeurId
- ✅ Script de correction des données existantes
- ✅ Tests de validation du système
- ✅ Matrice des permissions par rôle et par entité

**Quand l'utiliser**:

- ✅ "Comment fonctionne le filtrage des données par rôle ?"
- ✅ "Pourquoi un directeur ne voit pas ses commerciaux ?"
- ✅ "Comment corriger les données existantes ?"
- ✅ "Quelles sont les permissions de chaque rôle ?"

---

### 3. 🏗️ **Documentation Backend Complète**

**Fichier**: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md)

**Pour qui**: Développeurs backend, architectes, nouveaux développeurs

**Contenu**:

- Vue d'ensemble de l'architecture (NestJS + GraphQL + Prisma)
- Schéma de base de données complet (7 modèles)
- Tous les endpoints GraphQL (queries et mutations)
- Services backend détaillés
- Diagramme des relations
- Optimisations implémentées
- Recommandations d'amélioration

**Quand l'utiliser**:

- ✅ "Quelle est la structure de la base de données ?"
- ✅ "Quels sont tous les endpoints disponibles ?"
- ✅ "Comment fonctionne le service ZoneService ?"
- ✅ "Quelles sont les relations entre les entités ?"

---

### 4. 📊 **Comparaison Avant/Après Optimisations**

**Fichier**: [`BEFORE_AFTER_COMPARISON.md`](./BEFORE_AFTER_COMPARISON.md)

**Pour qui**: Product owners, développeurs qui veulent comprendre l'évolution

**Contenu**:

- Comparaison des approches avant/après optimisation
- Bénéfices de l'architecture actuelle
- Exemples de code avant/après

**Quand l'utiliser**:

- ✅ "Pourquoi utiliser GET_COMMERCIALS au lieu de GET_COMMERCIAL_FULL ?"
- ✅ "Quelles optimisations ont été apportées ?"

---

### 5. ⚡ **Optimisations GraphQL**

**Fichier**: [`OPTIMIZATION_GRAPHQL.md`](./OPTIMIZATION_GRAPHQL.md)

**Pour qui**: Développeurs qui veulent optimiser les performances

**Contenu**:

- Stratégies d'optimisation GraphQL
- Lazy loading et cache
- Bonnes pratiques

**Quand l'utiliser**:

- ✅ "Comment éviter les requêtes N+1 ?"
- ✅ "Comment implémenter le cache pour les queries ?"

---

### 6. 🧪 **Tests de filtrage par rôles**

**Fichier**: [`TESTS_FILTRAGE_ROLES.md`](./TESTS_FILTRAGE_ROLES.md)

**Pour qui**: QA, développeurs qui travaillent sur les permissions

**Contenu**:

- Tests de filtrage selon les rôles (Admin, Directeur, Manager, Commercial)
- Scénarios de test
- Résultats attendus

**Quand l'utiliser**:

- ✅ "Quelles données un Manager peut-il voir ?"
- ✅ "Comment tester les permissions ?"

---

## 🗺️ Guide d'utilisation selon votre besoin

### Je veux rapidement savoir quel endpoint utiliser

→ [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)

### Je dois créer une nouvelle page frontend

→ [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md) (voir les patterns)

### Je dois comprendre la structure de la base de données

→ [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md) (section "Schéma de base de données")

### Je dois ajouter un nouveau endpoint backend

→ [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md) (section "Services Backend")

### Je dois optimiser une page qui charge lentement

→ [`OPTIMIZATION_GRAPHQL.md`](./OPTIMIZATION_GRAPHQL.md)

### Je dois implémenter des permissions par rôle

→ [`TESTS_FILTRAGE_ROLES.md`](./TESTS_FILTRAGE_ROLES.md)

---

## 📋 Architecture du projet

```
Re_work/
├── backend/                      # Backend NestJS + GraphQL
│   ├── src/
│   │   ├── commercial/          # Module commerciaux
│   │   ├── directeur/           # Module directeurs
│   │   ├── manager/             # Module managers
│   │   ├── zone/                # Module zones
│   │   ├── immeuble/            # Module immeubles
│   │   ├── statistic/           # Module statistiques
│   │   ├── prisma.service.ts    # Service Prisma
│   │   ├── app.module.ts        # Module principal
│   │   └── schema.gql           # Schéma GraphQL auto-généré
│   └── prisma/
│       └── schema.prisma         # Schéma base de données
│
├── frontend/                     # Frontend React
│   └── src/
│       ├── pages/               # Pages de l'application
│       │   ├── dashboard/       # Dashboard
│       │   ├── directeurs/      # Gestion directeurs
│       │   ├── managers/        # Gestion managers
│       │   ├── commercial/      # Gestion commerciaux + détails
│       │   ├── zones/           # Gestion zones
│       │   └── immeubles/       # Gestion immeubles
│       ├── services/            # Services API
│       │   ├── api-queries.ts   # Toutes les queries GraphQL
│       │   ├── api-mutations.ts # Toutes les mutations GraphQL
│       │   └── api-service.ts   # Hooks React pour l'API
│       └── hooks/               # Hooks personnalisés
│
└── Documentation/                # 📚 Vous êtes ici
    ├── QUICK_REFERENCE.md               # ⚡ Référence rapide
    ├── FRONTEND_BACKEND_MAPPING.md      # 🔗 Mapping détaillé
    ├── BACKEND_DOCUMENTATION.md         # 🏗️ Documentation backend
    ├── BEFORE_AFTER_COMPARISON.md       # 📊 Comparaison optimisations
    ├── OPTIMIZATION_GRAPHQL.md          # ⚡ Optimisations GraphQL
    └── TESTS_FILTRAGE_ROLES.md          # 🧪 Tests rôles
```

---

## 🔍 Recherche rapide

### Par entité

#### Directeur

- Schéma DB: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#1-directeur-directeur-commercial)
- Endpoints: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#directeurs)
- Page frontend: [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md#2-directeurs-directeurs)
- Quick ref: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#directeurs---liste-des-directeurs)

#### Manager

- Schéma DB: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#2-manager-manager-régional)
- Endpoints: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#managers)
- Page frontend: [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md#3-managers-managers)
- Quick ref: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#managers---liste-des-managers)

#### Commercial

- Schéma DB: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#3-commercial-agent-commercial)
- Endpoints: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#commerciaux)
- Page frontend: [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md#4-commerciaux-commerciaux)
- Page détails: [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md#5-détails-commercial-commerciauxid)
- Quick ref: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#commerciaux---liste-des-commerciaux)

#### Zone

- Schéma DB: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#4-zone-zone-géographique)
- Endpoints: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#zones)
- Page frontend: [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md#6-zones-zones)
- Quick ref: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#zones---liste-des-zones)

#### Immeuble

- Schéma DB: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#5-immeuble-bâtiment-à-prospecter)
- Endpoints: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#immeubles)
- Page frontend: [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md#7-immeubles-immeubles)
- Quick ref: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md#immeubles---liste-des-immeubles)

#### Statistic

- Schéma DB: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#6-statistic-statistiques-de-prospection)
- Endpoints: [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md#statistiques)
- Utilisation: [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md#5-détails-commercial-commerciauxid)

---

## 📊 Statistiques du projet

### Backend

- **Framework**: NestJS
- **API**: GraphQL
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Modules**: 6 (Directeur, Manager, Commercial, Zone, Immeuble, Statistic)
- **Endpoints**: 30+ (queries + mutations)

### Frontend

- **Framework**: React
- **UI**: Tailwind CSS + shadcn/ui
- **État**: Hooks React + Apollo Client
- **Pages**: 7 pages principales
- **Hooks personnalisés**: 15+ hooks API

### Base de données

- **Tables**: 7 (Directeur, Manager, Commercial, Zone, Immeuble, Statistic, CommercialZone)
- **Relations**: Many-to-one, One-to-many, Many-to-many

---

## 🚀 Démarrage rapide

### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- GraphQL Playground: http://localhost:3000/graphql
- Prisma Studio: `npx prisma studio` (depuis backend/)

---

## 📞 Ressources externes

### Technologies

- [NestJS Documentation](https://nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/)
- [GraphQL Documentation](https://graphql.org/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### APIs externes utilisées

- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

---

## 🔄 Maintenance de la documentation

### Quand mettre à jour

- ✅ Ajout d'un nouveau endpoint
- ✅ Ajout d'une nouvelle page
- ✅ Modification d'un modèle de données
- ✅ Changement de flux majeur

### Comment mettre à jour

1. Modifier le document concerné
2. Mettre à jour la date en bas du document
3. Si ajout d'entité, mettre à jour tous les documents
4. Tester les exemples de code

---

## ✅ Checklist pour nouveau développeur

- [ ] Lire [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md) (section "Vue d'ensemble")
- [ ] Lire [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md) (section "Schéma de base de données")
- [ ] Parcourir [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)
- [ ] Tester les endpoints dans GraphQL Playground
- [ ] Lancer Prisma Studio pour voir les données
- [ ] Créer un directeur via l'interface
- [ ] Créer un manager et l'assigner au directeur
- [ ] Créer un commercial et l'assigner au manager
- [ ] Créer une zone et l'assigner au commercial

---

## 🎓 Glossaire

- **Directeur**: Responsable hiérarchique de niveau supérieur
- **Manager**: Responsable régional qui gère une équipe de commerciaux
- **Commercial**: Agent commercial qui prospecte des immeubles
- **Zone**: Zone géographique définie par un cercle (centre + rayon)
- **Immeuble**: Bâtiment à prospecter (adresse, étages, portes)
- **Statistic**: Métriques de performance (contrats, visites, RDV, refus)
- **CommercialZone**: Table de liaison pour relation many-to-many Commercial ↔ Zone

---

## 📝 Historique des versions

### Version 1.0.0 (13 octobre 2025)

- ✅ Documentation initiale complète
- ✅ Mapping frontend-backend
- ✅ Référence rapide
- ✅ Guide d'optimisation
- ✅ Tests de rôles

---

## 💡 Conseils pour utiliser cette documentation

### Pour développer une nouvelle feature

1. Commencer par [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) pour voir les patterns existants
2. Consulter [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md) pour une page similaire
3. Vérifier dans [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md) si les endpoints existent
4. Suivre le même pattern que les pages existantes

### Pour débugger un problème

1. Vérifier dans [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md) les queries utilisées
2. Tester la query dans GraphQL Playground
3. Vérifier les relations dans [`BACKEND_DOCUMENTATION.md`](./BACKEND_DOCUMENTATION.md)
4. Consulter [`OPTIMIZATION_GRAPHQL.md`](./OPTIMIZATION_GRAPHQL.md) pour les problèmes de performance

### Pour comprendre le système de rôles

1. Lire [`TESTS_FILTRAGE_ROLES.md`](./TESTS_FILTRAGE_ROLES.md)
2. Voir les exemples dans [`FRONTEND_BACKEND_MAPPING.md`](./FRONTEND_BACKEND_MAPPING.md) (section "Particularités")

---

**Dernière mise à jour**: 13 octobre 2025
**Version**: 1.0.0
**Mainteneur**: Équipe Re_work
