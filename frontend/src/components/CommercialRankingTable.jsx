import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, Star } from 'lucide-react'
import { calculateRank } from '@/share/ranks'

const formatNumber = num => {
  if (typeof num !== 'number') return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}

const getRankIcon = position => {
  switch (position) {
    case 1:
      return <Trophy className="h-4 w-4 text-yellow-500" />
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />
    case 3:
      return <Award className="h-4 w-4 text-orange-600" />
    default:
      return <Star className="h-4 w-4 text-blue-500" />
  }
}

/**
 * Tableau de classement des commerciaux par rang et performances
 * @param {Object} props
 * @param {Array} props.commercials - Liste des commerciaux
 * @param {Array} props.statistics - Statistiques pour calculer les performances
 * @param {string} props.title - Titre du tableau
 * @param {string} props.description - Description du tableau
 * @param {number} props.limit - Nombre max de commerciaux à afficher
 */
export default function CommercialRankingTable({
  commercials = [],
  statistics = [],
  title = 'Classement des commerciaux',
  description = 'Classement basé sur les performances',
  limit = 10,
}) {
  const rankedCommercials = useMemo(() => {
    if (!commercials?.length || !statistics?.length) return []

    // Calculer les performances de chaque commercial
    const commercialStats = commercials.map(commercial => {
      // Filtrer les stats de ce commercial
      const commercialStatistics = statistics.filter(stat => stat.commercialId === commercial.id)

      // Calculer les totaux
      const totals = commercialStatistics.reduce(
        (acc, stat) => ({
          contratsSignes: acc.contratsSignes + (stat.contratsSignes || 0),
          rendezVousPris: acc.rendezVousPris + (stat.rendezVousPris || 0),
          immeublesVisites: acc.immeublesVisites + (stat.immeublesVisites || 0),
          refus: acc.refus + (stat.refus || 0),
        }),
        { contratsSignes: 0, rendezVousPris: 0, immeublesVisites: 0, refus: 0 }
      )

      // Calculer le rang et les points
      const { rank, points } = calculateRank(
        totals.contratsSignes,
        totals.rendezVousPris,
        totals.immeublesVisites
      )

      // Calculer le taux de conversion
      const totalActivites = totals.contratsSignes + totals.rendezVousPris + totals.refus
      const tauxConversion =
        totalActivites > 0 ? Math.round((totals.contratsSignes / totalActivites) * 100) : 0

      return {
        ...commercial,
        ...totals,
        rank,
        points,
        tauxConversion,
        name: `${commercial.prenom} ${commercial.nom}`,
        initials: `${commercial.prenom?.[0] || ''}${commercial.nom?.[0] || ''}`.toUpperCase(),
      }
    })

    // Trier par points (décroissant) puis par contrats signés
    return commercialStats
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return b.contratsSignes - a.contratsSignes
      })
      .slice(0, limit)
      .map((commercial, index) => ({
        ...commercial,
        position: index + 1,
      }))
  }, [commercials, statistics, limit])

  if (!rankedCommercials.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Pos.</TableHead>
              <TableHead>Commercial</TableHead>
              <TableHead>Rang</TableHead>
              <TableHead className="text-center">Points</TableHead>
              <TableHead className="text-center">Contrats</TableHead>
              <TableHead className="text-center">RDV</TableHead>
              <TableHead className="text-center">Taux Conv.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedCommercials.map(commercial => (
              <TableRow
                key={commercial.id}
                className={commercial.position <= 3 ? 'bg-muted/50' : ''}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getRankIcon(commercial.position)}
                    {commercial.position}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                      {commercial.initials}
                    </div>
                    <div className="grid gap-1">
                      <div className="font-medium leading-none">{commercial.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {commercial.id}</div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    className={`${commercial.rank.bgColor} ${commercial.rank.textColor} ${commercial.rank.borderColor} border font-semibold`}
                  >
                    {commercial.rank.name}
                  </Badge>
                </TableCell>

                <TableCell className="text-center font-mono">
                  {formatNumber(commercial.points)}
                </TableCell>

                <TableCell className="text-center">
                  <Badge className="bg-green-100 text-green-800">
                    {formatNumber(commercial.contratsSignes)}
                  </Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge className="bg-blue-100 text-blue-800">
                    {formatNumber(commercial.rendezVousPris)}
                  </Badge>
                </TableCell>

                <TableCell className="text-center">
                  <span
                    className={`font-medium ${
                      commercial.tauxConversion >= 20
                        ? 'text-green-600'
                        : commercial.tauxConversion >= 10
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {commercial.tauxConversion}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
