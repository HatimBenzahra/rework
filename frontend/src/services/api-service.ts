/**
 * @fileoverview Main API service with typed methods
 * Provides high-level, typed functions for all API operations
 */

import { gql } from './graphql-client'
import {
  GET_DIRECTEURS,
  GET_DIRECTEUR,
  GET_MANAGERS,
  GET_MANAGER,
  GET_COMMERCIALS,
  GET_COMMERCIAL,
  GET_COMMERCIAL_FULL,
  GET_ZONES,
  GET_ZONE,
  GET_IMMEUBLES,
  GET_IMMEUBLE,
  GET_STATISTICS,
  GET_STATISTIC,
} from './api-queries'

import {
  CREATE_DIRECTEUR,
  UPDATE_DIRECTEUR,
  REMOVE_DIRECTEUR,
  CREATE_MANAGER,
  UPDATE_MANAGER,
  REMOVE_MANAGER,
  CREATE_COMMERCIAL,
  UPDATE_COMMERCIAL,
  REMOVE_COMMERCIAL,
  CREATE_ZONE,
  UPDATE_ZONE,
  REMOVE_ZONE,
  CREATE_IMMEUBLE,
  UPDATE_IMMEUBLE,
  REMOVE_IMMEUBLE,
  CREATE_STATISTIC,
  UPDATE_STATISTIC,
  REMOVE_STATISTIC,
  ASSIGN_ZONE_TO_COMMERCIAL,
  UNASSIGN_ZONE_FROM_COMMERCIAL,
} from './api-mutations'

import type {
  QueryDirecteursResponse,
  QueryDirecteurResponse,
  QueryManagersResponse,
  QueryManagerResponse,
  QueryCommercialsResponse,
  QueryCommercialResponse,
  QueryZonesResponse,
  QueryZoneResponse,
  QueryImmeublesResponse,
  QueryImmeubleResponse,
  QueryStatisticsResponse,
  QueryStatisticResponse,
  MutationCreateDirecteurResponse,
  MutationUpdateDirecteurResponse,
  MutationRemoveDirecteurResponse,
  MutationCreateManagerResponse,
  MutationUpdateManagerResponse,
  MutationRemoveManagerResponse,
  MutationCreateCommercialResponse,
  MutationUpdateCommercialResponse,
  MutationRemoveCommercialResponse,
  MutationCreateZoneResponse,
  MutationUpdateZoneResponse,
  MutationRemoveZoneResponse,
  MutationCreateImmeubleResponse,
  MutationUpdateImmeubleResponse,
  MutationRemoveImmeubleResponse,
  MutationCreateStatisticResponse,
  MutationUpdateStatisticResponse,
  MutationRemoveStatisticResponse,
  MutationAssignZoneResponse,
  MutationUnassignZoneResponse,
  GetEntityByIdVariables,
  CreateDirecteurVariables,
  UpdateDirecteurVariables,
  CreateManagerVariables,
  UpdateManagerVariables,
  CreateCommercialVariables,
  UpdateCommercialVariables,
  CreateZoneVariables,
  UpdateZoneVariables,
  CreateImmeubleVariables,
  UpdateImmeubleVariables,
  CreateStatisticVariables,
  UpdateStatisticVariables,
  AssignZoneVariables,
  UnassignZoneVariables,
} from '../types/graphql'

import type { Directeur, Manager, Commercial, Zone, Immeuble, Statistic } from '../types/api'

// =============================================================================
// Directeur API Service
// =============================================================================

export const directeurApi = {
  async getAll(): Promise<Directeur[]> {
    const response = await gql<QueryDirecteursResponse>(GET_DIRECTEURS)
    return response.directeurs
  },

  async getById(id: number): Promise<Directeur> {
    const response = await gql<QueryDirecteurResponse, GetEntityByIdVariables>(GET_DIRECTEUR, {
      id,
    })
    return response.directeur
  },

  async create(input: CreateDirecteurVariables['createDirecteurInput']): Promise<Directeur> {
    const response = await gql<MutationCreateDirecteurResponse, CreateDirecteurVariables>(
      CREATE_DIRECTEUR,
      { createDirecteurInput: input }
    )
    return response.createDirecteur
  },

  async update(input: UpdateDirecteurVariables['updateDirecteurInput']): Promise<Directeur> {
    const response = await gql<MutationUpdateDirecteurResponse, UpdateDirecteurVariables>(
      UPDATE_DIRECTEUR,
      { updateDirecteurInput: input }
    )
    return response.updateDirecteur
  },

  async remove(id: number): Promise<Directeur> {
    const response = await gql<MutationRemoveDirecteurResponse, GetEntityByIdVariables>(
      REMOVE_DIRECTEUR,
      { id }
    )
    return response.removeDirecteur
  },
}

