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
import {
  usePortesByImmeuble,
  useUpdatePorte,
  useImmeuble,
  useAddEtageToImmeuble,
  useAddPorteToEtage,
} from '@/hooks/use-api'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'
import { useRecording } from '@/hooks/useRecording'
import { useErrorToast } from '@/hooks/use-error-toast'
import { useRole } from '@/contexts/userole'
import { STATUT_OPTIONS } from './Statut_options'
import PortesTemplate from './components/PortesTemplate'
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
  const { currentUserId } = useRole()

  // Récupère la ref de scroll depuis le layout (fallback possible si non fourni)
  const { scrollContainerRef, audioStatus } = useOutletContext() || {}

  // Hook d'enregistrement automatique (attend la connexion audio)
  const {
    isRecording,
    isStarting,
    error: recordingError,
  } = useRecording(parseInt(currentUserId), true, audioStatus?.audioConnected)

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
  const { data: immeuble, loading: immeubleLoading } = useImmeuble(parseInt(immeubleId, 10))
  const { data: portesData, loading, refetch } = usePortesByImmeuble(parseInt(immeubleId, 10))
  const portes = useMemo(() => portesData || [], [portesData])

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

  const clearAllFilters = useCallback(() => setActiveFilters([]), [])

  // Comptes par statut mémoïsés (évite filter répétés par bouton)
  const statusCounts = useMemo(() => {
    const m = new Map()
    let totalSansContrat = 0
    for (const p of portes) {
      m.set(p.statut, (m.get(p.statut) || 0) + 1)
      if (p.statut !== 'CONTRAT_SIGNE') totalSansContrat++
    }
    return { byStatus: m, totalSansContrat }
  }, [portes])

  // Filtrage des portes selon les critères locaux
  const filteredPortes = useMemo(() => {
    return portes.filter(porte => {
      // Si aucun filtre n'est actif, afficher toutes les portes sauf les contrats signés
      if (activeFilters.length === 0) {
        return porte.statut
      }
      // Si des filtres sont actifs, afficher seulement les portes correspondantes
      return activeFilters.includes(porte.statut)
    })
  }, [portes, activeFilters])

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
        await withScrollRestore(async () => {
          await updatePorte(updateData)
          await refetch()
        })
        showSuccess('Statut mis à jour avec succès !')
      } catch (error) {
        console.error('Error updating porte status:', error)
        showError(error, 'Mise à jour statut')
      }
    },
    [updatePorte, refetch, withScrollRestore, showSuccess, showError]
  )

  // Repassages +/-
  const handleRepassageChange = useCallback(
    async (porte, increment) => {
      const newNbRepassages = Math.max(0, porte.nbRepassages + increment)
      const updateData = { id: porte.id, nbRepassages: newNbRepassages }

      try {
        await withScrollRestore(async () => {
          await updatePorte(updateData)
          await refetch()
        })
      } catch (error) {
        console.error('Error updating repassages:', error)
        showError(error, 'Mise à jour repassages')
      }
    },
    [updatePorte, refetch, withScrollRestore, showError]
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
        await refetch()
      })
      showSuccess('Étage ajouté avec succès !')
    } catch (error) {
      console.error('Error adding etage:', error)
      showError(error, 'Ajout étage')
    } finally {
      setAddingEtage(false)
    }
  }, [immeubleId, addingEtage, addEtage, refetch, withScrollRestore, showSuccess, showError])

  // Ajout d'une porte sur un étage donné
  const handleAddPorteToEtage = useCallback(
    async etage => {
      if (!immeubleId || addingPorteToEtage) return
      setAddingPorteToEtage(true)
      try {
        await withScrollRestore(async () => {
          await addPorteToEtage({ immeubleId: parseInt(immeubleId, 10), etage })
          await refetch()
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
    ]
  )

  // Composant personnalisé pour les filtres supplémentaires
  const customFilters = useMemo(
    () => (
      <div
        ref={etageSelecteurRef}
        className={`${base.bg.card} border ${base.border.default} rounded-xl p-3 mb-4 shadow-lg`}
      >
        {/* Gestion de l'immeuble */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700">Gestion de l'immeuble</h3>
              {/* Indicateur d'enregistrement */}
              {isRecording && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-red-700">REC</span>
                </div>
              )}
              {isStarting && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-yellow-700">Démarrage...</span>
                </div>
              )}
            </div>
            {immeuble && (
              <div className="text-xs text-gray-500">
                {immeuble.nbEtages} étages • {immeuble.nbPortesParEtage} portes/étage
              </div>
            )}
          </div>

          {/* Message d'info ou d'erreur */}
          {recordingError ? (
            <div className="text-xs md:text-sm text-red-600 bg-red-50 p-3 md:p-4 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <div className="text-red-500 text-sm mt-0.5 flex-shrink-0">⚠️</div>
                <div className="leading-relaxed">
                  <span className="font-medium">Erreur d'enregistrement :</span> {recordingError}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs md:text-sm text-gray-600 bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="text-blue-500 text-sm mt-0.5 flex-shrink-0">💡</div>
                <div className="leading-relaxed">
                  <span className="font-medium">Astuce :</span> Utilisez les boutons + à la fin de
                  chaque étage pour ajouter des portes ou à la fin pour ajouter un étage complet.
                  {isRecording && (
                    <span className="block mt-1 text-green-600 font-medium">
                      📹 Votre session est enregistrée automatiquement.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtres par statut */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Filtres par statut</h3>
            {activeFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Effacer tout
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {/* Bouton "Toutes" */}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className={`${
                activeFilters.length === 0
                  ? `${colors.primary.bgLight} ${colors.primary.textLight} border ${colors.primary.border}`
                  : `${base.bg.muted} ${base.text.muted}`
              } px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm`}
            >
              <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
              Toutes ({statusCounts.totalSansContrat})
            </Button>

            {/* Filtres par statut */}
            {statutOptions
              .filter(option => option.value !== 'CONTRAT_SIGNE')
              .map(option => {
                const count = statusCounts.byStatus.get(option.value) || 0
                const isActive = activeFilters.includes(option.value)
                const IconComponent = option.icon
                return (
                  <Button
                    key={option.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFilter(option.value)}
                    className={`${
                      isActive ? option.color + ' border' : `${base.bg.muted} ${base.text.muted}`
                    } px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm`}
                  >
                    <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                    {option.label} ({count})
                  </Button>
                )
              })}
          </div>
        </div>
      </div>
    ),
    [
      activeFilters,
      base.bg.card,
      base.border.default,
      base.bg.muted,
      base.text.muted,
      clearAllFilters,
      colors.primary.bgLight,
      colors.primary.border,
      colors.primary.textLight,
      immeuble,
      statutOptions,
      statusCounts.byStatus,
      statusCounts.totalSansContrat,
      toggleFilter,
      isRecording,
      isStarting,
      recordingError,
    ]
  )

  return (
    <div className="space-y-3">
      {/* Utilisation du template avec les configurations spécifiques à la gestion */}
      <PortesTemplate
        portes={filteredPortes}
        loading={loading || immeubleLoading}
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
      />

      {/* Modal d'édition - Optimisé mobile */}
      <Dialog
        open={showEditModal}
        onOpenChange={open => {
          setShowEditModal(open)
          if (!open) setIsSaving(false) // Réinitialiser lors de la fermeture
        }}
      >
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-lg mx-auto !bg-white dark:!bg-white !border-gray-200 dark:!border-gray-200 h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Header fixe */}
          <DialogHeader className="px-[2vh] py-[1.5vh] border-b !border-gray-200 dark:!border-gray-200 flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg font-bold !text-gray-900 dark:!text-gray-900 line-clamp-1">
              {selectedPorte?.nomPersonnalise || `Porte ${selectedPorte?.numero}`}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm !text-gray-600 dark:!text-gray-600 line-clamp-1 mt-1">
              Étage {selectedPorte?.etage} • {immeuble?.adresse}
            </DialogDescription>
          </DialogHeader>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto px-[2vh] py-[1.5vh] min-h-0">
            <div className="space-y-[1.5vh]">
              {/* Nom personnalisé */}
              <div className="space-y-[0.5vh]">
                <label className="text-[clamp(0.75rem,1.6vh,0.875rem)] font-semibold !text-gray-900 dark:!text-gray-900 flex items-center gap-2">
                  Nom personnalisé (optionnel)
                </label>
                <Input
                  placeholder={`Porte ${selectedPorte?.numero}`}
                  value={editForm.nomPersonnalise}
                  onChange={e =>
                    setEditForm(prev => ({ ...prev, nomPersonnalise: e.target.value }))
                  }
                  className="h-11 sm:h-12 text-sm sm:text-base !bg-white dark:!bg-white !border-gray-300 dark:!border-gray-300 !text-gray-900 dark:!text-gray-900"
                />
                <p className="text-xs !text-gray-500 dark:!text-gray-500 leading-relaxed">
                  Ex: "Porte à droite", "Appt A", etc.
                </p>
                {editForm.nomPersonnalise && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditForm(prev => ({ ...prev, nomPersonnalise: '' }))}
                    className={`text-xs h-8 ${base.text.muted} hover:${base.text.primary}`}
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>

              {/* Statut */}
              <div className="space-y-[0.5vh]">
                <label className="text-[clamp(0.75rem,1.6vh,0.875rem)] font-semibold !text-gray-900 dark:!text-gray-900 block">
                  Statut *
                </label>
                <Select
                  value={editForm.statut}
                  onValueChange={value => setEditForm(prev => ({ ...prev, statut: value }))}
                >
                  <SelectTrigger className="h-11 sm:h-12 !bg-white dark:!bg-white !border-gray-300 dark:!border-gray-300 !text-gray-900 dark:!text-gray-900 text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="!bg-white dark:!bg-white !border-gray-200 dark:!border-gray-200">
                    {statutOptions.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="!text-gray-900 dark:!text-gray-900 focus:!bg-blue-50 dark:focus:!bg-blue-50"
                      >
                        <div className="flex items-center gap-2 py-0.5">
                          <option.icon className="h-4 w-4 sm:h-5 sm:w-5 !text-gray-700 dark:!text-gray-700" />
                          <span className="text-sm sm:text-base !text-gray-900 dark:!text-gray-900">
                            {option.label}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* RDV si nécessaire */}
              {editForm.statut === 'RENDEZ_VOUS_PRIS' && (
                <div
                  className={`p-[1.5vh] ${colors.primary.bgLight} rounded-lg border ${colors.primary.border} space-y-[1vh]`}
                >
                  <p
                    className={`text-sm font-semibold ${colors.primary.text} flex items-center gap-2`}
                  >
                    <Calendar className="h-4 w-4" />
                    Informations du rendez-vous
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1vh]">
                    <div className="space-y-[0.5vh]">
                      <label className="text-xs font-medium !text-gray-900 dark:!text-gray-900 block">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={editForm.rdvDate}
                        onChange={e => setEditForm(prev => ({ ...prev, rdvDate: e.target.value }))}
                        className="w-fit px-3 py-2.5 text-sm sm:text-base !bg-white dark:!bg-white !border-gray-300 dark:!border-gray-300 !text-gray-900 dark:!text-gray-900 rounded-lg border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-[0.5vh]">
                      <label className="text-xs font-medium !text-gray-900 dark:!text-gray-900 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 !text-gray-700 dark:!text-gray-700" />
                        Heure
                      </label>
                      <input
                        type="time"
                        value={editForm.rdvTime}
                        onChange={e => setEditForm(prev => ({ ...prev, rdvTime: e.target.value }))}
                        className="w-fit px-3 py-2.5 text-sm sm:text-base !bg-white dark:!bg-white !border-gray-300 dark:!border-gray-300 !text-gray-900 dark:!text-gray-900 rounded-lg border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Gestion des repassages dans le modal */}
              {(editForm.statut === 'CURIEUX' || editForm.statut === 'NECESSITE_REPASSAGE') && (
                <div
                  className={`p-[1.5vh] ${colors.warning.bgLight} rounded-lg border ${colors.warning.border}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCcw className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.warning.text}`} />
                      <span className={`font-bold text-sm sm:text-base ${colors.warning.text}`}>
                        Repassages : {selectedPorte?.nbRepassages || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRepassageChange(selectedPorte, -1)}
                        disabled={!selectedPorte || selectedPorte.nbRepassages === 0}
                        className={`h-9 w-9 sm:h-10 sm:w-10 p-0 ${colors.danger.bgLight} ${colors.danger.text} hover:${colors.danger.bg} border ${colors.danger.border}`}
                      >
                        <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRepassageChange(selectedPorte, 1)}
                        disabled={!selectedPorte}
                        className={`h-9 w-9 sm:h-10 sm:w-10 p-0 ${colors.success.bgLight} ${colors.success.text} hover:${colors.success.bg} border ${colors.success.border}`}
                      >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </div>
                  <p className={`text-xs ${colors.warning.text} opacity-80 mt-1.5`}>
                    Utilisez les boutons pour ajuster le nombre de repassages
                  </p>
                </div>
              )}

              {/* Commentaire */}
              <div className="space-y-[0.5vh]">
                <label className="text-[clamp(0.75rem,1.6vh,0.875rem)] font-semibold !text-gray-900 dark:!text-gray-900 block">
                  Commentaire
                </label>
                <Textarea
                  placeholder="Ajouter un commentaire..."
                  value={editForm.commentaire}
                  onChange={e => setEditForm(prev => ({ ...prev, commentaire: e.target.value }))}
                  rows={2}
                  className="text-sm sm:text-base !bg-white dark:!bg-white !border-gray-300 dark:!border-gray-300 !text-gray-900 dark:!text-gray-900 resize-none min-h-[8vh] max-h-[12vh] focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-gray-300"
                />
              </div>

              {/* Info repassages */}
              {selectedPorte?.nbRepassages > 0 && (
                <div
                  className={`p-[1.5vh] ${colors.warning.bgLight} rounded-lg border ${colors.warning.border}`}
                >
                  <div className={`flex items-start gap-2.5 ${colors.warning.text}`}>
                    <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {selectedPorte.nbRepassages} repassage
                        {selectedPorte.nbRepassages > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs opacity-80 mt-0.5">
                        Cette porte a nécessité plusieurs visites
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer fixe */}
          <DialogFooter className="px-[2vh] py-[1.5vh] border-t !border-gray-200 dark:!border-gray-200 flex-shrink-0">
            <div className="flex flex-col-reverse sm:flex-row gap-[1vh] w-full">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditModal(false)
                  setIsSaving(false)
                }}
                disabled={isSaving}
                className={`w-full sm:flex-1 h-10 sm:h-11 text-sm sm:text-base ${getButtonClasses('outline')}`}
              >
                Annuler
              </Button>
              <Button
                variant="ghost"
                onClick={handleSavePorte}
                disabled={isSaving}
                className={`w-full sm:flex-1 h-10 sm:h-11 text-sm sm:text-base ${getButtonClasses('primary')}`}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
