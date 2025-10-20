import React, { useState, useMemo, useEffect, useRef } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Clock, Eye, RotateCcw, Calendar, Plus, Minus } from 'lucide-react'
import { usePortesByImmeuble, useUpdatePorte, useImmeuble } from '@/hooks/use-api'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'
import { STATUT_OPTIONS } from './Statut_options'
import PortesTemplate from './components/PortesTemplate'
/**
 * Page de gestion des portes d'un immeuble
 * Utilise le contexte du layout parent (PortesLayout)
 */
export default function PortesGestion() {
  const { immeubleId } = useParams()
  const navigate = useNavigate()

  // Récupérer les données du contexte (venant du layout)
  // Note: commercial et myStats sont disponibles mais pas utilisés directement dans ce composant
  // Ils peuvent être utiles pour des fonctionnalités futures
  useOutletContext()

  // Hook pour le thème commercial - centralise TOUS les styles
  const { colors, base, getButtonClasses } = useCommercialTheme()

  // Configuration des statuts avec les couleurs du thème
  const statutOptions = STATUT_OPTIONS()

  const [selectedPorte, setSelectedPorte] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeFilters, setActiveFilters] = useState(() => {
    // Récupérer les filtres sauvegardés dans localStorage
    const saved = localStorage.getItem(`filters-${immeubleId}`)
    return saved ? JSON.parse(saved) : []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    statut: '',
    commentaire: '',
    rdvDate: '',
    rdvTime: '',
    nomPersonnalise: '',
  })

  const etageSelecteurRef = useRef(null)

  // Sauvegarder les filtres actifs dans localStorage
  useEffect(() => {
    localStorage.setItem(`filters-${immeubleId}`, JSON.stringify(activeFilters))
  }, [activeFilters, immeubleId])

  // Récupérer les informations de l'immeuble
  const { data: immeuble, loading: immeubleLoading } = useImmeuble(parseInt(immeubleId))

  // Récupérer les portes de l'immeuble avec cache management
  const { data: portesData, loading, refetch } = usePortesByImmeuble(parseInt(immeubleId))

  // S'assurer que portes est toujours un tableau avec useMemo pour éviter les re-renders
  const portes = useMemo(() => portesData || [], [portesData])

  // Mutation pour mettre à jour une porte
  const { mutate: updatePorte } = useUpdatePorte()

  // Fonctions pour gérer les filtres multiples
  const toggleFilter = filterValue => {
    setActiveFilters(prev => {
      if (prev.includes(filterValue)) {
        return prev.filter(f => f !== filterValue)
      } else {
        return [...prev, filterValue]
      }
    })
  }

  const clearAllFilters = () => {
    setActiveFilters([])
  }

  // Filtrage des portes selon les critères locaux
  const filteredPortes = useMemo(() => {
    return portes.filter(porte => {
      // Si aucun filtre n'est actif, afficher toutes les portes sauf les contrats signés
      if (activeFilters.length === 0) {
        return porte.statut !== 'CONTRAT_SIGNE'
      }

      // Si des filtres sont actifs, afficher seulement les portes correspondantes
      return activeFilters.includes(porte.statut)
    })
  }, [portes, activeFilters])

  const handleEditPorte = porte => {
    setSelectedPorte(porte)
    setEditForm({
      statut: porte.statut,
      commentaire: porte.commentaire || '',
      rdvDate: porte.rdvDate ? porte.rdvDate.split('T')[0] : '',
      rdvTime: porte.rdvTime || '',
      nomPersonnalise: porte.nomPersonnalise || '',
    })
    setIsSaving(false) // Réinitialiser l'état de sauvegarde
    setShowEditModal(true)
  }

  const handleSavePorte = async () => {
    if (!selectedPorte || isSaving) return

    setIsSaving(true)

    // Sauvegarder la position du scroll avant la mise à jour
    const scrollContainer = document.querySelector('.portes-scroll-container')
    const scrollPosition = scrollContainer?.scrollTop || 0

    const updateData = {
      id: selectedPorte.id,
      statut: editForm.statut,
      commentaire: editForm.commentaire.trim() || null,
      nomPersonnalise: editForm.nomPersonnalise.trim() || null,
      derniereVisite: new Date().toISOString(),
    }

    // Ajouter RDV si nécessaire
    if (editForm.statut === 'RENDEZ_VOUS_PRIS') {
      if (editForm.rdvDate) updateData.rdvDate = editForm.rdvDate
      if (editForm.rdvTime) updateData.rdvTime = editForm.rdvTime
    }

    try {
      await updatePorte(updateData)
      await refetch()
      setShowEditModal(false)
      setSelectedPorte(null)

      // Restaurer la position du scroll après la mise à jour
      setTimeout(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPosition
        }
      }, 50)
    } catch (error) {
      console.error('Error updating porte:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Fonction pour changer le statut en un clic
  const handleQuickStatusChange = async (porte, newStatut) => {
    // Si c'est un RDV, ouvrir directement le modal avec la date d'aujourd'hui
    if (newStatut === 'RENDEZ_VOUS_PRIS') {
      setSelectedPorte(porte)
      setEditForm({
        statut: newStatut,
        commentaire: porte.commentaire || '',
        rdvDate: new Date().toISOString().split('T')[0], // Date d'aujourd'hui
        rdvTime: new Date().toTimeString().slice(0, 5), // Heure actuelle
        nomPersonnalise: porte.nomPersonnalise || '',
      })
      setShowEditModal(true)
      return
    }

    // Sauvegarder la position du scroll avant la mise à jour
    const scrollContainer = document.querySelector('.portes-scroll-container')
    const scrollPosition = scrollContainer?.scrollTop || 0

    const updateData = {
      id: porte.id,
      statut: newStatut,
      derniereVisite: new Date().toISOString(),
    }

    try {
      await updatePorte(updateData)
      await refetch()

      // Restaurer la position du scroll après la mise à jour
      setTimeout(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPosition
        }
      }, 50)
    } catch (error) {
      console.error('Error updating porte status:', error)
    }
  }

  // Fonction pour gérer les repassages avec +/-
  const handleRepassageChange = async (porte, increment) => {
    // Sauvegarder la position du scroll avant la mise à jour
    const scrollContainer = document.querySelector('.portes-scroll-container')
    const scrollPosition = scrollContainer?.scrollTop || 0

    const newNbRepassages = Math.max(0, porte.nbRepassages + increment)

    const updateData = {
      id: porte.id,
      nbRepassages: newNbRepassages,
    }

    try {
      await updatePorte(updateData)
      await refetch()

      // Restaurer la position du scroll après la mise à jour
      setTimeout(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPosition
        }
      }, 50)
    } catch (error) {
      console.error('Error updating repassages:', error)
    }
  }

  // Navigation vers la liste des immeubles
  const handleBackToImmeubles = () => {
    navigate('/immeubles')
  }

  // Composant personnalisé pour les filtres supplémentaires de la page gestion
  const customFilters = (
    <div
      ref={etageSelecteurRef}
      className={`sticky top-0 z-20 ${base.bg.card} border ${base.border.default} rounded-xl p-3 mb-4 shadow-lg`}
    >
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
            Toutes ({portes.filter(p => p.statut !== 'CONTRAT_SIGNE').length})
          </Button>

          {/* Filtres par statut */}
          {statutOptions
            .filter(option => option.value !== 'CONTRAT_SIGNE')
            .map(option => {
              const count = portes.filter(p => p.statut === option.value).length
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

                  {/* Grid responsive pour date et heure */}
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
