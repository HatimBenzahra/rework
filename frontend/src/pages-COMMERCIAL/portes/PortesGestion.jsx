import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RotateCcw,
  Calendar,
  MessageSquare,
  Plus,
  Minus,
  MapPin,
  CalendarDays,
  Home,
  ArrowUp,
} from 'lucide-react'
import { usePortesByImmeuble, useUpdatePorte, useImmeuble } from '@/hooks/use-api'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'
import { STATUT_OPTIONS } from './Statut_options'
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
  const { colors, base, components, getButtonClasses, getInputClasses } = useCommercialTheme()

  // Configuration des statuts avec les couleurs du thème
  const statutOptions = STATUT_OPTIONS()

  const [searchQuery] = useState('')
  const [statutFilter] = useState('all')
  const [selectedPorte, setSelectedPorte] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEtage, setSelectedEtage] = useState(() => {
    // Récupérer l'étage sauvegardé dans localStorage
    return localStorage.getItem(`etage-${immeubleId}`) || 'all'
  })
  const [showOnlyVisited, setShowOnlyVisited] = useState(false)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    statut: '',
    commentaire: '',
    rdvDate: '',
    rdvTime: '',
    nomPersonnalise: '',
  })

  const etageRefs = useRef({})
  const etageSelecteurRef = useRef(null)

  // Sauvegarder l'étage sélectionné dans localStorage
  useEffect(() => {
    if (selectedEtage !== 'all') {
      localStorage.setItem(`etage-${immeubleId}`, selectedEtage)
    }
  }, [selectedEtage, immeubleId])

  // Détecter le scroll pour afficher le bouton "Remonter"
  useEffect(() => {
    const handleScroll = e => {
      const scrollContainer = e.target
      // Afficher le bouton si on a scrollé plus de 300px
      setShowScrollToTop(scrollContainer.scrollTop > 300)
    }

    // Attendre que le DOM soit complètement monté
    const timer = setTimeout(() => {
      const scrollContainer = document.querySelector('.portes-scroll-container')
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll)
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      const scrollContainer = document.querySelector('.portes-scroll-container')
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  // Récupérer les informations de l'immeuble
  const { data: immeuble, loading: immeubleLoading } = useImmeuble(parseInt(immeubleId))

  // Récupérer les portes de l'immeuble
  const { data: portesData, loading, refetch } = usePortesByImmeuble(parseInt(immeubleId))

  // S'assurer que portes est toujours un tableau avec useMemo pour éviter les re-renders
  const portes = useMemo(() => portesData || [], [portesData])

  // Mutation pour mettre à jour une porte
  const { mutate: updatePorte } = useUpdatePorte()

  // Filtrage des portes
  const filteredPortes = useMemo(() => {
    return portes.filter(porte => {
      const matchesSearch =
        porte.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        porte.etage.toString().includes(searchQuery) ||
        (porte.nomPersonnalise &&
          porte.nomPersonnalise.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStatut = statutFilter === 'all' || porte.statut === statutFilter
      const matchesVisited = !showOnlyVisited || porte.statut !== 'NON_VISITE'
      return matchesSearch && matchesStatut && matchesVisited
    })
  }, [portes, searchQuery, statutFilter, showOnlyVisited])

  // Grouper les portes par étage
  const portesByEtage = useMemo(() => {
    const grouped = {}
    filteredPortes.forEach(porte => {
      const etage = porte.etage
      if (!grouped[etage]) {
        grouped[etage] = []
      }
      grouped[etage].push(porte)
    })

    // Trier les étages par ordre décroissant (du plus haut au plus bas)
    return Object.keys(grouped)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .reduce((acc, etage) => {
        acc[etage] = grouped[etage].sort((a, b) => a.numero.localeCompare(b.numero))
        return acc
      }, {})
  }, [filteredPortes])

  // Obtenir la liste des étages disponibles
  const etagesDisponibles = useMemo(() => {
    return Object.keys(portesByEtage).sort((a, b) => parseInt(b) - parseInt(a))
  }, [portesByEtage])

  // Filtrer les étages selon la sélection
  const etagesAffiches = useMemo(() => {
    if (selectedEtage === 'all') {
      return portesByEtage
    }
    return { [selectedEtage]: portesByEtage[selectedEtage] }
  }, [portesByEtage, selectedEtage])

  // Statistiques des portes
  const stats = useMemo(() => {
    const total = portes.length
    const nonVisitees = portes.filter(p => p.statut === 'NON_VISITE').length
    const contratsSigne = portes.filter(p => p.statut === 'CONTRAT_SIGNE').length
    const rdvPris = portes.filter(p => p.statut === 'RENDEZ_VOUS_PRIS').length
    const curieux = portes.filter(p => p.statut === 'CURIEUX').length
    const refus = portes.filter(p => p.statut === 'REFUS').length
    const repassages = portes.filter(p => p.statut === 'NECESSITE_REPASSAGE').length

    const tauxVisite = total > 0 ? (((total - nonVisitees) / total) * 100).toFixed(1) : '0'

    return {
      total,
      nonVisitees,
      contratsSigne,
      rdvPris,
      curieux,
      refus,
      repassages,
      tauxVisite,
      taux_couverture: tauxVisite, // Alias pour compatibilité
    }
  }, [portes])

  const getStatutInfo = statut => {
    return statutOptions.find(option => option.value === statut) || statutOptions[0]
  }

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

  // Navigation rapide entre étages
  const handleEtageChange = etage => {
    setSelectedEtage(etage)
    // Scroll vers l'étage si ce n'est pas "all"
    if (etage !== 'all' && etageRefs.current[etage]) {
      setTimeout(() => {
        etageRefs.current[etage]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  // Fonction pour remonter au sélecteur d'étages
  const scrollToEtageSelector = () => {
    etageSelecteurRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading || immeubleLoading) {
    return (
      <div className={components.loading.container}>
        <div className="text-center">
          <div className={`${components.loading.spinner} mx-auto mb-4`}></div>
          <p className={components.loading.text}>Chargement des portes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Titre et bouton retour - Optimisé Mobile */}
      <div className="mb-4 md:mb-6">
        {/* Bouton retour - Full width sur mobile */}
        <div className="mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/immeubles')}
            className={`flex items-center gap-2 ${getButtonClasses('primary')}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>

        {/* Adresse et infos - Card optimisée mobile */}
        <Card className={`${base.bg.card} ${base.border.card} shadow-md mb-4 md:mb-6`}>
          <CardContent className="p-4 md:p-5">
            {/* Adresse principale */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-lg ${colors.primary.bgLight} flex-shrink-0`}>
                <MapPin className={`h-5 w-5 md:h-6 md:w-6 ${colors.primary.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${base.text.muted} mb-1 uppercase tracking-wide`}>Adresse</p>
                <h1
                  className={`text-base md:text-xl font-bold ${base.text.primary} leading-tight break-words`}
                >
                  {immeuble?.adresse || 'Chargement...'}
                </h1>
              </div>
            </div>

            {/* Séparateur */}
            <div className={`h-px ${base.border.default} mb-4`}></div>

            {/* Infos compactes - Grid responsive */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${base.bg.muted} flex-shrink-0`}>
                  <Home className={`h-4 w-4 ${base.text.primary}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${base.text.muted}`}>Portes</p>
                  <p className={`text-sm md:text-base font-bold ${base.text.primary}`}>
                    {stats.total}
                  </p>
                </div>
              </div>

              {immeuble?.createdAt && (
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${base.bg.muted} flex-shrink-0`}>
                    <CalendarDays className={`h-4 w-4 ${base.text.primary}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${base.text.muted}`}>Créé le</p>
                    <p className={`text-xs md:text-sm font-semibold ${base.text.primary} truncate`}>
                      {new Date(immeuble.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards - Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className={`${base.bg.card} ${base.border.card}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${base.text.muted} mb-1 truncate`}>Taux de visite</p>
                  <p className={`text-xl md:text-2xl font-bold ${base.text.primary}`}>
                    {stats.tauxVisite}%
                  </p>
                </div>
                <div className="p-2 md:p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0">
                  <Eye className={`h-4 w-4 md:h-5 md:w-5 ${base.icon.default}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${base.bg.card} ${base.border.card}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${base.text.muted} mb-1 truncate`}>Contrats signés</p>
                  <p className={`text-xl md:text-2xl font-bold ${base.text.primary}`}>
                    {stats.contratsSigne}
                  </p>
                </div>
                <div className="p-2 md:p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0">
                  <CheckCircle2 className={`h-4 w-4 md:h-5 md:w-5 ${base.icon.default}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${base.bg.card} ${base.border.card}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${base.text.muted} mb-1 truncate`}>RDV programmés</p>
                  <p className={`text-xl md:text-2xl font-bold ${base.text.primary}`}>
                    {stats.rdvPris}
                  </p>
                </div>
                <div className="p-2 md:p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0">
                  <Calendar className={`h-4 w-4 md:h-5 md:w-5 ${base.icon.default}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${base.bg.card} ${base.border.card}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${base.text.muted} mb-1 truncate`}>Repassages</p>
                  <p className={`text-xl md:text-2xl font-bold ${base.text.primary}`}>
                    {stats.repassages}
                  </p>
                </div>
                <div className="p-2 md:p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0">
                  <RotateCcw className={`h-4 w-4 md:h-5 md:w-5 ${base.icon.default}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BARRE DE NAVIGATION RAPIDE - STICKY */}
        <div
          ref={etageSelecteurRef}
          className={`sticky top-0 z-20 ${base.bg.card} border ${base.border.default} rounded-xl p-4 mb-6 shadow-lg`}
        >
          {/* Sélecteur d'étage GROS et VISIBLE */}
          <div className="mb-4">
            <h3 className={`text-lg font-bold ${base.text.primary} mb-3 flex items-center gap-2`}>
              <Building2 className="h-5 w-5" />
              Je suis à l'étage :
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {etagesDisponibles.map(etage => (
                <Button
                  key={etage}
                  variant="ghost"
                  size="lg"
                  onClick={() => handleEtageChange(etage)}
                  className={`h-16 text-2xl font-bold ${
                    selectedEtage === etage
                      ? `${colors.primary.bg} ${colors.primary.text} border-4 ${colors.primary.border} shadow-lg scale-105`
                      : `${base.bg.muted} ${base.text.primary} hover:bg-gray-300 border-2 ${base.border.default}`
                  } transition-all duration-200`}
                >
                  {etage}
                  <span
                    className={`ml-2 text-sm ${selectedEtage === etage ? 'opacity-100' : 'opacity-60'}`}
                  >
                    ({portesByEtage[etage]?.length || 0})
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Filtres rapides */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOnlyVisited(!showOnlyVisited)}
              className={`${
                showOnlyVisited
                  ? `${colors.success.bgLight} ${colors.success.text} border ${colors.success.border}`
                  : `${base.bg.muted} ${base.text.muted}`
              } px-4 py-2`}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showOnlyVisited ? 'Portes visitées' : 'Toutes les portes'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEtage('all')}
              className={`${
                selectedEtage === 'all'
                  ? `${colors.primary.bgLight} ${colors.primary.textLight} border ${colors.primary.border}`
                  : `${base.bg.muted} ${base.text.muted}`
              } px-4 py-2`}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Tous les étages ({filteredPortes.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des portes groupées par étage */}
      <div className="space-y-6">
        {Object.entries(etagesAffiches).map(([etage, portesEtage]) => (
          <div key={etage} className="space-y-4">
            {/* En-tête de l'étage */}
            <div
              ref={el => (etageRefs.current[etage] = el)}
              className="flex items-center space-x-3 scroll-mt-32"
            >
              <div className={`h-px flex-1 ${base.border.default}`}></div>
              <div
                className={`px-6 py-3 ${colors.primary.bgLight} ${colors.primary.textLight} rounded-full border-2 ${colors.primary.border} font-bold text-lg shadow-md`}
              >
                <h3>
                  Étage {etage} ({portesEtage.length} porte{portesEtage.length > 1 ? 's' : ''})
                </h3>
              </div>
              <div className={`h-px flex-1 ${base.border.default}`}></div>
            </div>

            {/* Grille des portes pour cet étage - FULL WIDTH sur mobile */}
            <div className="grid grid-cols-1 gap-4">
              {portesEtage.map(porte => {
                const statutInfo = getStatutInfo(porte.statut)
                const IconComponent = statutInfo.icon

                const needsRepassage =
                  porte.statut === 'CURIEUX' || porte.statut === 'NECESSITE_REPASSAGE'

                return (
                  <Card
                    key={porte.id}
                    className={`${base.bg.card} border-2 ${
                      porte.statut === 'NON_VISITE'
                        ? base.border.default
                        : `${statutInfo.color.split(' ')[0].replace('bg-', 'border-')}`
                    } shadow-md hover:shadow-xl transition-all duration-200`}
                  >
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {/* En-tête avec numéro de porte */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-bold text-2xl ${base.text.primary}`}>
                              {porte.nomPersonnalise || `Porte ${porte.numero}`}
                            </p>
                            {porte.nomPersonnalise && (
                              <p className={`text-sm ${base.text.muted}`}>N° {porte.numero}</p>
                            )}
                          </div>
                          <Badge className={`${statutInfo.color} text-sm px-3 py-1`}>
                            <IconComponent className="h-4 w-4 mr-1" />
                            {statutInfo.label}
                          </Badge>
                        </div>

                        {/* BOUTONS D'ACTION RAPIDE - GROS ET VISIBLES */}
                        <div className="space-y-2">
                          <p className={`text-xs font-semibold ${base.text.muted} uppercase`}>
                            Action rapide :
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {/* Contrat signé */}
                            <Button
                              variant="ghost"
                              size="lg"
                              onClick={() => handleQuickStatusChange(porte, 'CONTRAT_SIGNE')}
                              className={`h-20 flex flex-col items-center justify-center gap-2 ${
                                porte.statut === 'CONTRAT_SIGNE'
                                  ? `${colors.success.bg} ${colors.success.text} border-2 ${colors.success.border} shadow-lg`
                                  : `${base.bg.muted} ${base.text.primary} hover:${colors.success.bgLight} border-2 ${base.border.default}`
                              } font-bold transition-all duration-200`}
                            >
                              <CheckCircle2 className="h-6 w-6" />
                              <span className="text-xs">Contrat</span>
                            </Button>

                            {/* RDV */}
                            <Button
                              variant="ghost"
                              size="lg"
                              onClick={() => handleQuickStatusChange(porte, 'RENDEZ_VOUS_PRIS')}
                              className={`h-20 flex flex-col items-center justify-center gap-2 ${
                                porte.statut === 'RENDEZ_VOUS_PRIS'
                                  ? `${colors.primary.bg} ${colors.primary.text} border-2 ${colors.primary.border} shadow-lg`
                                  : `${base.bg.muted} ${base.text.primary} hover:${colors.primary.bgLight} border-2 ${base.border.default}`
                              } font-bold transition-all duration-200`}
                            >
                              <Calendar className="h-6 w-6" />
                              <span className="text-xs">RDV</span>
                            </Button>

                            {/* Refus */}
                            <Button
                              variant="ghost"
                              size="lg"
                              onClick={() => handleQuickStatusChange(porte, 'REFUS')}
                              className={`h-20 flex flex-col items-center justify-center gap-2 ${
                                porte.statut === 'REFUS'
                                  ? `${colors.danger.bg} ${colors.danger.text} border-2 ${colors.danger.border} shadow-lg`
                                  : `${base.bg.muted} ${base.text.primary} hover:${colors.danger.bgLight} border-2 ${base.border.default}`
                              } font-bold transition-all duration-200`}
                            >
                              <XCircle className="h-6 w-6" />
                              <span className="text-xs">Refus</span>
                            </Button>

                            {/* Curieux */}
                            <Button
                              variant="ghost"
                              size="lg"
                              onClick={() => handleQuickStatusChange(porte, 'CURIEUX')}
                              className={`h-20 flex flex-col items-center justify-center gap-2 ${
                                porte.statut === 'CURIEUX'
                                  ? `${colors.info.bg} ${colors.info.text} border-2 ${colors.info.border} shadow-lg`
                                  : `${base.bg.muted} ${base.text.primary} hover:${colors.info.bgLight} border-2 ${base.border.default}`
                              } font-bold transition-all duration-200`}
                            >
                              <MessageSquare className="h-6 w-6" />
                              <span className="text-xs">Curieux</span>
                            </Button>
                          </div>
                        </div>

                        {/* GESTION DES REPASSAGES avec +/- */}
                        {needsRepassage && (
                          <div
                            className={`${colors.warning.bgLight} border-2 ${colors.warning.border} rounded-lg p-3`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <RotateCcw className={`h-5 w-5 ${colors.warning.text}`} />
                                <span className={`font-bold ${colors.warning.text}`}>
                                  Repassages : {porte.nbRepassages}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRepassageChange(porte, -1)}
                                  disabled={porte.nbRepassages === 0}
                                  className={`h-10 w-10 p-0 ${colors.danger.bgLight} ${colors.danger.text} hover:${colors.danger.bg} border ${colors.danger.border}`}
                                >
                                  <Minus className="h-5 w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRepassageChange(porte, 1)}
                                  className={`h-10 w-10 p-0 ${colors.success.bgLight} ${colors.success.text} hover:${colors.success.bg} border ${colors.success.border}`}
                                >
                                  <Plus className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* RDV info */}
                        {porte.rdvDate && (
                          <div
                            className={`${colors.primary.bgLight} border ${colors.primary.border} rounded-lg pr-1 pl-2`}
                          >
                            <div
                              className={`flex items-center gap-2 ${colors.primary.textLight} font-semibold`}
                            >
                              <Calendar className="h-5 w-5" />
                              <span>{new Date(porte.rdvDate).toLocaleDateString('fr-FR')}</span>
                              {porte.rdvTime && <span>à {porte.rdvTime}</span>}
                            </div>
                          </div>
                        )}

                        {/* Commentaire */}
                        {porte.commentaire && (
                          <div
                            className={`${base.bg.muted} border ${base.border.default} rounded-lg p-3`}
                          >
                            <p className={`text-sm ${base.text.secondary}`}>{porte.commentaire}</p>
                          </div>
                        )}

                        {/* Bouton pour ajouter/modifier détails */}
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={() => handleEditPorte(porte)}
                          className={`w-full h-12 ${getButtonClasses('outline')} text-base font-semibold`}
                        >
                          <MessageSquare className="h-5 w-5 mr-2" />
                          {porte.commentaire || porte.nomPersonnalise
                            ? 'Modifier les détails'
                            : 'Ajouter des détails'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredPortes.length === 0 && (
        <div className="text-center py-12">
          <Building2 className={`h-12 w-12 mx-auto ${base.icon.default} mb-4`} />
          <h3 className={`text-lg font-medium ${base.text.primary} mb-2`}>Aucune porte trouvée</h3>
          <p className={base.text.muted}>
            {searchQuery || statutFilter !== 'all'
              ? 'Aucune porte ne correspond à vos critères de recherche'
              : "Aucune porte n'est disponible pour cet immeuble"}
          </p>
        </div>
      )}

      {/* Bouton flottant "Remonter" avec animation */}
      {showScrollToTop && (
        <button
          onClick={scrollToEtageSelector}
          className="fixed bottom-24 right-6 z-50 flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-blue-400"
          aria-label="Remonter"
        >
          <ArrowUp className="w-6 h-6 animate-bounce mb-1" />
          <span className="font-bold text-xs whitespace-nowrap">Étages</span>
        </button>
      )}

      {/* Modal d'édition - Optimisé mobile */}
      <Dialog
        open={showEditModal}
        onOpenChange={open => {
          setShowEditModal(open)
          if (!open) setIsSaving(false) // Réinitialiser lors de la fermeture
        }}
      >
        <DialogContent
          className={`w-[95vw] sm:w-[90vw] max-w-lg mx-auto ${base.bg.card} ${base.border.light} max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0`}
        >
          {/* Header fixe */}
          <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <DialogTitle
              className={`text-base sm:text-lg font-bold ${base.text.primary} line-clamp-1`}
            >
              {selectedPorte?.nomPersonnalise || `Porte ${selectedPorte?.numero}`}
            </DialogTitle>
            <DialogDescription
              className={`text-xs sm:text-sm ${base.text.muted} line-clamp-1 mt-1`}
            >
              Étage {selectedPorte?.etage} • {immeuble?.adresse}
            </DialogDescription>
          </DialogHeader>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="space-y-5">
              {/* Nom personnalisé */}
              <div className="space-y-2">
                <label
                  className={`text-sm font-semibold ${base.text.primary} flex items-center gap-2`}
                >
                  Nom personnalisé (optionnel)
                </label>
                <Input
                  placeholder={`Porte ${selectedPorte?.numero}`}
                  value={editForm.nomPersonnalise}
                  onChange={e =>
                    setEditForm(prev => ({ ...prev, nomPersonnalise: e.target.value }))
                  }
                  className={`h-11 sm:h-12 text-sm sm:text-base ${base.bg.input} ${base.border.input} ${base.text.primary}`}
                />
                <p className={`text-xs ${base.text.muted} leading-relaxed`}>
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
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${base.text.primary} block`}>
                  Statut *
                </label>
                <Select
                  value={editForm.statut}
                  onValueChange={value => setEditForm(prev => ({ ...prev, statut: value }))}
                >
                  <SelectTrigger
                    className={`h-11 sm:h-12 ${base.bg.input} ${base.border.input} ${base.text.primary} text-sm sm:text-base`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={`${base.bg.card} ${base.border.light}`}>
                    {statutOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2 py-0.5">
                          <option.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-sm sm:text-base">{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* RDV si nécessaire */}
              {editForm.statut === 'RENDEZ_VOUS_PRIS' && (
                <div
                  className={`p-3 sm:p-4 ${colors.primary.bgLight} rounded-lg border ${colors.primary.border} space-y-3`}
                >
                  <p
                    className={`text-sm font-semibold ${colors.primary.text} flex items-center gap-2`}
                  >
                    <Calendar className="h-4 w-4" />
                    Informations du rendez-vous
                  </p>

                  {/* Grid responsive pour date et heure */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-medium ${base.text.primary} block`}>
                        Date *
                      </label>
                      <input
                        type="date"
                        value={editForm.rdvDate}
                        onChange={e => setEditForm(prev => ({ ...prev, rdvDate: e.target.value }))}
                        className={`w-fit px-3 py-2.5 text-sm sm:text-base ${base.bg.input} ${base.border.input} ${base.text.primary} rounded-lg border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200`}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className={`text-xs font-medium ${base.text.primary} flex items-center gap-1.5`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Heure
                      </label>
                      <input
                        type="time"
                        value={editForm.rdvTime}
                        onChange={e => setEditForm(prev => ({ ...prev, rdvTime: e.target.value }))}
                        className={`w-fit px-3 py-2.5 text-sm sm:text-base ${base.bg.input} ${base.border.input} ${base.text.primary} rounded-lg border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Commentaire */}
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${base.text.primary} block`}>
                  Commentaire
                </label>
                <Textarea
                  placeholder="Ajouter un commentaire..."
                  value={editForm.commentaire}
                  onChange={e => setEditForm(prev => ({ ...prev, commentaire: e.target.value }))}
                  rows={3}
                  className={`text-sm sm:text-base ${getInputClasses()} resize-none min-h-[80px]`}
                />
              </div>

              {/* Info repassages */}
              {selectedPorte?.nbRepassages > 0 && (
                <div
                  className={`p-3 sm:p-4 ${colors.warning.bgLight} rounded-lg border ${colors.warning.border}`}
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
          <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 w-full">
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
