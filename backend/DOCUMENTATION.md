# Documentation Backend - Rework

## Vue d'ensemble

Application backend NestJS utilisant GraphQL, Prisma ORM et PostgreSQL pour gérer un système de gestion commerciale avec enregistrement audio/vidéo via LiveKit.

---

## Technologies principales

### Framework & Core
- **NestJS 11** - Framework Node.js progressif
- **TypeScript 5.7** - Langage typé
- **GraphQL** - API avec Apollo Server 5
- **Express 5** - Serveur HTTP

### Base de données
- **PostgreSQL** - Base de données relationnelle
- **Prisma 6** - ORM moderne pour Node.js

### Communication temps réel
- **LiveKit Server SDK** - Gestion audio/vidéo
- **WebSocket** - Communication bidirectionnelle
- **http-proxy-middleware** - Proxy pour LiveKit

### Cloud & Storage
- **AWS S3** - Stockage des enregistrements
- **@aws-sdk/client-s3** - Client AWS
- **@aws-sdk/s3-request-presigner** - URLs présignées

### Validation & Transformation
- **class-validator** - Validation des DTOs
- **class-transformer** - Transformation des objets

### Développement
- **ESLint** - Linting du code
- **Prettier** - Formatage du code
- **Jest** - Tests unitaires et e2e
- **ts-jest** - Tests TypeScript

---

## Architecture

### Structure des dossiers

```
backend/
├── prisma/
│   ├── schema.prisma      # Schéma de base de données
│   └── seed.ts            # Données de seed
├── src/
│   ├── auth/              # Module d'authentification
│   │   ├── decorators/    # Décorateurs personnalisés
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── guards/        # Guards d'authentification
│   │   ├── auth.module.ts
│   │   ├── auth.resolver.ts
│   │   ├── auth.service.ts
│   │   └── auth.types.ts
│   ├── commercial/        # Gestion des commerciaux
│   │   ├── commercial.dto.ts
│   │   ├── commercial.module.ts
│   │   ├── commercial.resolver.ts
│   │   └── commercial.service.ts
│   ├── manager/           # Gestion des managers
│   ├── directeur/         # Gestion des directeurs
│   ├── zone/              # Gestion des zones géographiques
│   ├── immeuble/          # Gestion des immeubles
│   ├── porte/             # Gestion des portes/appartements
│   ├── statistic/         # Statistiques
│   ├── recording/         # Enregistrements audio/vidéo
│   ├── audio-monitoring/  # Monitoring audio en temps réel
│   ├── app.module.ts      # Module racine
│   ├── main.ts            # Point d'entrée
│   ├── prisma.service.ts  # Service Prisma
│   └── schema.gql         # Schéma GraphQL généré
├── ssl/                   # Certificats SSL (dev local)
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## Configuration

### Variables d'environnement

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# LiveKit
LK_HOST=http://localhost:7880
LK_API_KEY=your_api_key
LK_API_SECRET=your_api_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-west-1
AWS_BUCKET_NAME=your_bucket

# Frontend
VITE_FRONTEND_URL=https://localhost:5173,https://192.168.1.107:5173
```

### Démarrage

```bash
# Installation
npm install

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Seed de la base de données
npm run db:seed

# Développement
npm run start:dev

# Production
npm run build
npm run start:prod
```

### SSL (Développement local)

Le serveur démarre automatiquement en HTTPS si les certificats existent dans `ssl/`:
- `ssl/key.pem` - Clé privée
- `ssl/cert.pem` - Certificat

En production ou sans certificats, le serveur démarre en HTTP.

---

## Modèle de données (Prisma)

### Entités principales

#### Directeur
```prisma
model Directeur {
  id           Int
  nom          String
  prenom       String
  adresse      String?
  email        String? @unique
  numTelephone String?
  createdAt    DateTime
  updatedAt    DateTime
  
  // Relations
  managers     Manager[]
  commercials  Commercial[]
  zones        Zone[]
  statistics   Statistic[]
}
```

