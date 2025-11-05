import React, { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, CheckCircle2, Building2, Award, Trophy, Target, Clock } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useCommercialTheme } from '@/hooks/ui/use-commercial-theme'
import { calculateRank, RANKS } from '@/share/ranks'

export default function CommercialDashboard() {
  // Récupérer les données du contexte du layout
  const context = useOutletContext()
  const myStats = useMemo(
    () =>
      context?.myStats || {
        contratsSignes: 0,
        immeublesVisites: 0,
        rendezVousPris: 0,
        refus: 0,
      },
    [context?.myStats]
  )

  // Hook pour le thème commercial - centralise TOUS les styles
  const { colors, base } = useCommercialTheme()

  // Calculer le rang et les points avec le système unifié
  const { rank: currentRank, points: totalPoints } = useMemo(() => {
    return calculateRank(myStats.contratsSignes, myStats.rendezVousPris, myStats.immeublesVisites)
  }, [myStats.contratsSignes, myStats.rendezVousPris, myStats.immeublesVisites])

  // Calculer la progression vers le prochain rang
  const rankProgress = useMemo(() => {
    const currentRankIndex = RANKS.indexOf(currentRank)
    const nextRank = RANKS[currentRankIndex + 1]

    if (!nextRank) {
      return { percentage: 100, pointsNeeded: 0, nextRank: null }
    }

    const pointsInCurrentRank = totalPoints - currentRank.minPoints
    const pointsNeededForNextRank = nextRank.minPoints - currentRank.minPoints
    const percentage = Math.min((pointsInCurrentRank / pointsNeededForNextRank) * 100, 100)
    const pointsNeeded = nextRank.minPoints - totalPoints

    return { percentage, pointsNeeded, nextRank }
  }, [totalPoints, currentRank])

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
    <div className="flex flex-col space-y-3 sm:space-y-4 max-w-full h-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-shrink-0">
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

      {/* Rang et progression */}
      <Card className={`${base.bg.card} ${base.border.card} h-fit`}>
        <CardHeader className="px-2.5 sm:px-3 md:px-4 py-0 space-y-0 mb-0">
          <CardTitle
            className={`text-sm sm:text-base ${base.text.primary} flex items-center gap-1 leading-none`}
          >
            <Trophy className="w-4 h-4 " />
            Rang
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2.5 sm:px-3 md:px-4 pt-0 pb-0 -mt-1">
          <div className="space-y-3 sm:space-y-4">
            {/* Rang actuel */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${currentRank.bgColor}`}>
                  <Award className="w-5 h-5 text-white" />
                </div>
                <span className={`text-base sm:text-lg font-bold ${base.text.primary}`}>
                  Rang {currentRank.name}
                </span>
              </div>
              <Badge
                className={`${currentRank.bgColor} ${currentRank.textColor} ${currentRank.borderColor} border text-xs font-semibold px-2 py-1`}
              >
                {totalPoints} pts
              </Badge>
            </div>

            {/* Progression vers le prochain rang */}
            {rankProgress.nextRank && (
              <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <span className={`text-xs sm:text-sm ${base.text.secondary}`}>
                    Prochain rang : {rankProgress.nextRank.name}
                  </span>
                  <span className={`text-xs ${base.text.muted}`}>
                    {rankProgress.pointsNeeded} pts restants
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${currentRank.bgColor}`}
                    style={{
                      width: `${rankProgress.percentage}%`,
                    }}
                  ></div>
                </div>
                <div className={`text-[10px] sm:text-xs ${base.text.muted}`}>
                  {Math.round(rankProgress.percentage)}% complété
                </div>
              </div>
            )}

            {/* Message si rang max atteint */}
            {!rankProgress.nextRank && (
              <div
                className={`text-xs sm:text-sm ${colors.success.text} bg-green-50 p-2 rounded-lg flex items-center gap-2`}
              >
                <Trophy className="w-4 h-4" />
                <span>Rang maximum atteint !</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
