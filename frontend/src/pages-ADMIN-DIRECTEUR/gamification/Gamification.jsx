import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Trophy,
  Medal,
  Award,
  Star,
  RefreshCw,
  Link2,
  Package,
  Zap,
  Shield,
  Crown,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  Pencil,
} from 'lucide-react'
import {
  useGamificationLogic,
  RANK_PERIODS,
  BADGE_CATEGORIES,
  BADGE_PRODUCT_KEYS,
} from './useGamificationLogic'

// =============================================================================
// Utilitaires
// =============================================================================

const formatNumber = (num, decimals = 0) => {
  if (typeof num !== 'number') return '0'
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
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
      return null
  }
}

const getCategoryColor = category => {
  switch (category) {
    case 'PROGRESSION':
      return 'default'
    case 'PRODUIT':
      return 'secondary'
    case 'PERFORMANCE':
      return 'outline'
    case 'TROPHEE':
      return 'destructive'
    default:
      return 'default'
  }
}

const getCategoryIcon = category => {
  switch (category) {
    case 'PROGRESSION':
      return <Star className="h-3.5 w-3.5" />
    case 'PRODUIT':
      return <Package className="h-3.5 w-3.5" />
    case 'PERFORMANCE':
      return <Zap className="h-3.5 w-3.5" />
    case 'TROPHEE':
      return <Crown className="h-3.5 w-3.5" />
    default:
      return null
  }
}

