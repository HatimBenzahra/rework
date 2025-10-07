/**
 * Thèmes prédéfinis prêts à utiliser
 * 
 * Pour utiliser un thème, copiez les valeurs de `light` et `dark`
 * et collez-les dans le fichier theme.js
 */

// Rayon par défaut des bordures
const DEFAULT_RADIUS = '0.625rem'

export const themePresets = {
  // Thème par défaut (noir et blanc)
  default: {
    light: {
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.145 0 0)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.145 0 0)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.145 0 0)',
      primary: 'oklch(0.205 0 0)',
      primaryForeground: 'oklch(0.985 0 0)',
      secondary: 'oklch(0.97 0 0)',
      secondaryForeground: 'oklch(0.205 0 0)',
      muted: 'oklch(0.97 0 0)',
      mutedForeground: 'oklch(0.556 0 0)',
      accent: 'oklch(0.97 0 0)',
      accentForeground: 'oklch(0.205 0 0)',
      destructive: 'oklch(0.577 0.245 27.325)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.922 0 0)',
      input: 'oklch(0.922 0 0)',
      ring: 'oklch(0.708 0 0)',
      'chart-1': 'oklch(0.646 0.222 41.116)',
      'chart-2': 'oklch(0.6 0.118 184.704)',
      'chart-3': 'oklch(0.398 0.07 227.392)',
      'chart-4': 'oklch(0.828 0.189 84.429)',
      'chart-5': 'oklch(0.769 0.188 70.08)',
      sidebar: 'oklch(0.985 0 0)',
      sidebarForeground: 'oklch(0.145 0 0)',
      sidebarPrimary: 'oklch(0.205 0 0)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
      sidebarAccent: 'oklch(0.97 0 0)',
      sidebarAccentForeground: 'oklch(0.205 0 0)',
      sidebarBorder: 'oklch(0.922 0 0)',
      sidebarRing: 'oklch(0.708 0 0)',
    },
    dark: {
      background: 'oklch(0.145 0 0)',
      foreground: 'oklch(0.985 0 0)',
      card: 'oklch(0.205 0 0)',
      cardForeground: 'oklch(0.985 0 0)',
      popover: 'oklch(0.205 0 0)',
      popoverForeground: 'oklch(0.985 0 0)',
      primary: 'oklch(0.922 0 0)',
      primaryForeground: 'oklch(0.205 0 0)',
      secondary: 'oklch(0.269 0 0)',
      secondaryForeground: 'oklch(0.985 0 0)',
      muted: 'oklch(0.269 0 0)',
      mutedForeground: 'oklch(0.708 0 0)',
      accent: 'oklch(0.269 0 0)',
      accentForeground: 'oklch(0.985 0 0)',
      destructive: 'oklch(0.704 0.191 22.216)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(1 0 0 / 10%)',
      input: 'oklch(1 0 0 / 15%)',
      ring: 'oklch(0.556 0 0)',
      'chart-1': 'oklch(0.488 0.243 264.376)',
      'chart-2': 'oklch(0.696 0.17 162.48)',
      'chart-3': 'oklch(0.769 0.188 70.08)',
      'chart-4': 'oklch(0.627 0.265 303.9)',
      'chart-5': 'oklch(0.645 0.246 16.439)',
      sidebar: 'oklch(0.205 0 0)',
      sidebarForeground: 'oklch(0.985 0 0)',
      sidebarPrimary: 'oklch(0.922 0 0)',
      sidebarPrimaryForeground: 'oklch(0.205 0 0)',
      sidebarAccent: 'oklch(0.269 0 0)',
      sidebarAccentForeground: 'oklch(0.985 0 0)',
      sidebarBorder: 'oklch(1 0 0 / 10%)',
      sidebarRing: 'oklch(0.556 0 0)',
    }
  },

  // Thème Bleu Océan
  ocean: {
    light: {
      primary: 'oklch(0.5 0.20 250)',           // Bleu océan
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.7 0.15 250)',            // Bleu clair
      accentForeground: 'oklch(0.2 0 0)',
      sidebar: 'oklch(0.985 0 0)',
      sidebarForeground: 'oklch(0.145 0 0)',
      sidebarPrimary: 'oklch(0.5 0.20 250)',
      sidebarPrimaryForeground: 'oklch(1 0 0)',
      sidebarAccent: 'oklch(0.92 0.10 250)',    // Bleu très clair pour hover
      sidebarAccentForeground: 'oklch(0.2 0 0)',
      sidebarBorder: 'oklch(0.90 0.05 250)',
      sidebarRing: 'oklch(0.5 0.20 250)',
    },
    dark: {
      primary: 'oklch(0.6 0.22 250)',
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.35 0.18 250)',
      accentForeground: 'oklch(0.95 0 0)',
      sidebar: 'oklch(0.205 0 0)',
      sidebarForeground: 'oklch(0.985 0 0)',
      sidebarPrimary: 'oklch(0.6 0.22 250)',
      sidebarPrimaryForeground: 'oklch(1 0 0)',
      sidebarAccent: 'oklch(0.30 0.18 250)',    // Bleu foncé pour hover
      sidebarAccentForeground: 'oklch(0.95 0 0)',
      sidebarBorder: 'oklch(0.35 0.12 250)',
      sidebarRing: 'oklch(0.6 0.22 250)',
    }
  },

  // Thème Vert Nature
  nature: {
    light: {
      primary: 'oklch(0.55 0.17 145)',          // Vert nature
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.75 0.12 145)',           // Vert clair
      accentForeground: 'oklch(0.2 0 0)',
      sidebarPrimary: 'oklch(0.55 0.17 145)',
      sidebarAccent: 'oklch(0.75 0.10 145)',
    },
    dark: {
      primary: 'oklch(0.65 0.18 145)',
      primaryForeground: 'oklch(0.15 0 0)',
      accent: 'oklch(0.40 0.15 145)',
      accentForeground: 'oklch(0.95 0 0)',
      sidebarPrimary: 'oklch(0.65 0.18 145)',
      sidebarAccent: 'oklch(0.40 0.15 145)',
    }
  },

  // Thème Violet Royal
  royal: {
    light: {
      primary: 'oklch(0.5 0.25 300)',           // Violet profond
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.7 0.18 300)',            // Violet clair
      accentForeground: 'oklch(0.2 0 0)',
      sidebarPrimary: 'oklch(0.5 0.25 300)',
      sidebarAccent: 'oklch(0.7 0.15 300)',
    },
    dark: {
      primary: 'oklch(0.6 0.26 300)',
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.40 0.20 300)',
      accentForeground: 'oklch(0.95 0 0)',
      sidebarPrimary: 'oklch(0.6 0.26 300)',
      sidebarAccent: 'oklch(0.40 0.20 300)',
    }
  },

  // Thème Orange Énergique
  energy: {
    light: {
      primary: 'oklch(0.65 0.19 50)',           // Orange corail
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.80 0.15 50)',            // Orange clair
      accentForeground: 'oklch(0.2 0 0)',
      sidebarPrimary: 'oklch(0.65 0.19 50)',
      sidebarAccent: 'oklch(0.80 0.12 50)',
    },
    dark: {
      primary: 'oklch(0.70 0.20 50)',
      primaryForeground: 'oklch(0.15 0 0)',
      accent: 'oklch(0.45 0.17 50)',
      accentForeground: 'oklch(0.95 0 0)',
      sidebarPrimary: 'oklch(0.70 0.20 50)',
      sidebarAccent: 'oklch(0.45 0.17 50)',
    }
  },

  // Thème Rose Moderne
  modern: {
    light: {
      primary: 'oklch(0.55 0.22 340)',          // Rose/Magenta
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.75 0.15 340)',           // Rose clair
      accentForeground: 'oklch(0.2 0 0)',
      sidebarPrimary: 'oklch(0.55 0.22 340)',
      sidebarAccent: 'oklch(0.75 0.12 340)',
    },
    dark: {
      primary: 'oklch(0.65 0.23 340)',
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.40 0.18 340)',
      accentForeground: 'oklch(0.95 0 0)',
      sidebarPrimary: 'oklch(0.65 0.23 340)',
      sidebarAccent: 'oklch(0.40 0.18 340)',
    }
  },

  // Thème Cyan Tech
  tech: {
    light: {
      primary: 'oklch(0.55 0.18 210)',          // Cyan
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.75 0.13 210)',           // Cyan clair
      accentForeground: 'oklch(0.2 0 0)',
      sidebarPrimary: 'oklch(0.55 0.18 210)',
      sidebarAccent: 'oklch(0.75 0.10 210)',
    },
    dark: {
      primary: 'oklch(0.65 0.19 210)',
      primaryForeground: 'oklch(0.15 0 0)',
      accent: 'oklch(0.40 0.16 210)',
      accentForeground: 'oklch(0.95 0 0)',
      sidebarPrimary: 'oklch(0.65 0.19 210)',
      sidebarAccent: 'oklch(0.40 0.16 210)',
    }
  },

  // Thème Rouge Passion
  passion: {
    light: {
      primary: 'oklch(0.55 0.24 27)',           // Rouge
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.75 0.17 27)',            // Rouge clair
      accentForeground: 'oklch(0.2 0 0)',
      sidebarPrimary: 'oklch(0.55 0.24 27)',
      sidebarAccent: 'oklch(0.75 0.14 27)',
    },
    dark: {
      primary: 'oklch(0.65 0.22 27)',
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.40 0.19 27)',
      accentForeground: 'oklch(0.95 0 0)',
      sidebarPrimary: 'oklch(0.65 0.22 27)',
      sidebarAccent: 'oklch(0.40 0.19 27)',
    }
  },

  // Thème Indigo Professionnel
  professional: {
    light: {
      primary: 'oklch(0.48 0.18 265)',          // Indigo
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.70 0.13 265)',           // Indigo clair
      accentForeground: 'oklch(0.2 0 0)',
      sidebarPrimary: 'oklch(0.48 0.18 265)',
      sidebarAccent: 'oklch(0.70 0.10 265)',
    },
    dark: {
      primary: 'oklch(0.58 0.19 265)',
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.38 0.16 265)',
      accentForeground: 'oklch(0.95 0 0)',
      sidebarPrimary: 'oklch(0.58 0.19 265)',
      sidebarAccent: 'oklch(0.38 0.16 265)',
    }
  },

  // Thème Jaune Solaire (attention au contraste !)
  solar: {
    light: {
      primary: 'oklch(0.45 0.15 90)',           // Jaune foncé pour le contraste
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.85 0.19 90)',            // Jaune vif
      accentForeground: 'oklch(0.2 0 0)',
      sidebarPrimary: 'oklch(0.45 0.15 90)',
      sidebarAccent: 'oklch(0.85 0.15 90)',
    },
    dark: {
      primary: 'oklch(0.75 0.20 90)',
      primaryForeground: 'oklch(0.15 0 0)',
      accent: 'oklch(0.50 0.17 90)',
      accentForeground: 'oklch(0.95 0 0)',
      sidebarPrimary: 'oklch(0.75 0.20 90)',
      sidebarAccent: 'oklch(0.50 0.17 90)',
    }
  },
}