#### Manager
```prisma
model Manager {
  id           Int
  nom          String
  prenom       String
  email        String? @unique
  numTelephone String?
  directeurId  Int?
  createdAt    DateTime
  updatedAt    DateTime
  
  // Relations
  directeur          Directeur?
  commercials        Commercial[]
  zones              Zone[]
  immeubles          Immeuble[]
  statistics         Statistic[]
  statusHistorique   StatusHistorique[]
}
```

#### Commercial
```prisma
model Commercial {
  id          Int
  nom         String
  prenom      String
  email       String? @unique
  numTel      String?
  age         Int?
  managerId   Int?
  directeurId Int?
  createdAt   DateTime
  updatedAt   DateTime
  
  // Relations
  manager          Manager?
  directeur        Directeur?
  immeubles        Immeuble[]
  statistics       Statistic[]
  statusHistorique StatusHistorique[]
}
```

#### Zone
```prisma
model Zone {
  id          Int
  nom         String
  xOrigin     Float  // Coordonnée X du centre
  yOrigin     Float  // Coordonnée Y du centre
  rayon       Float  // Rayon de la zone
  directeurId Int?
  managerId   Int?
  createdAt   DateTime
  updatedAt   DateTime
  
  // Relations
  directeur       Directeur?
  manager         Manager?
  immeubles       Immeuble[]
  statistics      Statistic[]
  zoneEnCours     ZoneEnCours[]
  historiqueZones HistoriqueZone[]
}
```

#### Immeuble
```prisma
model Immeuble {
  id               Int
  adresse          String
  latitude         Float?
  longitude        Float?
  nbEtages         Int
  nbPortesParEtage Int
  ascenseurPresent Boolean
  digitalCode      String?
  commercialId     Int?
  managerId        Int?
  zoneId           Int?
  createdAt        DateTime
  updatedAt        DateTime
  
  // Relations
  commercial Commercial?
  manager    Manager?
  zone       Zone?
  statistics Statistic[]
  portes     Porte[]
}
```

#### Porte
```prisma
model Porte {
  id              Int
  numero          String     // Ex: "101", "201A"
  nomPersonnalise String?    // Ex: "Porte à droite"
  etage           Int
  immeubleId      Int
  statut          StatutPorte @default(NON_VISITE)
  nbRepassages    Int        @default(0)
  nbContrats      Int        @default(1)
  rdvDate         DateTime?
  rdvTime         String?    // Ex: "14:30"
  commentaire     String?
  derniereVisite  DateTime?
  createdAt       DateTime
  updatedAt       DateTime
  
  // Relations
  immeuble         Immeuble
  statusHistorique StatusHistorique[]
  
  @@unique([immeubleId, numero])
}

enum StatutPorte {
  NON_VISITE
  CONTRAT_SIGNE
  REFUS
  RENDEZ_VOUS_PRIS
  ABSENT
  ARGUMENTE
  NECESSITE_REPASSAGE
}
```

#### Statistic
```prisma
model Statistic {
  id                    Int
  commercialId          Int?
  managerId             Int?
  directeurId           Int?
  immeubleId            Int?
  zoneId                Int?
  contratsSignes        Int  // Contrats signés
  immeublesVisites      Int  // Immeubles visités
  rendezVousPris        Int  // RDV pris
  refus                 Int  // Refus
  absents               Int  // Absents
  argumentes            Int  // Refus après argumentation
  nbImmeublesProspectes Int  // Immeubles prospectés
  nbPortesProspectes    Int  // Portes prospectées
  createdAt             DateTime
  updatedAt             DateTime
  
  // Relations
  commercial Commercial?
  manager    Manager?
  directeur  Directeur?
  immeuble   Immeuble?
  zone       Zone?
}
```

#### StatusHistorique
```prisma
model StatusHistorique {
  id           Int
  porteId      Int
  commercialId Int?
  managerId    Int?
  statut       StatutPorte
  commentaire  String?
  rdvDate      DateTime?
  rdvTime      String?
  createdAt    DateTime
  
  // Relations
  porte      Porte
  commercial Commercial?
  manager    Manager?
  
  @@index([porteId])
  @@index([commercialId])
  @@index([managerId])
  @@index([createdAt])
}
```

