/**
 * @fileoverview GraphQL client configuration and utilities
 * Handles all communication with the backend GraphQL API
 */

import type { GraphQLResponse } from '../types/api'
import { ApiException } from '../types/api'
import {
  ErrorType,
  GraphQLClientError,
  errorHandler,
  isGraphQLClientError,
  getErrorMessage,
  logError,
} from './graphql-errors'

// Re-export error utilities for convenience
export { ErrorType, GraphQLClientError, isGraphQLClientError, getErrorMessage, logError }

// =============================================================================
// Configuration
// =============================================================================

const GRAPHQL_ENDPOINT = import.meta.env.VITE_API_URL + '/graphql'

export const config = {
  endpoint: GRAPHQL_ENDPOINT,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
} as const

// =============================================================================
// Retry Configuration
// =============================================================================

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number, error: GraphQLClientError) => void
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000, // 1 seconde
}

/**
 * Fonction utilitaire pour attendre un délai
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// =============================================================================
// GraphQL Client Class
// =============================================================================

export class GraphQLClient {
  private endpoint: string
  private defaultHeaders: Record<string, string>
  private retryOptions: RetryOptions

  constructor(
    endpoint: string = config.endpoint,
    headers: Record<string, string> = {},
    retryOptions: RetryOptions = {}
  ) {
    this.endpoint = endpoint
    this.defaultHeaders = { ...config.defaultHeaders, ...headers }
    this.retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions }
  }

  /**
   * Execute a GraphQL query or mutation with centralized error handling
   */
  async request<TData = any, TVariables = Record<string, any>>(
    query: string,
    variables?: TVariables,
    headers?: Record<string, string>
  ): Promise<TData> {
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    try {
      // Attempt fetch request
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          query,
          variables,
        }),
      })

      // Handle HTTP errors
      if (!response.ok) {
        throw errorHandler.handleHttpError(response.status, response.statusText)
      }

      // Parse JSON response
      const result: GraphQLResponse<TData> = await response.json()

      // Handle GraphQL errors
      if (result.errors && result.errors.length > 0) {
        throw errorHandler.handleGraphQLErrors(result.errors)
      }

      // Validate data presence
      if (!result.data) {
        throw new GraphQLClientError('Aucune donnée retournée par le serveur', ErrorType.SERVER)
      }

      return result.data
    } catch (error) {
      // Centralized error processing
      if (error instanceof GraphQLClientError) {
        throw error
      }

      // Handle network/fetch errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw errorHandler.handleNetworkError(error)
      }

      // Handle all other errors
      throw errorHandler.process(error)
    }
  }

  /**
   * Execute a GraphQL request with automatic retry for retryable errors
   */
  async requestWithRetry<TData = any, TVariables = Record<string, any>>(
    query: string,
    variables?: TVariables,
    headers?: Record<string, string>,
    customRetryOptions?: RetryOptions
  ): Promise<TData> {
    const retryOptions = { ...this.retryOptions, ...customRetryOptions }
    const maxRetries = retryOptions.maxRetries || 3
    let lastError: GraphQLClientError | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<TData, TVariables>(query, variables, headers)
      } catch (error) {
        // Vérifier si l'erreur est retryable
        if (error instanceof GraphQLClientError && error.isRetryable()) {
          lastError = error

          // Si c'est pas la dernière tentative, attendre et réessayer
          if (attempt < maxRetries) {
            const delayMs = (retryOptions.retryDelay || 1000) * Math.pow(2, attempt) // Exponential backoff

            // Callback optionnel pour informer de la tentative
            if (retryOptions.onRetry) {
              retryOptions.onRetry(attempt + 1, error)
            }

            await delay(delayMs)
            continue
          }
        }

        // Si l'erreur n'est pas retryable ou dernière tentative, throw
        throw error
      }
    }

    // Si on arrive ici, c'est que toutes les tentatives ont échoué
    throw lastError || new GraphQLClientError('Échec après plusieurs tentatives', ErrorType.UNKNOWN)
  }

  /**
   * Set default headers for all requests
   */
  setHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers }
  }

  /**
   * Add authorization header
   */
  setAuthToken(token: string): void {
    this.setHeaders({ Authorization: `Bearer ${token}` })
  }

  /**
   * Remove authorization header
   */
  clearAuthToken(): void {
    const { Authorization, ...headers } = this.defaultHeaders
    this.defaultHeaders = headers
  }
}

// =============================================================================
// Default Client Instance
// =============================================================================

export const graphqlClient = new GraphQLClient()

// =============================================================================
// Helper Function for Requests
// =============================================================================

/**
 * Convenience function for making GraphQL requests
 */
export async function gql<TData = any, TVariables = Record<string, any>>(
  query: string,
  variables?: TVariables
): Promise<TData> {
  return graphqlClient.request<TData, TVariables>(query, variables)
}

// =============================================================================
// Error Handling Utilities (Legacy Support)
// =============================================================================

/**
 * Legacy type guard for backward compatibility
 */
export function isGraphQLError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    (error.message.includes('GraphQL') || error instanceof GraphQLClientError)
  )
}

/**
 * Convert any error to ApiException (legacy support)
 */
export function handleApiError(error: unknown): ApiException {
  if (error instanceof GraphQLClientError) {
    return new ApiException(
      error.getUserMessage(),
      error.statusCode,
      error.graphQLErrors?.map(e => ({
        message: e.message,
        statusCode: error.statusCode,
      }))
    )
  }

  if (error instanceof Error) {
    return new ApiException(error.message)
  }

  return new ApiException('Erreur API inconnue')
}