// =============================================================================
// Manager API Service
// =============================================================================

export const managerApi = {
  async getAll(): Promise<Manager[]> {
    const response = await gql<QueryManagersResponse>(GET_MANAGERS)
    return response.managers
  },

  async getById(id: number): Promise<Manager> {
    const response = await gql<QueryManagerResponse, GetEntityByIdVariables>(GET_MANAGER, { id })
    return response.manager
  },

  async create(input: CreateManagerVariables['createManagerInput']): Promise<Manager> {
    const response = await gql<MutationCreateManagerResponse, CreateManagerVariables>(
      CREATE_MANAGER,
      { createManagerInput: input }
    )
    return response.createManager
  },

  async update(input: UpdateManagerVariables['updateManagerInput']): Promise<Manager> {
    const response = await gql<MutationUpdateManagerResponse, UpdateManagerVariables>(
      UPDATE_MANAGER,
      { updateManagerInput: input }
    )
    return response.updateManager
  },

  async remove(id: number): Promise<Manager> {
    const response = await gql<MutationRemoveManagerResponse, GetEntityByIdVariables>(
      REMOVE_MANAGER,
      { id }
    )
    return response.removeManager
  },
}

// =============================================================================
// Commercial API Service
// =============================================================================

export const commercialApi = {
  async getAll(): Promise<Commercial[]> {
    const response = await gql<QueryCommercialsResponse>(GET_COMMERCIALS)
    return response.commercials
  },

  async getById(id: number): Promise<Commercial> {
    const response = await gql<QueryCommercialResponse, GetEntityByIdVariables>(GET_COMMERCIAL, {
      id,
    })
    return response.commercial
  },

  /**
   * Charge un commercial avec toutes ses relations (immeubles, zones, statistics)
   * Utilisé pour la page de détails
   */
  async getFullById(id: number): Promise<Commercial> {
    const response = await gql<QueryCommercialResponse, GetEntityByIdVariables>(
      GET_COMMERCIAL_FULL,
      { id }
    )
    return response.commercial
  },

  async create(input: CreateCommercialVariables['createCommercialInput']): Promise<Commercial> {
    const response = await gql<MutationCreateCommercialResponse, CreateCommercialVariables>(
      CREATE_COMMERCIAL,
      { createCommercialInput: input }
    )
    return response.createCommercial
  },

  async update(input: UpdateCommercialVariables['updateCommercialInput']): Promise<Commercial> {
    const response = await gql<MutationUpdateCommercialResponse, UpdateCommercialVariables>(
      UPDATE_COMMERCIAL,
      { updateCommercialInput: input }
    )
    return response.updateCommercial
  },

  async remove(id: number): Promise<Commercial> {
    const response = await gql<MutationRemoveCommercialResponse, GetEntityByIdVariables>(
      REMOVE_COMMERCIAL,
      { id }
    )
    return response.removeCommercial
  },

  async assignZone(commercialId: number, zoneId: number): Promise<boolean> {
    const response = await gql<MutationAssignZoneResponse, AssignZoneVariables>(
      ASSIGN_ZONE_TO_COMMERCIAL,
      { commercialId, zoneId }
    )
    return response.assignZoneToCommercial
  },

  async unassignZone(commercialId: number, zoneId: number): Promise<boolean> {
    const response = await gql<MutationUnassignZoneResponse, UnassignZoneVariables>(
      UNASSIGN_ZONE_FROM_COMMERCIAL,
      { commercialId, zoneId }
    )
    return response.unassignZoneFromCommercial
  },
}

