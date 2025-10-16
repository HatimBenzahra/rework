import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  MapPin,
  Building2,
  ArrowUp,
  Key,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  X,
} from 'lucide-react'

const STEPS = [
  {
    id: 'address',
    title: 'Adresse',
    description: "Localisation de l'immeuble",
    icon: MapPin,
  },
  {
    id: 'details',
    title: 'Détails',
    description: 'Configuration du bâtiment',
    icon: Building2,
  },
  {
    id: 'access',
    title: 'Accès',
    description: "Informations d'accès",
    icon: Key,
  },
]

export default function AddImmeubleModal({ open, onOpenChange, onSave }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [isAddressSelected, setIsAddressSelected] = useState(false)
  const [formData, setFormData] = useState({
    adresse: '',
    complementAdresse: '',
    nbEtages: '',
    nbPortesParEtage: '',
    ascenseurPresent: false,
    digitalCode: '',
  })
  const [errors, setErrors] = useState({})

  // Mapbox access token - should be in env file
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(0)
      setFormData({
        adresse: '',
        complementAdresse: '',
        nbEtages: '',
        nbPortesParEtage: '',
        ascenseurPresent: false,
        digitalCode: '',
      })
      setErrors({})
      setAddressSuggestions([])
      setIsAddressSelected(false)
    }
  }, [open])

  // Debounced address search with Mapbox
  useEffect(() => {
    // Ne pas rechercher si l'adresse vient d'être sélectionnée
    if (isAddressSelected) {
      return
    }

    const timeoutId = setTimeout(() => {
      if (formData.adresse && formData.adresse.length > 2 && MAPBOX_TOKEN) {
        searchAddresses(formData.adresse)
      } else {
        setAddressSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.adresse])

  const searchAddresses = async query => {
    if (!MAPBOX_TOKEN) {
      console.warn('⚠️ VITE_MAPBOX_ACCESS_TOKEN not found in environment variables')
      return
    }

    setLoadingSuggestions(true)
    try {
      // Pour l'Île-de-France : country=fr, types pour avoir adresses + lieux
      // proximity pour favoriser les résultats autour de Paris (2.3522, 48.8566)
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${MAPBOX_TOKEN}&country=fr&proximity=2.3522,48.8566&types=address,poi&limit=8&language=fr`

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error details:', errorData)
        setAddressSuggestions([])
        return
      }

      const data = await response.json()

      setAddressSuggestions(data.features || [])
    } catch (error) {
      console.error('❌ Error fetching address suggestions:', error)
      setAddressSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))

    // Si l'utilisateur modifie l'adresse manuellement, on réinitialise la sélection
    if (field === 'adresse') {
      setIsAddressSelected(false)
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }))
    }
  }

  const selectAddress = address => {
    // Marquer que l'adresse a été sélectionnée pour éviter une nouvelle recherche
    setIsAddressSelected(true)
    setAddressSuggestions([])
    // Modifier directement formData sans passer par handleInputChange
    setFormData(prev => ({
      ...prev,
      adresse: address.place_name,
    }))
    // Effacer l'erreur si elle existe
    if (errors.adresse) {
      setErrors(prev => ({
        ...prev,
        adresse: null,
      }))
    }
  }

  const validateStep = stepIndex => {
    const newErrors = {}

    switch (stepIndex) {
      case 0: // Address step
        if (!formData.adresse.trim()) {
          newErrors.adresse = "L'adresse est requise"
        } else if (MAPBOX_TOKEN && !isAddressSelected) {
          newErrors.adresse = 'Veuillez sélectionner une adresse depuis les suggestions'
        }
        break

      case 1: // Details step
        if (!formData.nbEtages || parseInt(formData.nbEtages) < 1) {
          newErrors.nbEtages = "Le nombre d'étages doit être supérieur à 0"
        }
        if (!formData.nbPortesParEtage || parseInt(formData.nbPortesParEtage) < 1) {
          newErrors.nbPortesParEtage = 'Le nombre de portes par étage doit être supérieur à 0'
        }
        break

      case 2: // Access step - no required validation needed
        break

      default:
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setLoading(true)
    try {
      // Combiner l'adresse et le complément
      const adresseComplete = formData.complementAdresse.trim()
        ? `${formData.adresse}, ${formData.complementAdresse.trim()}`
        : formData.adresse

      const immeubleData = {
        adresse: adresseComplete,
        nbEtages: parseInt(formData.nbEtages),
        nbPortesParEtage: parseInt(formData.nbPortesParEtage),
        ascenseurPresent: formData.ascenseurPresent,
        digitalCode: formData.digitalCode.trim() || null,
      }

      await onSave(immeubleData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving immeuble:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Address step
        return (
          <div className="space-y-[1vh]">
            <div className="space-y-[0.5vh] relative">
              <Label
                htmlFor="adresse"
                className="text-[clamp(0.75rem,1.6vh,0.875rem)] !text-gray-900 dark:!text-gray-900"
              >
                Adresse de l'immeuble *
              </Label>
              <div className="relative">
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={e => handleInputChange('adresse', e.target.value)}
                  placeholder="Tapez une adresse..."
                  className={`${errors.adresse ? 'border-red-500' : ''} text-sm sm:text-base ${formData.adresse ? 'pr-10' : ''}`}
                  autoComplete="off"
                />
                {/* Bouton pour effacer */}
                {formData.adresse && !loadingSuggestions && (
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('adresse', '')
                      setAddressSuggestions([])
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:!bg-gray-200 rounded-full transition-colors z-10"
                    aria-label="Effacer l'adresse"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:!text-gray-500 dark:hover:!text-gray-700" />
                  </button>
                )}
                {loadingSuggestions && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              {errors.adresse && <p className="text-xs text-red-500">{errors.adresse}</p>}

              {/* Address suggestions - Absolute positioning with high z-index */}
              {addressSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-[9999] mt-1 border border-gray-300 dark:!border-gray-300 rounded-md bg-white dark:!bg-white shadow-lg max-h-[25vh] overflow-y-auto overflow-x-hidden">
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-[1vh] py-[1vh] hover:bg-blue-50 dark:hover:!bg-blue-50 border-b border-gray-200 dark:!border-gray-200 last:border-b-0 text-sm transition-colors"
                      onClick={() => selectAddress(suggestion)}
                    >
                      <div className="flex items-start gap-[0.5vh]">
                        <MapPin className="h-[1.5vh] w-[1.5vh] min-h-[14px] min-w-[14px] text-blue-500 dark:!text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="font-medium text-gray-900 dark:!text-gray-900 truncate text-[clamp(0.75rem,1.5vh,0.875rem)]">
                            {suggestion.text}
                          </div>
                          <div className="text-gray-600 dark:!text-gray-600 truncate text-[clamp(0.625rem,1.2vh,0.75rem)]">
                            {suggestion.place_name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!MAPBOX_TOKEN && (
                <p className="text-xs text-orange-500">
                  ⚠️ Configuration Mapbox manquante - saisie manuelle uniquement
                </p>
              )}
            </div>

            {/* Complément d'adresse (optionnel) */}
            <div className="space-y-[0.5vh]">
              <Label
                htmlFor="complementAdresse"
                className="text-[clamp(0.75rem,1.6vh,0.875rem)] !text-gray-900 dark:!text-gray-900"
              >
                Complément d'adresse (optionnel)
              </Label>
              <Input
                id="complementAdresse"
                value={formData.complementAdresse}
                onChange={e => handleInputChange('complementAdresse', e.target.value)}
                placeholder="Ex: Appartement 12, Bâtiment A, Porte 3..."
                className="text-sm sm:text-base"
              />
              <p className="text-[clamp(0.625rem,1.2vh,0.75rem)] text-gray-500 dark:!text-gray-400">
                Numéro d'appartement, bâtiment, étage, ou toute information complémentaire
              </p>
            </div>
          </div>
        )

      case 1: // Details step
        return (
          <div className="space-y-[1vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1.5vh]">
              <div className="space-y-[0.5vh]">
                <Label
                  htmlFor="nbEtages"
                  className="text-[clamp(0.75rem,1.6vh,0.875rem)] !text-gray-900 dark:!text-gray-900"
                >
                  Nombre d'étages *
                </Label>
                <Input
                  id="nbEtages"
                  type="number"
                  min="1"
                  value={formData.nbEtages}
                  onChange={e => handleInputChange('nbEtages', e.target.value)}
                  placeholder="Ex: 5"
                  className={`${errors.nbEtages ? 'border-red-500' : ''} text-sm sm:text-base`}
                />
                {errors.nbEtages && <p className="text-xs text-red-500">{errors.nbEtages}</p>}
              </div>

              <div className="space-y-[0.5vh]">
                <Label
                  htmlFor="nbPortesParEtage"
                  className="text-[clamp(0.75rem,1.6vh,0.875rem)] !text-gray-900 dark:!text-gray-900"
                >
                  Portes par étage *
                </Label>
                <Input
                  id="nbPortesParEtage"
                  type="number"
                  min="1"
                  value={formData.nbPortesParEtage}
                  onChange={e => handleInputChange('nbPortesParEtage', e.target.value)}
                  placeholder="Ex: 4"
                  className={`${errors.nbPortesParEtage ? 'border-red-500' : ''} text-sm sm:text-base`}
                />
                {errors.nbPortesParEtage && (
                  <p className="text-xs text-red-500">{errors.nbPortesParEtage}</p>
                )}
              </div>
            </div>

            {/* Summary card */}
            {formData.nbEtages && formData.nbPortesParEtage && (
              <div className="p-[1.5vh] rounded-lg border border-gray-200 dark:!border-gray-200 bg-gray-50 dark:!bg-gray-50">
                <div className="flex items-center justify-between gap-[1vh]">
                  <div className="flex-1">
                    <p className="text-[clamp(0.625rem,1.4vh,0.875rem)] text-gray-600 dark:!text-gray-600">
                      Total des portes
                    </p>
                    <p className="text-[clamp(1rem,2.2vh,1.375rem)] font-bold text-gray-900 dark:!text-gray-900 leading-tight">
                      {parseInt(formData.nbEtages) * parseInt(formData.nbPortesParEtage)}
                    </p>
                    <p className="text-[clamp(0.5625rem,1.2vh,0.75rem)] text-gray-600 dark:!text-gray-600 mt-[0.3vh]">
                      {formData.nbEtages} étages × {formData.nbPortesParEtage} portes/étage
                    </p>
                  </div>
                  <div className="p-[1vh] rounded-lg border border-gray-200 dark:!border-gray-200 bg-white dark:!bg-white flex-shrink-0">
                    <Building2 className="h-[2.5vh] w-[2.5vh] text-gray-600 dark:!text-gray-600" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 2: // Access step
        return (
          <div className="space-y-[1.5vh]">
            <div className="space-y-[1vh]">
              <div className="flex items-center justify-between">
                <div className="space-y-[0.3vh]">
                  <Label className="text-[clamp(0.75rem,1.6vh,0.875rem)] font-medium !text-gray-900 dark:!text-gray-900">
                    Ascenseur présent
                  </Label>
                  <p className="text-[clamp(0.625rem,1.4vh,0.75rem)] text-gray-600 dark:!text-gray-600">
                    Y a-t-il un ascenseur dans cet immeuble ?
                  </p>
                </div>
                <div className="flex items-center space-x-[1vh]">
                  <ArrowUp className="h-[2.5vh] w-[2.5vh] text-gray-400 dark:!text-gray-400" />
                  <input
                    type="checkbox"
                    id="ascenseurPresent"
                    checked={formData.ascenseurPresent}
                    onChange={e => handleInputChange('ascenseurPresent', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
              </div>

              <Separator className="!border-gray-200 dark:!border-gray-200" />

              <div className="space-y-[0.5vh]">
                <Label
                  htmlFor="digitalCode"
                  className="text-[clamp(0.75rem,1.6vh,0.875rem)] !text-gray-900 dark:!text-gray-900"
                >
                  Code d'accès digital (optionnel)
                </Label>
                <Input
                  id="digitalCode"
                  value={formData.digitalCode}
                  onChange={e => handleInputChange('digitalCode', e.target.value)}
                  placeholder="Ex: 1234A, A5678..."
                />
                <p className="text-[clamp(0.625rem,1.4vh,0.875rem)] text-gray-600 dark:!text-gray-600">
                  Laissez vide si aucun code d'accès
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const _currentStepData = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1
  const isFirstStep = currentStep === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md md:max-w-lg h-[90vh] overflow-hidden p-[2vh] sm:p-[3vh] !bg-white dark:!bg-white !text-gray-900 dark:!text-gray-900 flex flex-col">
        <DialogHeader className="space-y-[0.5vh] flex-none">
          <DialogTitle className="text-[clamp(1rem,2.5vh,1.5rem)] leading-tight !text-gray-900 dark:!text-gray-900">
            Ajouter un immeuble
          </DialogTitle>
          <DialogDescription className="text-[clamp(0.75rem,1.8vh,1rem)] !text-gray-600 dark:!text-gray-600">
            Remplissez les informations de l'immeuble en suivant les étapes
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator - Responsive */}
        <div className="py-[1vh] px-0 overflow-x-hidden flex-none">
          <div className="flex items-start justify-between gap-[0.5vh]">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    {/* Circle with icon */}
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-green-600 dark:!bg-green-600 border-green-600 dark:!border-green-600 text-white dark:!text-white'
                          : isActive
                            ? 'bg-blue-600 dark:!bg-blue-600 border-blue-600 dark:!border-blue-600 text-white dark:!text-white'
                            : 'border-gray-300 dark:!border-gray-300 text-gray-400 dark:!text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </div>

                    {/* Text labels */}
                    <div className="text-center mt-[0.5vh] w-full px-0.5">
                      <div
                        className={`text-[clamp(0.625rem,1.2vh,0.75rem)] font-medium leading-tight truncate ${
                          isActive
                            ? 'text-blue-600 dark:!text-blue-600'
                            : 'text-gray-600 dark:!text-gray-600'
                        }`}
                        title={step.title}
                      >
                        {step.title}
                      </div>
                      <div className="text-[clamp(0.5rem,1vh,0.625rem)] text-gray-400 dark:!text-gray-400 leading-tight mt-[0.2vh] hidden sm:block truncate">
                        {step.description}
                      </div>
                    </div>
                  </div>

                  {/* Connector line */}
                  {index < STEPS.length - 1 && (
                    <div className="flex items-start pt-4">
                      <div
                        className={`w-6 sm:w-12 md:w-16 h-0.5 transition-colors ${
                          index < currentStep
                            ? 'bg-green-600 dark:!bg-green-600'
                            : 'bg-gray-300 dark:!bg-gray-300'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <Separator className="my-[0.5vh] !border-gray-200 dark:!border-gray-200 flex-none" />

        {/* Step content - Prend tout l'espace disponible avec scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {renderStepContent()}
        </div>

        <Separator className="my-[0.5vh] !border-gray-200 dark:!border-gray-200 flex-none" />

        {/* Footer buttons */}
        <DialogFooter className="pt-[1vh] flex-none">
          <div className="flex w-full gap-[1vh] flex-col-reverse sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={isFirstStep ? () => onOpenChange(false) : prevStep}
              className="w-full sm:w-auto h-[4.5vh] min-h-[36px] max-h-[44px] text-[clamp(0.75rem,1.5vh,0.875rem)]"
            >
              {isFirstStep ? (
                'Annuler'
              ) : (
                <>
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Précédent
                </>
              )}
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 dark:!bg-blue-600 hover:bg-blue-700 dark:hover:!bg-blue-700 text-white dark:!text-white w-full sm:w-auto h-[4.5vh] min-h-[36px] max-h-[44px] text-[clamp(0.75rem,1.5vh,0.875rem)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    Créer l'immeuble
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="bg-blue-600 dark:!bg-blue-600 hover:bg-blue-700 dark:hover:!bg-blue-700 text-white dark:!text-white w-full sm:w-auto h-[4.5vh] min-h-[36px] max-h-[44px] text-[clamp(0.75rem,1.5vh,0.875rem)]"
              >
                Suivant
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
