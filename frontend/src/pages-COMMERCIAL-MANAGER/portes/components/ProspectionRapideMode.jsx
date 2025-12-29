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
  CheckCircle2,
  Circle,
  Sun,
  Moon,
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
  const [filterMode, setFilterMode] = useState('all') 
  
  // Pour le mode repassage
  const [showRepassageChoice, setShowRepassageChoice] = useState(false)
  
  // Calculer les portes filtrées selon le mode
  const filteredPortes = useMemo(() => {
    switch (filterMode) {
      case 'non_visitees':
        return portes.filter(p => p.statut === StatutPorte.NON_VISITE)
      case 'absents':
        return portes.filter(p => 
          p.statut === StatutPorte.ABSENT
        )
      case 'rdv':
        return portes.filter(p => p.statut === StatutPorte.RENDEZ_VOUS_PRIS)
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

  // Calculer les étages cibles pour l'affichage (Moved up to avoid hook order error)
  const previousFloorTarget = useMemo(() => {
    if (!currentPorte) return null
    for (let i = currentIndex - 1; i >= 0; i--) {
        if (filteredPortes[i].etage < currentPorte.etage) {
            return filteredPortes[i].etage
        }
    }
    return null
  }, [currentPorte, currentIndex, filteredPortes])

  const nextFloorTarget = useMemo(() => {
    if (!currentPorte) return null
    for (let i = currentIndex + 1; i < filteredPortes.length; i++) {
        if (filteredPortes[i].etage > currentPorte.etage) {
            return filteredPortes[i].etage
        }
    }
    return null
  }, [currentPorte, currentIndex, filteredPortes])
  
  // Navigation
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
    setShowCommentInput(false)
    setShowRepassageChoice(false)
  }, [])
  
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(filteredPortes.length - 1, prev + 1))
    setShowCommentInput(false)
    setShowRepassageChoice(false)
  }, [filteredPortes.length])
  
  const goToFirst = useCallback(() => {
    setCurrentIndex(0)
    setQuickComment('')
    setShowCommentInput(false)
  }, [])
  // Navigation par étage
  const goToPreviousFloor = useCallback(() => {
    if (!currentPorte) return
    const currentFloor = currentPorte.etage
    
    // Chercher la première porte de l'étage précédent dans la liste filtrée
    // On parcourt à l'envers depuis l'index actuel
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (filteredPortes[i].etage < currentFloor) {
        // On a trouvé un étage inférieur. Maintenant on cherche le DÉBUT de cet étage.
        const targetFloor = filteredPortes[i].etage
        // Remonter jusqu'au début de cet étage
        let targetIndex = i
        while (targetIndex > 0 && filteredPortes[targetIndex - 1].etage === targetFloor) {
          targetIndex--
        }
        setCurrentIndex(targetIndex)
        setQuickComment('')
        setShowCommentInput(false)
        return
      }
    }
  }, [currentIndex, filteredPortes, currentPorte])

  const goToNextFloor = useCallback(() => {
    if (!currentPorte) return
    const currentFloor = currentPorte.etage
    
    // Chercher la première porte de l'étage suivant
    for (let i = currentIndex + 1; i < filteredPortes.length; i++) {
      if (filteredPortes[i].etage > currentFloor) {
        setCurrentIndex(i) // C'est forcément la première de cet étage puisqu'on avance
        setQuickComment('')
        setShowCommentInput(false)
        return
      }
    }
  }, [currentIndex, filteredPortes.length, currentPorte])

  // Vérifier si navigation étage possible
  const canGoPreviousFloor = useMemo(() => {
    if (!currentPorte || currentIndex === 0) return false
    return filteredPortes.some((p, i) => i < currentIndex && p.etage < currentPorte.etage)
  }, [currentPorte, currentIndex, filteredPortes])

  const canGoNextFloor = useMemo(() => {
    if (!currentPorte || currentIndex >= filteredPortes.length - 1) return false
    return filteredPortes.some((p, i) => i > currentIndex && p.etage > currentPorte.etage)
  }, [currentPorte, currentIndex, filteredPortes])
  
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
  
  // Gestion du changement de statut: Si RDV ou Contrat, ouvrir le modal pour les détails , Si Absent, montrer le choix de repassage
  const handleStatusChange = useCallback(async (newStatut) => {
    if (!currentPorte) return
    
    if (newStatut === StatutPorte.RENDEZ_VOUS_PRIS || newStatut === StatutPorte.CONTRAT_SIGNE) {
      if (onOpenEditModal) {
        onOpenEditModal(currentPorte, newStatut, quickComment)
      }
      return
    }
    
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
      }, 1000)
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
  
  // Sauvegarder uniquement le commentaire
  const handleSaveComment = useCallback(async () => {
    if (!currentPorte) return
    
    // On garde le statut actuel
    const currentStatus = currentPorte.statut
    
    // On utilise le handler qui gère déjà la sauvegarde (statut + commentaire)
    // On passe le commentaire actuel
    await onQuickStatusChange(currentPorte, currentStatus, quickComment)
    
    // On ferme l'input et on vide (optionnel, selon préférence UX)
    setShowCommentInput(false)
    setQuickComment('')
  }, [currentPorte, quickComment, onQuickStatusChange])
  
  // Filters options
  const filterOptions = [
    { value: 'non_visitees', label: 'Non visitées', count: portes.filter(p => p.statut === StatutPorte.NON_VISITE).length },
    { value: 'absents', label: 'Absents', count: portes.filter(p =>p.statut === StatutPorte.ABSENT).length},
    { value: 'rendez_vous_pris', label: 'Rendez-vous pris', count: portes.filter(p => p.statut === StatutPorte.RENDEZ_VOUS_PRIS).length },
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
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${colors.primary.bgLight}`}>
            <Zap className={`h-5 w-5 ${colors.primary.text}`} />
          </div>
          <div>
            <h2 className={`font-bold text-lg ${base.text.primary}`}>Mode Rapide</h2>
            <p className={`text-xs ${base.text.muted}`}>{immeuble?.adresse}</p>
          </div>
        </div>
        
        {/* Filtres rapides */}
        <div className="flex flex-wrap gap-2 mb-2">
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
        <div className="space-y-1">
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
      <div className="flex-1 p-2 space-y-2">
        {/* Contrôles de navigation PREMIUM */}
        <div className="flex flex-col gap-2">
            {/* Navigation Étage (Premium Design) */}
            <div className="relative flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
               {/* Label Central (Absolu pour ne pas gêner le flex) */}
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Étage</span>
                    <span className="text-sm font-bold text-gray-800">
                      {currentPorte ? currentPorte.etage : '--'}
                    </span>
                  </div>
               </div>

               {/* Bouton Précédent */}
               <button
                  onClick={goToPreviousFloor}
                  disabled={!canGoPreviousFloor}
                  className={`
                    relative z-10 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                    ${canGoPreviousFloor 
                        ? 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md -translate-y-0 active:scale-95' 
                        : 'opacity-40 cursor-not-allowed grayscale'}
                  `}
               >
                  <div className={`
                    p-2 rounded-full transition-colors
                    ${canGoPreviousFloor ? 'bg-white shadow-sm text-blue-600' : 'bg-gray-100 text-gray-400'}
                  `}>
                    <ChevronsLeft className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-start min-w-[60px]">
                     <span className="text-[10px] font-bold opacity-60 uppercase">Précédent</span>
                     <span className="text-sm font-bold">
                        {previousFloorTarget !== null ? `Étage ${previousFloorTarget}` : '-'}
                     </span>
                  </div>
               </button>

               {/* Bouton Suivant */}
               <button
                  onClick={goToNextFloor}
                  disabled={!canGoNextFloor}
                  className={`
                    relative z-10 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-right
                    ${canGoNextFloor 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95' 
                        : 'bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed'}
                  `}
               >
                  <div className="flex flex-col items-end min-w-[60px]">
                     <span className={`text-[10px] font-bold uppercase ${canGoNextFloor ? 'opacity-80' : 'opacity-60'}`}>Suivant</span>
                     <span className="text-sm font-bold">
                        {nextFloorTarget !== null ? `Étage ${nextFloorTarget}` : '-'}
                     </span>
                  </div>
                  <div className={`
                    p-2 rounded-full transition-colors
                    ${canGoNextFloor ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-400'}
                  `}>
                    <ChevronsRight className="h-5 w-5" />
                  </div>
               </button>
            </div>
        </div>
        
        {/* Carte de la porte courante */}
        {currentPorte && (
          <Card className={`${base.bg.card} border-2 ${base.border.default} shadow-lg`}>
            <CardContent className="p-0">
              {/* Header: Compact Horizontal Layout */}
              <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Étage */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100/80 backdrop-blur-sm shrink-0">
                    <Building2 className="h-3 w-3 text-gray-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      Étage {currentPorte.etage}
                    </span>
                  </div>
                  
                  {/* Center: Porte Number/Name */}
                  <div className="text-center flex-1 min-w-0">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight truncate">
                      {currentPorte.nomPersonnalise || currentPorte.numero}
                    </h3>
                    {currentPorte.nomPersonnalise && (
                      <p className="text-[10px] font-medium text-gray-400">
                        Porte {currentPorte.numero}
                      </p>
                    )}
                  </div>
                  
                  {/* Right: Status Badge */}
                  <Badge className={`${statutInfo?.color || 'bg-gray-100 text-gray-700'} border-0 px-2.5 py-1 text-[10px] font-bold shadow-sm ring-1 ring-inset ring-black/5 shrink-0`}>
                    {StatutIcon && <StatutIcon className="h-3 w-3 mr-1" />}
                    {statutInfo?.label}
                  </Badge>
                </div>
              </div>

              {/* Info Section: Compact Horizontal */}
              <div className="px-4 py-2 bg-white">
                {/* Repassage Info - Horizontal Pills for ABSENT */}
                {currentPorte.statut === StatutPorte.ABSENT && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide shrink-0">Passages:</span>
                    <div className="flex gap-2 flex-1">
                      {/* 1er Passage */}
                      <div className={`
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border flex-1
                        ${currentPorte.nbRepassages >= 1 
                          ? 'bg-orange-50 border-orange-200' 
                          : 'bg-gray-50 border-gray-200 opacity-50'}
                      `}>
                        <div className={`p-1 rounded-full ${currentPorte.nbRepassages >= 1 ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-400'}`}>
                          <Sun className="h-3 w-3" />
                        </div>
                        <span className={`text-[10px] font-bold ${currentPorte.nbRepassages >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>Matin</span>
                        {currentPorte.nbRepassages >= 1 && <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />}
                      </div>
                      
                      {/* 2ème Passage */}
                      <div className={`
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border flex-1
                        ${currentPorte.nbRepassages >= 2 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-gray-50 border-gray-200 opacity-50'}
                      `}>
                        <div className={`p-1 rounded-full ${currentPorte.nbRepassages >= 2 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-400'}`}>
                          <Moon className="h-3 w-3" />
                        </div>
                        <span className={`text-[10px] font-bold ${currentPorte.nbRepassages >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>Soir</span>
                        {currentPorte.nbRepassages >= 2 && <CheckCircle2 className="h-3 w-3 text-indigo-500 ml-auto" />}
                      </div>
                    </div>
                  </div>
                )}

                {/* RDV Info - Inline */}
                {currentPorte.statut === StatutPorte.RENDEZ_VOUS_PRIS && currentPorte.rdvDate && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide shrink-0">RDV:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2.5 py-0.5 text-[10px]">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(currentPorte.rdvDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {currentPorte.rdvTime && ` • ${currentPorte.rdvTime}`}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Commentaire existant */}
              {currentPorte.commentaire && (
                <div className="px-4 pb-3">
                  <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-2.5 flex gap-2 shadow-sm">
                    <span className="text-sm select-none">📝</span>
                    <p className="text-[11px] font-medium text-gray-700 leading-relaxed italic">
                      "{currentPorte.commentaire}"
                    </p>
                  </div>
                </div>
              )}
              
              {/* Section Sélection Repassage (affichée si absent sélectionné) */}
              {showRepassageChoice && (
                <div className="mb-6 animate-in zoom-in-95 duration-200 px-4">
                  <div className="text-center mb-3">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Noter un passage</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRepassageSelect(1)}
                      className={`
                        group relative overflow-hidden p-4 rounded-2xl transition-all duration-300 border-2
                        ${(currentPorte.nbRepassages || 0) === 1
                          ? 'bg-orange-50 border-orange-500 shadow-md ring-2 ring-orange-200 ring-offset-2' 
                          : 'bg-white border-gray-100 hover:border-orange-200 hover:bg-orange-50/30'}
                      `}
                    >
                      <div className="relative z-10 flex flex-col items-center">
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">🌅</span>
                        <span className="font-bold text-gray-900">Matin</span>
                        <span className="text-xs text-gray-500">1er passage</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleRepassageSelect(2)}
                      className={`
                        group relative overflow-hidden p-4 rounded-2xl transition-all duration-300 border-2
                        ${(currentPorte.nbRepassages || 0) >= 2
                          ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-200 ring-offset-2' 
                          : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30'}
                      `}
                    >
                       <div className="relative z-10 flex flex-col items-center">
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">🌆</span>
                        <span className="font-bold text-gray-900">Soir</span>
                        <span className="text-xs text-gray-500">2ème passage</span>
                      </div>
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowRepassageChoice(false)}
                    className="w-full mt-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Ignorer pour l'instant
                  </button>
                </div>
              )}
              
              {/* Boutons d'action GÉANTS */}
              {!showRepassageChoice && (
                <>
                  <div className="grid grid-cols-3 gap-3 px-4 py-2">
                    {actionButtons.slice(0, 3).map(btn => {
                      const Icon = btn.icon
                      const isActive = currentPorte.statut === btn.statut
                      return (
                        <button
                          key={btn.statut}
                          onClick={() => handleStatusChange(btn.statut)}
                          className={`
                            flex flex-col items-center justify-center p-4 rounded-xl 
                            ${isActive ? btn.color + ' text-white ring-4 ring-offset-2' : 'bg-gray-100 text-gray-700'}
                            transition-all duration-200 active:scale-80
                            min-h-[80px]
                          `}
                        >
                          <Icon className="h-7 w-7 mb-2" />
                          <span className="font-bold text-xs">{btn.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 px-4 py-2">
                    {actionButtons.slice(3).map(btn => {
                      const Icon = btn.icon
                      const isActive = currentPorte.statut === btn.statut
                      return (
                        <button
                          key={btn.statut}
                          onClick={() => handleStatusChange(btn.statut)}
                          className={`
                            flex flex-col items-center justify-center p-4 rounded-xl 
                            ${isActive ? btn.color + ' text-white ring-4 ring-offset-2' : 'bg-gray-100 text-gray-700'}
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
              
              {/* Zone commentaire - REMOVED redundant display as requested. 
                  Only show the input trigger button if no comment is being typed yet to keep UI clean.
              */}
              <div className="mt-2 py-2 px-4">
                {!showCommentInput && (
                    <button
                      onClick={() => setShowCommentInput(true)}
                      className={`w-full py-3 rounded-lg border-2 border-dashed ${base.border.default} ${base.text.muted} hover:border-gray-400 transition-all flex items-center justify-center gap-2`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">Ajouter un commentaire rapide</span>
                    </button>
                )}
                
                {showCommentInput && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Commentaire rapide..."
                      value={quickComment}
                      onChange={e => setQuickComment(e.target.value)}
                      className="min-h-[80px]"
                      autoFocus
                    />
                    
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                                setShowCommentInput(false)
                            }}
                            className="flex-1"
                        >
                            Masquer
                        </Button>
                         <Button 
                            size="sm"
                            onClick={handleSaveComment}
                            disabled={!quickComment.trim()}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Save className="h-4 w-4 mr-1" />
                            Enregistrer note
                        </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Porte (Premium Design) - Moved below card */}
        <div className="relative flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
          {/* Progress Bar Background */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${((currentIndex + 1) / filteredPortes.length) * 100}%` }}
            />
          </div>

          {/* Bouton Précédent */}
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={`
              relative z-10 flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300
              ${currentIndex > 0
                ? 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md active:scale-95' 
                : 'opacity-40 cursor-not-allowed grayscale'}
            `}
          >
            <div className={`
              p-1.5 rounded-full transition-colors
              ${currentIndex > 0 ? 'bg-white shadow-sm text-blue-600' : 'bg-gray-100 text-gray-400'}
            `}>
              <ChevronLeft className="h-4 w-4" />
            </div>
            <div className="flex flex-col items-start min-w-[50px]">
              <span className="text-[9px] font-bold opacity-60 uppercase">Précédent</span>
              <span className="text-xs font-bold">
                {currentIndex > 0 ? `Porte ${filteredPortes[currentIndex - 1]?.numero || currentIndex}` : '-'}
              </span>
            </div>
          </button>

          {/* Center: Current Door Info */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Porte</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-gray-900">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  / {filteredPortes.length}
                </span>
              </div>
            </div>
          </div>

          {/* Bouton Suivant */}
          <button
            onClick={goToNext}
            disabled={currentIndex >= filteredPortes.length - 1}
            className={`
              relative z-10 flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300
              ${currentIndex < filteredPortes.length - 1
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95' 
                : 'bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed'}
            `}
          >
            <div className="flex flex-col items-end min-w-[50px]">
              <span className={`text-[9px] font-bold uppercase ${currentIndex < filteredPortes.length - 1 ? 'opacity-80' : 'opacity-60'}`}>Suivant</span>
              <span className="text-xs font-bold">
                {currentIndex < filteredPortes.length - 1 ? `Porte ${filteredPortes[currentIndex + 1]?.numero || currentIndex + 2}` : '-'}
              </span>
            </div>
            <div className={`
              p-1.5 rounded-full transition-colors
              ${currentIndex < filteredPortes.length - 1 ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-400'}
            `}>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>
        
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
