/**
 * @fileoverview React hooks for API data fetching
 * Provides reusable hooks with loading states, error handling, and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../services/api-service'
import { ROLES } from './roleFilters'
import { apiCache, invalidateRelatedCaches } from '../../services/api-cache'
import type {
  Directeur,
  Manager,
  Commercial,
  Zone,
  Immeuble,
  Statistic,
  ZoneStatistic,
  Porte,
  CreateDirecteurInput,
  CreateManagerInput,
  CreateCommercialInput,
  CreateZoneInput,
  CreateImmeubleInput,
  CreateStatisticInput,
  CreatePorteInput,
  UpdateDirecteurInput,
  UpdateManagerInput,
  UpdateCommercialInput,
  UpdateZoneInput,
  UpdateImmeubleInput,
  UpdateStatisticInput,
  UpdatePorteInput,
} from '../../types/api'

// =============================================================================
// Base Hook Types
// =============================================================================

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiListState<T> {
  data: T[]
  loading: boolean
  error: string | null
}

interface UseApiActions {
  refetch: () => Promise<void>
}

interface UseApiMutation<TInput, TOutput> {
  mutate: (input: TInput) => Promise<TOutput>
  loading: boolean
  error: string | null
}

// =============================================================================
// Generic Hooks
// =============================================================================

function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  namespace?: string
): UseApiState<T> & UseApiActions {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cacheKey = apiCache.getKey(apiCall, dependencies, namespace)

    if (forceRefresh) {
      // Force refresh: bypass cache and in-flight
      setState(prev => ({ ...prev, loading: true, error: null }))
      try {
        const data = await apiCall()
        apiCache.set(cacheKey, data)
        setState({ data, loading: false, error: null })
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        })
      }
      return
    }

    // Use fetchWithCache for deduplication and cache management
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await apiCache.fetchWithCache<T>(cacheKey, apiCall)
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => fetchData(true), [fetchData])

  return {
    ...state,
    refetch,
  }
}

type MutateOptions<TOutput, TOptimistic> = {
  onSuccess?: (result: TOutput) => void
  onError?: (message: string, raw: unknown) => void
  optimisticUpdate?: (draft?: TOptimistic) => () => void // renvoie un rollback
}

export function useApiMutation<TInput, TOutput, TOptimistic = unknown>(
  mutationFn: (input: TInput, signal?: AbortSignal) => Promise<TOutput>,
  entityType?: string
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    return () => {
      mounted.current = false
      abortRef.current?.abort()
    }
  }, [])

  const mutate = useCallback(
    async (input: TInput, opts?: MutateOptions<TOutput, TOptimistic>): Promise<TOutput> => {
      const myId = ++callIdRef.current
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)

      let rollback: (() => void) | undefined
      try {
        if (opts?.optimisticUpdate) {
          rollback = opts.optimisticUpdate()
        }

        const result = await mutationFn(input, controller.signal)

        if (entityType) {
          await Promise.resolve(invalidateRelatedCaches(entityType))
        }

        if (mounted.current && callIdRef.current === myId) {
          opts?.onSuccess?.(result)
        }

        return result
      } catch (err: unknown) {
        // Normalisation message d’erreur
        let message = 'Unknown error occurred'
        if (typeof err === 'object' && err !== null) {
          const anyErr = err as any
          message = anyErr?.response?.data?.message ?? anyErr?.message ?? message
        }
        // rollback si optimistic
        try {
          rollback?.()
        } catch {}

        if (mounted.current && callIdRef.current === myId) {
          setError(message)
          opts?.onError?.(message, err)
        }
        throw err
      } finally {
        if (mounted.current && callIdRef.current === myId) {
          setLoading(false)
        }
      }
    },
    [mutationFn, entityType]
  )

  return { mutate, loading, error }
}

// =============================================================================
// Directeur Hooks
// =============================================================================

export function useDirecteurs(
  userId?: number,
  userRole?: string
): UseApiListState<Directeur> & UseApiActions {
  return useApiCall(() => api.directeurs.getAll(userId, userRole), [userId, userRole], 'directeurs')
}

export function useDirecteur(id: number): UseApiState<Directeur> & UseApiActions {
  return useApiCall(() => api.directeurs.getById(id), [id], 'directeurs')
}

export function useCreateDirecteur(): UseApiMutation<CreateDirecteurInput, Directeur> {
  return useApiMutation(api.directeurs.create, 'directeurs')
}

export function useUpdateDirecteur(): UseApiMutation<UpdateDirecteurInput, Directeur> {
  return useApiMutation(api.directeurs.update, 'directeurs')
}

export function useRemoveDirecteur(): UseApiMutation<number, Directeur> {
  return useApiMutation(api.directeurs.remove, 'directeurs')
}

// =============================================================================
// Manager Hooks
// =============================================================================

export function useManagers(
  userId?: number,
  userRole?: string
): UseApiListState<Manager> & UseApiActions {
  return useApiCall(() => api.managers.getAll(userId, userRole), [userId, userRole], 'managers')
}

export function useManager(id: number): UseApiState<Manager> & UseApiActions {
  return useApiCall(() => api.managers.getById(id), [id], 'managers')
}

export function useManagerPersonal(id: number): UseApiState<Manager> & UseApiActions {
  return useApiCall(() => api.managers.getPersonalById(id), [id], 'managers-personal')
}

export function useManagerFull(id: number): UseApiState<Manager> & UseApiActions {
  return useApiCall(() => api.managers.getFullById(id), [id], 'managers-full')
}

type WorkspaceProfile = Commercial | Manager

//la fonction qu'on utilise pour charger les donnees des deux espaces (commercial et manager)
export function useWorkspaceProfile(
  id: number,
  role: string,
  includeTeam: boolean = false
): //====================================================
UseApiState<WorkspaceProfile> & UseApiActions {
  const fetchProfile = useCallback(() => {
    if (Number.isNaN(id)) {
      return Promise.reject(new Error('Identifiant utilisateur invalide'))
    }
    if (role === ROLES.MANAGER) {
      // Si on est sur la page équipe, charger les données complètes avec les commerciaux
      if (includeTeam) {
        return api.managers.getFullById(id)
      }
      // Sinon, charger uniquement les données personnelles
      return api.managers.getPersonalById(id)
    }
    return api.commercials.getFullById(id)
  }, [id, role, includeTeam])

  return useApiCall(
    () => fetchProfile() as Promise<WorkspaceProfile>,
    [id, role, includeTeam],
    `workspace-${role}-${includeTeam ? 'full' : 'personal'}`
  )
}
//====================================================
export function useCreateManager(): UseApiMutation<CreateManagerInput, Manager> {
  return useApiMutation(api.managers.create, 'managers')
}

export function useUpdateManager(): UseApiMutation<UpdateManagerInput, Manager> {
  return useApiMutation(api.managers.update, 'managers')
}

export function useRemoveManager(): UseApiMutation<number, Manager> {
  return useApiMutation(api.managers.remove, 'managers')
}

// =============================================================================
// Commercial Hooks
// =============================================================================

export function useCommercials(
  userId?: number,
  userRole?: string
): UseApiListState<Commercial> & UseApiActions {
  return useApiCall(
    () => api.commercials.getAll(userId, userRole),
    [userId, userRole],
    'commercials'
  )
}

export function useCommercial(id: number): UseApiState<Commercial> & UseApiActions {
  return useApiCall(() => api.commercials.getById(id), [id], 'commercials')
}

/**
 * Hook pour charger un commercial avec toutes ses relations (immeubles, zones, statistics)
 * Optimisé pour les pages de détails - charge plus de données que useCommercial
 */
