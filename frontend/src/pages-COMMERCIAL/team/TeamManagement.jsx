import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { Users, Trophy, BarChart3, RefreshCcw, TrendingUp, MapPin, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCommercialTheme } from '@/hooks/ui/use-commercial-theme'
import { calculateRank } from '@/share/ranks'

const INITIAL_STATS = {
  contratsSignes: 0,
  immeublesVisites: 0,
  rendezVousPris: 0,
  refus: 0,
  nbImmeublesProspectes: 0,
  nbPortesProspectes: 0,
}

const formatNumber = value => new Intl.NumberFormat('fr-FR').format(value || 0)

const buildCommercialSnapshot = commercial => {
  const stats = (commercial.statistics || []).reduce(
    (acc, stat) => ({
      contratsSignes: acc.contratsSignes + (stat.contratsSignes || 0),
      immeublesVisites: acc.immeublesVisites + (stat.immeublesVisites || 0),
      rendezVousPris: acc.rendezVousPris + (stat.rendezVousPris || 0),
      refus: acc.refus + (stat.refus || 0),
      nbImmeublesProspectes: acc.nbImmeublesProspectes + (stat.nbImmeublesProspectes || 0),
      nbPortesProspectes: acc.nbPortesProspectes + (stat.nbPortesProspectes || 0),
    }),
    { ...INITIAL_STATS }
  )

  const { rank, points } = calculateRank(
    stats.contratsSignes,
    stats.rendezVousPris,
    stats.immeublesVisites
  )

  return {
    ...commercial,
    stats,
    rank,
    points,
    zoneCount: commercial.zones?.length || 0,
    immeubleCount: commercial.immeubles?.length || 0,
  }
}

