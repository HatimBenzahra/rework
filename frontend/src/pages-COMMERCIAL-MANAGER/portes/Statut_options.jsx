import { useCommercialTheme } from '@/hooks/ui/use-commercial-theme'
import { getStatusOptions } from '@/constants/porte-status.constants'

/**
 * Hook pour obtenir les options de statut avec les couleurs du thème
 * Utilise maintenant le système centralisé de gestion des statuts
 */
export function STATUT_OPTIONS() {
  const { colors } = useCommercialTheme()
  return getStatusOptions(colors)
}
