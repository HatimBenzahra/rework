/**
 * @fileoverview Central type definitions for all entities
 * Synchronized with backend GraphQL schema
 */

/**
 * @typedef {Object} BaseEntity
 * @property {number} id
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {BaseEntity & Object} Directeur
 * @property {string} nom
 * @property {string} prenom
 * @property {string} email
 * @property {string} numTelephone
 * @property {string} adresse
 */

/**
 * @typedef {BaseEntity & Object} Manager
 * @property {string} nom
 * @property {string} prenom
 * @property {number|null} directeurId
 */

/**
 * @typedef {BaseEntity & Object} Commercial
 * @property {string} nom
 * @property {string} prenom
 * @property {string} email
 * @property {string} numTel
 * @property {number} age
 * @property {number|null} managerId
 * @property {number|null} directeurId
 * @property {Immeuble[]} immeubles
 * @property {Zone[]} zones
 * @property {Statistic[]} statistics
 */

/**
 * @typedef {BaseEntity & Object} Zone
 * @property {string} nom
 * @property {number} rayon
 * @property {number} xOrigin
 * @property {number} yOrigin
 */

/**
 * @typedef {BaseEntity & Object} Immeuble
 * @property {string} adresse
 * @property {number} nbEtages
 * @property {number} nbPortesParEtage
 * @property {number} commercialId
 */

/**
 * @typedef {BaseEntity & Object} Statistic
 * @property {number} commercialId
 * @property {number} portesVisitees
 * @property {number} contratsSignes
 */

// Create Input Types
/**
 * @typedef {Object} CreateDirecteurInput
 * @property {string} nom
 * @property {string} prenom
 * @property {string} email
 * @property {string} numTelephone
 * @property {string} adresse
 */

/**
 * @typedef {Object} CreateManagerInput
 * @property {string} nom
 * @property {string} prenom
 * @property {number} [directeurId]
 */

/**
 * @typedef {Object} CreateCommercialInput
 * @property {string} nom
 * @property {string} prenom
 * @property {string} email
 * @property {string} numTel
 * @property {number} age
 * @property {number} [managerId]
 * @property {number} [directeurId]
 */

/**
 * @typedef {Object} CreateZoneInput
 * @property {string} nom
 * @property {number} rayon
 * @property {number} xOrigin
 * @property {number} yOrigin
 */

/**
 * @typedef {Object} CreateImmeubleInput
 * @property {string} adresse
 * @property {number} nbEtages
 * @property {number} nbPortesParEtage
 * @property {number} commercialId
 */

/**
 * @typedef {Object} CreateStatisticInput
 * @property {number} commercialId
 * @property {number} portesVisitees
 * @property {number} contratsSignes
 */

// Update Input Types
/**
 * @typedef {Object} UpdateDirecteurInput
 * @property {number} id
 * @property {string} [nom]
 * @property {string} [prenom]
 * @property {string} [email]
 * @property {string} [numTelephone]
 * @property {string} [adresse]
 */

/**
 * @typedef {Object} UpdateManagerInput
 * @property {number} id
 * @property {string} [nom]
 * @property {string} [prenom]
 * @property {number} [directeurId]
 */

/**
 * @typedef {Object} UpdateCommercialInput
 * @property {number} id
 * @property {string} [nom]
 * @property {string} [prenom]
 * @property {string} [email]
 * @property {string} [numTel]
 * @property {number} [age]
 * @property {number} [managerId]
 * @property {number} [directeurId]
 */

/**
 * @typedef {Object} UpdateZoneInput
 * @property {number} id
 * @property {string} [nom]
 * @property {number} [rayon]
 * @property {number} [xOrigin]
 * @property {number} [yOrigin]
 */

/**
 * @typedef {Object} UpdateImmeubleInput
 * @property {number} id
 * @property {string} [adresse]
 * @property {number} [nbEtages]
 * @property {number} [nbPortesParEtage]
 */

/**
 * @typedef {Object} UpdateStatisticInput
 * @property {number} id
 * @property {number} [portesVisitees]
 * @property {number} [contratsSignes]
 */

export {}