export function useCommercialFull(id: number): UseApiState<Commercial> & UseApiActions {
  return useApiCall(() => api.commercials.getFullById(id), [id], 'commercials-full')
}

export function useCreateCommercial(): UseApiMutation<CreateCommercialInput, Commercial> {
  return useApiMutation(api.commercials.create, 'commercials')
}

export function useUpdateCommercial(): UseApiMutation<UpdateCommercialInput, Commercial> {
  return useApiMutation(api.commercials.update, 'commercials')
}

export function useRemoveCommercial(): UseApiMutation<number, Commercial> {
  return useApiMutation(api.commercials.remove, 'commercials')
}

export function useAssignZone(): UseApiMutation<{ commercialId: number; zoneId: number }, boolean> {
  return useApiMutation(
    ({ commercialId, zoneId }) => api.commercials.assignZone(commercialId, zoneId),
    'commercials'
  )
}

export function useUnassignZone(): UseApiMutation<
  { commercialId: number; zoneId: number },
  boolean
> {
  return useApiMutation(
    ({ commercialId, zoneId }) => api.commercials.unassignZone(commercialId, zoneId),
    'commercials'
  )
}

// =============================================================================
// Zone Hooks
// =============================================================================

export function useZones(
  userId?: number,
  userRole?: string
): UseApiListState<Zone> & UseApiActions {
  return useApiCall(() => api.zones.getAll(userId, userRole), [userId, userRole], 'zones')
}

export function useZone(id: number): UseApiState<Zone> & UseApiActions {
  return useApiCall(() => api.zones.getById(id), [id], 'zones')
}

export function useCreateZone(): UseApiMutation<CreateZoneInput, Zone> {
  return useApiMutation(api.zones.create, 'zones')
}

export function useUpdateZone(): UseApiMutation<UpdateZoneInput, Zone> {
  return useApiMutation(api.zones.update, 'zones')
}

export function useRemoveZone(): UseApiMutation<number, Zone> {
  return useApiMutation(api.zones.remove, 'zones')
}

export function useAssignZoneToDirecteur(): UseApiMutation<
  { directeurId: number; zoneId: number },
  boolean
> {
  return useApiMutation(
    ({ directeurId, zoneId }) => api.zones.assignToDirecteur(directeurId, zoneId),
    'zones'
  )
}

export function useAssignZoneToManager(): UseApiMutation<
  { managerId: number; zoneId: number },
  boolean
> {
  return useApiMutation(
    ({ managerId, zoneId }) => api.zones.assignToManager(managerId, zoneId),
    'zones'
  )
}