#### ZoneEnCours
```prisma
model ZoneEnCours {
  id         Int
  zoneId     Int
  userId     Int
  userType   UserType
  assignedAt DateTime
  
  zone Zone
  
  @@unique([userId, userType])
  @@index([zoneId])
  @@index([userId, userType])
}
```

#### HistoriqueZone
```prisma
model HistoriqueZone {
  id                       Int
  zoneId                   Int
  userId                   Int
  userType                 UserType
  assignedAt               DateTime
  unassignedAt             DateTime
  
  // Snapshot des statistiques
  totalContratsSignes       Int
  totalImmeublesVisites     Int
  totalRendezVousPris       Int
  totalRefus                Int
  totalImmeublesProspectes  Int
  totalPortesProspectes     Int
  
  zone Zone
  
  @@index([zoneId])
  @@index([userId, userType])
  @@index([assignedAt, unassignedAt])
}

enum UserType {
  COMMERCIAL
  MANAGER
  DIRECTEUR
}
```

---

## Modules

### AuthModule

**Responsabilité** : Authentification et autorisation des utilisateurs

**Fichiers** :
- `auth.service.ts` - Logique d'authentification
- `auth.resolver.ts` - Résolveurs GraphQL
- `auth.types.ts` - Types GraphQL
- `decorators/` - Décorateurs personnalisés (@CurrentUser, @Roles)
- `guards/` - Guards de sécurité (AuthGuard, RolesGuard)
- `dto/` - DTOs de validation

**Fonctionnalités** :
- Connexion utilisateur (Commercial, Manager, Directeur)
- Vérification des rôles
- Gestion des sessions
- Protection des routes

**Résolveurs GraphQL** :
```graphql
type Mutation {
  login(email: String!, password: String!, userType: UserType!): AuthResponse!
  logout: Boolean!
}

type Query {
  me: User!
}
```

---

### CommercialModule

**Responsabilité** : Gestion des commerciaux

**Fichiers** :
- `commercial.service.ts` - Logique métier
- `commercial.resolver.ts` - Résolveurs GraphQL
- `commercial.dto.ts` - DTOs et types

**Fonctionnalités** :
- CRUD des commerciaux
- Affectation à un manager/directeur
- Gestion des immeubles assignés
- Statistiques individuelles

**Résolveurs GraphQL** :
```graphql
type Query {
  commercials: [Commercial!]!
  commercial(id: Int!): Commercial
  commercialsByManager(managerId: Int!): [Commercial!]!
  commercialsByDirecteur(directeurId: Int!): [Commercial!]!
}

type Mutation {
  createCommercial(input: CreateCommercialInput!): Commercial!
  updateCommercial(id: Int!, input: UpdateCommercialInput!): Commercial!
  deleteCommercial(id: Int!): Boolean!
  assignCommercialToManager(commercialId: Int!, managerId: Int!): Commercial!
}
```

---

### ManagerModule

**Responsabilité** : Gestion des managers

**Fichiers** :
- `manager.service.ts` - Logique métier
- `manager.resolver.ts` - Résolveurs GraphQL
- `manager.dto.ts` - DTOs et types

**Fonctionnalités** :
- CRUD des managers
- Affectation à un directeur
- Gestion de l'équipe de commerciaux
- Gestion des zones et immeubles
- Statistiques d'équipe

**Résolveurs GraphQL** :
```graphql
type Query {
  managers: [Manager!]!
  manager(id: Int!): Manager
  managersByDirecteur(directeurId: Int!): [Manager!]!
}

type Mutation {
  createManager(input: CreateManagerInput!): Manager!
  updateManager(id: Int!, input: UpdateManagerInput!): Manager!
  deleteManager(id: Int!): Boolean!
  assignManagerToDirecteur(managerId: Int!, directeurId: Int!): Manager!
}
```

