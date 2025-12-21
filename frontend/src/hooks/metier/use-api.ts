/**
 * @fileoverview React hooks for API data fetching
 * Provides reusable hooks with loading states, error handling, and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../services/api'
import { ROLES } from './roleFilters'
import { apiCache, invalidateRelatedCaches } from '../../services/core'
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

// NEW IMPORT
import { offlineQueue } from '../../services/core'

export function useApiMutation<TInput, TOutput, TOptimistic = unknown>(
  mutationFn: (input: TInput, signal?: AbortSignal) => Promise<TOutput>,
  entityType?: string,
  offlineType?: string // NEW: Type for offline queue
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

      // OFFLINE CHECK
      if (offlineType && !navigator.onLine) {
         console.log('[useApiMutation] Offline detected, queuing action:', offlineType)
         offlineQueue.enqueue(offlineType, input)
         
         // Simulate artificial delay for UX feel
         await new Promise(r => setTimeout(r, 300))
         
         if (opts?.onSuccess) {
            // We can't provide real TOutput, so we cast pending input or partial as Output if possible
            // Or just undefined (casting needed)
            opts.onSuccess(input as unknown as TOutput)
         }
         
         setLoading(false)
         // Return input as output (best guess) to resolve promise
         return input as unknown as TOutput
      }

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
    [mutationFn, entityType, offlineType]
  )

  return { mutate, loading, error }
}

// =============================================================================
// Directeur Hooks
// =============================================================================

export function useDirecteurs(): UseApiListState<Directeur> & UseApiActions {
  return useApiCall(() => api.directeurs.getAll(), [], 'directeurs')
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

export function useManagers(): UseApiListState<Manager> & UseApiActions {
  return useApiCall(() => api.managers.getAll(), [], 'managers')
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
    // Vérifier si id est valide (pas null, pas NaN, > 0)
    if (!id || Number.isNaN(id) || id <= 0) {
      return Promise.resolve(null)
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

export function useCommercials(): UseApiListState<Commercial> & UseApiActions {
  return useApiCall(() => api.commercials.getAll(), [], 'commercials')
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

export function useCommercialTeamRanking(commercialId: number): UseApiState<{
  position: number
  total: number
  points: number
  trend?: string | null
  managerNom?: string | null
  managerPrenom?: string | null
  managerEmail?: string | null
  managerNumTel?: string | null
}> &
  UseApiActions {
  return useApiCall(
    () => {
      if (!commercialId || commercialId <= 0) {
        return Promise.resolve(null)
      }
      return api.commercials.getTeamRanking(commercialId)
    },
    [commercialId],
    'commercial-team-ranking'
  )
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

export function useZones(): UseApiListState<Zone> & UseApiActions {
  return useApiCall(() => api.zones.getAll(), [], 'zones')
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

export function useAllZoneHistory(): UseApiListState<any> & UseApiActions {
  return useApiCall(() => api.zones.getAllZoneHistory(), [], 'allZoneHistory')
}

export function useAllCurrentAssignments(): UseApiListState<any> & UseApiActions {
  return useApiCall(() => api.zones.getAllCurrentAssignments(), [], 'allCurrentAssignments')
}

export function useZoneCurrentAssignments(zoneId: number): UseApiListState<any> & UseApiActions {
  return useApiCall(
    () => api.zones.getZoneCurrentAssignments(zoneId),
    [zoneId],
    'zoneCurrentAssignments'
  )
}

export function useCurrentUserAssignment(
  userId: number,
  userType: 'COMMERCIAL' | 'MANAGER' | 'DIRECTEUR'
): UseApiState<any> & UseApiActions {
  return useApiCall(
    () => {
      // Skip l'appel API si userId est invalide (null, NaN, ou <= 0)
      if (!userId || isNaN(userId) || userId <= 0) {
        return Promise.resolve(null)
      }
      return api.zones.getCurrentUserAssignment(userId, userType)
    },
    [userId, userType],
    `current-zone-assignment-${userId}-${userType}`
  )
}

// =============================================================================
// Immeuble Hooks
// =============================================================================

export function useImmeubles(): UseApiListState<Immeuble> & UseApiActions {
  return useApiCall(() => api.immeubles.getAll(), [], 'immeubles')
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

export function useStatistics(): UseApiListState<Statistic> & UseApiActions {
  return useApiCall(() => api.statistics.getAll(undefined), [], 'statistics')
}

export function useStatisticsByCommercial(
  commercialId: number
): UseApiListState<Statistic> & UseApiActions {
  return useApiCall(() => api.statistics.getAll(commercialId), [commercialId], 'statistics')
}

export function useStatisticsByZone(zoneId: number): UseApiListState<Statistic> & UseApiActions {
  const result = useApiCall(() => api.statistics.getAll(undefined), [], 'statistics')

  // Filtrer les statistiques par zoneId côté client
  const filteredData = result.data?.filter(stat => stat.zoneId === zoneId) || []

  return {
    ...result,
    data: filteredData,
  }
}

export function useZoneStatistics(): UseApiListState<ZoneStatistic> & UseApiActions {
  return useApiCall(() => api.statistics.getZoneStatistics(), [], 'zoneStatistics')
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
  return useApiMutation(api.portes.update, 'portes', 'UPDATE_PORTE')
}

export function useRemovePorte(): UseApiMutation<number, Porte> {
  return useApiMutation(api.portes.remove, 'portes')
}

export function usePortesModifiedToday(
  immeubleId?: number
): UseApiListState<Porte> & UseApiActions {
  return useApiCall(
    () => api.portes.getModifiedToday(immeubleId),
    [immeubleId],
    'portes-modified-today'
  )
}

export function usePortesRdvToday(): UseApiListState<Porte> & UseApiActions {
  return useApiCall(() => api.portes.getRdvToday(), [], 'portes-rdv-today')
}

export function usePorteStatistics(immeubleId: number): UseApiState<any> & UseApiActions {
  return useApiCall(
    () => api.portes.getStatistics(immeubleId),
    [immeubleId],
    'porte-statistics'
  )
}

interface UseInfiniteApiListState<T> {
  data: T[]
  loading: boolean
  error: string | null
  hasMore: boolean
  isFetchingMore: boolean // NEW: Separate state for pagination loading
  loadMore: () => Promise<void>
  reset: () => void
  updateLocalData: (id: number, changes: Partial<T>) => void
}

export function useInfinitePortesByImmeuble(
  immeubleId: number | null,
  pageSize = 20,
  etage?: number | null
): UseInfiniteApiListState<Porte> & UseApiActions {
  const [state, setState] = useState<{
    data: Porte[]
    loading: boolean
    error: string | null
    hasMore: boolean
    page: number
    isFetchingMore: boolean // NEW
  }>({
    data: [],
    loading: false,
    error: null,
    hasMore: true,
    page: 0,
    isFetchingMore: false,
  })

  // Réinitialiser quand l'immeuble ou l'étage change
  useEffect(() => {
     if (immeubleId) {
        setState({
            data: [],
            loading: true,
            error: null,
            hasMore: true,
            page: 0,
            isFetchingMore: false
        })
        fetchPage(0, true)
     }
  }, [immeubleId, etage]) // Add etage dependency

  const fetchPage = useCallback(
    async (pageToFetch: number, isReset: boolean = false) => {
      if (!immeubleId) return

      // Si chargement initial, mettre loading. Si pagination, mettre isFetchingMore
      const isInitialLoad = isReset || state.data.length === 0
      setState(prev => ({
        ...prev,
        loading: isInitialLoad,
        isFetchingMore: !isInitialLoad,
        error: null
      }))

      try {
        const skip = pageToFetch * pageSize
        // Pass etage to API call
        const newPortes = await api.portes.getByImmeuble(immeubleId, skip, pageSize, etage || undefined)

        setState(prev => {
           // Si reset, on remplace tout. Sinon on ajoute.
           // On vérifie les doublons par sécurité (bien que skip/take devrait gérer ça)
           const existingIds = isReset ? new Set() : new Set(prev.data.map(p => p.id))
           const uniqueNewPortes = newPortes.filter(p => !existingIds.has(p.id))

           return {
            data: isReset ? newPortes : [...prev.data, ...uniqueNewPortes],
            loading: false,
            isFetchingMore: false,
            error: null,
            hasMore: newPortes.length === pageSize, // Si on a reçu moins que demandé, c'est la fin
            page: pageToFetch,
          }
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          isFetchingMore: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      }
    },
    [immeubleId, pageSize, etage, state.data.length]
  )


  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return
    await fetchPage(state.page + 1)
  }, [state.loading, state.hasMore, state.page, fetchPage])

  const refetch = useCallback(async () => {
     // Recharger la premiere page et reinitialiser
     await fetchPage(0, true)
  }, [fetchPage])
  
  const reset = useCallback(() => {
    setState({
        data: [],
        loading: false,
        error: null,
        hasMore: true,
        page: 0,
        isFetchingMore: false
    })
    // fetchPage(0, true) // Optional: auto reload on reset
  }, [])

  const updateLocalData = useCallback((id: number, changes: Partial<Porte>) => {
     setState(prev => ({
        ...prev,
        data: prev.data.map(p => p.id === id ? { ...p, ...changes } : p)
     }))
  }, [])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    isFetchingMore: state.isFetchingMore,
    loadMore,
    refetch,
    reset,
    updateLocalData
  }
}

// =============================================================================
// Status Historique Hooks
// =============================================================================

export function useStatusHistoriqueByPorte(porteId: number | null): UseApiState<any[]> & UseApiActions {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!porteId) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await api.portes.getStatusHistorique(porteId)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique')
    } finally {
      setLoading(false)
    }
  }, [porteId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}

export function useStatusHistoriqueByImmeuble(immeubleId: number | null): UseApiState<any[]> & UseApiActions {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!immeubleId) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await api.portes.getStatusHistoriqueByImmeuble(immeubleId)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique')
    } finally {
      setLoading(false)
    }
  }, [immeubleId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}
