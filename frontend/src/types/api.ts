/**
 * @fileoverview TypeScript definitions for GraphQL API
 * Generated from backend schema.gql
 * Provides type safety for all API interactions
 */

// =============================================================================
// Base Types
// =============================================================================

export interface BaseEntity {
  id: number
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Entity Types (matching GraphQL schema exactly)
// =============================================================================

export interface Directeur extends BaseEntity {
  nom: string
  prenom: string
  adresse: string
  email: string
  numTelephone: string
}

export interface Manager extends BaseEntity {
  nom: string
  prenom: string
  email?: string | null
  numTelephone?: string | null
  directeurId?: number | null
  directeur?: Directeur | null
  commercials?: Commercial[]
  zones?: Zone[]
  immeubles?: Immeuble[]
  statistics?: Statistic[]
}

export interface Commercial extends BaseEntity {
  nom: string
  prenom: string
  email: string
  numTel: string
  age: number
  managerId?: number | null
  directeurId?: number | null
  immeubles: Immeuble[]
  zones: Zone[]
  statistics: Statistic[]
}

export interface Zone extends BaseEntity {
  nom: string
  xOrigin: number
  yOrigin: number
  rayon: number
  directeurId?: number | null
  managerId?: number | null
  commercials?: ZoneCommercialRelation[]
  immeubles?: Immeuble[]
}

export interface Immeuble extends BaseEntity {
  adresse: string
  nbEtages: number
  nbPortesParEtage: number
  commercialId: number
  zoneId?: number | null
  ascenseurPresent?: boolean
  digitalCode?: string | null
  portes?: Porte[]
}

export interface Statistic extends BaseEntity {
  commercialId?: number
  immeubleId?: number
  zoneId?: number
  contratsSignes: number
  immeublesVisites: number
  rendezVousPris: number
  refus: number
  nbImmeublesProspectes: number
  nbPortesProspectes: number
}

export interface ZoneCommercialRelation extends BaseEntity {
  commercialId: number
  zoneId: number
}

export interface ZoneStatistic {
  zoneId: number
  zoneName: string
  totalContratsSignes: number
  totalImmeublesVisites: number
  totalRendezVousPris: number
  totalRefus: number
  totalImmeublesProspectes: number
  totalPortesProspectes: number
  tauxConversion: number
  tauxSuccesRdv: number
  nombreCommerciaux: number
  performanceGlobale: number
}

export enum StatutPorte {
  NON_VISITE = 'NON_VISITE',
  CONTRAT_SIGNE = 'CONTRAT_SIGNE',
  REFUS = 'REFUS',
  RENDEZ_VOUS_PRIS = 'RENDEZ_VOUS_PRIS',
  CURIEUX = 'CURIEUX',
  NECESSITE_REPASSAGE = 'NECESSITE_REPASSAGE',
}

export interface Porte extends BaseEntity {
  numero: string
  nomPersonnalise?: string | null
  etage: number
  immeubleId: number
  statut: StatutPorte
  nbRepassages: number
  rdvDate?: string | null
  rdvTime?: string | null
  commentaire?: string | null
  derniereVisite?: string | null
}

// =============================================================================
// Input Types for Mutations
// =============================================================================

export interface CreateDirecteurInput {
  nom: string
  prenom: string
  adresse: string
  email: string
  numTelephone: string
}

export interface CreateManagerInput {
  nom: string
  prenom: string
  email?: string
  numTelephone?: string
  directeurId?: number
}

export interface CreateCommercialInput {
  nom: string
  prenom: string
  email: string
  numTel: string
  age: number
  managerId?: number
  directeurId?: number
}

export interface CreateZoneInput {
  nom: string
  xOrigin: number
  yOrigin: number
  rayon: number
}

export interface CreateImmeubleInput {
  adresse: string
  nbEtages: number
  nbPortesParEtage: number
  commercialId: number
}

export interface CreateStatisticInput {
  commercialId: number
  contratsSignes: number
  immeublesVisites: number
  rendezVousPris: number
  refus: number
}

export interface CreatePorteInput {
  numero: string
  etage: number
  immeubleId: number
  statut?: StatutPorte
  nbRepassages?: number
  rdvDate?: string
  rdvTime?: string
  commentaire?: string
  derniereVisite?: string
}

// =============================================================================
// Update Input Types
// =============================================================================

export interface UpdateDirecteurInput {
  id: number
  nom?: string
  prenom?: string
  adresse?: string
  email?: string
  numTelephone?: string
}

export interface UpdateManagerInput {
  id: number
  nom?: string
  prenom?: string
  email?: string
  numTelephone?: string
  directeurId?: number
}

export interface UpdateCommercialInput {
  id: number
  nom?: string
  prenom?: string
  email?: string
  numTel?: string
  age?: number
  managerId?: number
  directeurId?: number
}

export interface UpdateZoneInput {
  id: number
  nom?: string
  xOrigin?: number
  yOrigin?: number
  rayon?: number
}

export interface UpdateImmeubleInput {
  id: number
  adresse?: string
  nbEtages?: number
  nbPortesParEtage?: number
  commercialId?: number
}

export interface UpdateStatisticInput {
  id: number
  commercialId?: number
  contratsSignes?: number
  immeublesVisites?: number
  rendezVousPris?: number
  refus?: number
}

export interface UpdatePorteInput {
  id: number
  numero?: string
  nomPersonnalise?: string
  etage?: number
  statut?: StatutPorte
  nbRepassages?: number
  rdvDate?: string
  rdvTime?: string
  commentaire?: string
  derniereVisite?: string
}

// =============================================================================
// GraphQL Response Types
// =============================================================================

export interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{
      line: number
      column: number
    }>
    path?: Array<string | number>
  }>
}

// =============================================================================
// API Error Types
// =============================================================================

export interface ApiError {
  message: string
  statusCode?: number
  timestamp?: string
  path?: string
}

export class ApiException extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: ApiError[]
  ) {
    super(message)
    this.name = 'ApiException'
  }
}
