import { Eye, CheckCircle2, XCircle, Calendar, MessageSquare, RotateCcw } from 'lucide-react'
import { useCommercialTheme } from '@/hooks/ui/use-commercial-theme'

// Configuration des statuts avec les couleurs du thème
export function STATUT_OPTIONS() {
  const { colors } = useCommercialTheme()
  return [
    {
      value: 'NON_VISITE',
      label: 'Non visité',
      color: `${colors.neutral.bgLight} ${colors.neutral.text}`,
      icon: Eye,
    },
    {
      value: 'CONTRAT_SIGNE',
      label: 'Contrat signé',
      color: `${colors.success.bgLight} ${colors.success.text}`,
      icon: CheckCircle2,
    },
    {
      value: 'REFUS',
      label: 'Refus',
      color: `${colors.danger.bgLight} ${colors.danger.text}`,
      icon: XCircle,
    },
    {
      value: 'RENDEZ_VOUS_PRIS',
      label: 'RDV pris',
      color: `${colors.primary.bgLight} ${colors.primary.textLight}`,
      icon: Calendar,
    },
    {
      value: 'CURIEUX',
      label: 'Curieux',
      color: `${colors.info.bgLight} ${colors.info.text}`,
      icon: MessageSquare,
    },
    {
      value: 'NECESSITE_REPASSAGE',
      label: 'Nécessite repassage',
      color: `${colors.warning.bgLight} ${colors.warning.text}`,
      icon: RotateCcw,
    },
  ]
}