export default function TeamManagement() {
  const context = useOutletContext()
  const { colors, base, components } = useCommercialTheme()

  const managerProfile = context?.commercial
  const isManager = context?.isManager
  const refetch = context?.refetch

  const teamSnapshots = React.useMemo(() => {
    if (!managerProfile?.commercials) return []
    return managerProfile.commercials
      .map(buildCommercialSnapshot)
      .sort((a, b) => b.points - a.points)
  }, [managerProfile?.commercials])

  const teamStats = React.useMemo(() => {
    return teamSnapshots.reduce(
      (acc, commercial) => ({
        contratsSignes: acc.contratsSignes + commercial.stats.contratsSignes,
        immeublesVisites: acc.immeublesVisites + commercial.stats.immeublesVisites,
        rendezVousPris: acc.rendezVousPris + commercial.stats.rendezVousPris,
        refus: acc.refus + commercial.stats.refus,
        nbImmeublesProspectes: acc.nbImmeublesProspectes + commercial.stats.nbImmeublesProspectes,
        nbPortesProspectes: acc.nbPortesProspectes + commercial.stats.nbPortesProspectes,
      }),
      { ...INITIAL_STATS }
    )
  }, [teamSnapshots])

  const topPerformer = teamSnapshots[0]

  if (!isManager) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
        Cette page est réservée aux managers.
      </div>
    )
  }

  const handleRefresh = async () => {
    try {
      await refetch?.()
    } catch (error) {
      console.error('TeamManagement.refetch', error)
    }
  }

  const summaryCards = [
    {
      id: 'team-size',
      title: 'Effectif',
      value: formatNumber(teamSnapshots.length),
      subtitle: 'Commerciaux actifs',
      icon: Users,
      tint: `${colors.primary.bgLight} ${colors.primary.border}`,
      iconBg: 'bg-white/70',
      iconColor: colors.primary.textLight,
    },
    {
      id: 'contracts',
      title: 'Contrats signés',
      value: formatNumber(teamStats.contratsSignes),
      subtitle: 'Cumul des signatures',
      icon: Trophy,
      tint: `${colors.success.bgLight} ${colors.success.border}`,
      iconBg: 'bg-white/70',
      iconColor: colors.success.textLight,
    },
    {
      id: 'appointments',
      title: 'Rendez-vous pris',
      value: formatNumber(teamStats.rendezVousPris),
      subtitle: 'Opportunités générées',
      icon: BarChart3,
      tint: `${colors.warning.bgLight} ${colors.warning.border}`,
      iconBg: 'bg-white/70',
      iconColor: colors.warning.textLight,
    },
    {
      id: 'doors',
      title: 'Portes prospectées',
      value: formatNumber(teamStats.nbPortesProspectes),
      subtitle: 'Volume de prospection',
      icon: TrendingUp,
      tint: `${colors.info.bgLight} ${colors.info.border}`,
      iconBg: 'bg-white/70',
      iconColor: colors.info.textLight,
    },
  ]

  return (
    <div className="space-y-8 mb-50x">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-semibold ${base.text.primary}`}>Votre équipe commerciale</h2>
          <p className={`text-sm ${base.text.muted}`}>
            Surveillez les performances, récompensez les meilleurs et identifiez les axes de
            progrès.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Résumé d'équipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {summaryCards.map(card => (
          <div
            key={card.id}
            className={`rounded-xl border ${card.tint} ${components.card.hover} shadow-sm`}
          >
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="space-y-1.5">
                <p className={`text-xs font-semibold uppercase ${base.text.secondary}`}>
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${base.text.primary} leading-none`}>
                  {card.value}
                </p>
                {card.subtitle && <p className={`text-xs ${base.text.muted}`}>{card.subtitle}</p>}
              </div>
              <div className={`p-2.5 rounded-xl border border-white/60 ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top performer */}
      {topPerformer && (
        <div
          className={`${components.card.hover} rounded-2xl border ${base.bg.card} ${base.border.card} shadow-md`}
        >
          <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-full ${base.bg.muted} ${base.border.default} flex items-center justify-center shadow-sm`}
              >
                <Trophy className={`h-6 w-6 ${colors.primary.textLight}`} />
              </div>
              <div>
                <p
                  className={`text-sm ${colors.primary.text} uppercase tracking-wide font-semibold`}
                >
                  Meilleur commercial
                </p>
                <h3 className={`text-lg font-semibold ${base.text.primary}`}>
                  {topPerformer.prenom} {topPerformer.nom}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`uppercase tracking-wider ${colors.primary.border} ${colors.primary.text} ${base.bg.card}`}
              >
                {topPerformer.rank.name}
              </Badge>
              <div className="text-right">
                <p className={`text-sm font-semibold ${base.text.primary}`}>
                  {formatNumber(topPerformer.stats.contratsSignes)} contrats
                </p>
                <p className={`text-xs ${base.text.muted}`}>
                  {formatNumber(topPerformer.stats.rendezVousPris)} rendez-vous
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des commerciaux */}
      <div className="space-y-3">
        {teamSnapshots.map(commercial => (
          <Card key={commercial.id} className={`${base.bg.card} ${base.border.card} shadow-sm`}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-semibold ${base.text.primary}`}>
                      {commercial.prenom} {commercial.nom}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {commercial.rank.name} • {formatNumber(commercial.points)} pts
                    </Badge>
                  </div>
                  <p className={`text-sm ${base.text.muted}`}>
                    {commercial.email} • {commercial.numTel || 'Téléphone non fourni'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className={`flex items-center gap-2 ${base.text.muted}`}>
                    <MapPin className="h-4 w-4" />
                    <span>{commercial.zoneCount} zone(s)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${base.text.muted}`}>
                    <Target className="h-4 w-4" />
                    <span>{commercial.immeubleCount} immeubles</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className={`rounded-lg p-3 shadow-sm ${base.bg.muted} ${base.border.card}`}>
                  <p className={`text-xs ${base.text.muted} uppercase`}>Contrats</p>
                  <p className={`text-lg font-semibold ${base.text.primary}`}>
                    {formatNumber(commercial.stats.contratsSignes)}
                  </p>
                </div>
                <div className={`rounded-lg p-3 shadow-sm ${base.bg.muted} ${base.border.card}`}>
                  <p className={`text-xs ${base.text.muted} uppercase`}>Rendez-vous</p>
                  <p className={`text-lg font-semibold ${base.text.primary}`}>
                    {formatNumber(commercial.stats.rendezVousPris)}
                  </p>
                </div>
                <div className={`rounded-lg p-3 shadow-sm ${base.bg.muted} ${base.border.card}`}>
                  <p className={`text-xs ${base.text.muted} uppercase`}>Immeubles visités</p>
                  <p className={`text-lg font-semibold ${base.text.primary}`}>
                    {formatNumber(commercial.stats.immeublesVisites)}
                  </p>
                </div>
                <div className={`rounded-lg p-3 shadow-sm ${base.bg.muted} ${base.border.card}`}>
                  <p className={`text-xs ${base.text.muted} uppercase`}>Portes</p>
                  <p className={`text-lg font-semibold ${base.text.primary}`}>
                    {formatNumber(commercial.stats.nbPortesProspectes)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {teamSnapshots.length === 0 && (
          <Card className={`${components.card.base} ${components.card.hover} p-6 text-center`}>
            <CardContent className="space-y-2">
              <Users className={`h-10 w-10 mx-auto ${base.icon.muted}`} />
              <h3 className={`text-lg font-semibold ${base.text.primary}`}>
                Aucun commercial assigné
              </h3>
              <p className={`text-sm ${base.text.muted}`}>
                Dès qu'un commercial vous sera rattaché, ses résultats apparaîtront ici.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
