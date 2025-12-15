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
  GET_MANAGER_PERSONAL,
  GET_MANAGER_FULL,
  GET_COMMERCIALS,
  GET_COMMERCIAL,
  GET_COMMERCIAL_FULL,
  GET_COMMERCIAL_TEAM_RANKING,
  GET_ZONES,
  GET_ZONE,
  GET_IMMEUBLES,
  GET_IMMEUBLE,
  GET_STATISTICS,
  GET_STATISTIC,
  GET_ZONE_STATISTICS,
  GET_CURRENT_USER_ASSIGNMENT,
  GET_ALL_ZONE_HISTORY,
  GET_ALL_CURRENT_ASSIGNMENTS,
  GET_ZONE_CURRENT_ASSIGNMENTS,
  GET_PORTES,
  GET_PORTE,
  GET_PORTES_BY_IMMEUBLE,
  GET_PORTES_MODIFIED_TODAY,
  GET_PORTE_STATISTICS,
  GET_PORTES_RDV_TODAY,
  GET_ME,
  GET_STATUS_HISTORIQUE_BY_PORTE,
  GET_STATUS_HISTORIQUE_BY_IMMEUBLE,
} from './api-queries'


import {
  RECALCULATE_ALL_STATS,
  VALIDATE_STATS_COHERENCE,
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
  ADD_ETAGE_TO_IMMEUBLE,
  REMOVE_ETAGE_FROM_IMMEUBLE,
  ADD_PORTE_TO_ETAGE,
  REMOVE_PORTE_FROM_ETAGE,
  CREATE_STATISTIC,
  UPDATE_STATISTIC,
  REMOVE_STATISTIC,
  CREATE_PORTE,
  UPDATE_PORTE,
  REMOVE_PORTE,
  ASSIGN_ZONE_TO_COMMERCIAL,
  UNASSIGN_ZONE_FROM_COMMERCIAL,
  ASSIGN_ZONE_TO_DIRECTEUR,
  ASSIGN_ZONE_TO_MANAGER,
} from './api-mutations'

import type {
  QueryDirecteursResponse,
  QueryDirecteursVariables,
  QueryDirecteurResponse,
  QueryManagersResponse,
  QueryManagersVariables,
  QueryManagerResponse,
  QueryManagerFullResponse,
  QueryCommercialsResponse,
  QueryCommercialResponse,
  QueryZonesResponse,
  QueryZoneResponse,
  QueryImmeublesResponse,
  QueryImmeubleResponse,
  QueryStatisticsResponse,
  QueryStatisticResponse,
  QueryZoneStatisticsResponse,
  QueryPortesResponse,
  QueryPorteResponse,
  QueryPortesByImmeubleResponse,
  QueryPortesModifiedTodayResponse,
  QueryPortesRdvTodayResponse,
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
  MutationCreatePorteResponse,
  MutationUpdatePorteResponse,
  MutationRemovePorteResponse,
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
  CreatePorteVariables,
  UpdatePorteVariables,
  GetPortesByImmeubleVariables,
  GetPortesModifiedTodayVariables,
  AssignZoneVariables,
  UnassignZoneVariables,
  QueryManagerPersonalResponse,
} from '../types/graphql'

import type {
  Directeur,
  Manager,
  Commercial,
  Zone,
  Immeuble,
  Statistic,
  ZoneStatistic,
  Porte,
} from '../types/api'

// =============================================================================
// Directeur API Service
// =============================================================================