---

### DirecteurModule

**Responsabilité** : Gestion des directeurs

**Fichiers** :
- `directeur.service.ts` - Logique métier
- `directeur.resolver.ts` - Résolveurs GraphQL
- `directeur.dto.ts` - DTOs et types

**Fonctionnalités** :
- CRUD des directeurs
- Vue d'ensemble de toutes les équipes
- Gestion des managers et commerciaux
- Statistiques globales
- Gestion des zones

**Résolveurs GraphQL** :
```graphql
type Query {
  directeurs: [Directeur!]!
  directeur(id: Int!): Directeur
}

type Mutation {
  createDirecteur(input: CreateDirecteurInput!): Directeur!
  updateDirecteur(id: Int!, input: UpdateDirecteurInput!): Directeur!
  deleteDirecteur(id: Int!): Boolean!
}
```

---

### ZoneModule

**Responsabilité** : Gestion des zones géographiques

**Fichiers** :
- `zone.service.ts` - Logique métier
- `zone.resolver.ts` - Résolveurs GraphQL
- `zone.dto.ts` - DTOs et types

**Fonctionnalités** :
- CRUD des zones
- Définition géographique (centre + rayon)
- Affectation de zones aux équipes
- Historique d'affectation
- Statistiques par zone

**Résolveurs GraphQL** :
```graphql
type Query {
  zones: [Zone!]!
  zone(id: Int!): Zone
  zonesByManager(managerId: Int!): [Zone!]!
  zonesByDirecteur(directeurId: Int!): [Zone!]!
  currentZone(userId: Int!, userType: UserType!): Zone
}

type Mutation {
  createZone(input: CreateZoneInput!): Zone!
  updateZone(id: Int!, input: UpdateZoneInput!): Zone!
  deleteZone(id: Int!): Boolean!
  assignZone(zoneId: Int!, userId: Int!, userType: UserType!): ZoneEnCours!
  unassignZone(userId: Int!, userType: UserType!): Boolean!
}
```

---

### ImmeubleModule

**Responsabilité** : Gestion des immeubles

**Fichiers** :
- `immeuble.service.ts` - Logique métier
- `immeuble.resolver.ts` - Résolveurs GraphQL
- `immeuble.dto.ts` - DTOs et types

**Fonctionnalités** :
- CRUD des immeubles
- Géolocalisation (latitude/longitude)
- Génération automatique des portes
- Affectation à une zone/commercial/manager
- Statistiques par immeuble

**Résolveurs GraphQL** :
```graphql
type Query {
  immeubles: [Immeuble!]!
  immeuble(id: Int!): Immeuble
  immeublesByZone(zoneId: Int!): [Immeuble!]!
  immeublesByCommercial(commercialId: Int!): [Immeuble!]!
}

type Mutation {
  createImmeuble(input: CreateImmeubleInput!): Immeuble!
  updateImmeuble(id: Int!, input: UpdateImmeubleInput!): Immeuble!
  deleteImmeuble(id: Int!): Boolean!
  assignImmeubleToCommercial(immeubleId: Int!, commercialId: Int!): Immeuble!
}
```

---

### PorteModule

**Responsabilité** : Gestion des portes/appartements

**Fichiers** :
- `porte.service.ts` - Logique métier
- `porte.resolver.ts` - Résolveurs GraphQL
- `porte.dto.ts` - DTOs et types

**Fonctionnalités** :
- CRUD des portes
- Gestion des statuts (NON_VISITE, CONTRAT_SIGNE, REFUS, etc.)
- Historique des changements de statut
- Gestion des RDV
- Compteurs de repassages et contrats

