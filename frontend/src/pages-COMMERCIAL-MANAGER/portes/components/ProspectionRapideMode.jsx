import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  UserX,
  X,
  Calendar,
  MessageSquare,
  FileSignature,
  List,
  Zap,
  SkipForward,
  Building2,
  RotateCcw,
  Filter,
  Save,
} from 'lucide-react'
import { useCommercialTheme } from '@/hooks/ui/use-commercial-theme'
import { StatutPorte } from '@/constants/domain/porte-status'

/**
 * Mode Prospection Rapide - Affiche une porte à la fois pour une mise à jour ultra-rapide
 */
export default function ProspectionRapideMode({
  portes = [],
  statsData,
  onQuickStatusChange,
  onSwitchToListMode,
  statutOptions,
  immeuble,
  onOpenEditModal,
  onRepassageChange,
}) {
  const { colors, base } = useCommercialTheme()
  
  // Index de la porte courante
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Commentaire rapide (inline)
  const [quickComment, setQuickComment] = useState('')
  const [showCommentInput, setShowCommentInput] = useState(false)
  
  // Auto-avancer après mise à jour
  const [autoAdvance, setAutoAdvance] = useState(true)
  
  // Filtre : type de portes à afficher
  const [filterMode, setFilterMode] = useState('non_visitees') // 'all' | 'non_visitees' | 'absents' | 'rdv'
  
  // Pour le mode repassage
  const [showRepassageChoice, setShowRepassageChoice] = useState(false)
  
  // Calculer les portes filtrées selon le mode
  const filteredPortes = useMemo(() => {
    switch (filterMode) {
      case 'non_visitees':
        return portes.filter(p => p.statut === StatutPorte.NON_VISITE)
      case 'absents':
        return portes.filter(p => 
          p.statut === StatutPorte.ABSENT || 
          p.statut === StatutPorte.NECESSITE_REPASSAGE
        )
      case 'rdv':
        return portes.filter(p => p.statut === StatutPorte.RENDEZ_VOUS_PRIS)
      case 'a_traiter':
        return portes.filter(p => 
          p.statut === StatutPorte.NON_VISITE || 
          p.statut === StatutPorte.ABSENT ||
          p.statut === StatutPorte.NECESSITE_REPASSAGE
        )
      default:
        return portes
    }
  }, [portes, filterMode])
  
  // Porte courante
  const currentPorte = filteredPortes[currentIndex]
  
  // Stats de progression
  const progressStats = useMemo(() => {
    const total = statsData?.totalPortes || portes.length
    const visited = total - (statsData?.nonVisitees || portes.filter(p => p.statut === StatutPorte.NON_VISITE).length)
    const percentage = total > 0 ? Math.round((visited / total) * 100) : 0
    return { total, visited, percentage, remaining: total - visited }
  }, [portes, statsData])
  
  // Navigation
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
    setQuickComment('')
    setShowCommentInput(false)
    setShowRepassageChoice(false)
  }, [])
  
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(filteredPortes.length - 1, prev + 1))
    setQuickComment('')
    setShowCommentInput(false)
    setShowRepassageChoice(false)
  }, [filteredPortes.length])
  
  const goToFirst = useCallback(() => {
    setCurrentIndex(0)
    setQuickComment('')
    setShowCommentInput(false)
  }, [])
  
  const goToLast = useCallback(() => {
    setCurrentIndex(filteredPortes.length - 1)
    setQuickComment('')
    setShowCommentInput(false)
  }, [filteredPortes.length])
  
  // Trouver la prochaine porte non visitée
  const findNextUnvisited = useCallback(() => {
    for (let i = currentIndex + 1; i < filteredPortes.length; i++) {
      if (filteredPortes[i].statut === StatutPorte.NON_VISITE) {
        return i
      }
    }
    // Si aucune après, chercher depuis le début
    for (let i = 0; i < currentIndex; i++) {
      if (filteredPortes[i].statut === StatutPorte.NON_VISITE) {
        return i
      }
    }
    return -1
  }, [currentIndex, filteredPortes])
  
  // Gestion du changement de statut
  const handleStatusChange = useCallback(async (newStatut) => {
    if (!currentPorte) return
    
    // Si RDV ou Contrat, ouvrir le modal pour les détails
    if (newStatut === StatutPorte.RENDEZ_VOUS_PRIS || newStatut === StatutPorte.CONTRAT_SIGNE) {
      if (onOpenEditModal) {
        onOpenEditModal(currentPorte, newStatut, quickComment)
      }
      return
    }
    
    // Si Absent, montrer le choix de repassage
    if (newStatut === StatutPorte.ABSENT) {
      setShowRepassageChoice(true)
      // Mettre d'abord le statut à ABSENT
      await onQuickStatusChange(currentPorte, newStatut, quickComment)
      return
    }
    
    // Pour les autres statuts, mise à jour rapide
    await onQuickStatusChange(currentPorte, newStatut, quickComment)
    
    // Auto-avancer si activé
    if (autoAdvance) {
      setTimeout(() => {
        const nextIndex = findNextUnvisited()
        if (nextIndex >= 0) {
          setCurrentIndex(nextIndex)
        } else if (currentIndex < filteredPortes.length - 1) {
          goToNext()
        }
        setQuickComment('')
        setShowCommentInput(false)
        setShowRepassageChoice(false)
      }, 300)
    }
  }, [currentPorte, onQuickStatusChange, autoAdvance, findNextUnvisited, goToNext, onOpenEditModal, quickComment, currentIndex, filteredPortes.length])
  
  // Gestion du repassage
  const handleRepassageSelect = useCallback(async (nbRepassages) => {
    if (!currentPorte || !onRepassageChange) return
    
    const diff = nbRepassages - (currentPorte.nbRepassages || 0)
    if (diff !== 0) {
      await onRepassageChange(currentPorte, diff)
    }
    
    setShowRepassageChoice(false)
    
    // Auto-avancer
    if (autoAdvance) {
      setTimeout(() => {
        const nextIndex = findNextUnvisited()
        if (nextIndex >= 0) {
          setCurrentIndex(nextIndex)
        } else if (currentIndex < filteredPortes.length - 1) {
          goToNext()
        }
        setQuickComment('')
        setShowCommentInput(false)
      }, 300)
    }
  }, [currentPorte, onRepassageChange, autoAdvance, findNextUnvisited, goToNext, currentIndex, filteredPortes.length])
  
  // Reset l'index si les portes filtrées changent
  useEffect(() => {
    if (currentIndex >= filteredPortes.length) {
      setCurrentIndex(Math.max(0, filteredPortes.length - 1))
    }
  }, [filteredPortes.length, currentIndex])
  
  // Reset quand on change de filtre
  useEffect(() => {
    setCurrentIndex(0)
    setShowRepassageChoice(false)
    setShowCommentInput(false)
    setQuickComment('')
  }, [filterMode])
  
  // Filters options
  const filterOptions = [
    { value: 'non_visitees', label: 'Non visitées', count: portes.filter(p => p.statut === StatutPorte.NON_VISITE).length },
    { value: 'absents', label: 'Absents', count: portes.filter(p => p.statut === StatutPorte.ABSENT || p.statut === StatutPorte.NECESSITE_REPASSAGE).length },
    { value: 'a_traiter', label: 'À traiter', count: portes.filter(p => p.statut === StatutPorte.NON_VISITE || p.statut === StatutPorte.ABSENT || p.statut === StatutPorte.NECESSITE_REPASSAGE).length },
    { value: 'rdv', label: 'RDV', count: portes.filter(p => p.statut === StatutPorte.RENDEZ_VOUS_PRIS).length },
    { value: 'all', label: 'Toutes', count: portes.length },
  ]
  
  // Si aucune porte à afficher
  if (filteredPortes.length === 0) {
    return (
      <div className="flex flex-col min-h-[60vh]">
        {/* Header */}
        <div className={`${base.bg.card} border-b ${base.border.default} p-4 rounded-t-xl`}>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colors.primary.bgLight}`}>
                <Zap className={`h-5 w-5 ${colors.primary.text}`} />
              </div>
              <div>
                <h2 className={`font-bold text-lg ${base.text.primary}`}>Mode Rapide</h2>
                <p className={`text-xs ${base.text.muted}`}>{immeuble?.adresse}</p>
              </div>
            </div>
          </div>
          
          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterMode(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterMode === opt.value 
                    ? `${colors.primary.bg} text-white` 
                    : `${base.bg.muted} ${base.text.muted} hover:${base.bg.card}`
                }`}
              >
                {opt.label} ({opt.count})
              </button>
            ))}
          </div>
        </div>
        
        {/* Message vide */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className={`p-6 rounded-full ${colors.success.bgLight} mb-6`}>
            <FileSignature className={`h-16 w-16 ${colors.success.text}`} />
          </div>
          <h2 className={`text-2xl font-bold ${base.text.primary} mb-3 text-center`}>
            🎉 Aucune porte dans ce filtre !
          </h2>
          <p className={`${base.text.muted} text-center mb-6`}>
            {filterMode === 'non_visitees' && "Toutes les portes ont été visitées."}
            {filterMode === 'absents' && "Aucun absent à repasser."}
            {filterMode === 'rdv' && "Aucun RDV en attente."}
            {filterMode === 'a_traiter' && "Toutes les portes ont été traitées !"}
            {filterMode === 'all' && "Aucune porte disponible."}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setFilterMode('all')}
              className="h-12"
            >
              Voir toutes les portes
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  const statutInfo = statutOptions.find(o => o.value === currentPorte?.statut) || statutOptions[0]
  const StatutIcon = statutInfo?.icon
  
  const needsRepassage = currentPorte?.statut === StatutPorte.ABSENT || currentPorte?.statut === StatutPorte.NECESSITE_REPASSAGE
  
  // Boutons d'action avec leurs configs
  const actionButtons = [
    { 
      statut: StatutPorte.ABSENT, 
      label: 'Absent', 
      icon: UserX,
      color: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700',
    },
    { 
      statut: StatutPorte.REFUS, 
      label: 'Refus', 
      icon: X,
      color: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    },
    { 
      statut: StatutPorte.RENDEZ_VOUS_PRIS, 
      label: 'RDV', 
      icon: Calendar,
      color: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    },
    { 
      statut: StatutPorte.ARGUMENTE, 
      label: 'Argumenté', 
      icon: MessageSquare,
      color: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700',
    },
    { 
      statut: StatutPorte.CONTRAT_SIGNE, 
      label: 'Contrat', 
      icon: FileSignature,
      color: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
    },
  ]

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* Header avec barre de progression */}
      <div className={`${base.bg.card} border-b ${base.border.default} p-4 rounded-t-xl`}>
        {/* Titre */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${colors.primary.bgLight}`}>
            <Zap className={`h-5 w-5 ${colors.primary.text}`} />
          </div>
          <div>
            <h2 className={`font-bold text-lg ${base.text.primary}`}>Mode Rapide</h2>
            <p className={`text-xs ${base.text.muted}`}>{immeuble?.adresse}</p>
          </div>
        </div>
        
        {/* Filtres rapides */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Filter className={`h-4 w-4 ${base.text.muted} self-center`} />
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterMode(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterMode === opt.value 
                  ? `${colors.primary.bg} text-white shadow-md` 
                  : `${base.bg.muted} ${base.text.muted} hover:opacity-80`
              }`}
            >
              {opt.label} ({opt.count})
            </button>
          ))}
        </div>
        
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={base.text.muted}>Progression globale</span>
            <span className={`font-bold ${colors.primary.text}`}>
              {progressStats.visited}/{progressStats.total} ({progressStats.percentage}%)
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${colors.primary.bg} transition-all duration-500 ease-out`}
              style={{ width: `${progressStats.percentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Navigation et porte courante */}
      <div className="flex-1 p-4 space-y-4">
        {/* Contrôles de navigation */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goToFirst}
              disabled={currentIndex === 0}
              className="h-10 w-10"
            >
              <ChevronsLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="text-center">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {currentIndex + 1} / {filteredPortes.length}
            </Badge>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex >= filteredPortes.length - 1}
              className="h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToLast}
              disabled={currentIndex >= filteredPortes.length - 1}
              className="h-10 w-10"
            >
              <ChevronsRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Carte de la porte courante */}
        {currentPorte && (
          <Card className={`${base.bg.card} border-2 ${base.border.default} shadow-lg`}>
            <CardContent className="p-5">
              {/* Info porte */}
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building2 className={`h-5 w-5 ${base.text.muted}`} />
                  <span className={`text-sm ${base.text.muted}`}>Étage {currentPorte.etage}</span>
                </div>
                <h3 className={`text-2xl font-bold ${base.text.primary} mb-1`}>
                  {currentPorte.nomPersonnalise || `Porte ${currentPorte.numero}`}
                </h3>
                {currentPorte.nomPersonnalise && (
                  <p className={`text-sm ${base.text.muted}`}>N° {currentPorte.numero}</p>
                )}
                
                {/* Badge statut actuel */}
                <div className="mt-3 flex justify-center">
                  <Badge className={`${statutInfo.color} text-sm px-4 py-1.5`}>
                    {StatutIcon && <StatutIcon className="h-4 w-4 mr-2" />}
                    {statutInfo.label}
                  </Badge>
                </div>
                
                {/* Info repassage */}
                {needsRepassage && currentPorte.nbRepassages > 0 && (
                  <div className={`mt-3 ${colors.warning.bgLight} rounded-lg p-2 inline-flex items-center gap-2`}>
                    <RotateCcw className={`h-4 w-4 ${colors.warning.text}`} />
                    <span className={`text-sm font-medium ${colors.warning.text}`}>
                      {currentPorte.nbRepassages === 1 ? '1er passage effectué' : '2ème passage effectué'}
                    </span>
                  </div>
                )}
                
                {/* Info RDV */}
                {currentPorte.rdvDate && (
                  <div className={`mt-3 ${colors.primary.bgLight} rounded-lg p-2 inline-flex items-center gap-2`}>
                    <Calendar className={`h-4 w-4 ${colors.primary.text}`} />
                    <span className={`text-sm ${colors.primary.text}`}>
                      RDV: {new Date(currentPorte.rdvDate).toLocaleDateString('fr-FR')}
                      {currentPorte.rdvTime && ` à ${currentPorte.rdvTime}`}
                    </span>
                  </div>
                )}
                
                {/* Commentaire existant */}
                {currentPorte.commentaire && !showCommentInput && (
                  <div className={`mt-3 ${base.bg.muted} rounded-lg p-3 text-left`}>
                    <p className={`text-xs ${base.text.muted} mb-1`}>💬 Commentaire :</p>
                    <p className={`text-sm ${base.text.secondary}`}>{currentPorte.commentaire}</p>
                  </div>
                )}
              </div>
              
              {/* Section Repassage (affichée si absent sélectionné) */}
              {showRepassageChoice && (
                <div className={`mb-4 p-4 ${colors.warning.bgLight} rounded-xl border ${colors.warning.border}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <RotateCcw className={`h-5 w-5 ${colors.warning.text}`} />
                    <span className={`font-bold ${colors.warning.text}`}>Quel passage ?</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRepassageSelect(1)}
                      className={`p-4 rounded-xl transition-all ${
                        (currentPorte.nbRepassages || 0) === 1
                          ? 'bg-orange-500 text-white shadow-lg'
                          : 'bg-white hover:bg-orange-50 text-gray-700 border border-orange-200'
                      }`}
                    >
                      <span className="text-2xl block mb-1">🌅</span>
                      <span className="font-bold text-sm">1er Passage</span>
                      <span className="text-xs block opacity-70">Matin</span>
                    </button>
                    <button
                      onClick={() => handleRepassageSelect(2)}
                      className={`p-4 rounded-xl transition-all ${
                        (currentPorte.nbRepassages || 0) >= 2
                          ? 'bg-orange-500 text-white shadow-lg'
                          : 'bg-white hover:bg-orange-50 text-gray-700 border border-orange-200'
                      }`}
                    >
                      <span className="text-2xl block mb-1">🌆</span>
                      <span className="font-bold text-sm">2ème Passage</span>
                      <span className="text-xs block opacity-70">Soir</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowRepassageChoice(false)}
                    className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Passer cette étape
                  </button>
                </div>
              )}
              
              {/* Boutons d'action GÉANTS */}
              {!showRepassageChoice && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {actionButtons.slice(0, 3).map(btn => {
                      const Icon = btn.icon
                      const isActive = currentPorte.statut === btn.statut
                      return (
                        <button
                          key={btn.statut}
                          onClick={() => handleStatusChange(btn.statut)}
                          className={`
                            flex flex-col items-center justify-center p-4 rounded-xl 
                            ${isActive ? btn.color + ' text-white ring-4 ring-offset-2' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                            transition-all duration-200 active:scale-95
                            min-h-[85px]
                          `}
                        >
                          <Icon className="h-7 w-7 mb-2" />
                          <span className="font-bold text-xs">{btn.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {actionButtons.slice(3).map(btn => {
                      const Icon = btn.icon
                      const isActive = currentPorte.statut === btn.statut
                      return (
                        <button
                          key={btn.statut}
                          onClick={() => handleStatusChange(btn.statut)}
                          className={`
                            flex flex-col items-center justify-center p-4 rounded-xl 
                            ${isActive ? btn.color + ' text-white ring-4 ring-offset-2' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                            transition-all duration-200 active:scale-95
                            min-h-[85px]
                          `}
                        >
                          <Icon className="h-7 w-7 mb-2" />
                          <span className="font-bold text-xs">{btn.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
              
              {/* Zone commentaire */}
              <div className="mt-4">
                {!showCommentInput ? (
                  <button
                    onClick={() => setShowCommentInput(true)}
                    className={`w-full py-3 rounded-lg border-2 border-dashed ${base.border.default} ${base.text.muted} hover:border-gray-400 transition-all flex items-center justify-center gap-2`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">Ajouter un commentaire rapide</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Commentaire sur cette porte..."
                      value={quickComment}
                      onChange={(e) => setQuickComment(e.target.value)}
                      className="min-h-[80px] text-sm resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCommentInput(false)
                          setQuickComment('')
                        }}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowCommentInput(false)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        OK
                      </Button>
                    </div>
                    <p className={`text-xs ${base.text.muted} text-center`}>
                      Le commentaire sera enregistré avec le prochain statut
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Options */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className={`text-sm ${base.text.muted}`}>
              <SkipForward className="h-4 w-4 inline mr-1" />
              Auto-avancer
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
