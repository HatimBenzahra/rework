import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCard } from '@/components/card'
import CommercialRankingTable from '@/components/CommercialRankingTable'
import ActiveZonesSlider_Dashboard from '@/components/ActiveZonesSlider_Dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  Users,
  Trophy,
  MapPin,
  TrendingUp,
  Calendar,
  ArrowRight,
  Award,
  Target,
  Activity,
} from 'lucide-react'
import {
  useCommercials,
  useManagers,
  useDirecteurs,
  useStatistics,
  useImmeubles,
  useAllCurrentAssignments,
} from '@/hooks/metier/use-api'
import { Skeleton } from '@/components/ui/skeleton'
import { useRole } from '@/contexts/userole'

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUserId, currentRole } = useRole()

  // Chargement des données
  const { data: commercials, loading: loadingCommercials } = useCommercials(
    +currentUserId,
    currentRole
  )
  const { data: managers, loading: loadingManagers } = useManagers(+currentUserId, currentRole)
  const { data: directeurs, loading: loadingDirecteurs } = useDirecteurs(
    +currentUserId,
    currentRole
  )
  const { data: statistics, loading: loadingStats } = useStatistics(+currentUserId, currentRole)
  const { data: immeubles, loading: loadingImmeubles } = useImmeubles(+currentUserId, currentRole)
  const { data: assignments, loading: loadingAssignments } = useAllCurrentAssignments(
    +currentUserId,
    currentRole
  )

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Données journalières
  const todayStats = useMemo(() => {
    if (!statistics) return []
    return statistics.filter(stat => {
      const date = new Date(stat.updatedAt || stat.createdAt)
      date.setHours(0, 0, 0, 0)
      return date.getTime() === today.getTime()
    })
  }, [statistics, today])

  const totals = useMemo(() => {
    return todayStats.reduce(
      (acc, s) => ({
        contrats: acc.contrats + (s.contratsSignes || 0),
        rdv: acc.rdv + (s.rendezVousPris || 0),
        refus: acc.refus + (s.refus || 0),
        immeubles: acc.immeubles + (s.immeublesVisites || 0),
      }),
      { contrats: 0, rdv: 0, refus: 0, immeubles: 0 }
    )
  }, [todayStats])

  const tauxConversion =
    totals.contrats + totals.rdv + totals.refus > 0
      ? `${Math.round((totals.contrats / (totals.contrats + totals.rdv + totals.refus)) * 100)}%`
      : '0%'

  const isLoading =
    loadingCommercials ||
    loadingManagers ||
    loadingDirecteurs ||
    loadingStats ||
    loadingImmeubles ||
    loadingAssignments

  if (isLoading)
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )

  return (
    <div className="flex flex-col gap-8 animate-in fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Aperçu des performances du jour</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-5 w-5" />
          <span className="text-sm font-medium">
            {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* STATS DU JOUR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Immeubles prospectés"
          value={totals.immeubles}
          description="Visites effectuées"
          icon={<Building2 />}
        />
        <StatsCard
          title="Contrats signés"
          value={totals.contrats}
          description="Signatures du jour"
          icon={<Trophy />}
          variant="success"
        />
        <StatsCard
          title="Rendez-vous pris"
          value={totals.rdv}
          description="Planifiés aujourd'hui"
          icon={<Calendar />}
        />
        <StatsCard
          title="Taux de conversion"
          value={tauxConversion}
          description="Succès / Total contacts"
          icon={<TrendingUp />}
          variant={parseInt(tauxConversion) >= 20 ? 'success' : 'warning'}
        />
      </div>

      {/* ZONES EN COURS */}
      <ActiveZonesSlider_Dashboard assignments={assignments || []} />

      {/* ACCÈS RAPIDES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Accès rapides
          </CardTitle>
          <CardDescription>Navigation vers les sections principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Commerciaux',
                icon: Users,
                path: '/commerciaux',
                info: `${commercials?.length || 0}`,
              },
              {
                label: 'Managers',
                icon: Award,
                path: '/gestion-managers',
                info: `${managers?.length || 0}`,
              },
              {
                label: 'Zones',
                icon: MapPin,
                path: '/gestion-zones',
                info: `${assignments?.length || 0}`,
              },
              {
                label: 'Immeubles',
                icon: Building2,
                path: '/gestion-immeubles',
                info: `${immeubles?.length || 0}`,
              },
              {
                label: 'Statistiques',
                icon: TrendingUp,
                path: '/statistiques',
                info: 'Performances détaillées',
              },
              {
                label: 'Historique',
                icon: Calendar,
                path: '/historique',
                info: 'Historique complet',
              },
              {
                label: 'Classement',
                icon: Trophy,
                path: '/classement',
                info: 'Podium des performances',
              },
              {
                label: 'Analyse zones',
                icon: Target,
                path: '/analyse-zones',
                info: 'Analyse détaillée',
              },
            ].map(({ label, icon: Icon, path, info }) => (
              <Button
                key={label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2 transition hover:scale-[1.01]"
                onClick={() => navigate(path)}
              >
                <div className="flex items-center gap-2 w-full">
                  {Icon && <Icon className="h-5 w-5 text-primary" />}
                  <span className="font-semibold">{label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{info}</span>
                <ArrowRight className="h-4 w-4 ml-auto opacity-70" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CLASSEMENT */}
      <CommercialRankingTable
        commercials={commercials || []}
        directeurs={directeurs || []}
        managers={managers || []}
        statistics={statistics || []}
        currentUserRole="admin"
        title="Top Performers"
        description="Classement général des meilleures performances"
        limit={5}
      />
    </div>
  )
}
