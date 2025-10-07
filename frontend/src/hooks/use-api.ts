/**
 * @fileoverview React hooks for API data fetching
 * Provides reusable hooks with loading states, error handling, and caching
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api-service';
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
  UpdateStatisticInput,
} from '../types/api';

// =============================================================================
// Base Hook Types
// =============================================================================

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiListState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

interface UseApiActions {
  refetch: () => Promise<void>;
}

interface UseApiMutation<TInput, TOutput> {
  mutate: (input: TInput) => Promise<TOutput>;
  loading: boolean;
  error: string | null;
}

// =============================================================================
// Generic Hooks
// =============================================================================

function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiState<T> & UseApiActions {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

function useApiMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>
): UseApiMutation<TInput, TOutput> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(input);
        setLoading(false);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setLoading(false);
        throw err;
      }
    },
    [mutationFn]
  );

  return { mutate, loading, error };
}

// =============================================================================
// Directeur Hooks
// =============================================================================

export function useDirecteurs(): UseApiListState<Directeur> & UseApiActions {
  return useApiCall(api.directeurs.getAll);
}

export function useDirecteur(id: number): UseApiState<Directeur> & UseApiActions {
  return useApiCall(() => api.directeurs.getById(id), [id]);
}

export function useCreateDirecteur(): UseApiMutation<CreateDirecteurInput, Directeur> {
  return useApiMutation(api.directeurs.create);
}

export function useUpdateDirecteur(): UseApiMutation<UpdateDirecteurInput, Directeur> {
  return useApiMutation(api.directeurs.update);
}

export function useRemoveDirecteur(): UseApiMutation<number, Directeur> {
  return useApiMutation(api.directeurs.remove);
}

// =============================================================================
// Manager Hooks
// =============================================================================

export function useManagers(): UseApiListState<Manager> & UseApiActions {
  return useApiCall(api.managers.getAll);
}

export function useManager(id: number): UseApiState<Manager> & UseApiActions {
  return useApiCall(() => api.managers.getById(id), [id]);
}

export function useCreateManager(): UseApiMutation<CreateManagerInput, Manager> {
  return useApiMutation(api.managers.create);
}

export function useUpdateManager(): UseApiMutation<UpdateManagerInput, Manager> {
  return useApiMutation(api.managers.update);
}

export function useRemoveManager(): UseApiMutation<number, Manager> {
  return useApiMutation(api.managers.remove);
}

// =============================================================================
// Commercial Hooks
// =============================================================================

export function useCommercials(): UseApiListState<Commercial> & UseApiActions {
  return useApiCall(api.commercials.getAll);
}

export function useCommercial(id: number): UseApiState<Commercial> & UseApiActions {
  return useApiCall(() => api.commercials.getById(id), [id]);
}

export function useCreateCommercial(): UseApiMutation<CreateCommercialInput, Commercial> {
  return useApiMutation(api.commercials.create);
}

export function useUpdateCommercial(): UseApiMutation<UpdateCommercialInput, Commercial> {
  return useApiMutation(api.commercials.update);
}

export function useRemoveCommercial(): UseApiMutation<number, Commercial> {
  return useApiMutation(api.commercials.remove);
}

export function useAssignZone(): UseApiMutation<{ commercialId: number; zoneId: number }, boolean> {
  return useApiMutation(({ commercialId, zoneId }) =>
    api.commercials.assignZone(commercialId, zoneId)
  );
}

export function useUnassignZone(): UseApiMutation<{ commercialId: number; zoneId: number }, boolean> {
  return useApiMutation(({ commercialId, zoneId }) =>
    api.commercials.unassignZone(commercialId, zoneId)
  );
}

// =============================================================================
// Zone Hooks
// =============================================================================

export function useZones(): UseApiListState<Zone> & UseApiActions {
  return useApiCall(api.zones.getAll);
}

export function useZone(id: number): UseApiState<Zone> & UseApiActions {
  return useApiCall(() => api.zones.getById(id), [id]);
}

export function useCreateZone(): UseApiMutation<CreateZoneInput, Zone> {
  return useApiMutation(api.zones.create);
}

export function useUpdateZone(): UseApiMutation<UpdateZoneInput, Zone> {
  return useApiMutation(api.zones.update);
}

export function useRemoveZone(): UseApiMutation<number, Zone> {
  return useApiMutation(api.zones.remove);
}

// =============================================================================
// Immeuble Hooks
// =============================================================================

export function useImmeubles(): UseApiListState<Immeuble> & UseApiActions {
  return useApiCall(api.immeubles.getAll);
}

export function useImmeuble(id: number): UseApiState<Immeuble> & UseApiActions {
  return useApiCall(() => api.immeubles.getById(id), [id]);
}

export function useCreateImmeuble(): UseApiMutation<CreateImmeubleInput, Immeuble> {
  return useApiMutation(api.immeubles.create);
}

export function useUpdateImmeuble(): UseApiMutation<UpdateImmeubleInput, Immeuble> {
  return useApiMutation(api.immeubles.update);
}

export function useRemoveImmeuble(): UseApiMutation<number, Immeuble> {
  return useApiMutation(api.immeubles.remove);
}

// =============================================================================
// Statistic Hooks
// =============================================================================

export function useStatistics(): UseApiListState<Statistic> & UseApiActions {
  return useApiCall(api.statistics.getAll);
}

export function useStatistic(id: number): UseApiState<Statistic> & UseApiActions {
  return useApiCall(() => api.statistics.getById(id), [id]);
}

export function useCreateStatistic(): UseApiMutation<CreateStatisticInput, Statistic> {
  return useApiMutation(api.statistics.create);
}

export function useUpdateStatistic(): UseApiMutation<UpdateStatisticInput, Statistic> {
  return useApiMutation(api.statistics.update);
}

export function useRemoveStatistic(): UseApiMutation<number, Statistic> {
  return useApiMutation(api.statistics.remove);
}