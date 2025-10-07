/**
 * @fileoverview Authentication and authorization types
 * Role-based access control definitions
 */

/**
 * @typedef {'directeur' | 'manager' | 'commercial'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} nom
 * @property {string} prenom
 * @property {string} email
 * @property {UserRole} role
 * @property {number} [managerId] - For commercials
 * @property {number} [directeurId] - For managers and commercials
 */

/**
 * @typedef {Object} AuthState
 * @property {User | null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} loading
 * @property {string | null} error
 */

/**
 * @typedef {Object} RolePermissions
 * @property {boolean} canCreate
 * @property {boolean} canUpdate
 * @property {boolean} canDelete
 * @property {boolean} canViewAll
 * @property {Array<string>} allowedEntities
 */

/**
 * @typedef {Object} DataFilter
 * @property {UserRole} role
 * @property {number} userId
 * @property {number} [managerId]
 * @property {number} [directeurId]
 */

export {}