**Résolveurs GraphQL** :
```graphql
type Query {
  portes: [Porte!]!
  porte(id: Int!): Porte
  portesByImmeuble(immeubleId: Int!): [Porte!]!
  portesByStatut(immeubleId: Int!, statut: StatutPorte!): [Porte!]!
}

type Mutation {
  createPorte(input: CreatePorteInput!): Porte!
  updatePorte(id: Int!, input: UpdatePorteInput!): Porte!
  updatePorteStatut(id: Int!, statut: StatutPorte!, userId: Int!, userType: UserType!, commentaire: String, rdvDate: DateTime, rdvTime: String): Porte!
  deletePorte(id: Int!): Boolean!
}
```

**Statuts de porte** :
- `NON_VISITE` - Pas encore visitée
- `CONTRAT_SIGNE` - Contrat signé
- `REFUS` - Refus direct
- `RENDEZ_VOUS_PRIS` - RDV programmé
- `ABSENT` - Personne absente
- `ARGUMENTE` - Refus après argumentation
- `NECESSITE_REPASSAGE` - Doit repasser

---

### StatisticModule

**Responsabilité** : Gestion des statistiques

**Fichiers** :
- `statistic.service.ts` - Logique métier
- `statistic.resolver.ts` - Résolveurs GraphQL
- `statistic.dto.ts` - DTOs et types

**Fonctionnalités** :
- Statistiques par commercial
- Statistiques par manager
- Statistiques par directeur
- Statistiques par zone
- Statistiques par immeuble
- Agrégation temporelle

**Métriques** :
- Contrats signés
- Immeubles visités
- Rendez-vous pris
- Refus
- Absents
- Argumentés
- Immeubles prospectés
- Portes prospectées

**Résolveurs GraphQL** :
```graphql
type Query {
  statistics(filters: StatisticFilters!): [Statistic!]!
  statisticsByCommercial(commercialId: Int!, startDate: DateTime, endDate: DateTime): AggregatedStatistic!
  statisticsByManager(managerId: Int!, startDate: DateTime, endDate: DateTime): AggregatedStatistic!
  statisticsByDirecteur(directeurId: Int!, startDate: DateTime, endDate: DateTime): AggregatedStatistic!
  statisticsByZone(zoneId: Int!, startDate: DateTime, endDate: DateTime): AggregatedStatistic!
}

type Mutation {
  createStatistic(input: CreateStatisticInput!): Statistic!
  updateStatistic(id: Int!, input: UpdateStatisticInput!): Statistic!
}
```

---

### RecordingModule

**Responsabilité** : Gestion des enregistrements audio/vidéo

**Fichiers** :
- `recording.service.ts` - Logique métier
- `recording.resolver.ts` - Résolveurs GraphQL
- `recording.dto.ts` - DTOs et types

**Fonctionnalités** :
- Intégration avec LiveKit
- Démarrage/arrêt des enregistrements
- Upload vers AWS S3
- Génération d'URLs présignées
- Gestion des métadonnées
- Webhook LiveKit pour notifications

**Technologies** :
- `livekit-server-sdk` - SDK serveur LiveKit
- `@aws-sdk/client-s3` - Upload S3
- `@aws-sdk/s3-request-presigner` - URLs présignées

**Résolveurs GraphQL** :
```graphql
type Query {
  recordings(filters: RecordingFilters!): [Recording!]!
  recording(id: String!): Recording
  recordingUrl(id: String!, expiresIn: Int): String!
}

type Mutation {
  startRecording(roomName: String!, commercialId: Int): RecordingStartResponse!
  stopRecording(recordingId: String!): Boolean!
}
```

**Workflow** :
1. Frontend démarre un appel LiveKit
2. Backend démarre l'enregistrement via `startRecording`
3. LiveKit enregistre l'audio/vidéo
4. Webhook LiveKit notifie la fin de l'enregistrement
5. Backend upload le fichier vers S3
6. Frontend peut récupérer l'URL via `recordingUrl`

---

### AudioMonitoringModule

**Responsabilité** : Monitoring audio en temps réel

**Fichiers** :
- `audio-monitoring.service.ts` - Logique métier
- `audio-monitoring.resolver.ts` - Résolveurs GraphQL
- `audio-monitoring.dto.ts` - DTOs et types

