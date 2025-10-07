/**
 * @fileoverview GraphQL client configuration and utilities
 * Handles all communication with the backend GraphQL API
 */

import type { GraphQLResponse, ApiException } from '../types/api';

// =============================================================================
// Configuration
// =============================================================================

const GRAPHQL_ENDPOINT = import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql';

export const config = {
  endpoint: GRAPHQL_ENDPOINT,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
} as const;

// =============================================================================
// GraphQL Client Class
// =============================================================================

export class GraphQLClient {
  private endpoint: string;
  private defaultHeaders: Record<string, string>;

  constructor(endpoint: string = config.endpoint, headers: Record<string, string> = {}) {
    this.endpoint = endpoint;
    this.defaultHeaders = { ...config.defaultHeaders, ...headers };
  }

  /**
   * Execute a GraphQL query or mutation
   */
  async request<TData = any, TVariables = Record<string, any>>(
    query: string,
    variables?: TVariables,
    headers?: Record<string, string>
  ): Promise<TData> {
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result: GraphQLResponse<TData> = await response.json();

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0];
        throw new Error(`GraphQL Error: ${error.message}`);
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL query');
      }

      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GraphQL Request Failed: ${error.message}`);
      }
      throw new Error('Unknown error occurred during GraphQL request');
    }
  }

  /**
   * Set default headers for all requests
   */
  setHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Add authorization header
   */
  setAuthToken(token: string): void {
    this.setHeaders({ Authorization: `Bearer ${token}` });
  }

  /**
   * Remove authorization header
   */
  clearAuthToken(): void {
    const { Authorization, ...headers } = this.defaultHeaders;
    this.defaultHeaders = headers;
  }
}

// =============================================================================
// Default Client Instance
// =============================================================================

export const graphqlClient = new GraphQLClient();

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
  return graphqlClient.request<TData, TVariables>(query, variables);
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

export function isGraphQLError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('GraphQL');
}

export function handleApiError(error: unknown): ApiException {
  if (error instanceof Error) {
    return new ApiException(error.message);
  }
  return new ApiException('Unknown API error occurred');
}