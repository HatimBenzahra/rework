import React, { useMemo } from 'react'
import { Pie, PieChart, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

// Configuration des couleurs et libellés pour chaque statut
const statusConfig = {
  CONTRAT_SIGNE: {
    label: 'Contrats signés',
    color: 'var(--chart-2)', // Vert
    fill: 'var(--chart-2)',
  },
  RENDEZ_VOUS_PRIS: {
    label: 'RDV pris',
    color: 'var(--chart-1)', // Orange
    fill: 'var(--chart-1)',
  },
  CURIEUX: {
    label: 'Curieux',
    color: 'var(--chart-4)', // Jaune-vert
    fill: 'var(--chart-4)',
  },
  REFUS: {
    label: 'Refus',
    color: 'var(--chart-5)', // Rouge-orange
    fill: 'var(--chart-5)',
  },
  NECESSITE_REPASSAGE: {
    label: 'À recontacter',
    color: 'var(--chart-3)', // Bleu
    fill: 'var(--chart-3)',
  },
  NON_VISITE: {
    label: 'Non visitées',
    color: 'oklch(0.8 0 0)', // Gris clair
    fill: 'oklch(0.8 0 0)',
  },
}

const chartConfig = {
  contrats: {
    label: 'Contrats signés',
    color: 'var(--chart-2)',
  },
  rdv: {
    label: 'RDV pris',
    color: 'var(--chart-1)',
  },
  curieux: {
    label: 'Curieux',
    color: 'var(--chart-4)',
  },
  refus: {
    label: 'Refus',
    color: 'var(--chart-5)',
  },
  repassage: {
    label: 'À recontacter',
    color: 'var(--chart-3)',
  },
  nonVisite: {
    label: 'Non visitées',
    color: 'oklch(0.8 0 0)',
  },
}

/**
 * Composant graphique circulaire pour afficher la répartition des statuts des portes
 * @param {Object} props
 * @param {Array} props.portes - Liste des portes avec leur statut
 * @param {string} props.title - Titre du graphique
 * @param {string} props.description - Description du graphique
 * @param {boolean} props.showNonVisited - Afficher ou non les portes non visitées (défaut: true)
 */
export default function PortesStatusChart({
  portes = [],
  title = 'Répartition des statuts',
  description = 'État actuel de la prospection',
  showNonVisited = true,
}) {
  // Préparer les données pour le graphique circulaire
  const chartData = useMemo(() => {
    if (!portes || portes.length === 0) {
      return []
    }

    // Compter chaque statut
    const statusCounts = {
      CONTRAT_SIGNE: 0,
      RENDEZ_VOUS_PRIS: 0,
      CURIEUX: 0,
      REFUS: 0,
      NECESSITE_REPASSAGE: 0,
      NON_VISITE: 0,
    }

    portes.forEach(porte => {
      if (porte.statut in statusCounts) {
        statusCounts[porte.statut]++
      }
    })

    // Convertir en format attendu par Recharts
    const data = Object.entries(statusCounts)
      .filter(([status, count]) => {
        // Filtrer les portes non visitées si demandé
        if (!showNonVisited && status === 'NON_VISITE') {
          return false
        }
        return count > 0 // Ne garder que les statuts avec au moins 1 porte
      })
      .map(([status, count]) => ({
        name: statusConfig[status].label,
        value: count,
        status: status,
        fill: statusConfig[status].fill,
        percentage: portes.length > 0 ? Math.round((count / portes.length) * 100) : 0,
      }))

    return data
  }, [portes, showNonVisited])

  // Calculer les statistiques
  const totalPortes = useMemo(() => {
    return portes.length
  }, [portes])

  const portesProspectees = useMemo(() => {
    return portes.filter(p => p.statut !== 'NON_VISITE').length
  }, [portes])

  const tauxProspection = useMemo(() => {
    if (totalPortes === 0) return 0
    return Math.round((portesProspectees / totalPortes) * 100)
  }, [portesProspectees, totalPortes])

  const tauxReussite = useMemo(() => {
    const contrats = portes.filter(p => p.statut === 'CONTRAT_SIGNE').length
    const rdv = portes.filter(p => p.statut === 'RENDEZ_VOUS_PRIS').length
    const totalPositif = contrats + rdv

    if (portesProspectees === 0) return 0
    return Math.round((totalPositif / portesProspectees) * 100)
  }, [portes, portesProspectees])

  // Si pas de données, afficher un message
  if (chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Aucune donnée disponible</p>
              <p className="text-xs mt-1">Commencez à prospecter pour voir la répartition</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{totalPortes}</div>
          <div className="text-xs text-muted-foreground">
            {portesProspectees} prospectées ({tauxProspection}%)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, props) => [
                    `${value} porte${value > 1 ? 's' : ''} (${props.payload.percentage}%)`,
                    name,
                  ]}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" height={36} />
          </PieChart>
        </ChartContainer>

        {/* Statistiques supplémentaires */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t">
          <div>
            <span className="font-medium">Taux prospection: </span>
            <span className="text-foreground">{tauxProspection}%</span>
          </div>
          <div>
            <span className="font-medium">Taux réussite: </span>
            <span className="text-foreground">{tauxReussite}%</span>
          </div>
        </div>

        {/* Légende détaillée */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{item.value}</span>
                <span className="text-muted-foreground">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
