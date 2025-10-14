/**
 * Hook personnalisé pour la gestion des couleurs de l'espace commercial
 * Sépare le système de couleurs de l'interface admin/manager/directeur
 */

export function useCommercialTheme() {
  // Palette de couleurs pour l'espace commercial
  const colors = {
    primary: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-100',
      text: 'bg-blue-600',
      textLight: 'text-blue-600',
      border: 'border-blue-500',
    },
    success: {
      bg: 'bg-green-500',
      bgLight: 'bg-green-100',
      text: 'text-green-600',
      textLight: 'text-green-600',
      border: 'border-green-500',
    },
    warning: {
      bg: 'bg-orange-500',
      bgLight: 'bg-orange-100',
      text: 'text-orange-600',
      textLight: 'text-orange-600',
      border: 'border-orange-500',
    },
    danger: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-100',
      text: 'text-red-600',
      textLight: 'text-red-600',
      border: 'border-red-500',
    },
    neutral: {
      bg: 'bg-gray-500',
      bgLight: 'bg-gray-100',
      text: 'text-gray-600',
      textLight: 'text-gray-600',
      border: 'border-gray-500',
    },
  }

  // Variantes de composants pour l'espace commercial
  const cardVariants = {
    stats: {
      contracts: `${colors.success.bgLight} ${colors.success.textLight}`,
      visits: `${colors.primary.bgLight} ${colors.primary.textLight}`,
      appointments: `${colors.warning.bgLight} ${colors.warning.textLight}`,
      refusals: `${colors.danger.bgLight} ${colors.danger.textLight}`,
    },
  }

  // Navigation bottom bar - couleurs spécifiques tablette
  const navigationTheme = {
    active: {
      bg: 'bg-blue-600',
      text: 'text-white',
      icon: 'text-white',
    },
    inactive: {
      bg: 'hover:bg-gray-100',
      text: 'text-gray-600 hover:text-gray-800',
      icon: 'text-gray-600 hover:text-gray-800',
    },
    badge: {
      active: 'bg-white text-blue-600 border border-blue-200',
      inactive: 'bg-blue-600 text-white border border-blue-700',
    },
  }

  // Fonction helper pour obtenir les classes CSS d'une variante
  const getCardClasses = type => {
    return cardVariants.stats[type] || cardVariants.stats.visits
  }

  // Fonction pour obtenir les classes de navigation
  const getNavClasses = isActive => {
    return isActive ? navigationTheme.active : navigationTheme.inactive
  }

  const getBadgeClasses = isActive => {
    return isActive ? navigationTheme.badge.active : navigationTheme.badge.inactive
  }

  return {
    colors,
    cardVariants,
    navigationTheme,
    getCardClasses,
    getNavClasses,
    getBadgeClasses,
  }
}
