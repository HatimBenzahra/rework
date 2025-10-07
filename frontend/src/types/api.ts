/**
 * @fileoverview TypeScript definitions for GraphQL API
 * Generated from backend schema.gql
 * Provides type safety for all API interactions
 */

// =============================================================================
// Base Types
// =============================================================================

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Entity Types (matching GraphQL schema exactly)
// =============================================================================

export interface Directeur extends BaseEntity {
  nom: string;
  prenom: string;
  adresse: string;
  email: string;
  numTelephone: string;
}

export interface Manager extends BaseEntity {
  nom: string;
  prenom: string;
  directeurId?: number | null;
}

export interface Commercial extends BaseEntity {
  nom: string;
  prenom: string;
  email: string;
  numTel: string;
  age: number;
  managerId?: number | null;
  directeurId?: number | null;
  immeubles: Immeuble[];
  zones: Zone[];
  statistics: Statistic[];
}

export interface Zone extends BaseEntity {
  nom: string;
  xOrigin: number;
  yOrigin: number;
  rayon: number;
}

export interface Immeuble extends BaseEntity {
  adresse: string;
  nbEtages: number;
  nbPortesParEtage: number;
  commercialId: number;
}

export interface Statistic extends BaseEntity {
  commercialId: number;
  contratsSignes: number;
  immeublesVisites: number;
  rendezVousPris: number;
  refus: number;
}

// =============================================================================
// Input Types for Mutations
// =============================================================================

export interface CreateDirecteurInput {
  nom: string;
  prenom: string;
  adresse: string;
  email: string;
  numTelephone: string;
}

export interface CreateManagerInput {
  nom: string;
  prenom: string;
  directeurId?: number;
}

export interface CreateCommercialInput {
  nom: string;
  prenom: string;
  email: string;
  numTel: string;
  age: number;
  managerId?: number;
  directeurId?: number;
}

export interface CreateZoneInput {
  nom: string;
  xOrigin: number;
  yOrigin: number;
  rayon: number;
}

export interface CreateImmeubleInput {
  adresse: string;
  nbEtages: number;
  nbPortesParEtage: number;
  commercialId: number;
}

export interface CreateStatisticInput {
  commercialId: number;
  contratsSignes: number;
  immeublesVisites: number;
  rendezVousPris: number;
  refus: number;
}

// =============================================================================
// Update Input Types
// =============================================================================

export interface UpdateDirecteurInput {
  id: number;
  nom?: string;
  prenom?: string;
  adresse?: string;
  email?: string;
  numTelephone?: string;
}

export interface UpdateManagerInput {
  id: number;
  nom?: string;
  prenom?: string;
  directeurId?: number;
}

export interface UpdateCommercialInput {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  numTel?: string;
  age?: number;
  managerId?: number;
  directeurId?: number;
}

export interface UpdateZoneInput {
  id: number;
  nom?: string;
  xOrigin?: number;
  yOrigin?: number;
  rayon?: number;
}

export interface UpdateImmeubleInput {
  id: number;
  adresse?: string;
  nbEtages?: number;
  nbPortesParEtage?: number;
}

export interface UpdateStatisticInput {
  id: number;
  commercialId?: number;
  contratsSignes?: number;
  immeublesVisites?: number;
  rendezVousPris?: number;
  refus?: number;
}

// =============================================================================
// GraphQL Response Types
// =============================================================================

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: Array<string | number>;
  }>;
}

// =============================================================================
// API Error Types
// =============================================================================

export interface ApiError {
  message: string;
  statusCode?: number;
  timestamp?: string;
  path?: string;
}

export class ApiException extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: ApiError[]
  ) {
    super(message);
    this.name = 'ApiException';
  }
}