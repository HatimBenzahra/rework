import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Building2,
  ChevronRight,
  ChevronLeft,
  Clock,
  Calendar as CalendarIcon,
  RotateCcw,
} from 'lucide-react'
import { usePortesByImmeuble } from '@/hooks/use-api'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'
import { STATUT_OPTIONS } from '../portes/Statut_options'

const ITEMS_PER_PAGE = 8

/**
 * Composant pour un immeuble avec ses portes chargées
 */
function ImmeubleCard({ immeuble, periodFilter, onExpand, onVisibilityChange, shouldRender }) {
  const { data: portes, loading } = usePortesByImmeuble(immeuble.id)
  const { colors, base } = useCommercialTheme()

  // Fonctions utilitaires
  const getLastModifiedDate = () => {
    if (!portes?.length) return new Date(immeuble.updatedAt)
    const porteDates = portes.map(p => new Date(p.updatedAt).getTime())
    return new Date(Math.max(...porteDates))
  }

  const getRelativeTimeText = date => {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return "À l'instant"
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 30) return `Il y a ${days}j`
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const getModifiedPortesCount = () => {
    return portes?.filter(p => p.statut !== 'NON_VISITE').length || 0
  }

  // Filtrer par période
  const lastModified = portes?.length
    ? getLastModifiedDate().getTime()
    : new Date(immeuble.updatedAt).getTime()
  const now = Date.now()

  let shouldShow = false
  switch (periodFilter) {
    case '24h':
      shouldShow = now - lastModified < 24 * 60 * 60 * 1000
      break
    case '7d':
      shouldShow = now - lastModified < 7 * 24 * 60 * 60 * 1000
      break
    case '30d':
      shouldShow = now - lastModified < 30 * 24 * 60 * 60 * 1000
      break
    default:
      shouldShow = true
  }

  // Notifier la visibilité après le chargement
  React.useEffect(() => {
    if (!loading) {
      onVisibilityChange?.(immeuble.id, shouldShow && portes?.length > 0, lastModified)
    }
  }, [loading, shouldShow, portes, immeuble.id, onVisibilityChange, lastModified])

  // Ne rien afficher si chargement, ou pas dans la période, ou pas de portes, ou pas dans la page
  if (loading || !shouldShow || !portes?.length || !shouldRender) return null

  const modifiedCount = getModifiedPortesCount()

  return (
    <Card
      className={`${base.bg.card} ${base.border.card} cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]`}
      onClick={() => onExpand(immeuble.id, portes)}
      data-last-modified={lastModified}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl ${colors.primary.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}
          >
            <Building2 className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm sm:text-base ${base.text.primary} truncate`}>
              {immeuble.adresse}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0 h-5 flex items-center gap-1 bg-blue-50 text-blue-700"
              >
                {modifiedCount} modification{modifiedCount > 1 ? 's' : ''}
              </Badge>
              <span className={`text-xs ${base.text.muted} flex items-center gap-1`}>
                <Clock className="w-3 h-3" />
                {getRelativeTimeText(getLastModifiedDate())}
              </span>
            </div>
          </div>

          <ChevronRight className={`w-5 h-5 ${colors.primary.text} flex-shrink-0`} />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Page Historique - Affiche l'historique des immeubles avec portes modifiées
 */
export default function Historique() {
  const context = useOutletContext()
  const commercial = context?.commercial
  const { colors, base, getButtonClasses } = useCommercialTheme()
  const statutOptions = STATUT_OPTIONS()

  const [periodFilter, setPeriodFilter] = useState('all')
  const [expandedImmeubleId, setExpandedImmeubleId] = useState(null)
  const [expandedImmeublePortes, setExpandedImmeublePortes] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [visibleImmeubles, setVisibleImmeubles] = useState(new Map())

  const immeubles = commercial?.immeubles || []

  // Reset to page 1 when period filter changes
  React.useEffect(() => {
    setCurrentPage(1)
    setVisibleImmeubles(new Map())
  }, [periodFilter])

  // Callback pour tracker les immeubles visibles
  const handleVisibilityChange = React.useCallback((immeubleId, isVisible, lastModified) => {
    setVisibleImmeubles(prev => {
      const newMap = new Map(prev)
      if (isVisible) {
        newMap.set(immeubleId, lastModified)
      } else {
        newMap.delete(immeubleId)
      }
      return newMap
    })
  }, [])

  // Trier les IDs d'immeubles visibles par date de modification
  const sortedVisibleImmeubleIds = React.useMemo(() => {
    return Array.from(visibleImmeubles.entries())
      .sort(([, a], [, b]) => b - a) // Tri par timestamp décroissant
      .map(([id]) => id)
  }, [visibleImmeubles])

  // Pagination
  const totalPages = Math.ceil(sortedVisibleImmeubleIds.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedImmeubleIds = new Set(sortedVisibleImmeubleIds.slice(startIndex, endIndex))

  const handleExpand = (immeubleId, portes) => {
    setExpandedImmeubleId(immeubleId)
    setExpandedImmeublePortes(portes || [])
  }

  const selectedImmeuble = immeubles.find(imm => imm.id === expandedImmeubleId)

  // Fonctions utilitaires pour la vue détaillée
  const groupByEtage = portes => {
    return portes?.reduce((acc, porte) => {
      if (!acc[porte.etage]) acc[porte.etage] = []
      acc[porte.etage].push(porte)
      return acc
    }, {})
  }

  const getRelativeTimeText = date => {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return "À l'instant"
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 30) return `Il y a ${days}j`
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const getStatutIcon = statut => {
    const option = statutOptions.find(opt => opt.value === statut)
    if (!option) return null
    const Icon = option.icon
    const iconColor = option.iconColor || base.text.primary
    return <Icon className={`w-5 h-5 ${iconColor}`} />
  }

  const getStatutBadgeClass = statut => {
    const option = statutOptions.find(opt => opt.value === statut)
    return option?.badgeClass || ''
  }

  return (
    <div className="space-y-4">
      {/* Filtres temporels */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={periodFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriodFilter('all')}
          className={`${periodFilter === 'all' ? `${colors.primaryLight.bg} ${colors.black.text} hover:${colors.primaryLight.bg}` : getButtonClasses('outline')} text-xs sm:text-sm`}
        >
          Tout
        </Button>
        <Button
          variant={periodFilter === '24h' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriodFilter('24h')}
          className={`${periodFilter === '24h' ? `${colors.primaryLight.bg} ${colors.black.text} hover:${colors.primaryLight.bg}` : getButtonClasses('outline')} text-xs sm:text-sm`}
        >
          24 heures
        </Button>
        <Button
          variant={periodFilter === '7d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriodFilter('7d')}
          className={`${periodFilter === '7d' ? `${colors.primaryLight.bg} ${colors.black.text} hover:${colors.primaryLight.bg}` : getButtonClasses('outline')} text-xs sm:text-sm`}
        >
          7 jours
        </Button>
        <Button
          variant={periodFilter === '30d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriodFilter('30d')}
          className={`${periodFilter === '30d' ? `${colors.primaryLight.bg} ${colors.black.text} hover:${colors.primaryLight.bg}` : getButtonClasses('outline')} text-xs sm:text-sm`}
        >
          30 jours
        </Button>
      </div>

      {/* Liste des immeubles */}
      <div className="space-y-3">
        {immeubles.length === 0 ? (
          <Card className={`p-8 ${base.bg.card} ${base.border.card}`}>
            <div className="text-center">
              <Building2 className={`w-12 h-12 mx-auto mb-3 ${base.text.muted}`} />
              <p className={`text-sm ${base.text.muted}`}>Aucun immeuble trouvé</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Charger tous les immeubles pour déterminer la visibilité */}
            {immeubles.map(immeuble => (
              <ImmeubleCard
                key={immeuble.id}
                immeuble={immeuble}
                periodFilter={periodFilter}
                onExpand={handleExpand}
                onVisibilityChange={handleVisibilityChange}
                shouldRender={paginatedImmeubleIds.has(immeuble.id)}
              />
            ))}

            {/* Message si aucun immeuble visible après filtrage */}
            {sortedVisibleImmeubleIds.length === 0 && immeubles.length > 0 && (
              <Card className={`p-8 ${base.bg.card} ${base.border.card}`}>
                <div className="text-center">
                  <Building2 className={`w-12 h-12 mx-auto mb-3 ${base.text.muted}`} />
                  <p className={`text-sm ${base.text.muted}`}>
                    Aucun immeuble modifié pour cette période
                  </p>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Pagination controls */}
      {sortedVisibleImmeubleIds.length > ITEMS_PER_PAGE && (
        <div className="mt-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className={`text-sm ${base.text.muted}`}>
            Affichage de {startIndex + 1} à {Math.min(endIndex, sortedVisibleImmeubleIds.length)}{' '}
            sur {sortedVisibleImmeubleIds.length} immeuble
            {sortedVisibleImmeubleIds.length > 1 ? 's' : ''}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`${base.bg.card} ${base.border.card} border hover:${base.bg.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)

                if (!showPage) {
                  // Show ellipsis for skipped pages
                  if (
                    (page === currentPage - 2 && currentPage > 3) ||
                    (page === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <span key={page} className={`px-2 ${base.text.muted}`}>
                        ...
                      </span>
                    )
                  }
                  return null
                }

                return (
                  <Button
                    key={page}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={
                      currentPage === page
                        ? getButtonClasses('primary')
                        : `${base.bg.card} ${base.border.card} border hover:${base.bg.hover} min-w-[2.5rem] ${base.text.primary}`
                    }
                  >
                    {page}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`${base.bg.card} ${base.border.card} border hover:${base.bg.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de vue détaillée */}
      <Dialog open={expandedImmeubleId !== null} onOpenChange={() => setExpandedImmeubleId(null)}>
        <DialogContent
          className={`max-w-4xl max-h-[85vh] overflow-y-auto ${base.bg.card} border-0 shadow-xl`}
        >
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle
              className={`flex items-center gap-3 text-lg sm:text-xl ${base.text.primary}`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${colors.primary.bg} flex items-center justify-center`}
              >
                <Building2 className="w-5 h-5 text-white" />
              </div>
              {selectedImmeuble?.adresse}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {expandedImmeublePortes.length > 0 &&
              Object.entries(groupByEtage(expandedImmeublePortes))
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([etage, portes]) => (
                  <div key={etage} className="space-y-3">
                    <div
                      className={`sticky top-0 ${base.bg.card} py-2 border-b border-gray-200 flex items-center justify-between`}
                    >
                      <h4 className={`font-bold text-sm sm:text-base ${base.text.primary}`}>
                        Étage {etage}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {portes.length} porte{portes.length > 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      {portes
                        .sort((a, b) => a.numero.localeCompare(b.numero))
                        .map(porte => (
                          <Card
                            key={porte.id}
                            className={`${base.bg.card} ${base.border.card} overflow-hidden`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                                    {getStatutIcon(porte.statut)}
                                  </div>
                                  <div>
                                    <span
                                      className={`font-semibold text-sm sm:text-base ${base.text.primary}`}
                                    >
                                      Porte {porte.numero}
                                    </span>
                                    {porte.nomPersonnalise && (
                                      <p className={`text-xs ${base.text.muted} mt-0.5`}>
                                        {porte.nomPersonnalise}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <Badge className={getStatutBadgeClass(porte.statut)}>
                                    {statutOptions.find(opt => opt.value === porte.statut)?.label ||
                                      porte.statut}
                                  </Badge>
                                  <span
                                    className={`text-[10px] sm:text-xs ${base.text.muted} flex items-center gap-1`}
                                  >
                                    <CalendarIcon className="w-3 h-3" />
                                    {getRelativeTimeText(porte.updatedAt)}
                                  </span>
                                </div>
                              </div>

                              {/* Informations supplémentaires */}
                              {(porte.commentaire || porte.rdvDate || porte.nbRepassages > 0) && (
                                <div className="space-y-2 pt-3 border-t border-gray-100">
                                  {porte.commentaire && (
                                    <div className="flex gap-2">
                                      <p
                                        className={`text-xs sm:text-sm ${base.text.secondary} bg-gray-50 p-2 rounded-lg flex-1`}
                                      >
                                        💬 {porte.commentaire}
                                      </p>
                                    </div>
                                  )}

                                  {porte.rdvDate && (
                                    <div
                                      className={`flex items-center gap-2 text-xs sm:text-sm ${colors.primary.text} bg-blue-50 p-2 rounded-lg`}
                                    >
                                      <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                                      <span className="font-medium">
                                        RDV:{' '}
                                        {new Date(porte.rdvDate).toLocaleDateString('fr-FR', {
                                          weekday: 'long',
                                          day: 'numeric',
                                          month: 'long',
                                        })}
                                        {porte.rdvTime && ` à ${porte.rdvTime}`}
                                      </span>
                                    </div>
                                  )}

                                  {porte.nbRepassages > 0 && (
                                    <div
                                      className={`flex items-center gap-2 text-xs ${base.text.muted} bg-orange-50 p-2 rounded-lg`}
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>
                                        {porte.nbRepassages} repassage
                                        {porte.nbRepassages > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}

            {expandedImmeublePortes.length === 0 && (
              <div className="text-center py-12">
                <Building2 className={`w-16 h-16 mx-auto mb-4 ${base.text.muted} opacity-50`} />
                <p className={`text-sm ${base.text.muted}`}>Aucune porte pour cet immeuble</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
