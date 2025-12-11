import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Users, Building, RefreshCw, CheckCircle, FileText, Clock } from 'lucide-react'
import { useRole } from '@/contexts/userole'
import {
  useStatistics,
  useCommercials,
  useDirecteurs,
  useManagers,
  useZoneStatistics,
} from '@/services'
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

// Fonction pour filtrer les statistiques par période
const filterStatisticsByPeriod = (statistics, period) => {
  if (!statistics?.length) return []

  const now = new Date()
  let startDate

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    case 'all':
    default:
      return statistics
  }

  return statistics.filter(stat => {
    const statDate = new Date(stat.createdAt || stat.date)
    return statDate >= startDate
  })
}

// Options de filtres temporels
const TIME_FILTERS = [
  { value: '7d', label: '7 derniers jours', icon: Clock },
  { value: '30d', label: '30 derniers jours', icon: Calendar },
  { value: '90d', label: '3 derniers mois', icon: Calendar },
  { value: '1y', label: 'Cette année', icon: Calendar },
  { value: 'all', label: 'Toute la période', icon: Calendar },
]

const MetricCard = ({ title, value, description, icon: Icon }) => {
  return (
    <Card className={`bg-card border-border text-foreground border-2`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5" />}
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
  const { currentRole } = useRole()
  const [timePeriod, setTimePeriod] = useState('30d')

  // Chargement des données depuis les APIs
  const {
    data: rawStatistics,
    loading: statisticsLoading,
    error: statisticsError,
  } = useStatistics()

  const {
    data: rawCommercials,
    loading: commercialsLoading,
    error: commercialsError,
  } = useCommercials()

  const {
    data: rawDirecteurs,
    loading: directeursLoading,
    error: directeursError,
  } = useDirecteurs()

  const { data: rawManagers, loading: managersLoading, error: managersError } = useManagers()

  const {
    data: zoneStatisticsData,
    loading: zoneStatsLoading,
    error: zoneStatsError,
  } = useZoneStatistics()

  // États de chargement et d'erreur combinés
  const loading =
    statisticsLoading ||
    commercialsLoading ||
    directeursLoading ||
    managersLoading ||
    zoneStatsLoading
  const error =
    statisticsError || commercialsError || directeursError || managersError || zoneStatsError

  // Calculs des statistiques filtrées avec le hook unifié
  const filteredStatistics = useRoleBasedData('statistics', rawStatistics, {
    commercials: rawCommercials,
  })

  const filteredCommercials = useRoleBasedData('commerciaux', rawCommercials)

  const filteredDirecteurs = useRoleBasedData('directeurs', rawDirecteurs)

  const filteredManagers = useRoleBasedData('managers', rawManagers)

  // Appliquer le filtre temporel aux statistiques
  const timeFilteredStatistics = useMemo(() => {
    return filterStatisticsByPeriod(filteredStatistics, timePeriod)
  }, [filteredStatistics, timePeriod])

  // Calculs des métriques - IMPORTANT: utiliser les stats globales pour éviter les doublons
  const metrics = useMemo(() => {
    if (!timeFilteredStatistics?.length) {
      return {
        contratsSignes: 0,
        rendezVousPris: 0,
        refus: 0,
        absents: 0,
        argumentes: 0,
        nbRepassages: 0,
        nbImmeubles: 0,
        nbCommerciaux: filteredCommercials?.length || 0,
      }
    }

    // Chercher la statistique globale (sans commercialId ni managerId)
    // Cette stat est créée automatiquement par le backend et contient le total agrégé
    const globalStat = timeFilteredStatistics.find(
      stat => !stat.commercialId && !stat.managerId
    )

    // Si on a une stat globale, l'utiliser directement (déjà calculée côté backend)
    // Sinon, fallback: additionner toutes les stats disponibles
    let contratsSignes, rendezVousPris, refus, nbRepassages, nbImmeubles

    if (globalStat) {
      // Utiliser directement les valeurs de la stat globale
      contratsSignes = globalStat.contratsSignes || 0
      rendezVousPris = globalStat.rendezVousPris || 0
      refus = globalStat.refus || 0
      nbRepassages = globalStat.nbRepassages || 0
      nbImmeubles = globalStat.immeublesVisites || 0
    } else {
      // Fallback: calculer manuellement (si pas de stat globale)
      contratsSignes = timeFilteredStatistics.reduce(
        (sum, stat) => sum + (stat.contratsSignes || 0),
        0
      )
      rendezVousPris = timeFilteredStatistics.reduce(
        (sum, stat) => sum + (stat.rendezVousPris || 0),
        0
      )
      refus = timeFilteredStatistics.reduce((sum, stat) => sum + (stat.refus || 0), 0)
      nbRepassages = timeFilteredStatistics.reduce(
        (sum, stat) => sum + (stat.nbRepassages || 0),
        0
      )
      nbImmeubles = timeFilteredStatistics.reduce(
        (sum, stat) => sum + (stat.immeublesVisites || 0),
        0
      )
    }
    const nbCommerciaux = filteredCommercials?.length || 0

    // Calculer absents et argumentés depuis les portes des commerciaux (non disponible dans Statistic)
    let absents = 0
    let argumentes = 0

    if (filteredCommercials?.length) {
      filteredCommercials.forEach(commercial => {
        if (commercial.immeubles) {
          commercial.immeubles.forEach(immeuble => {
            if (immeuble.portes) {
              immeuble.portes.forEach(porte => {
                if (porte.statut === 'ABSENT') absents++
                if (porte.statut === 'ARGUMENTE') argumentes++
              })
            }
          })
        }
      })
    }

    return {
      contratsSignes,
      rendezVousPris,
      refus,
      absents,
      argumentes,
      nbRepassages,
      nbImmeubles,
      nbCommerciaux,
    }
  }, [timeFilteredStatistics, filteredCommercials])

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
      {/* En-tête avec filtre temporel */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
            <p className="text-muted-foreground">Tableau de bord des performances commerciales</p>
          </div>

          {/* Sélecteur de période */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Sélectionner une période" />
              </SelectTrigger>
              <SelectContent>
                {TIME_FILTERS.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>
                    <div className="flex items-center gap-2">
                      <filter.icon className="h-4 w-4" />
                      {filter.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Métriques principales demandées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          title="Absents"
          value={metrics.absents}
          description="Portes où personne n'était présent"
          icon={Users}
          color="blue"
        />

        <MetricCard
          title="Argumentés"
          value={metrics.argumentes}
          description="Refus après argumentation"
          icon={FileText}
          color="orange"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Chart d'évolution des contrats */}
        <ContratsEvolutionChart
          statistics={timeFilteredStatistics}
          title="Évolution des contrats signés"
          description={`Tendance sur ${TIME_FILTERS.find(f => f.value === timePeriod)?.label?.toLowerCase()}`}
          daysToShow={
            timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : timePeriod === '90d' ? 90 : 365
          }
        />

        {/* Tableau de classement multi-rôles */}
        <CommercialRankingTable
          commercials={filteredCommercials}
          directeurs={filteredDirecteurs}
          managers={filteredManagers}
          statistics={timeFilteredStatistics}
          currentUserRole={currentRole}
          title="Classement des performances"
          description={`Classement par rôle et performance - ${TIME_FILTERS.find(f => f.value === timePeriod)?.label}`}
          limit={10}
        />

        {/* Comparaison des zones */}
        <div className="lg:col-span-2">
          <ZoneComparisonChart
            zoneStatistics={zoneStatisticsData}
            title="Analyse des zones"
            description={`Comparaison par critères et classement - ${TIME_FILTERS.find(f => f.value === timePeriod)?.label}`}
            maxZones={5}
          />
        </div>
      </div>
    </div>
  )
}
