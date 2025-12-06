/**
 * Fichier centralisé pour la gestion des statuts de porte (Frontend)
 *
 * Ce fichier contient :
 * - L'enum StatutPorte (synchronisé avec le backend)
 * - Les métadonnées UI de chaque statut (labels, couleurs, icônes)
 * - Les helpers pour faciliter l'utilisation des statuts
 *
 * Pour ajouter un nouveau statut :
 * 1. Ajouter la valeur dans StatutPorte
 * 2. Ajouter la configuration dans STATUS_CONFIG
 * 3. Le système UI s'adaptera automatiquement
 *
 * IMPORTANT: Ce fichier doit être synchronisé avec :
 * - backend/src/porte/porte-status.constants.ts (même enum)
 * - backend/prisma/schema.prisma (même enum)
 */

import {
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  RotateCcw,
} from 'lucide-react'

/**
 * Enum des statuts possibles pour une porte
 * DOIT être synchronisé avec le backend
 */
export const StatutPorte = {
  NON_VISITE: 'NON_VISITE',
  CONTRAT_SIGNE: 'CONTRAT_SIGNE',
  REFUS: 'REFUS',
  RENDEZ_VOUS_PRIS: 'RENDEZ_VOUS_PRIS',
  CURIEUX: 'CURIEUX',
  NECESSITE_REPASSAGE: 'NECESSITE_REPASSAGE',
}

/**
 * Type de configuration UI pour un statut
 * @typedef {Object} StatusUIConfig
 * @property {string} value - La valeur du statut
 * @property {string} label - Le label en français pour l'UI
 * @property {string} description - Description du statut
 * @property {string} themeColor - Nom de la couleur du thème (primary, success, danger, etc.)
 * @property {import('lucide-react').LucideIcon} icon - L'icône Lucide React
 * @property {boolean} requiresRdvDateTime - Si ce statut nécessite une date/heure de RDV
 */

/**
 * Configuration UI centralisée de tous les statuts
 *
 * Cette configuration définit l'apparence et le comportement de chaque statut dans l'UI
 */
export const STATUS_CONFIG = {
  [StatutPorte.NON_VISITE]: {
    value: StatutPorte.NON_VISITE,
    label: 'Non visité',
    description: 'Porte non visitée - statut par défaut',
    themeColor: 'neutral',
    icon: Eye,
    requiresRdvDateTime: false,
  },

  [StatutPorte.CONTRAT_SIGNE]: {
    value: StatutPorte.CONTRAT_SIGNE,
    label: 'Contrat signé',
    description: 'Contrat signé - succès commercial',
    themeColor: 'success',
    icon: CheckCircle2,
    requiresRdvDateTime: false,
  },

  [StatutPorte.REFUS]: {
    value: StatutPorte.REFUS,
    label: 'Refus',
    description: 'Refus du prospect',
    themeColor: 'danger',
    icon: XCircle,
    requiresRdvDateTime: false,
  },

  [StatutPorte.RENDEZ_VOUS_PRIS]: {
    value: StatutPorte.RENDEZ_VOUS_PRIS,
    label: 'RDV pris',
    description: 'Rendez-vous planifié avec le prospect',
    themeColor: 'primary',
    icon: Calendar,
    requiresRdvDateTime: true,
  },

  [StatutPorte.CURIEUX]: {
    value: StatutPorte.CURIEUX,
    label: 'Curieux',
    description: 'Prospect intéressé mais sans engagement',
    themeColor: 'info',
    icon: MessageSquare,
    requiresRdvDateTime: false,
  },

  [StatutPorte.NECESSITE_REPASSAGE]: {
    value: StatutPorte.NECESSITE_REPASSAGE,
    label: 'Nécessite repassage',
    description: 'Nécessite un repassage ultérieur',
    themeColor: 'warning',
    icon: RotateCcw,
    requiresRdvDateTime: false,
  },
}

/**
 * Helper: Obtenir la configuration d'un statut
 * @param {string} status - Le statut
 * @returns {StatusUIConfig}
 */
export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG[StatutPorte.NON_VISITE]
}

/**
 * Helper: Liste de tous les statuts disponibles
 * @returns {string[]}
 */
export function getAllStatuses() {
  return Object.values(StatutPorte)
}

/**
 * Helper: Obtenir le label d'un statut
 * @param {string} status - Le statut
 * @returns {string}
 */
export function getStatusLabel(status) {
  return getStatusConfig(status).label
}

/**
 * Helper: Obtenir l'icône d'un statut
 * @param {string} status - Le statut
 * @returns {import('lucide-react').LucideIcon}
 */
export function getStatusIcon(status) {
  return getStatusConfig(status).icon
}

/**
 * Helper: Obtenir la couleur du thème pour un statut
 * @param {string} status - Le statut
 * @returns {string}
 */
export function getStatusThemeColor(status) {
  return getStatusConfig(status).themeColor
}

/**
 * Helper: Vérifier si un statut nécessite une date/heure de RDV
 * @param {string} status - Le statut
 * @returns {boolean}
 */
export function requiresRdvDateTime(status) {
  return getStatusConfig(status).requiresRdvDateTime
}

/**
 * Helper: Obtenir les classes CSS de couleur pour un statut
 * Utilisé pour générer les classes Tailwind avec les couleurs du thème
 *
 * @param {string} status - Le statut
 * @param {Object} themeColors - Les couleurs du thème (de useCommercialTheme)
 * @returns {string} Les classes CSS
 */
export function getStatusColorClasses(status, themeColors) {
  const config = getStatusConfig(status)
  const colorKey = config.themeColor

  // Gérer le cas spécial de primary qui utilise textLight
  if (colorKey === 'primary') {
    return `${themeColors[colorKey].bgLight} ${themeColors[colorKey].textLight}`
  }

  return `${themeColors[colorKey].bgLight} ${themeColors[colorKey].text}`
}

/**
 * Helper: Générer les options de statut pour les composants de formulaire
 * Utilisé par les selects, dropdowns, etc.
 *
 * @param {Object} themeColors - Les couleurs du thème (de useCommercialTheme)
 * @param {string[]} [excludeStatuses] - Statuts à exclure (optionnel)
 * @returns {Array<{value: string, label: string, color: string, icon: import('lucide-react').LucideIcon}>}
 */
export function getStatusOptions(themeColors, excludeStatuses = []) {
  return getAllStatuses()
    .filter((status) => !excludeStatuses.includes(status))
    .map((status) => {
      const config = getStatusConfig(status)
      return {
        value: config.value,
        label: config.label,
        color: getStatusColorClasses(status, themeColors),
        icon: config.icon,
      }
    })
}

/**
 * Helper: Obtenir le badge HTML pour un statut
 * Utilisé dans les tableaux et cartes
 *
 * @param {string} status - Le statut
 * @param {Object} themeColors - Les couleurs du thème
 * @returns {{label: string, colorClasses: string, Icon: import('lucide-react').LucideIcon}}
 */
export function getStatusBadgeData(status, themeColors) {
  const config = getStatusConfig(status)
  return {
    label: config.label,
    colorClasses: getStatusColorClasses(status, themeColors),
    Icon: config.icon,
  }
}