const getConfidenceColor = confidence => {
  if (confidence >= 80) return 'text-green-600'
  if (confidence >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

const getOffreLogoUrl = logoUrl => {
  if (!logoUrl) return null
  if (logoUrl.startsWith('http')) return logoUrl
  return `https://www.winleadplus.com${logoUrl}`
}

// =============================================================================
// Tabs Configuration
// =============================================================================

const TABS = [
  { id: 'classement', label: 'Classement', icon: Trophy },
  { id: 'badges', label: 'Badges', icon: Shield },
  { id: 'mapping', label: 'Mapping', icon: Link2 },
  { id: 'offres', label: 'Offres', icon: Package },
  { id: 'sync', label: 'Synchronisation', icon: RefreshCw },
]

const TAB_PATHS = {
  classement: '/gamification',
  badges: '/gamification/badges',
  mapping: '/gamification/mapping',
  offres: '/gamification/offres',
  sync: '/gamification/sync',
}

const getTabFromPathname = pathname => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'

  if (normalizedPath.startsWith('/gamification/badges')) return 'badges'
  if (normalizedPath.startsWith('/gamification/mapping')) return 'mapping'
  if (normalizedPath.startsWith('/gamification/offres')) return 'offres'
  if (normalizedPath.startsWith('/gamification/sync')) return 'sync'
  return 'classement'
}

// =============================================================================
// Tab: Classement
// =============================================================================

function ClassementTab({
  ranking,
  rankPeriod,
  setRankPeriod,
  periodKey,
  rankingLoading,
  handleComputeRanking,
  computeRankingLoading,
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Contrôles */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={rankPeriod} onValueChange={setRankPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              {RANK_PERIODS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">Période : {periodKey}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleComputeRanking}
          disabled={computeRankingLoading}
        >
          {computeRankingLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Recalculer
        </Button>
      </div>

      {/* Tableau de classement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Classement des commerciaux
          </CardTitle>
          <CardDescription>
            {RANK_PERIODS.find(p => p.value === rankPeriod)?.label} — Points basés sur le prix des contrats validés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rankingLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !ranking?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Trophy className="h-8 w-8 mb-3 opacity-50" />
              <p>Aucun classement disponible pour cette période</p>
              <p className="text-xs mt-1">Lancez un recalcul ou attendez le prochain cycle CRON</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Commercial</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Contrats</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                        <span className={entry.rank <= 3 ? 'font-bold' : 'text-muted-foreground'}>
                          {entry.rank}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {entry.commercialPrenom} {entry.commercialNom}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatNumber(entry.points)} pts
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(entry.contratsSignes)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Tab: Badges
// =============================================================================

function BadgesTab({
  filteredBadges,
  badgeStats,
  badgeCategoryFilter,
  setBadgeCategoryFilter,
  badgesLoading,
  handleSeedBadges,
  seedBadgesLoading,
  handleEvaluateBadges,
  evaluateBadgesLoading,
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* En-tête et contrôles */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={badgeCategoryFilter} onValueChange={setBadgeCategoryFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {BADGE_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredBadges?.length || 0} badge{(filteredBadges?.length || 0) !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedBadges}
            disabled={seedBadgesLoading}
          >
            {seedBadgesLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Initialiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEvaluateBadges}
            disabled={evaluateBadgesLoading}
          >
            {evaluateBadgesLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Évaluer
          </Button>
        </div>
      </div>

      {/* Statistiques des badges */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: badgeStats.total, icon: Shield },
          { label: 'Progression', value: badgeStats.progression, icon: Star },
          { label: 'Produit', value: badgeStats.produit, icon: Package },
          { label: 'Performance', value: badgeStats.performance, icon: Zap },
          { label: 'Trophée', value: badgeStats.trophee, icon: Crown },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grille de badges */}
      {badgesLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !filteredBadges?.length ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Shield className="h-8 w-8 mb-3 opacity-50" />
          <p>Aucun badge trouvé</p>
          <p className="text-xs mt-1">Lancez l'initialisation pour créer le catalogue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBadges.map(badge => (
            <Card key={badge.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(badge.category)}
                    <span className="font-medium text-sm">{badge.nom}</span>
                  </div>
                  <Badge variant={getCategoryColor(badge.category)} className="text-xs shrink-0">
                    {badge.category}
                  </Badge>
                </div>
                {badge.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {badge.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Niveau {badge.tier}</span>
                  <span>•</span>
                  <span>{badge.code}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Tab: Mapping
// =============================================================================

function MappingTab({
  mappingSuggestions,
  mappingStats,
  mappingLoading,
  handleConfirmMapping,
  confirmMappingLoading,
  refetchMapping,
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Statistiques du mapping */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xl font-bold">{mappingStats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-xl font-bold">{mappingStats.mapped}</div>
              <div className="text-xs text-muted-foreground">Mappés</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <div>
              <div className="text-xl font-bold">{mappingStats.pending}</div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau de mapping */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Mapping Pro-Win ↔ WinLead+
              </CardTitle>
              <CardDescription>
                Associez les commerciaux Pro-Win avec leurs comptes WinLead+
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refetchMapping}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mappingLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !mappingSuggestions?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Link2 className="h-8 w-8 mb-3 opacity-50" />
              <p>Aucune suggestion de mapping disponible</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commercial Pro-Win</TableHead>
                  <TableHead>Commercial WinLead+</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Confiance</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappingSuggestions.map(suggestion => (
                  <TableRow key={`${suggestion.prowinId}-${suggestion.prowinType}`}>
                    <TableCell>
                      <div className="font-medium">
                        {suggestion.prowinPrenom} {suggestion.prowinNom}
                      </div>
                      {suggestion.prowinEmail && (
                        <div className="text-xs text-muted-foreground">{suggestion.prowinEmail}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {suggestion.winleadPlusNom ? (
                        <div>
                          <div className="font-medium">
                            {suggestion.winleadPlusPrenom} {suggestion.winleadPlusNom}
                          </div>
                          {suggestion.winleadPlusEmail && (
                            <div className="text-xs text-muted-foreground">
                              {suggestion.winleadPlusEmail}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Aucune correspondance</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.prowinType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {suggestion.confidence != null ? (
                        <span className={`font-semibold ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {suggestion.alreadyMapped ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!suggestion.alreadyMapped && suggestion.winleadPlusId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfirmMapping(suggestion)}
                          disabled={confirmMappingLoading}
                        >
                          {confirmMappingLoading ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            'Confirmer'
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Tab: Offres
// =============================================================================

function OffresTab({
  offres,
  offresLoading,
  editingOffre,
  setEditingOffre,
  handleSyncOffres,
  syncOffresLoading,
  handleUpdateOffrePoints,
  handleUpdateBadgeProductKey,
  updatePointsLoading,
  updateBadgeKeyLoading,
}) {
  const [editPoints, setEditPoints] = useState('')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {offres?.length || 0} offre{(offres?.length || 0) !== 1 ? 's' : ''} synchronisées
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncOffres}
          disabled={syncOffresLoading}
        >
          {syncOffresLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Synchroniser les offres
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Offres WinLead+
          </CardTitle>
          <CardDescription>
            Gérez les points et les clés produit badge pour chaque offre
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offresLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !offres?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-8 w-8 mb-3 opacity-50" />
              <p>Aucune offre synchronisée</p>
              <p className="text-xs mt-1">Lancez la synchronisation pour importer les offres</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Prix de base</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead>Clé Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offres.map(offre => (
                  <TableRow key={offre.id}>
                    <TableCell>
                      {offre.logoUrl ? (
                        <img
                          src={getOffreLogoUrl(offre.logoUrl)}
                          alt={offre.fournisseur}
                          className="h-8 w-8 rounded object-contain"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{offre.nom}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {offre.categorie}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{offre.fournisseur}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {offre.prixBase != null ? `${formatNumber(offre.prixBase, 2)} €` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingOffre === offre.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <Input
                            type="number"
                            value={editPoints}
                            onChange={e => setEditPoints(e.target.value)}
                            className="w-20 h-7 text-xs"
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleUpdateOffrePoints(offre.id, editPoints)
                              if (e.key === 'Escape') setEditingOffre(null)
                            }}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleUpdateOffrePoints(offre.id, editPoints)}
                            disabled={updatePointsLoading}
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingOffre(null)}
                          >
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          <span className="font-semibold tabular-nums">{formatNumber(offre.points)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Modifier les points"
                            aria-label="Modifier les points"
                            onClick={() => {
                              setEditingOffre(offre.id)
                              setEditPoints(String(offre.points || 0))
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={offre.badgeProductKey || 'NONE'}
                        onValueChange={value =>
                          handleUpdateBadgeProductKey(offre.id, value)
                        }
                      >
                        <SelectTrigger className="h-7 w-36 text-xs">
                          <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                        <SelectContent>
                          {BADGE_PRODUCT_KEYS.map(k => (
                            <SelectItem key={k.value} value={k.value}>
                              {k.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Tab: Synchronisation
// =============================================================================

function SyncTab({
  syncResults,
  handleSyncContrats,
  syncContratsLoading,
  handleSyncOffres,
  syncOffresLoading,
  handleEvaluateBadges,
  evaluateBadgesLoading,
  handleComputeRanking,
  computeRankingLoading,
  handleSeedBadges,
  seedBadgesLoading,
  rankPeriod,
  periodKey,
}) {
  const actions = [
    {
      key: 'contrats',
      title: 'Synchroniser les contrats',
      description: 'Importe les contrats validés depuis WinLead+',
      icon: FileText,
      action: handleSyncContrats,
      loading: syncContratsLoading,
    },
    {
      key: 'offres',
      title: 'Synchroniser les offres',
      description: 'Importe les offres depuis WinLead+',
      icon: Package,
      action: handleSyncOffres,
      loading: syncOffresLoading,
    },
    {
      key: 'badges',
      title: 'Évaluer les badges',
      description: 'Lance l\'évaluation pour tous les commerciaux',
      icon: Shield,
      action: handleEvaluateBadges,
      loading: evaluateBadgesLoading,
    },
    {
      key: 'ranking',
      title: 'Calculer le classement',
      description: `Recalcule le classement ${RANK_PERIODS.find(p => p.value === rankPeriod)?.label?.toLowerCase()} (${periodKey})`,
      icon: Trophy,
      action: handleComputeRanking,
      loading: computeRankingLoading,
    },
    {
      key: 'seed',
      title: 'Initialiser les badges',
      description: 'Crée le catalogue de 87 badges (idempotent)',
      icon: Download,
      action: handleSeedBadges,
      loading: seedBadgesLoading,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Actions de synchronisation
          </CardTitle>
          <CardDescription>
            Ces actions sont normalement exécutées automatiquement par le CRON (2h00 quotidien).
            Utilisez-les manuellement si nécessaire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map(item => (
              <Card key={item.key} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 rounded-md bg-muted">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={item.action}
                      disabled={item.loading}
                      className="shrink-0"
                    >
                      {item.loading ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        'Lancer'
                      )}
                    </Button>
                  </div>
                  {/* Résultat */}
                  {syncResults[item.key] && (
                    <div
                      className={`mt-3 p-2 rounded text-xs flex items-center gap-2 ${
                        syncResults[item.key].success
                          ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                      }`}
                    >
                      {syncResults[item.key].success ? (
                        <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {syncResults[item.key].message}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Page principale
// =============================================================================

export default function Gamification() {
  const logic = useGamificationLogic()
  const location = useLocation()
  const navigate = useNavigate()
  const routeTab = getTabFromPathname(location.pathname)

  useEffect(() => {
    if (logic.activeTab !== routeTab) {
      logic.setActiveTab(routeTab)
    }
  }, [logic.activeTab, logic.setActiveTab, routeTab])

  const handleTabChange = tabId => {
    const targetPath = TAB_PATHS[tabId] || TAB_PATHS.classement
    logic.setActiveTab(tabId)
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  if (logic.loading && !logic.ranking && !logic.offres && !logic.filteredBadges?.length) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Chargement de la gamification...</p>
          </div>
        </div>
      </div>
    )
  }

  if (logic.error && !logic.ranking && !logic.offres) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600 font-medium">Erreur lors du chargement</p>
            <p className="text-muted-foreground text-sm mt-2">{logic.error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gamification</h1>
        <p className="text-muted-foreground">
          Classement, badges et gestion du système de gamification
        </p>
      </div>

      {/* Barre d'onglets */}
      <div className="flex gap-1 border-b">
        {TABS.map(tab => {
          const isActive = logic.activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Contenu des onglets */}
      {logic.activeTab === 'classement' && (
        <ClassementTab
          ranking={logic.ranking}
          rankPeriod={logic.rankPeriod}
          setRankPeriod={logic.setRankPeriod}
          periodKey={logic.periodKey}
          rankingLoading={logic.rankingLoading}
          handleComputeRanking={logic.handleComputeRanking}
          computeRankingLoading={logic.computeRankingLoading}
        />
      )}
      {logic.activeTab === 'badges' && (
        <BadgesTab
          filteredBadges={logic.filteredBadges}
          badgeStats={logic.badgeStats}
          badgeCategoryFilter={logic.badgeCategoryFilter}
          setBadgeCategoryFilter={logic.setBadgeCategoryFilter}
          badgesLoading={logic.badgesLoading}
          handleSeedBadges={logic.handleSeedBadges}
          seedBadgesLoading={logic.seedBadgesLoading}
          handleEvaluateBadges={logic.handleEvaluateBadges}
          evaluateBadgesLoading={logic.evaluateBadgesLoading}
        />
      )}
      {logic.activeTab === 'mapping' && (
        <MappingTab
          mappingSuggestions={logic.mappingSuggestions}
          mappingStats={logic.mappingStats}
          mappingLoading={logic.mappingLoading}
          handleConfirmMapping={logic.handleConfirmMapping}
          confirmMappingLoading={logic.confirmMappingLoading}
          refetchMapping={logic.refetchMapping}
        />
      )}
      {logic.activeTab === 'offres' && (
        <OffresTab
          offres={logic.offres}
          offresLoading={logic.offresLoading}
          editingOffre={logic.editingOffre}
          setEditingOffre={logic.setEditingOffre}
          handleSyncOffres={logic.handleSyncOffres}
          syncOffresLoading={logic.syncOffresLoading}
          handleUpdateOffrePoints={logic.handleUpdateOffrePoints}
          handleUpdateBadgeProductKey={logic.handleUpdateBadgeProductKey}
          updatePointsLoading={logic.updatePointsLoading}
          updateBadgeKeyLoading={logic.updateBadgeKeyLoading}
        />
      )}
      {logic.activeTab === 'sync' && (
        <SyncTab
          syncResults={logic.syncResults}
          handleSyncContrats={logic.handleSyncContrats}
          syncContratsLoading={logic.syncContratsLoading}
          handleSyncOffres={logic.handleSyncOffres}
          syncOffresLoading={logic.syncOffresLoading}
          handleEvaluateBadges={logic.handleEvaluateBadges}
          evaluateBadgesLoading={logic.evaluateBadgesLoading}
          handleComputeRanking={logic.handleComputeRanking}
          computeRankingLoading={logic.computeRankingLoading}
          handleSeedBadges={logic.handleSeedBadges}
          seedBadgesLoading={logic.seedBadgesLoading}
          rankPeriod={logic.rankPeriod}
          periodKey={logic.periodKey}
        />
      )}
    </div>
  )
}