export function useCurrentZoneAssignment(
  userId: number,
  userType: string
): UseApiState<any> & UseApiActions {
  return useApiCall(
    () => api.zones.getCurrentUserAssignment(userId, userType),
    [userId, userType],
    'currentZoneAssignment'
  )
}

// =============================================================================
// Immeuble Hooks
// =============================================================================

export function useImmeubles(
  userId?: number,
  userRole?: string
): UseApiListState<Immeuble> & UseApiActions {
  return useApiCall(() => api.immeubles.getAll(userId, userRole), [userId, userRole], 'immeubles')
}

export function useImmeuble(id: number): UseApiState<Immeuble> & UseApiActions {
  return useApiCall(() => api.immeubles.getById(id), [id], 'immeubles')
}

export function useCreateImmeuble(): UseApiMutation<CreateImmeubleInput, Immeuble> {
  return useApiMutation(api.immeubles.create, 'immeubles')
}

export function useUpdateImmeuble(): UseApiMutation<UpdateImmeubleInput, Immeuble> {
  return useApiMutation(api.immeubles.update, 'immeubles')
}

export function useRemoveImmeuble(): UseApiMutation<number, Immeuble> {
  return useApiMutation(api.immeubles.remove, 'immeubles')
}

export function useAddEtageToImmeuble(): UseApiMutation<number, Immeuble> {
  return useApiMutation(api.immeubles.addEtage, 'immeubles')
}

export function useRemoveEtageFromImmeuble(): UseApiMutation<number, Immeuble> {
  return useApiMutation(api.immeubles.removeEtage, 'immeubles')
}

export function useAddPorteToEtage(): UseApiMutation<
  { immeubleId: number; etage: number },
  Immeuble
> {
  return useApiMutation(
    ({ immeubleId, etage }) => api.immeubles.addPorteToEtage(immeubleId, etage),
    'immeubles'
  )
}

export function useRemovePorteFromEtage(): UseApiMutation<
  { immeubleId: number; etage: number },
  Immeuble
> {
  return useApiMutation(
    ({ immeubleId, etage }) => api.immeubles.removePorteFromEtage(immeubleId, etage),
    'immeubles'
  )
}

// =============================================================================
// Statistic Hooks
// =============================================================================

export function useStatistics(
  userId?: number,
  userRole?: string
): UseApiListState<Statistic> & UseApiActions {
  return useApiCall(
    () => api.statistics.getAll(undefined, userId, userRole),
    [userId, userRole],
    'statistics'
  )
}

export function useStatisticsByCommercial(
  commercialId: number
): UseApiListState<Statistic> & UseApiActions {
  return useApiCall(() => api.statistics.getAll(commercialId), [commercialId], 'statistics')
}

export function useStatisticsByZone(
  zoneId: number,
  userId?: number,
  userRole?: string
): UseApiListState<Statistic> & UseApiActions {
  const result = useApiCall(
    () => api.statistics.getAll(undefined, userId, userRole),
    [userId, userRole],
    'statistics'
  )

  // Filtrer les statistiques par zoneId côté client
  const filteredData = result.data?.filter(stat => stat.zoneId === zoneId) || []

  return {
    ...result,
    data: filteredData,
  }
}

export function useZoneStatistics(
  userId?: number,
  userRole?: string
): UseApiListState<ZoneStatistic> & UseApiActions {
  return useApiCall(
    () => api.statistics.getZoneStatistics(userId, userRole),
    [userId, userRole],
    'zoneStatistics'
  )
}

export function useStatistic(id: number): UseApiState<Statistic> & UseApiActions {
  return useApiCall(() => api.statistics.getById(id), [id], 'statistics')
}

export function useCreateStatistic(): UseApiMutation<CreateStatisticInput, Statistic> {
  return useApiMutation(api.statistics.create, 'statistics')
}

export function useUpdateStatistic(): UseApiMutation<UpdateStatisticInput, Statistic> {
  return useApiMutation(api.statistics.update, 'statistics')
}

export function useRemoveStatistic(): UseApiMutation<number, Statistic> {
  return useApiMutation(api.statistics.remove, 'statistics')
}

// =============================================================================
// Porte Hooks
// =============================================================================

export function usePortes(): UseApiListState<Porte> & UseApiActions {
  return useApiCall(api.portes.getAll, [], 'portes')
}

export function usePorte(id: number): UseApiState<Porte> & UseApiActions {
  return useApiCall(() => api.portes.getById(id), [id], 'portes')
}

export function usePortesByImmeuble(immeubleId: number): UseApiListState<Porte> & UseApiActions {
  return useApiCall(() => api.portes.getByImmeuble(immeubleId), [immeubleId], 'portes')
}

export function useCreatePorte(): UseApiMutation<CreatePorteInput, Porte> {
  return useApiMutation(api.portes.create, 'portes')
}

export function useUpdatePorte(): UseApiMutation<UpdatePorteInput, Porte> {
  return useApiMutation(api.portes.update, 'portes')
}

export function useRemovePorte(): UseApiMutation<number, Porte> {
  return useApiMutation(api.portes.remove, 'portes')
}