**Fonctionnalités** :
- Surveillance des niveaux audio
- Détection de silence
- Qualité audio en temps réel
- Alertes sur problèmes audio

---

## API GraphQL

### Configuration

L'API GraphQL est configurée dans `app.module.ts` :

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
  playground: true,
  introspection: true,
  context: ({ req }) => ({ req }),
})
```

### Accès

- **URL** : `https://localhost:3000/graphql`
- **Playground** : Activé en développement
- **Introspection** : Activée

### Schéma

Le schéma est généré automatiquement dans `src/schema.gql` à partir des résolveurs TypeScript.

---

## Proxy LiveKit

### Configuration

Proxy WebSocket configuré dans `main.ts` pour convertir WSS (frontend) → WS (LiveKit) :

```typescript
app.use(
  '/livekit-proxy',
  createProxyMiddleware({
    target: process.env.LK_HOST || 'http://100.68.221.26:7880',
    ws: true,
    changeOrigin: true,
    pathRewrite: {
      '^/livekit-proxy': '',
    },
  }),
)
```

### Utilisation

Le frontend se connecte à `wss://localhost:3000/livekit-proxy` au lieu de directement à LiveKit.

---

## CORS

### Configuration

```typescript
app.enableCors({
  origin: process.env.VITE_FRONTEND_URL?.split(',') || [
    'https://localhost:5173',
    'https://192.168.1.107:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
})
```

### Origines autorisées

Définies dans la variable d'environnement `VITE_FRONTEND_URL` (séparées par des virgules).

---

## Sécurité

### Authentification

- Basée sur les sessions/cookies
- Guard `AuthGuard` pour protéger les routes
- Décorateur `@CurrentUser()` pour récupérer l'utilisateur

### Autorisation

- Guard `RolesGuard` pour vérifier les rôles
- Décorateur `@Roles()` pour définir les rôles requis
- 3 types d'utilisateurs : COMMERCIAL, MANAGER, DIRECTEUR

### Exemple d'utilisation

```typescript
@Query(() => [Commercial])
@UseGuards(AuthGuard, RolesGuard)
@Roles('MANAGER', 'DIRECTEUR')
async commercials() {
  return this.commercialService.findAll();
}
```

---

## Base de données

### Migrations

```bash
# Créer une migration
npx prisma migrate dev --name nom_migration

# Appliquer les migrations
npx prisma migrate deploy

# Reset la base (DEV uniquement !)
npx prisma migrate reset
```

### Prisma Studio

```bash
# Interface web pour visualiser/éditer les données
npx prisma studio
```

Accès sur `http://localhost:5555`

### Seed

```bash
# Remplir la base avec des données de test
npm run db:seed
```

Le fichier `prisma/seed.ts` contient les données de seed.

---

## Tests

### Commandes

```bash
# Tests unitaires
npm run test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:cov

# Tests e2e
npm run test:e2e

# Tests e2e en mode debug
npm run test:debug
```

### Configuration Jest

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

---

## Scripts npm

```json
{
  "build": "nest build",
  "format": "prettier --write \"src/**/*.ts\"",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "db:seed": "npx tsx prisma/seed.ts"
}
```

---

## Déploiement

### Production

1. **Build**
```bash
npm run build
```

2. **Variables d'environnement**
```bash
# Configurer DATABASE_URL, LK_HOST, AWS credentials, etc.
```

3. **Migrations**
```bash
npx prisma migrate deploy
```

4. **Démarrage**
```bash
npm run start:prod
```

### Docker (recommandé)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Variables d'environnement Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
LK_HOST=https://livekit.example.com
LK_API_KEY=...
LK_API_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
AWS_BUCKET_NAME=...
VITE_FRONTEND_URL=https://app.example.com
```

---

## Monitoring & Logs

### Logger NestJS

Utilisation du logger intégré :

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('ServiceName');
logger.log('Info message');
logger.error('Error message', stackTrace);
logger.warn('Warning message');
logger.debug('Debug message');
```

### Logs LiveKit Proxy

