/**
 * @fileoverview Main services export file
 * Central export point for all services and utilities
 */

// =============================================================================
// API Services
// =============================================================================

export { default as api } from './api-service'
export {
  directeurApi,
  managerApi,
  commercialApi,
  zoneApi,
  immeubleApi,
  statisticApi,
} from './api-service'

// =============================================================================
// GraphQL Client
// =============================================================================

export { graphqlClient, gql, GraphQLClient } from './graphql-client'
export { isGraphQLError, handleApiError } from './graphql-client'

// =============================================================================
// GraphQL Error Handling
// =============================================================================

export {
  ErrorType,
  GraphQLClientError,
  isGraphQLClientError,
  getErrorMessage,
  logError,
} from './graphql-errors'

// =============================================================================
// Queries and Mutations
// =============================================================================

export * from './api-queries'
export * from './api-mutations'

// =============================================================================
// React Hooks
// =============================================================================

export * from '../hooks/metier/use-api'
