import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'

export default function PorteCardOriginal({
  porte,
  statutOptions,
  onQuickStatusChange,
  onEdit,
  onRepassageChange,
  readOnly = false,
}) {
  const { colors, base, getButtonClasses } = useCommercialTheme()

  const getStatutInfo = statut => {
    return statutOptions.find(option => option.value === statut) || statutOptions[0]
  }

  const statutInfo = getStatutInfo(porte.statut)
  const IconComponent = statutInfo.icon

  const needsRepassage = porte.statut === 'CURIEUX' || porte.statut === 'NECESSITE_REPASSAGE'

  if (readOnly) {
    // Version simple pour le mode lecture
    return (
      <Card
        className={`${base.bg.card} border-2 ${
          porte.statut === 'NON_VISITE'
            ? base.border.default
            : `${statutInfo.color.split(' ')[0].replace('bg-', 'border-')}`
        } shadow-md hover:shadow-xl transition-all duration-200`}
      >
        <CardContent className="p-3 sm:p-3.5 md:p-4">
          <div className="space-y-3">
            {/* En-tête avec numéro de porte */}
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-bold text-lg sm:text-xl ${base.text.primary}`}>
                  {porte.nomPersonnalise || `Porte ${porte.numero}`}
                </p>
                {porte.nomPersonnalise && (
                  <p className={`text-xs sm:text-sm ${base.text.muted}`}>N° {porte.numero}</p>
                )}
              </div>
              <Badge
                className={`${statutInfo.color} text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1`}
              >
                <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                <span className="hidden sm:inline">{statutInfo.label}</span>
              </Badge>
            </div>

            {/* RDV info */}
            {porte.rdvDate && (
              <div
                className={`${colors.primary.bgLight} border ${colors.primary.border} rounded-lg p-2 sm:p-2.5`}
              >
                <div
                  className={`flex items-center gap-1.5 sm:gap-2 ${colors.primary.textLight} font-semibold text-xs sm:text-sm`}
                >
                  <Calendar className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  <span>{new Date(porte.rdvDate).toLocaleDateString('fr-FR')}</span>
                  {porte.rdvTime && <span>à {porte.rdvTime}</span>}
                </div>
              </div>
            )}

            {/* Commentaire */}
            {porte.commentaire && (
              <div
                className={`${base.bg.muted} border ${base.border.default} rounded-lg p-2 sm:p-2.5`}
              >
                <p className={`text-xs sm:text-sm ${base.text.secondary}`}>{porte.commentaire}</p>
              </div>
            )}

            {/* Repassages en mode lecture */}
            {porte.nbRepassages > 0 && (
              <div
                className={`${colors.warning.bgLight} border ${colors.warning.border} rounded-lg p-2 sm:p-2.5`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <RotateCcw className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${colors.warning.text}`} />
                  <span className={`font-bold text-xs sm:text-sm ${colors.warning.text}`}>
                    Repassages : {porte.nbRepassages}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Version complète pour le mode gestion
  return (
    <Card
      className={`${base.bg.card} border-2 ${
        porte.statut === 'NON_VISITE'
          ? base.border.default
          : `${statutInfo.color.split(' ')[0].replace('bg-', 'border-')}`
      } shadow-md hover:shadow-xl transition-all duration-200`}
    >
      <CardContent className="p-3 sm:p-3.5 md:p-4">
        <div className="space-y-3">
          {/* En-tête avec numéro de porte */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-bold text-lg sm:text-xl ${base.text.primary}`}>
                {porte.nomPersonnalise || `Porte ${porte.numero}`}
              </p>
              {porte.nomPersonnalise && (
                <p className={`text-xs sm:text-sm ${base.text.muted}`}>N° {porte.numero}</p>
              )}
            </div>
            <Badge
              className={`${statutInfo.color} text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1`}
            >
              <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span className="hidden sm:inline">{statutInfo.label}</span>
            </Badge>
          </div>

          {/* BOUTONS D'ACTION RAPIDE - GROS ET VISIBLES */}
          <div className="space-y-1.5 sm:space-y-2">
            <p className={`text-[10px] sm:text-xs font-semibold ${base.text.muted} uppercase`}>
              Action rapide :
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {/* Contrat signé */}
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onQuickStatusChange(porte, 'CONTRAT_SIGNE')}
                className={`h-14 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-1.5 ${
                  porte.statut === 'CONTRAT_SIGNE'
                    ? `${colors.success.bg} ${colors.success.text} border-2 ${colors.success.border} shadow-lg`
                    : `${base.bg.muted} ${base.text.primary} hover:${colors.success.bgLight} border ${base.border.default}`
                } font-bold transition-all duration-200`}
              >
                <CheckCircle2 className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                <span className="text-[10px] sm:text-xs">Contrat</span>
              </Button>

              {/* RDV */}
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onQuickStatusChange(porte, 'RENDEZ_VOUS_PRIS')}
                className={`h-14 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-1.5 ${
                  porte.statut === 'RENDEZ_VOUS_PRIS'
                    ? `${colors.primary.bg} ${colors.primary.text} border-2 ${colors.primary.border} shadow-lg`
                    : `${base.bg.muted} ${base.text.primary} hover:${colors.primary.bgLight} border ${base.border.default}`
                } font-bold transition-all duration-200`}
              >
                <Calendar className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                <span className="text-[10px] sm:text-xs">RDV</span>
              </Button>

              {/* Refus */}
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onQuickStatusChange(porte, 'REFUS')}
                className={`h-14 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-1.5 ${
                  porte.statut === 'REFUS'
                    ? `${colors.danger.bg} ${colors.danger.text} border-2 ${colors.danger.border} shadow-lg`
                    : `${base.bg.muted} ${base.text.primary} hover:${colors.danger.bgLight} border ${base.border.default}`
                } font-bold transition-all duration-200`}
              >
                <XCircle className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                <span className="text-[10px] sm:text-xs">Refus</span>
              </Button>

              {/* Curieux */}
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onQuickStatusChange(porte, 'CURIEUX')}
                className={`h-14 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-1.5 ${
                  porte.statut === 'CURIEUX'
                    ? `${colors.info.bg} ${colors.info.text} border-2 ${colors.info.border} shadow-lg`
                    : `${base.bg.muted} ${base.text.primary} hover:${colors.info.bgLight} border ${base.border.default}`
                } font-bold transition-all duration-200`}
              >
                <MessageSquare className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                <span className="text-[10px] sm:text-xs">Curieux</span>
              </Button>
            </div>
          </div>

          {/* GESTION DES REPASSAGES avec +/- */}
          {needsRepassage && (
            <div
              className={`${colors.warning.bgLight} border ${colors.warning.border} rounded-lg p-2 sm:p-2.5`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <RotateCcw className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${colors.warning.text}`} />
                  <span className={`font-bold text-xs sm:text-sm ${colors.warning.text}`}>
                    Repassages : {porte.nbRepassages}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRepassageChange(porte, -1)}
                    disabled={porte.nbRepassages === 0}
                    className={`h-8 w-8 sm:h-9 sm:w-9 p-0 ${colors.danger.bgLight} ${colors.danger.text} hover:${colors.danger.bg} border ${colors.danger.border}`}
                  >
                    <Minus className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRepassageChange(porte, 1)}
                    className={`h-8 w-8 sm:h-9 sm:w-9 p-0 ${colors.success.bgLight} ${colors.success.text} hover:${colors.success.bg} border ${colors.success.border}`}
                  >
                    <Plus className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* RDV info */}
          {porte.rdvDate && (
            <div
              className={`${colors.primary.bgLight} border ${colors.primary.border} rounded-lg p-2 sm:p-2.5`}
            >
              <div
                className={`flex items-center gap-1.5 sm:gap-2 ${colors.primary.textLight} font-semibold text-xs sm:text-sm`}
              >
                <Calendar className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                <span>{new Date(porte.rdvDate).toLocaleDateString('fr-FR')}</span>
                {porte.rdvTime && <span>à {porte.rdvTime}</span>}
              </div>
            </div>
          )}

          {/* Commentaire */}
          {porte.commentaire && (
            <div
              className={`${base.bg.muted} border ${base.border.default} rounded-lg p-2 sm:p-2.5`}
            >
              <p className={`text-xs sm:text-sm ${base.text.secondary}`}>{porte.commentaire}</p>
            </div>
          )}

          {/* Bouton pour ajouter/modifier détails */}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => onEdit(porte)}
            className={`w-full h-10 sm:h-11 ${getButtonClasses('outline')} text-sm sm:text-base font-semibold`}
          >
            <MessageSquare className="h-4 w-4 sm:h-4.5 sm:w-4.5 mr-2" />
            {porte.commentaire || porte.nomPersonnalise
              ? 'Modifier les détails'
              : 'Ajouter des détails'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}