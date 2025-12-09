import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Building2, Clock, RotateCcw, Calendar, Plus, Minus } from 'lucide-react'

import { useCommercialTheme } from '@/hooks/ui/use-commercial-theme'
import { useRecording } from '@/hooks/audio/useRecording'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { useRole } from '@/contexts/userole'
import {
  useInfinitePortesByImmeuble,
  useImmeuble,
  useUpdatePorte,
  useAddEtageToImmeuble,
  useAddPorteToEtage,
  usePorteStatistics,
} from '@/hooks/metier/use-api'
import { STATUT_OPTIONS } from './Statut_options'
import PortesTemplate from './components/PortesTemplate'
import EditPorteModal from './components/EditPorteModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Page de gestion des portes d'un immeuble
 * Utilise le contexte du layout parent (CommercialLayout)
 */
export default function PortesGestion() {
  const { immeubleId } = useParams()
  const navigate = useNavigate()
  const { currentUserId, isManager } = useRole()

  // Récupère la ref de scroll depuis le layout (fallback possible si non fourni)
  const { scrollContainerRef, audioStatus } = useOutletContext() || {}

  // Déterminer le type d'utilisateur
  const userType = isManager ? 'manager' : 'commercial'

  // Hook d'enregistrement automatique (attend la connexion audio)
  const {
    isRecording: _isRecording,
    isStarting: _isStarting,
    error: _recordingError,
  } = useRecording(
    parseInt(currentUserId),
    userType,
    true,
    audioStatus?.audioConnected,
    parseInt(immeubleId, 10)
  )

  // Hook pour le thème commercial - centralise TOUS les styles
  const { colors, base, getButtonClasses } = useCommercialTheme()

  // Hook pour les toasts
  const { showError, showSuccess } = useErrorToast()

  // Configuration des statuts avec les couleurs du thème (mémo pour éviter recréations)
  const statutOptions = useMemo(() => STATUT_OPTIONS(), [])

  const [selectedPorte, setSelectedPorte] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Filtres (lecture/écriture localStorage sécurisée)
  const [activeFilters, setActiveFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(`filters-${immeubleId}`)
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(`filters-${immeubleId}`, JSON.stringify(activeFilters))
    } catch {
      /* ignore */
    }
  }, [activeFilters, immeubleId])

  const [editForm, setEditForm] = useState({
    statut: '',
    commentaire: '',
    rdvDate: '',
    rdvTime: '',
    nomPersonnalise: '',
  })

  const etageSelecteurRef = useRef(null)

  // Données
  // Filters
  const [selectedFloor, setSelectedFloor] = useState(null)

  // Données
  const {
    data: portes,
    loading: portesLoading,
    error: portesError,
    refetch,
    loadMore,
    hasMore,
    isFetchingMore,
    updateLocalData // NEW: Optimistic support
  } = useInfinitePortesByImmeuble(parseInt(immeubleId, 10), 20, selectedFloor)

  const { data: statsData, refetch: refetchStats } = usePorteStatistics(parseInt(immeubleId, 10))

  useEffect(() => {
    const handleScroll = () => {
      // Priorité 1: Ref du container principal (passé via contexte)
      // Priorité 2: Fallback sur window (si pas de layout complexe)
      const container = scrollContainerRef?.current

      if (container) {
          const { scrollTop, scrollHeight, clientHeight } = container
          if (
            scrollTop + clientHeight >= scrollHeight - 500 &&
            !portesLoading &&
            hasMore
          ) {
            // Sauvegarder la position avant le chargement
            const savedScrollTop = container.scrollTop

            loadMore().then(() => {
              // Restaurer la position après le chargement
              requestAnimationFrame(() => {
                if (container.scrollTop < savedScrollTop) {
                  container.scrollTop = savedScrollTop
                }
              })
            })
          }
      } else {
        // Fallback window
        if (
          window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 500 &&
          !portesLoading &&
          hasMore
        ) {
          loadMore()
        }
      }
    }

    const container = scrollContainerRef?.current
    if (container) {
        container.addEventListener('scroll', handleScroll)
        // Check initial load automatically (if screen large enough)
        handleScroll()
    } else {
        window.addEventListener('scroll', handleScroll)
    }

    return () => {
        if (container) {
            container.removeEventListener('scroll', handleScroll)
        } else {
            window.removeEventListener('scroll', handleScroll)
        }
    }
  }, [
    scrollContainerRef, 
    loadMore, 
    portesLoading, 
    hasMore,
    selectedFloor // Stop infinite scroll if we are filtered on a precise floor? 
    // Actually current hook implementation will loadMore PAGES of that floor if floor has many doors (e.g. >20)
    // So logic remains valid.
  ])

  const { data: immeuble, loading: immeubleLoading, refetch: refetchImmeuble } = useImmeuble(
    parseInt(immeubleId, 10)
  )

  // Mutations
  const { mutate: updatePorte } = useUpdatePorte()
  const { mutate: addEtage } = useAddEtageToImmeuble()
  const { mutate: addPorteToEtage } = useAddPorteToEtage()

  // States locaux pour gérer le loading des boutons
  const [addingEtage, setAddingEtage] = useState(false)
  const [addingPorteToEtage, setAddingPorteToEtage] = useState(false)

  // Helper scroll robust (utilise ref du layout; fallback sur querySelector)
  const withScrollRestore = useCallback(
    async fn => {
      const el = scrollContainerRef?.current || document.querySelector('.portes-scroll-container')
      const y = el?.scrollTop ?? 0
      await fn()
      // double rAF pour laisser le DOM se peindre après refetch
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (el) el.scrollTop = y
        })
      )
    },
    [scrollContainerRef]
  )

  // Handlers filtres (stables)
  const toggleFilter = useCallback(filterValue => {
    setActiveFilters(prev =>
      prev.includes(filterValue) ? prev.filter(f => f !== filterValue) : [...prev, filterValue]
    )
  }, [])



  // Comptes par statut mémoïsés (évite filter répétés par bouton)
  const statusCounts = useMemo(() => {
    if (statsData) {
        const m = new Map()
        m.set('NON_VISITE', statsData.nonVisitees)
        m.set('CONTRAT_SIGNE', statsData.contratsSigne)
        m.set('RENDEZ_VOUS_PRIS', statsData.rdvPris)
        m.set('ABSENT', statsData.absent)
        m.set('ARGUMENTE', statsData.argumente)
        m.set('REFUS', statsData.refus)
        return { byStatus: m, totalSansContrat: statsData.totalPortes - statsData.contratsSigne }
    }
    
    // Fallback local (loading state)
    const m = new Map()
    let totalSansContrat = 0
    for (const p of portes) {
      m.set(p.statut, (m.get(p.statut) || 0) + 1)
      if (p.statut !== 'CONTRAT_SIGNE') totalSansContrat++
    }
    return { byStatus: m, totalSansContrat }
  }, [portes, statsData])

  const clearAllFilters = useCallback(() => {
    setActiveFilters([])
    setSelectedFloor(null)
  }, [])

  // Callbacks
  const handleFloorSelect = useCallback((etage) => {
    // If clicking same floor, toggle off
    if (selectedFloor === etage) {
        setSelectedFloor(null)
    } else {
        setSelectedFloor(etage)
    }
  }, [selectedFloor])

  const filteredPortes = useMemo(() => {
    let result = portes
    
    // Si on a un étage sélectionné, le hook filtre déjà les données (serveur)
    // Mais si on avait des données en cache pour d'autres étages, on pourrait vouloir filtrer ici aussi
    // Dans notre cas, le hook reset les données quand l'étage change, donc 'portes' contient déjà
    // uniquement l'étage voulu (ou tous si null).
    
    // Filtrage local par statut
    if (activeFilters.length > 0) {
      result = result.filter(porte => activeFilters.includes(porte.statut))
    }

    return result
  }, [portes, activeFilters])

  // ... (handleEditPorte code omitted, assuming it's unchanged if not in range, but I must be careful with replace)
  // Actually, I should only replace the statusCounts part and the customFilters part. 
  // Let me do statusCounts first separately or include customFilters if they are close.
  // They are somewhat far apart. Let's do statusCounts first.

  const handleEditPorte = useCallback(porte => {
    setSelectedPorte(porte)
    setEditForm({
      statut: porte.statut,
      commentaire: porte.commentaire || '',
      rdvDate: porte.rdvDate ? porte.rdvDate.split('T')[0] : '',
      rdvTime: porte.rdvTime || '',
      nomPersonnalise: porte.nomPersonnalise || '',
    })
    setIsSaving(false)
    setShowEditModal(true)
  }, [])

  const handleSavePorte = useCallback(async () => {
    if (!selectedPorte || isSaving) return
    setIsSaving(true)

    const updateData = {
      id: selectedPorte.id,
      statut: editForm.statut,
      commentaire: editForm.commentaire.trim() || null,
      nomPersonnalise: editForm.nomPersonnalise.trim() || null,
      derniereVisite: new Date().toISOString(),
    }
    if (editForm.statut === 'RENDEZ_VOUS_PRIS') {
      if (editForm.rdvDate) updateData.rdvDate = editForm.rdvDate
      if (editForm.rdvTime) updateData.rdvTime = editForm.rdvTime
    }

    try {
      await withScrollRestore(async () => {
        await updatePorte(updateData)
        await refetch()
      })
      setShowEditModal(false)
      setSelectedPorte(null)
      showSuccess('Porte mise à jour avec succès !')
    } catch (error) {
      console.error('Error updating porte:', error)
      showError(error, 'Mise à jour porte')
    } finally {
      setIsSaving(false)
    }
  }, [
    selectedPorte,
    isSaving,
    editForm,
    updatePorte,
    refetch,
    withScrollRestore,
    showSuccess,
    showError,
  ])

  // Changement rapide de statut
  const handleQuickStatusChange = useCallback(
    async (porte, newStatut) => {
      // 1. Optimistic UI Update (Immediate)
      updateLocalData(porte.id, { statut: newStatut, derniereVisite: new Date().toISOString() })

      if (newStatut === 'RENDEZ_VOUS_PRIS') {
        setSelectedPorte(porte)
        setEditForm({
          statut: newStatut,
          commentaire: porte.commentaire || '',
          rdvDate: new Date().toISOString().split('T')[0],
          rdvTime: new Date().toTimeString().slice(0, 5),
          nomPersonnalise: porte.nomPersonnalise || '',
        })
        setShowEditModal(true)
        return
      }

      const updateData = {
        id: porte.id,
        statut: newStatut,
        derniereVisite: new Date().toISOString(),
      }

      try {
        // 2. Call API (Offline-ready mutation will queue if needed)
        await updatePorte(updateData)
        // Only refetch stats, not the full porte list (already updated optimistically)
        if (navigator.onLine && refetchStats) {
          await refetchStats()
        }
      } catch (error) {
        console.error('Error updating porte status:', error)
        showError(error, 'Mise à jour statut')
        // En cas d'erreur, on refetch pour revenir à l'état serveur
        if (navigator.onLine) {
          await refetch()
        }
      }
    },
    [updatePorte, refetch, refetchStats, updateLocalData, showSuccess, showError]
  )

  // Repassages +/-
  const handleRepassageChange = useCallback(
    async (porte, increment) => {
      const newNbRepassages = Math.max(0, (porte.nbRepassages || 0) + increment)
      const updateData = { id: porte.id, nbRepassages: newNbRepassages }

      // 1. Optimistic UI Update
      updateLocalData(porte.id, { nbRepassages: newNbRepassages })
      if (selectedPorte && selectedPorte.id === porte.id) {
          setSelectedPorte(prev => ({ ...prev, nbRepassages: newNbRepassages }))
      }

      try {
        await updatePorte(updateData)
        // Only refetch stats, not the full porte list (already updated optimistically)
        if (navigator.onLine && refetchStats) {
          await refetchStats()
        }
      } catch (error) {
        console.error('Error updating repassages:', error)
        showError(error, 'Mise à jour repassages')
        // En cas d'erreur, on refetch pour revenir à l'état serveur
        if (navigator.onLine) {
          await refetch()
        }
      }
    },
    [updatePorte, refetch, refetchStats, withScrollRestore, showError, selectedPorte]
  )

  // Navigation avec arrêt automatique de l'enregistrement
  const handleBackToImmeubles = useCallback(() => {
    // L'enregistrement s'arrêtera automatiquement via le hook useRecording
    // quand le composant se démonte (enabled devient false)
    navigate('/immeubles')
  }, [navigate])

  // Ajout d'étage
  const handleAddEtage = useCallback(async () => {
    if (!immeubleId || addingEtage) return
    setAddingEtage(true)
    try {
      await withScrollRestore(async () => {
        await addEtage(parseInt(immeubleId, 10))
        await Promise.all([refetch(), refetchImmeuble()])
      })
      showSuccess('Étage ajouté avec succès !')
    } catch (error) {
      console.error('Error adding etage:', error)
      showError(error, 'Ajout étage')
    } finally {
      setAddingEtage(false)
    }
  }, [
    immeubleId,
    addingEtage,
    addEtage,
    refetch,
    withScrollRestore,
    showSuccess,
    showError,
    refetchImmeuble,
  ])

  // Ajout d'une porte sur un étage donné
  const handleAddPorteToEtage = useCallback(
    async etage => {
      if (!immeubleId || addingPorteToEtage) return
      setAddingPorteToEtage(true)
      try {
        await withScrollRestore(async () => {
          await addPorteToEtage({ immeubleId: parseInt(immeubleId, 10), etage })
          await await Promise.all([refetch(), refetchImmeuble()])
        })
        showSuccess('Porte ajoutée avec succès !')
      } catch (error) {
        console.error('Error adding porte to etage:', error)
        showError(error, 'Ajout porte')
      } finally {
        setAddingPorteToEtage(false)
      }
    },
    [
      immeubleId,
      addingPorteToEtage,
      addPorteToEtage,
      refetch,
      withScrollRestore,
      showSuccess,
      showError,
      refetchImmeuble,
    ]
  )
  
  // Composant personnalisé pour les filtres supplémentaires - DESIGN PREMIUM AMÉLIORÉ
  const customFilters = useMemo(
    () => (
      <div
        ref={etageSelecteurRef}
        className="mb-6 space-y-4"
      >
        {/* Info Immeuble - Carte épurée */}
        <div className={`${base.bg.card} border ${base.border.default} rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4`}>
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.primary.bgLight}`}>
                  <Building2 className={`h-5 w-5 ${colors.primary.text}`} />
                </div>
                <div>
                   <h3 className={`text-sm font-bold ${base.text.primary}`}>Vue d'ensemble</h3>
                   {immeuble && (
                      <p className={`text-xs ${base.text.muted}`}>
                        {selectedFloor ? `Étage ${selectedFloor} • ` : ''}
                        {immeuble.nbEtages} étages • {immeuble.nbPortesParEtage} portes/étage • Total: {statsData ? statsData.totalPortes : portes.length} portes
                      </p>
                    )}
                </div>
             </div>
             
             {/* Filtre global */}
             {activeFilters.length > 0 && (
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  Effacer les filtres
                </Button>
             )}
        </div>

        {/* Filtres par statut - Design pills horizontal scrollable */}
        <div className="space-y-2">
           <h3 className={`text-xs font-bold uppercase tracking-wider ${base.text.muted} ml-1`}>Filtrer par statut</h3>
           <div className="flex flex-wrap gap-2">
            {/* Bouton "Tout voir" */}
            <button
              onClick={clearAllFilters}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                activeFilters.length === 0
                  ? `${colors.primary.bg} text-white border-transparent shadow-md`
                  : `${base.bg.card} ${base.text.muted} ${base.border.default} hover:border-gray-300`
              }`}
            >
              <span>Tout voir</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeFilters.length === 0 ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {statusCounts.totalSansContrat}
              </span>
            </button>

            {statutOptions
              .filter(option => option.value !== 'CONTRAT_SIGNE' && option.value !== 'NECESSITE_REPASSAGE')
              .map(option => {
                const count = statusCounts.byStatus.get(option.value) || 0
                const isActive = activeFilters.includes(option.value)
                const IconComponent = option.icon
                
                // Extraction de la classe couleur text pour l'état inactif
                const colorClass = option.color.split(' ')[1] || 'text-gray-500'

                return (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter(option.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                      isActive
                        ? `${option.color} border-transparent shadow-sm ring-1 ring-offset-1 ring-gray-200 dark:ring-gray-800`
                        : `${base.bg.card} ${base.text.muted} ${base.border.default} hover:border-gray-300 opacity-70 hover:opacity-100`
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{option.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
           </div>
        </div>
      </div>
    ),
    [
      activeFilters,
      base,
      clearAllFilters,
      colors.primary,
      immeuble,
      statutOptions,
      statusCounts,
      toggleFilter,
      portes.length, 
      statsData 
    ]
  )

  return (
    <div className="space-y-3">
      {/* Utilisation du template avec les configurations spécifiques à la gestion */}
      <PortesTemplate
        portes={filteredPortes}
        statsData={statsData}
        loading={(portesLoading && portes.length === 0) || immeubleLoading}
        isFetchingMore={isFetchingMore}
        readOnly={false}
        showStatusFilters={false}
        onPorteEdit={handleEditPorte}
        onQuickStatusChange={handleQuickStatusChange}
        onRepassageChange={handleRepassageChange}
        onBack={handleBackToImmeubles}
        backButtonText="Retour"
        scrollTarget={etageSelecteurRef}
        scrollTargetText="Étages"
        customFilters={customFilters}
        onAddPorteToEtage={handleAddPorteToEtage}
        onAddEtage={handleAddEtage}
        addingPorteToEtage={addingPorteToEtage}
        addingEtage={addingEtage}
        onFloorSelect={handleFloorSelect} // NEW
        selectedFloor={selectedFloor} // NEW
      />

      {/* Modal d'édition */}
      <EditPorteModal
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open)
          if (!open) setIsSaving(false)
        }}
        selectedPorte={selectedPorte}
        immeubleAdresse={immeuble?.adresse}
        editForm={editForm}
        setEditForm={setEditForm}
        statutOptions={statutOptions}
        isSaving={isSaving}
        onSave={handleSavePorte}
        onRepassageChange={handleRepassageChange}
      />
    </div>
  )
}
