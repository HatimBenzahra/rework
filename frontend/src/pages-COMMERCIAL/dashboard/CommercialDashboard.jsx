import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Target, CheckCircle2, Clock, Phone, Building2 } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'

/**
 * Dashboard commercial - Page des statistiques
 * Utilise le contexte du layout parent (CommercialLayout)
 */
export default function CommercialDashboard() {
  // Récupérer les données du contexte du layout
  const { myStats } = useOutletContext()

  // Hook pour le thème commercial - centralise TOUS les styles
  const { colors, base, components, getButtonClasses } = useCommercialTheme()

  const StatCard = ({ title, value, icon, trend }) => {
    const Icon = icon
    return (
      <Card className={`flex-1 min-w-0 ${base.bg.card} ${base.border.card}`}>
        <CardContent className="p-2 sm:p-2.5 md:p-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-[10px] sm:text-xs ${base.text.muted} truncate`}>{title}</p>
              <div className="p-1 sm:p-1.5 rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0">
                <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ${base.icon.default}`} />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className={`text-base sm:text-lg md:text-xl font-bold ${base.text.primary}`}>
                {value}
              </p>
              {trend && (
                <div
                  className={`flex items-center text-[10px] sm:text-xs ${trend > 0 ? colors.success.text : colors.danger.text}`}
                >
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  {trend > 0 ? '+' : ''}
                  {trend}%
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-w-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <StatCard
          title="Contrats signés"
          value={myStats.contratsSignes}
          icon={CheckCircle2}
          trend={15}
        />
        <StatCard
          title="Immeubles visités"
          value={myStats.immeublesVisites}
          icon={Building2}
          trend={8}
        />
        <StatCard title="Rendez-vous pris" value={myStats.rendezVousPris} icon={Clock} trend={-3} />
        <StatCard
          title="Taux de refus"
          value={`${Math.round((myStats.refus / Math.max(myStats.immeublesVisites, 1)) * 100)}%`}
          icon={Target}
        />
      </div>

      {/* Performance mensuelle */}
      <Card className={`${base.bg.card} ${base.border.card}`}>
        <CardHeader className="p-2.5 sm:p-3 md:p-4">
          <CardTitle className={`text-sm sm:text-base ${base.text.primary}`}>
            Performance mensuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center gap-2">
              <span className={`text-xs sm:text-sm ${base.text.secondary}`}>Objectif mensuel</span>
              <Badge variant="outline" className={`${components.badge.outline} text-xs`}>
                25 contrats
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${colors.primary.bg} h-2 rounded-full`}
                style={{
                  width: `${Math.min((myStats.contratsSignes / 25) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <div className={`text-xs ${base.text.muted}`}>
              {myStats.contratsSignes} / 25 contrats
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card className={`${base.bg.card} ${base.border.card}`}>
        <CardHeader className="p-2.5 sm:p-3 md:p-4">
          <CardTitle className={`text-sm sm:text-base ${base.text.primary}`}>
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
          <div className="grid grid-cols-1 gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className={`justify-start ${getButtonClasses('outline')} h-9 text-sm`}
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
              Appeler un prospect
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`justify-start ${getButtonClasses('outline')} h-9 text-sm`}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
              Planifier une visite
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`justify-start ${getButtonClasses('outline')} h-9 text-sm`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
              Programmer un rappel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