/**
 * Fusionne les couleurs d'un preset avec celles du thème par défaut
 * Cela permet aux presets incomplets d'hériter des valeurs manquantes
 */
function mergeWithDefault(presetColors, mode) {
  const defaultColors = themePresets.default[mode]
  return { ...defaultColors, ...presetColors }
}

/**
 * Fonction utilitaire pour appliquer un thème prédéfini
 * 
 * Usage:
 * ```js
 * import { applyPreset } from '@/config/theme-presets'
 * 
 * applyPreset('ocean')  // Applique le thème océan
 * ```
 */
export const applyPreset = (presetName, mode = 'light') => {
  const preset = themePresets[presetName]
  
  if (!preset) {
    console.error(`Thème "${presetName}" introuvable. Thèmes disponibles:`, Object.keys(themePresets).join(', '))
    return
  }
  
  const presetColors = preset[mode]
  
  if (!presetColors) {
    console.error(`Mode "${mode}" introuvable pour le thème "${presetName}"`)
    return
  }
  
  // Fusionne avec les couleurs par défaut pour avoir toutes les variables
  const colors = mergeWithDefault(presetColors, mode)
  
  // Applique le rayon des bordures
  document.documentElement.style.setProperty('--radius', DEFAULT_RADIUS)
  
  // Applique les couleurs en mettant à jour les variables CSS principales ET les variables --color-*
  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    
    // Met à jour la variable principale (ex: --primary)
    document.documentElement.style.setProperty(`--${cssVarName}`, value)
    
    // Met à jour aussi la variable Tailwind (ex: --color-primary)
    document.documentElement.style.setProperty(`--color-${cssVarName}`, value)
  })
  
  // 💾 Sauvegarde le preset dans localStorage pour persister après rechargement
  localStorage.setItem('theme-preset', presetName)
  
  console.log(`✅ Thème "${presetName}" (${mode}) appliqué avec succès !`)
}

/**
 * Récupère le preset actuellement sauvegardé
 */
export const getSavedPreset = () => {
  return localStorage.getItem('theme-preset') || 'default'
}

/**
 * Efface le preset sauvegardé (retour au thème par défaut)
 */
export const clearPreset = () => {
  localStorage.removeItem('theme-preset')
}

/**
 * Liste tous les thèmes disponibles
 */
export const getAvailablePresets = () => Object.keys(themePresets)

