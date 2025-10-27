import React, { useMemo, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Trophy, Medal, Award, Star, Users, Crown, Shield } from 'lucide-react'
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
 * Tableau de classement multi-rôles (commerciaux, directeurs, managers)
 * @param {Object} props
 * @param {Array} props.commercials - Liste des commerciaux
 * @param {Array} props.directeurs - Liste des directeurs
 * @param {Array} props.managers - Liste des managers
 * @param {Array} props.statistics - Statistiques pour calculer les performances
 * @param {string} props.title - Titre du tableau
 * @param {string} props.description - Description du tableau
 * @param {number} props.limit - Nombre max d'utilisateurs à afficher
 */
export default function CommercialRankingTable({
  commercials = [],
  directeurs = [],
  managers = [],
  statistics = [],
  currentUserRole = 'admin',
  title = 'Classement des performances',
  description = 'Classement basé sur les performances par rôle',
  limit = 10,
}) {
  const [selectedType, setSelectedType] = useState('commercials')

  // Filtrer les types d'utilisateurs selon le rôle connecté
  const availableUserTypes = [
    {
      key: 'commercials',
      label: 'Commerciaux',
      icon: Users,
      data: commercials,
      color: 'blue',
      allowedRoles: ['admin', 'directeur', 'manager'], // Tous peuvent voir les commerciaux
    },
    {
      key: 'directeurs',
      label: 'Directeurs',
      icon: Crown,
      data: directeurs,
      color: 'purple',
      allowedRoles: ['admin'], // Seul l'admin peut voir les directeurs
    },
    {
      key: 'managers',
      label: 'Managers',
      icon: Shield,
      data: managers,
      color: 'green',
      allowedRoles: ['admin', 'directeur'], // Admin et directeurs peuvent voir les managers
    },
  ]

  const userTypes = availableUserTypes.filter(type => type.allowedRoles.includes(currentUserRole))

  // S'assurer que le type sélectionné est valide pour le rôle actuel
  const validSelectedType = userTypes.find(type => type.key === selectedType)
    ? selectedType
    : userTypes[0]?.key || 'commercials'

  const currentUserType = userTypes.find(type => type.key === validSelectedType)
  const rankedUsers = useMemo(() => {
    const currentData = currentUserType?.data || []
    if (!currentData?.length || !statistics?.length) return []

    // Calculer les performances selon le type d'utilisateur
    const userStats = currentData.map(user => {
      let userStatistics = []

      // Filtrer les statistiques selon le type d'utilisateur
      if (validSelectedType === 'commercials') {
        userStatistics = statistics.filter(stat => stat.commercialId === user.id)
      } else if (validSelectedType === 'directeurs') {
        // Pour les directeurs : agréger les stats de tous leurs commerciaux
        userStatistics = statistics.filter(stat => {
          const commercial = commercials.find(c => c.id === stat.commercialId)
          return commercial && commercial.directeurId === user.id
        })
      } else if (validSelectedType === 'managers') {
        // Pour les managers : agréger les stats de tous leurs commerciaux
        userStatistics = statistics.filter(stat => {
          const commercial = commercials.find(c => c.id === stat.commercialId)
          return commercial && commercial.managerId === user.id
        })
      }

      // Calculer les totaux
      const totals = userStatistics.reduce(
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
        ...user,
        ...totals,
        rank,
        points,
        tauxConversion,
        name: `${user.prenom} ${user.nom}`,
        initials: `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase(),
        userType: validSelectedType,
      }
    })

    // Trier par points (décroissant) puis par contrats signés
    return userStats
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return b.contratsSignes - a.contratsSignes
      })
      .slice(0, limit)
      .map((user, index) => ({
        ...user,
        position: index + 1,
      }))
  }, [currentUserType, statistics, limit, validSelectedType, commercials])

  if (!rankedUsers.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>

          {/* Sélecteur de type d'utilisateur */}
          <div className="flex gap-2 mt-4">
            {userTypes.map(type => {
              const Icon = type.icon
              const isActive = validSelectedType === type.key
              const hasData = type.data && type.data.length > 0

              return (
                <Button
                  key={type.key}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  disabled={!hasData}
                  onClick={() => setSelectedType(type.key)}
                  className={`flex items-center gap-2 ${!hasData ? 'opacity-50' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  {type.label}
                  {hasData && (
                    <Badge variant="secondary" className="ml-1">
                      {type.data.length}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Aucune donnée disponible pour {currentUserType?.label?.toLowerCase()}
            </p>
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

        {/* Sélecteur de type d'utilisateur */}
        <div className="flex gap-2 mt-4">
          {userTypes.map(type => {
            const Icon = type.icon
            const isActive = validSelectedType === type.key
            const hasData = type.data && type.data.length > 0

            return (
              <Button
                key={type.key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                disabled={!hasData}
                onClick={() => setSelectedType(type.key)}
                className={`flex items-center gap-2 ${!hasData ? 'opacity-50' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {type.label}
                {hasData && (
                  <Badge variant="secondary" className="ml-1">
                    {type.data.length}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Pos.</TableHead>
              <TableHead>{currentUserType?.label?.slice(0, -1) || 'Utilisateur'}</TableHead>
              <TableHead>Rang</TableHead>
              <TableHead className="text-center">Points</TableHead>
              <TableHead className="text-center">Contrats</TableHead>
              <TableHead className="text-center">RDV</TableHead>
              <TableHead className="text-center">Taux Conv.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedUsers.map(user => {
              const userTypeConfig = userTypes.find(t => t.key === user.userType)
              const userColor = userTypeConfig?.color || 'blue'

              return (
                <TableRow key={user.id} className={user.position <= 3 ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getRankIcon(user.position)}
                      {user.position}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full bg-${userColor}-100 text-${userColor}-700 flex items-center justify-center text-xs font-semibold`}
                      >
                        {user.initials}
                      </div>
                      <div className="grid gap-1">
                        <div className="font-medium leading-none">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {currentUserType?.label?.slice(0, -1)} • ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={`${user.rank.bgColor} ${user.rank.textColor} ${user.rank.borderColor} border font-semibold`}
                    >
                      {user.rank.name}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center font-mono">
                    {formatNumber(user.points)}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge className="bg-green-100 text-green-800">
                      {formatNumber(user.contratsSignes)}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge className="bg-blue-100 text-blue-800">
                      {formatNumber(user.rendezVousPris)}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <span
                      className={`font-medium ${
                        user.tauxConversion >= 20
                          ? 'text-green-600'
                          : user.tauxConversion >= 10
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {user.tauxConversion}%
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