export const directeurApi = {
  async getAll(): Promise<Directeur[]> {
    const response = await gql<QueryDirecteursResponse, QueryDirecteursVariables>(
      GET_DIRECTEURS,
      {}
    )
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
    const response = await gql<QueryManagersResponse, QueryManagersVariables>(GET_MANAGERS, {})
    return response.managers
  },

  async getById(id: number): Promise<Manager> {
    const response = await gql<QueryManagerResponse, GetEntityByIdVariables>(GET_MANAGER, { id })
    return response.manager
  },

  async getPersonalById(id: number): Promise<Manager> {
    const response = await gql<QueryManagerPersonalResponse, GetEntityByIdVariables>(
      GET_MANAGER_PERSONAL,
      {
        id,
      }
    )
    if (!response.managerPersonal) {
      throw new Error('Manager introuvable')
    }
    return response.managerPersonal
  },

  async getFullById(id: number): Promise<Manager> {
    const response = await gql<QueryManagerFullResponse, GetEntityByIdVariables>(GET_MANAGER_FULL, {
      id,
    })
    if (!response.managerFull) {
      throw new Error('Manager introuvable')
    }
    return response.managerFull
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
    const response = await gql<QueryCommercialsResponse, {}>(GET_COMMERCIALS, {})
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

  async getTeamRanking(commercialId: number): Promise<{
    position: number
    total: number
    points: number
    trend?: string | null
    managerNom?: string | null
    managerPrenom?: string | null
    managerEmail?: string | null
    managerNumTel?: string | null
  }> {
    const response = await gql<
      {
        commercialTeamRanking: {
          position: number
          total: number
          points: number
          trend?: string | null
          managerNom?: string | null
          managerPrenom?: string | null
          managerEmail?: string | null
          managerNumTel?: string | null
        }
      },
      { commercialId: number }
    >(GET_COMMERCIAL_TEAM_RANKING, { commercialId })
    return response.commercialTeamRanking
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
    const response = await gql<QueryZonesResponse, {}>(GET_ZONES, {})
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

  async assignToDirecteur(directeurId: number, zoneId: number): Promise<boolean> {
    const response = await gql<
      { assignZoneToDirecteur: boolean },
      { directeurId: number; zoneId: number }
    >(ASSIGN_ZONE_TO_DIRECTEUR, { directeurId, zoneId })
    return response.assignZoneToDirecteur
  },

  async assignToManager(managerId: number, zoneId: number): Promise<boolean> {
    const response = await gql<
      { assignZoneToManager: boolean },
      { managerId: number; zoneId: number }
    >(ASSIGN_ZONE_TO_MANAGER, { managerId, zoneId })
    return response.assignZoneToManager
  },

  async getCurrentUserAssignment(userId: number, userType: string): Promise<any> {
    const response = await gql<any, { userId: number; userType: string }>(
      GET_CURRENT_USER_ASSIGNMENT,
      { userId, userType }
    )
    return response.currentUserAssignment
  },

  async getAllZoneHistory(): Promise<any[]> {
    const response = await gql<any, {}>(GET_ALL_ZONE_HISTORY, {})
    return response.allZoneHistory
  },

  async getAllCurrentAssignments(): Promise<any[]> {
    const response = await gql<any, {}>(GET_ALL_CURRENT_ASSIGNMENTS, {})
    return response.allCurrentAssignments
  },

  async getZoneCurrentAssignments(zoneId: number): Promise<any[]> {
    const response = await gql<any, { zoneId: number }>(GET_ZONE_CURRENT_ASSIGNMENTS, { zoneId })
    return response.zoneCurrentAssignments
  },
}

// =============================================================================
// Immeuble API Service
// =============================================================================

export const immeubleApi = {
  async getAll(): Promise<Immeuble[]> {
    const response = await gql<QueryImmeublesResponse, {}>(GET_IMMEUBLES, {})
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

  async addEtage(id: number): Promise<Immeuble> {
    const response = await gql<{ addEtageToImmeuble: Immeuble }, GetEntityByIdVariables>(
      ADD_ETAGE_TO_IMMEUBLE,
      { id }
    )
    return response.addEtageToImmeuble
  },

  async removeEtage(id: number): Promise<Immeuble> {
    const response = await gql<{ removeEtageFromImmeuble: Immeuble }, GetEntityByIdVariables>(
      REMOVE_ETAGE_FROM_IMMEUBLE,
      { id }
    )
    return response.removeEtageFromImmeuble
  },

  async addPorteToEtage(immeubleId: number, etage: number): Promise<Immeuble> {
    const response = await gql<
      { addPorteToEtage: Immeuble },
      { immeubleId: number; etage: number }
    >(ADD_PORTE_TO_ETAGE, { immeubleId, etage })
    return response.addPorteToEtage
  },

  async removePorteFromEtage(immeubleId: number, etage: number): Promise<Immeuble> {
    const response = await gql<
      { removePorteFromEtage: Immeuble },
      { immeubleId: number; etage: number }
    >(REMOVE_PORTE_FROM_ETAGE, { immeubleId, etage })
    return response.removePorteFromEtage
  },
}

// =============================================================================
// Statistic API Service
// =============================================================================

export const statisticApi = {
  async getAll(commercialId?: number): Promise<Statistic[]> {
    const response = await gql<QueryStatisticsResponse, { commercialId?: number }>(GET_STATISTICS, {
      commercialId,
    })
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

  async getZoneStatistics(): Promise<ZoneStatistic[]> {
    const response = await gql<QueryZoneStatisticsResponse, {}>(GET_ZONE_STATISTICS, {})
    return response.zoneStatistics
  },

  async getCurrentUserAssignment(userId: number, userType: string): Promise<any> {
    const response = await gql<any, { userId: number; userType: string }>(
      GET_CURRENT_USER_ASSIGNMENT,
      { userId, userType }
    )
    return response.currentUserAssignment
  },

  async recalculateAllStats(): Promise<string> {
    const response = await gql<{ recalculateAllStats: string }>(RECALCULATE_ALL_STATS)
    return response.recalculateAllStats
  },

  async validateStatsCoherence(): Promise<string> {
    const response = await gql<{ validateStatsCoherence: string }>(VALIDATE_STATS_COHERENCE)
    return response.validateStatsCoherence
  },
}

// =============================================================================
// Porte API Service
// =============================================================================

export const porteApi = {
  async getAll(): Promise<Porte[]> {
    const response = await gql<QueryPortesResponse>(GET_PORTES)
    return response.portes
  },

  async getById(id: number): Promise<Porte> {
    const response = await gql<QueryPorteResponse, GetEntityByIdVariables>(GET_PORTE, { id })
    return response.porte
  },

  async getByImmeuble(immeubleId: number, skip = 0, take = 20, etage?: number): Promise<Porte[]> {
    const response = await gql<QueryPortesByImmeubleResponse, any>(
      GET_PORTES_BY_IMMEUBLE,
      { immeubleId, skip, take, etage }
    )
    return response.portesByImmeuble
  },

  async create(input: CreatePorteVariables['createPorteInput']): Promise<Porte> {
    const response = await gql<MutationCreatePorteResponse, CreatePorteVariables>(CREATE_PORTE, {
      createPorteInput: input,
    })
    return response.createPorte
  },

  async update(input: UpdatePorteVariables['updatePorteInput']): Promise<Porte> {
    const response = await gql<MutationUpdatePorteResponse, UpdatePorteVariables>(UPDATE_PORTE, {
      updatePorteInput: input,
    })
    return response.updatePorte
  },

  async remove(id: number): Promise<Porte> {
    const response = await gql<MutationRemovePorteResponse, GetEntityByIdVariables>(REMOVE_PORTE, {
      id,
    })
    return response.removePorte
  },

  async getModifiedToday(immeubleId?: number): Promise<Porte[]> {
    const response = await gql<QueryPortesModifiedTodayResponse, GetPortesModifiedTodayVariables>(
      GET_PORTES_MODIFIED_TODAY,
      { immeubleId }
    )
    return response.portesModifiedToday
  },

  async getRdvToday(): Promise<Porte[]> {
    const response = await gql<QueryPortesRdvTodayResponse>(GET_PORTES_RDV_TODAY)
    return response.portesRdvToday
  },

  async getStatistics(immeubleId: number): Promise<any> {
    const response = await gql<any, { immeubleId: number }>(GET_PORTE_STATISTICS, { immeubleId })
    return response.porteStatistics
  },

  async getStatusHistorique(porteId: number): Promise<any[]> {
    const response = await gql<any, { porteId: number }>(GET_STATUS_HISTORIQUE_BY_PORTE, { porteId })
    return response.statusHistoriqueByPorte
  },

  async getStatusHistoriqueByImmeuble(immeubleId: number): Promise<any[]> {
    const response = await gql<any, { immeubleId: number }>(GET_STATUS_HISTORIQUE_BY_IMMEUBLE, { immeubleId })
    return response.statusHistoriqueByImmeuble
  },
}

// =============================================================================
// Main API Export
// =============================================================================

// =============================================================================
// Auth API
// =============================================================================

const authApi = {
  /**
   * Récupère les informations de l'utilisateur connecté depuis le JWT
   */
  async getMe() {
    const data = await gql(GET_ME)
    return data.me
  },
}

export const api = {
  auth: authApi,
  directeurs: directeurApi,
  managers: managerApi,
  commercials: commercialApi,
  zones: zoneApi,
  immeubles: immeubleApi,
  statistics: statisticApi,
  portes: porteApi,
}

export default api
