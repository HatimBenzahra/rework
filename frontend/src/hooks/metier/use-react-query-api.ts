/**
 * @fileoverview React Query hooks for API data fetching
 * Hooks optimisés avec React Query pour éviter les refetch complets
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api-service'
import { useErrorToast } from '../utils/use-error-toast'
import { invalidateRelatedCaches } from '../../services/api-cache'
import type {
  Manager,
  Commercial,
  UpdateManagerInput,
  UpdateCommercialInput,
} from '../../types/api'

// =============================================================================
// Query Keys - Clés de cache pour React Query
// =============================================================================

const queryKeys = {
  directeurs: (userId?: number, userRole?: string) => ['directeurs', { userId, userRole }] as const,
  managers: (userId?: number, userRole?: string) => ['managers', { userId, userRole }] as const,
  commercials: (userId?: number, userRole?: string) =>
    ['commercials', { userId, userRole }] as const,
}

// =============================================================================
// Directeur Hooks
// =============================================================================

export function useDirecteursQuery(userId?: number, userRole?: string) {
  return useQuery({
    queryKey: queryKeys.directeurs(userId, userRole),
    queryFn: () => api.directeurs.getAll(userId, userRole),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// =============================================================================
// Manager Hooks
// =============================================================================

export function useManagersQuery(userId?: number, userRole?: string) {
  return useQuery({
    queryKey: queryKeys.managers(userId, userRole),
    queryFn: () => api.managers.getAll(userId, userRole),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateManagerMutation() {
  const queryClient = useQueryClient()
  const { showError } = useErrorToast()

  return useMutation({
    mutationFn: (input: UpdateManagerInput) => api.managers.update(input),
    onMutate: async variables => {
      // Annuler les refetch en cours
      await queryClient.cancelQueries({ queryKey: ['managers'] })

      // Snapshot de l'état actuel pour rollback
      const previousManagers = queryClient.getQueriesData({ queryKey: ['managers'] })

      // Mise à jour optimiste - met à jour le cache immédiatement
      queryClient.setQueriesData<Manager[]>({ queryKey: ['managers'] }, old => {
        if (!old) return old
        return old.map(manager => {
          if (manager.id === variables.id) {
            // Fusionner les données en s'assurant que les types correspondent
            return {
              ...manager,
              ...variables,
              // Normaliser numTelephone en string si c'est un number
              numTelephone: variables.numTelephone
                ? String(variables.numTelephone)
                : manager.numTelephone,
            } as Manager
          }
          return manager
        })
      })

      // Retourner le contexte pour rollback en cas d'erreur
      return { previousManagers }
    },
    onError: (error, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousManagers) {
        context.previousManagers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      showError(error, 'useUpdateManagerMutation')
    },
    onSettled: () => {
      // Invalider AUSSI l'ancien cache pour compatibilité avec les anciens hooks
      invalidateRelatedCaches('managers')
      // Rafraîchir les données React Query après la mutation
      queryClient.invalidateQueries({ queryKey: ['managers'] })
    },
  })
}

// =============================================================================
// Commercial Hooks
// =============================================================================

export function useCommercialsQuery(userId?: number, userRole?: string) {
  return useQuery({
    queryKey: queryKeys.commercials(userId, userRole),
    queryFn: () => api.commercials.getAll(userId, userRole),
    staleTime: 3 * 60 * 1000, // 3 minutes - plus volatile
  })
}

export function useUpdateCommercialMutation() {
  const queryClient = useQueryClient()
  const { showError } = useErrorToast()

  return useMutation({
    mutationFn: (input: UpdateCommercialInput) => api.commercials.update(input),
    onMutate: async variables => {
      // Annuler les refetch en cours
      await queryClient.cancelQueries({ queryKey: ['commercials'] })

      // Snapshot de l'état actuel pour rollback
      const previousCommercials = queryClient.getQueriesData({ queryKey: ['commercials'] })

      // Mise à jour optimiste - met à jour le cache immédiatement
      queryClient.setQueriesData<Commercial[]>({ queryKey: ['commercials'] }, old => {
        if (!old) return old
        return old.map(commercial => {
          if (commercial.id === variables.id) {
            // Fusionner les données en s'assurant que les types correspondent
            return {
              ...commercial,
              ...variables,
            } as Commercial
          }
          return commercial
        })
      })

      // Retourner le contexte pour rollback en cas d'erreur
      return { previousCommercials }
    },
    onError: (error, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousCommercials) {
        context.previousCommercials.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      showError(error, 'useUpdateCommercialMutation')
    },
    onSettled: () => {
      // Invalider AUSSI l'ancien cache pour compatibilité avec les anciens hooks
      invalidateRelatedCaches('commercials')
      // Rafraîchir les données React Query après la mutation
      queryClient.invalidateQueries({ queryKey: ['commercials'] })
    },
  })
}
