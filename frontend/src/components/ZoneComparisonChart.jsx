import React, { useMemo } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MapPin, TrendingUp, Award, Calendar, X } from 'lucide-react'

const chartConfig = {
  zone1: {
    label: 'Zone 1',
    color: 'var(--chart-1)',
  },
  zone2: {
    label: 'Zone 2',
    color: 'var(--chart-2)',
  },
  zone3: {
    label: 'Zone 3',
    color: 'var(--chart-3)',
  },
  zone4: {
    label: 'Zone 4',
    color: 'var(--chart-4)',
  },
}

const formatNumber = num => {
  if (typeof num !== 'number') return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}

/**
 * Composant de comparaison des zones avec 3 graphiques radar séparés et tableau de classement
 * Utilise maintenant les statistiques précalculées depuis ZoneEnCours + HistoriqueZone
 */
export default function ZoneComparisonChart({
  zoneStatistics = [], // Nouveau: stats précalculées depuis le backend
  title = 'Comparaison des zones',
  description = 'Analyse par critères et classement',
  maxZones = 4,
}) {
  const { contratsData, rdvData, refusData, zoneMetrics } = useMemo(() => {
    if (!zoneStatistics?.length) {
      return { contratsData: [], rdvData: [], refusData: [], zoneMetrics: [] }
    }

    // Les statistiques sont déjà calculées côté backend (historique + actuelles)
    // On les utilise directement !
    const zonesWithMetrics = zoneStatistics
      .map(zoneStat => ({
        id: zoneStat.zoneId,
        nom: zoneStat.zoneName,
        contratsSignes: zoneStat.totalContratsSignes || 0,
        rendezVousPris: zoneStat.totalRendezVousPris || 0,
        refus: zoneStat.totalRefus || 0,
        immeublesProspectes: zoneStat.totalImmeublesProspectes || 0,
        portesProspectes: zoneStat.totalPortesProspectes || 0,
        tauxConversion: zoneStat.tauxConversion || 0,
        tauxSuccesRdv: zoneStat.tauxSuccesRdv || 0,
        performanceScore: zoneStat.performanceGlobale || 0,
        nbCommerciaux: zoneStat.nombreCommerciaux || 0,
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, maxZones)

    // Calculer les maximums pour normaliser
    const maxValues = zonesWithMetrics.reduce(
      (max, zone) => ({
        contratsSignes: Math.max(max.contratsSignes, zone.contratsSignes),
        rendezVousPris: Math.max(max.rendezVousPris, zone.rendezVousPris),
        refus: Math.max(max.refus, zone.refus),
      }),
      { contratsSignes: 1, rendezVousPris: 1, refus: 1 }
    )

    // Données pour le radar des contrats signés
    const contratsData = zonesWithMetrics.map((zone, index) => ({
      zone: zone.nom,
      value: Math.round((zone.contratsSignes / maxValues.contratsSignes) * 100),
      actualValue: zone.contratsSignes,
      color: `var(--chart-${index + 1})`,
    }))

    // Données pour le radar des RDV pris
    const rdvData = zonesWithMetrics.map((zone, index) => ({
      zone: zone.nom,
      value: Math.round((zone.rendezVousPris / maxValues.rendezVousPris) * 100),
      actualValue: zone.rendezVousPris,
      color: `var(--chart-${index + 1})`,
    }))

    // Données pour le radar des refus
    const refusData = zonesWithMetrics.map((zone, index) => ({
      zone: zone.nom,
      value: Math.round((zone.refus / maxValues.refus) * 100),
      actualValue: zone.refus,
      color: `var(--chart-${index + 1})`,
    }))

    return { contratsData, rdvData, refusData, zoneMetrics: zonesWithMetrics }
  }, [zoneStatistics, maxZones])

  // Composant pour créer un radar chart
  const RadarChart3D = ({ data, title, icon, color }) => {
    const IconComponent = icon
    // Préparer les données pour le radar avec tous les points nécessaires
    const radarData = data.map((item, index) => ({
      zone: item.zone,
      value: Math.max(item.value, 5), // Minimum pour la visibilité
      actualValue: item.actualValue,
      fill: `var(--chart-${index + 1})`,
      stroke: `var(--chart-${index + 1})`,
    }))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IconComponent className={`h-5 w-5 text-${color}-500`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="zone"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  className="fill-muted-foreground"
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  tickCount={5}
                  className="fill-muted-foreground"
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-sm">
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{data.zone}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatNumber(data.actualValue)} • {data.value}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Radar
                  name="performance"
                  dataKey="value"
                  stroke={`var(--chart-1)`}
                  fill={`var(--chart-1)`}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={{ fill: `var(--chart-1)`, strokeWidth: 2, r: 4 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `var(--chart-${index + 1})` }}
                  />
                  <span className="font-medium">{item.zone}</span>
                </div>
                <span className="font-mono">{formatNumber(item.actualValue)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!zoneMetrics.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Aucune donnée de zone disponible</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>

      {/* 3 Graphiques Radar séparés */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RadarChart3D data={contratsData} title="Contrats signés" icon={Award} color="green" />
        <RadarChart3D data={rdvData} title="Rendez-vous pris" icon={Calendar} color="blue" />
        <RadarChart3D data={refusData} title="Refus" icon={X} color="red" />
      </div>

      {/* Tableau de classement des zones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Classement des zones
          </CardTitle>
          <CardDescription>Zones classées par performance globale</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rang</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead className="text-center">Contrats signés</TableHead>
                <TableHead className="text-center">RDV pris</TableHead>
                <TableHead className="text-center">Refus</TableHead>
                <TableHead className="text-center">Taux de conversion</TableHead>
                <TableHead className="text-center">Taux de succès RDV</TableHead>
                <TableHead className="text-center">
                  Score (taux de conversion + taux de succès RDV)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zoneMetrics.map((zone, index) => {
                const rank = index + 1
                let rankBadgeVariant = 'outline'
                if (rank === 1) rankBadgeVariant = 'default'
                else if (rank === 2) rankBadgeVariant = 'secondary'
                else if (rank === 3) rankBadgeVariant = 'outline'

                return (
                  <TableRow key={zone.id}>
                    <TableCell>
                      <Badge
                        variant={rankBadgeVariant}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                      >
                        {rank}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `var(--chart-${index + 1})` }}
                        />
                        <div>
                          <div className="font-medium">{zone.nom}</div>
                          <div className="text-sm text-muted-foreground">
                            {zone.nbCommerciaux} commercial{zone.nbCommerciaux > 1 ? 's' : ''}
                            /manager{zone.nbCommerciaux > 1 ? 's' : ''} assigné
                            {zone.nbCommerciaux > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-bold text-green-600">
                        {formatNumber(zone.contratsSignes)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-bold text-blue-600">
                        {formatNumber(zone.rendezVousPris)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-bold text-red-600">{formatNumber(zone.refus)}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-bold text-yellow-600">
                        {formatNumber(zone.tauxConversion)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-bold text-green-600">
                        {formatNumber(zone.tauxSuccesRdv)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {formatNumber(zone.performanceScore)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
