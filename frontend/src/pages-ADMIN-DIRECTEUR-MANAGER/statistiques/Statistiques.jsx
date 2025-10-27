import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Building, RefreshCw, CheckCircle, FileText } from 'lucide-react'
import { useRole } from '@/contexts/userole'
import { useStatistics, useCommercials, useZones } from '@/services'
import { useRoleBasedData } from '@/hooks/metier/useRoleBasedData'
import ContratsEvolutionChart from '@/components/charts/ContratsEvolutionChart'
import CommercialRankingTable from '@/components/CommercialRankingTable'
import ZoneComparisonChart from '@/components/ZoneComparisonChart'

// Fonction utilitaire pour formater les nombres
const formatNumber = (num, decimals = 0) => {
  if (typeof num !== 'number') return '0'
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

const MetricCard = ({ title, value, description, icon: Icon, color = 'blue' }) => {
  return (
    <Card className={`bg-card border-border text-foreground border-2`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-1">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        {description && <p className="text-xs opacity-75">{description}</p>}
      </CardContent>
    </Card>
  )
}

export default function Statistiques() {
  const { currentRole, currentUserId } = useRole()

  // Chargement des données depuis les APIs
  const {
    data: rawStatistics,
    loading: statisticsLoading,
    error: statisticsError,
  } = useStatistics(parseInt(currentUserId, 10), currentRole)

  const {
    data: rawCommercials,
    loading: commercialsLoading,
    error: commercialsError,
  } = useCommercials(parseInt(currentUserId, 10), currentRole)

  const {
    data: rawZones,
    loading: zonesLoading,
    error: zonesError,
  } = useZones(parseInt(currentUserId, 10), currentRole)

  // États de chargement et d'erreur combinés
  const loading = statisticsLoading || commercialsLoading || zonesLoading
  const error = statisticsError || commercialsError || zonesError

  // Calculs des statistiques filtrées avec le hook unifié
  const filteredStatistics = useRoleBasedData('statistics', rawStatistics, {
    commercials: rawCommercials,
  })

  const filteredCommercials = useRoleBasedData('commerciaux', rawCommercials)

  const filteredZones = useRoleBasedData('zones', rawZones, {
    commercials: rawCommercials,
  })

  // Calculs des métriques
  const metrics = useMemo(() => {
    if (!filteredStatistics?.length) {
      return {
        contratsSignes: 0,
        rendezVousPris: 0,
        refus: 0,
        nbRepassages: 0,
        nbImmeubles: 0,
        nbCommerciaux: filteredCommercials?.length || 0,
      }
    }

    const contratsSignes = filteredStatistics.reduce(
      (sum, stat) => sum + (stat.contratsSignes || 0),
      0
    )
    const rendezVousPris = filteredStatistics.reduce(
      (sum, stat) => sum + (stat.rendezVousPris || 0),
      0
    )
    const refus = filteredStatistics.reduce((sum, stat) => sum + (stat.refus || 0), 0)
    const nbRepassages = filteredStatistics.reduce((sum, stat) => sum + (stat.nbRepassages || 0), 0)
    const nbImmeubles = filteredStatistics.reduce(
      (sum, stat) => sum + (stat.immeublesVisites || 0),
      0
    )
    const nbCommerciaux = filteredCommercials?.length || 0

    return {
      contratsSignes,
      rendezVousPris,
      refus,
      nbRepassages,
      nbImmeubles,
      nbCommerciaux,
      repassagesConvertis: Math.min(nbRepassages, contratsSignes),
    }
  }, [filteredStatistics, filteredCommercials])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Chargement des statistiques...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <FileText className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-red-600 font-medium">Erreur lors du chargement des statistiques</p>
            <p className="text-muted-foreground text-sm mt-2">Veuillez réessayer plus tard</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground">Tableau de bord des performances commerciales</p>
      </div>

      {/* Métriques principales demandées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Contrats signés"
          value={metrics.contratsSignes}
          description="Total sur la période"
          icon={CheckCircle}
          color="green"
        />

        <MetricCard
          title="Rendez-vous pris"
          value={metrics.rendezVousPris}
          description="RDV planifiés"
          icon={Calendar}
          color="blue"
        />

        <MetricCard
          title="Refus"
          value={metrics.refus}
          description="Prospects refusés"
          icon={FileText}
          color="red"
        />

        <MetricCard
          title="Repassages convertis"
          value={metrics.repassagesConvertis}
          description="En contrats signés"
          icon={RefreshCw}
          color="purple"
        />

        <MetricCard
          title="Immeubles"
          value={metrics.nbImmeubles}
          description="Immeubles visités"
          icon={Building}
          color="orange"
        />

        <MetricCard
          title="Commerciaux"
          value={metrics.nbCommerciaux}
          description="Équipe active"
          icon={Users}
          color="gray"
        />
      </div>
      {/* Charts et tableaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart d'évolution des contrats */}
        <ContratsEvolutionChart
          statistics={filteredStatistics}
          title="Évolution des contrats signés"
          description="Tendance sur les 30 derniers jours"
          daysToShow={30}
        />

        {/* Tableau de classement des commerciaux */}
        <CommercialRankingTable
          commercials={filteredCommercials}
          statistics={filteredStatistics}
          title="Classement des commerciaux"
          description="Top 10 des meilleurs performeurs"
          limit={10}
        />

        {/* Comparaison des zones */}
        <div className="lg:col-span-2">
          <ZoneComparisonChart
            zones={filteredZones}
            statistics={filteredStatistics}
            title="Analyse des zones"
            description="Comparaison par critères et classement"
            maxZones={5}
          />
        </div>
      </div>
    </div>
  )
}
