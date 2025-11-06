/**
 * @fileoverview Authentication service for Keycloak SSO integration
 * Handles login, logout, token management and role extraction
 */

import { graphqlClient } from './graphql-client'

// =============================================================================
// Types
// =============================================================================

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type?: string
  scope?: string
  groups: string[]
  role: string
  userId: number
  email?: string
}

export interface TokenPayload {
  sub: string
  email?: string
  name?: string
  groups: string[]
  exp: number
  iat: number
}

// Mapping des groupes Keycloak vers les rôles de l'application
export const GROUP_TO_ROLE_MAP: Record<string, string> = {
  'Prospection-Admin': 'admin',
  'Prospection-Directeur': 'directeur',
  'Prospection-Manager': 'manager',
  'Prospection-Commercial': 'commercial',
}

// Groupes autorisés
export const ALLOWED_GROUPS = [
  'Prospection-Admin',
  'Prospection-Directeur',
  'Prospection-Manager',
  'Prospection-Commercial',
]

// =============================================================================
// GraphQL Mutations
// =============================================================================

const LOGIN_MUTATION = `
  mutation Login($loginInput: LoginInput!) {
    login(loginInput: $loginInput) {
      access_token
      refresh_token
      expires_in
      token_type
      scope
      groups
      role
      userId
      email
    }
  }
`

// =============================================================================
// Auth Service Class
// =============================================================================

export class AuthService {
  /**
   * Connexion avec Keycloak via GraphQL
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const data = await graphqlClient.request<{ login: AuthResponse }>(LOGIN_MUTATION, {
        loginInput: credentials,
      })

      const authResponse = data.login

      // Vérifier que l'utilisateur a un groupe autorisé
      const hasAuthorizedGroup = authResponse.groups.some(group => ALLOWED_GROUPS.includes(group))

      if (!hasAuthorizedGroup) {
        throw new Error('UNAUTHORIZED_GROUP')
      }

      // Stocker les tokens et le rôle dans le localStorage
      this.storeAuthData(authResponse)

      // Configurer le token dans le client GraphQL pour les futures requêtes
      graphqlClient.setAuthToken(authResponse.access_token)

      return authResponse
    } catch (error: any) {
      // Si c'est une erreur de groupe non autorisé du backend
      if (
        error.message?.includes('UNAUTHORIZED_GROUP') ||
        error.graphQLErrors?.[0]?.message?.includes('UNAUTHORIZED_GROUP')
      ) {
        throw new Error('UNAUTHORIZED_GROUP')
      }

      // Sinon, propager l'erreur
      throw error
    }
  }

  /**
   * Déconnexion : nettoie les données d'authentification
   */
  logout(): void {
    this.clearAuthData()
    graphqlClient.clearAuthToken()
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    if (!token) return false

    // Vérifier si le token est expiré
    try {
      const payload = this.decodeToken(token)
      const now = Date.now() / 1000
      return payload.exp > now
    } catch {
      return false
    }
  }

  /**
   * Récupère le rôle de l'utilisateur
   */
  getUserRole(): string | null {
    return localStorage.getItem('userRole')
  }

  /**
   * Récupère les groupes de l'utilisateur
   */
  getUserGroups(): string[] {
    const groups = localStorage.getItem('userGroups')
    return groups ? JSON.parse(groups) : []
  }

  /**
   * Récupère l'access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  /**
   * Récupère le refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  /**
   * Initialise le client GraphQL avec le token stocké
   */
  initializeAuth(): void {
    const token = this.getAccessToken()
    if (token && this.isAuthenticated()) {
      graphqlClient.setAuthToken(token)
    } else {
      this.clearAuthData()
    }
  }

  /**
   * Stocke les données d'authentification dans le localStorage
   */
  private storeAuthData(authResponse: AuthResponse): void {
    localStorage.setItem('access_token', authResponse.access_token)
    localStorage.setItem('refresh_token', authResponse.refresh_token)
    localStorage.setItem('userRole', authResponse.role)
    localStorage.setItem('userId', authResponse.userId.toString())
    localStorage.setItem('userGroups', JSON.stringify(authResponse.groups))

    // Stocker l'email si disponible
    if (authResponse.email) {
      localStorage.setItem('userEmail', authResponse.email)
    }

    // Stocker l'expiration
    const expiresAt = Date.now() + authResponse.expires_in * 1000
    localStorage.setItem('token_expires_at', expiresAt.toString())
  }

  /**
   * Nettoie les données d'authentification du localStorage
   */
  private clearAuthData(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userGroups')
    localStorage.removeItem('token_expires_at')
  }

  /**
   * Décode un JWT token (sans vérification de signature)
   */
  private decodeToken(token: string): TokenPayload {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      throw new Error('Invalid token format')
    }
  }

  /**
   * Extrait l'ID utilisateur depuis le token
   */
  getUserId(): string | null {
    const token = this.getAccessToken()
    if (!token) return null

    try {
      const payload = this.decodeToken(token)
      return payload.sub || null
    } catch {
      return null
    }
  }

  /**
   * Extrait l'email depuis le token
   */
  getUserEmail(): string | null {
    const token = this.getAccessToken()
    if (!token) return null

    try {
      const payload = this.decodeToken(token)
      return payload.email || null
    } catch {
      return null
    }
  }
}

// =============================================================================
// Default Instance
// =============================================================================

export const authService = new AuthService()

// Initialiser l'authentification au chargement
authService.initializeAuth()