// =============================================================================
// Zone API Service
// =============================================================================

export const zoneApi = {
  async getAll(): Promise<Zone[]> {
    const response = await gql<QueryZonesResponse>(GET_ZONES)
    return response.zones
  },

  async getById(id: number): Promise<Zone> {
    const response = await gql<QueryZoneResponse, GetEntityByIdVariables>(GET_ZONE, { id })
    return response.zone
  },

  async create(input: CreateZoneVariables['createZoneInput']): Promise<Zone> {
    const response = await gql<MutationCreateZoneResponse, CreateZoneVariables>(CREATE_ZONE, {
      createZoneInput: input,
    })
    return response.createZone
  },

  async update(input: UpdateZoneVariables['updateZoneInput']): Promise<Zone> {
    const response = await gql<MutationUpdateZoneResponse, UpdateZoneVariables>(UPDATE_ZONE, {
      updateZoneInput: input,
    })
    return response.updateZone
  },

  async remove(id: number): Promise<Zone> {
    const response = await gql<MutationRemoveZoneResponse, GetEntityByIdVariables>(REMOVE_ZONE, {
      id,
    })
    return response.removeZone
  },
}

// =============================================================================
// Immeuble API Service
// =============================================================================

export const immeubleApi = {
  async getAll(): Promise<Immeuble[]> {
    const response = await gql<QueryImmeublesResponse>(GET_IMMEUBLES)
    return response.immeubles
  },

  async getById(id: number): Promise<Immeuble> {
    const response = await gql<QueryImmeubleResponse, GetEntityByIdVariables>(GET_IMMEUBLE, { id })
    return response.immeuble
  },

  async create(input: CreateImmeubleVariables['createImmeubleInput']): Promise<Immeuble> {
    const response = await gql<MutationCreateImmeubleResponse, CreateImmeubleVariables>(
      CREATE_IMMEUBLE,
      { createImmeubleInput: input }
    )
    return response.createImmeuble
  },

  async update(input: UpdateImmeubleVariables['updateImmeubleInput']): Promise<Immeuble> {
    const response = await gql<MutationUpdateImmeubleResponse, UpdateImmeubleVariables>(
      UPDATE_IMMEUBLE,
      { updateImmeubleInput: input }
    )
    return response.updateImmeuble
  },

  async remove(id: number): Promise<Immeuble> {
    const response = await gql<MutationRemoveImmeubleResponse, GetEntityByIdVariables>(
      REMOVE_IMMEUBLE,
      { id }
    )
    return response.removeImmeuble
  },
}

// =============================================================================
// Statistic API Service
// =============================================================================

export const statisticApi = {
  async getAll(): Promise<Statistic[]> {
    const response = await gql<QueryStatisticsResponse>(GET_STATISTICS)
    return response.statistics
  },

  async getById(id: number): Promise<Statistic> {
    const response = await gql<QueryStatisticResponse, GetEntityByIdVariables>(GET_STATISTIC, {
      id,
    })
    return response.statistic
  },

  async create(input: CreateStatisticVariables['createStatisticInput']): Promise<Statistic> {
    const response = await gql<MutationCreateStatisticResponse, CreateStatisticVariables>(
      CREATE_STATISTIC,
      { createStatisticInput: input }
    )
    return response.createStatistic
  },

  async update(input: UpdateStatisticVariables['updateStatisticInput']): Promise<Statistic> {
    const response = await gql<MutationUpdateStatisticResponse, UpdateStatisticVariables>(
      UPDATE_STATISTIC,
      { updateStatisticInput: input }
    )
    return response.updateStatistic
  },

  async remove(id: number): Promise<Statistic> {
    const response = await gql<MutationRemoveStatisticResponse, GetEntityByIdVariables>(
      REMOVE_STATISTIC,
      { id }
    )
    return response.removeStatistic
  },
}

// =============================================================================
// Main API Export
// =============================================================================

export const api = {
  directeurs: directeurApi,
  managers: managerApi,
  commercials: commercialApi,
  zones: zoneApi,
  immeubles: immeubleApi,
  statistics: statisticApi,
}

export default api