Logs détaillés des connexions WebSocket dans la console :
- 🔌 Connexions ouvertes/fermées
- 🎯 URLs cibles
- ❌ Erreurs de proxy

---

## Conventions de code

### Naming

- **Fichiers** : kebab-case (`user.service.ts`)
- **Classes** : PascalCase (`UserService`)
- **Méthodes/Variables** : camelCase (`getUserById`)
- **Constantes** : UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Structure des modules

```
module-name/
├── module-name.module.ts    # Module NestJS
├── module-name.service.ts   # Logique métier
├── module-name.resolver.ts  # Résolveurs GraphQL
├── module-name.dto.ts       # DTOs et types GraphQL
└── module-name.spec.ts      # Tests unitaires
```

### DTOs

Utiliser `class-validator` et `class-transformer` :

```typescript
import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateCommercialInput {
  @Field()
  @IsString()
  nom: string;

  @Field()
  @IsString()
  prenom: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  email?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(18)
  age?: number;
}
```

---

## Dépannage

### Problème de connexion LiveKit

1. Vérifier que LiveKit est démarré
2. Vérifier `LK_HOST` dans `.env`
3. Consulter les logs du proxy : `🔌 WebSocket connection`
4. Tester directement l'URL LiveKit

### Problème de connexion base de données

1. Vérifier `DATABASE_URL`
2. Tester la connexion PostgreSQL
3. Régénérer le client Prisma : `npx prisma generate`
4. Appliquer les migrations : `npx prisma migrate deploy`

### Problème CORS

1. Vérifier `VITE_FRONTEND_URL`
2. Vérifier l'origine dans les logs
3. Ajouter l'origine dans la configuration CORS

### Problème SSL en dev

1. Vérifier la présence de `ssl/key.pem` et `ssl/cert.pem`
2. Générer de nouveaux certificats si nécessaire
3. Accepter le certificat auto-signé dans le navigateur

### Problème AWS S3

1. Vérifier les credentials AWS
2. Vérifier les permissions du bucket
3. Vérifier la région
4. Consulter les logs d'erreur S3

---

## Performance

### Optimisations Prisma

- Utiliser `select` pour limiter les champs
- Utiliser `include` au lieu de requêtes multiples
- Ajouter des index sur les champs fréquemment filtrés
- Utiliser les transactions pour les opérations multiples

```typescript
// Exemple avec select
const commercial = await this.prisma.commercial.findUnique({
  where: { id },
  select: {
    id: true,
    nom: true,
    prenom: true,
    email: true,
  },
});

// Exemple avec include
const commercial = await this.prisma.commercial.findUnique({
  where: { id },
  include: {
    immeubles: true,
    statistics: true,
  },
});

// Exemple de transaction
await this.prisma.$transaction([
  this.prisma.porte.update({ where: { id }, data: { statut } }),
  this.prisma.statusHistorique.create({ data: historyData }),
]);
```

### Cache

Considérer l'ajout de Redis pour :
- Cache des statistiques
- Sessions utilisateurs
- Rate limiting

---

## Ressources

### Documentation externe

- [NestJS](https://docs.nestjs.com/)
- [Prisma](https://www.prisma.io/docs/)
- [GraphQL](https://graphql.org/learn/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [LiveKit](https://docs.livekit.io/)
- [AWS S3](https://docs.aws.amazon.com/s3/)

### Commandes utiles

```bash
# Voir les migrations
npx prisma migrate status

# Formater le schéma Prisma
npx prisma format

# Valider le schéma
npx prisma validate

# Générer le client Prisma
npx prisma generate

# Ouvrir Prisma Studio
npx prisma studio

# Linter le code
npm run lint

# Formater le code
npm run format
```

---

## Contact & Support

Pour toute question ou problème, consulter :
1. Cette documentation
2. Les logs de l'application
3. La documentation NestJS/Prisma
4. Les issues GitHub du projet

---

**Dernière mise à jour** : Janvier 2026  
**Version** : 0.0.1  
**Auteur** : Équipe Rework
