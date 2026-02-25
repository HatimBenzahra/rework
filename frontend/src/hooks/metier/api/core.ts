/**
 * @fileoverview Core Logic for API Hooks
 * Provides reusable hooks with loading states, error handling, and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiCache, invalidateRelatedCaches, offlineQueue } from '../../../services/core'

// =============================================================================
// Base Hook Types
// =============================================================================

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface UseApiListState<T> {
  data: T[]
  loading: boolean
  error: string | null
}

export interface UseApiActions {
  refetch: () => Promise<void>
}

export interface UseApiMutation<TInput, TOutput> {
  mutate: (input: TInput) => Promise<TOutput>
  loading: boolean
  error: string | null
}

// =============================================================================
// Generic Hooks
// =============================================================================

export function useApiCall<T>(
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
  entityType?: string,
  offlineType?: string // Type for offline queue
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const mutationFnRef = useRef(mutationFn)
  mutationFnRef.current = mutationFn

  // StrictMode-safe: re-set to true on every render so remount restores it
  const mountedRef = useRef(true)
  mountedRef.current = true

  useEffect(() => {
    return () => {
      mountedRef.current = false
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
            opts.onSuccess(input as unknown as TOutput)
         }
         
         setLoading(false)
         return input as unknown as TOutput
      }

      let rollback: (() => void) | undefined
      try {
        if (opts?.optimisticUpdate) {
          rollback = opts.optimisticUpdate()
        }

        const result = await mutationFnRef.current(input, controller.signal)

        if (entityType) {
          await Promise.resolve(invalidateRelatedCaches(entityType))
        }

        if (callIdRef.current === myId) {
          opts?.onSuccess?.(result)
        }

        return result
      } catch (err: unknown) {
        let message = 'Unknown error occurred'
        if (typeof err === 'object' && err !== null) {
          const anyErr = err as any
          message = anyErr?.response?.data?.message ?? anyErr?.message ?? message
        }
        try {
          rollback?.()
        } catch {}

        if (callIdRef.current === myId) {
          setError(message)
          opts?.onError?.(message, err)
        }
        throw err
      } finally {
        if (callIdRef.current === myId) {
          setLoading(false)
        }
      }
    },
    [entityType, offlineType]
  )

  return { mutate, loading, error }
}
