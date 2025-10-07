/**
 * @fileoverview GraphQL query and mutation type definitions
 * Provides typed GraphQL operations based on the backend schema
 */

import type {
  Directeur,
  Manager,
  Commercial,
  Zone,
  Immeuble,
  Statistic,
  CreateDirecteurInput,
  CreateManagerInput,
  CreateCommercialInput,
  CreateZoneInput,
  CreateImmeubleInput,
  CreateStatisticInput,
  UpdateDirecteurInput,
  UpdateManagerInput,
  UpdateCommercialInput,
  UpdateZoneInput,
  UpdateImmeubleInput,
  UpdateStatisticInput
} from './api';

// =============================================================================
// Query Types
// =============================================================================

export interface QueryDirecteursResponse {
  directeurs: Directeur[];
}

export interface QueryDirecteurResponse {
  directeur: Directeur;
}

export interface QueryManagersResponse {
  managers: Manager[];
}

export interface QueryManagerResponse {
  manager: Manager;
}

export interface QueryCommercialsResponse {
  commercials: Commercial[];
}

export interface QueryCommercialResponse {
  commercial: Commercial;
}

export interface QueryZonesResponse {
  zones: Zone[];
}

export interface QueryZoneResponse {
  zone: Zone;
}

export interface QueryImmeublesResponse {
  immeubles: Immeuble[];
}

export interface QueryImmeubleResponse {
  immeuble: Immeuble;
}

export interface QueryStatisticsResponse {
  statistics: Statistic[];
}

export interface QueryStatisticResponse {
  statistic: Statistic;
}

// =============================================================================
// Mutation Types
// =============================================================================

export interface MutationCreateDirecteurResponse {
  createDirecteur: Directeur;
}

export interface MutationCreateManagerResponse {
  createManager: Manager;
}

export interface MutationCreateCommercialResponse {
  createCommercial: Commercial;
}

export interface MutationCreateZoneResponse {
  createZone: Zone;
}

export interface MutationCreateImmeubleResponse {
  createImmeuble: Immeuble;
}

export interface MutationCreateStatisticResponse {
  createStatistic: Statistic;
}

export interface MutationUpdateDirecteurResponse {
  updateDirecteur: Directeur;
}

export interface MutationUpdateManagerResponse {
  updateManager: Manager;
}

export interface MutationUpdateCommercialResponse {
  updateCommercial: Commercial;
}

export interface MutationUpdateZoneResponse {
  updateZone: Zone;
}

export interface MutationUpdateImmeubleResponse {
  updateImmeuble: Immeuble;
}

export interface MutationUpdateStatisticResponse {
  updateStatistic: Statistic;
}

export interface MutationRemoveDirecteurResponse {
  removeDirecteur: Directeur;
}

export interface MutationRemoveManagerResponse {
  removeManager: Manager;
}

export interface MutationRemoveCommercialResponse {
  removeCommercial: Commercial;
}

export interface MutationRemoveZoneResponse {
  removeZone: Zone;
}

export interface MutationRemoveImmeubleResponse {
  removeImmeuble: Immeuble;
}

export interface MutationRemoveStatisticResponse {
  removeStatistic: Statistic;
}

export interface MutationAssignZoneResponse {
  assignZoneToCommercial: boolean;
}

export interface MutationUnassignZoneResponse {
  unassignZoneFromCommercial: boolean;
}

// =============================================================================
// Variable Types for Queries and Mutations
// =============================================================================

export interface GetEntityByIdVariables {
  id: number;
}

export interface CreateDirecteurVariables {
  createDirecteurInput: CreateDirecteurInput;
}

export interface CreateManagerVariables {
  createManagerInput: CreateManagerInput;
}

export interface CreateCommercialVariables {
  createCommercialInput: CreateCommercialInput;
}

export interface CreateZoneVariables {
  createZoneInput: CreateZoneInput;
}

export interface CreateImmeubleVariables {
  createImmeubleInput: CreateImmeubleInput;
}

export interface CreateStatisticVariables {
  createStatisticInput: CreateStatisticInput;
}

export interface UpdateDirecteurVariables {
  updateDirecteurInput: UpdateDirecteurInput;
}

export interface UpdateManagerVariables {
  updateManagerInput: UpdateManagerInput;
}

export interface UpdateCommercialVariables {
  updateCommercialInput: UpdateCommercialInput;
}

export interface UpdateZoneVariables {
  updateZoneInput: UpdateZoneInput;
}

export interface UpdateImmeubleVariables {
  updateImmeubleInput: UpdateImmeubleInput;
}

export interface UpdateStatisticVariables {
  updateStatisticInput: UpdateStatisticInput;
}

export interface AssignZoneVariables {
  commercialId: number;
  zoneId: number;
}

export interface UnassignZoneVariables {
  commercialId: number;
  zoneId: number;
}