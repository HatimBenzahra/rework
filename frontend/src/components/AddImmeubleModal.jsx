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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MapPin,
  Building2,
  ArrowUp,
  Key,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'

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
  const { getCardClasses } = useCommercialTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [formData, setFormData] = useState({
    adresse: '',
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
        nbEtages: '',
        nbPortesParEtage: '',
        ascenseurPresent: false,
        digitalCode: '',
      })
      setErrors({})
      setAddressSuggestions([])
    }
  }, [open])

  // Debounced address search with Mapbox
  useEffect(() => {
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
      console.warn('VITE_MAPBOX_ACCESS_TOKEN not found in environment variables')
      return
    }

    setLoadingSuggestions(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${MAPBOX_TOKEN}&country=tn&types=address&limit=5`
      )
      const data = await response.json()
      setAddressSuggestions(data.features || [])
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
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

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }))
    }
  }

  const selectAddress = address => {
    handleInputChange('adresse', address.place_name)
    setAddressSuggestions([])
  }

  const validateStep = stepIndex => {
    const newErrors = {}

    switch (stepIndex) {
      case 0: // Address step
        if (!formData.adresse.trim()) {
          newErrors.adresse = "L'adresse est requise"
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
      const immeubleData = {
        ...formData,
        nbEtages: parseInt(formData.nbEtages),
        nbPortesParEtage: parseInt(formData.nbPortesParEtage),
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse de l'immeuble *</Label>
              <div className="relative">
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={e => handleInputChange('adresse', e.target.value)}
                  placeholder="Tapez une adresse..."
                  className={errors.adresse ? 'border-red-500' : ''}
                />
                {loadingSuggestions && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
              {errors.adresse && <p className="text-xs text-red-500">{errors.adresse}</p>}

              {/* Address suggestions */}
              {addressSuggestions.length > 0 && (
                <div className="border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 text-sm"
                      onClick={() => selectAddress(suggestion)}
                    >
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{suggestion.text}</div>
                          <div className="text-gray-500 text-xs">{suggestion.place_name}</div>
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
          </div>
        )

      case 1: // Details step
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nbEtages">Nombre d'étages *</Label>
                <Input
                  id="nbEtages"
                  type="number"
                  min="1"
                  value={formData.nbEtages}
                  onChange={e => handleInputChange('nbEtages', e.target.value)}
                  placeholder="Ex: 5"
                  className={errors.nbEtages ? 'border-red-500' : ''}
                />
                {errors.nbEtages && <p className="text-xs text-red-500">{errors.nbEtages}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nbPortesParEtage">Portes par étage *</Label>
                <Input
                  id="nbPortesParEtage"
                  type="number"
                  min="1"
                  value={formData.nbPortesParEtage}
                  onChange={e => handleInputChange('nbPortesParEtage', e.target.value)}
                  placeholder="Ex: 4"
                  className={errors.nbPortesParEtage ? 'border-red-500' : ''}
                />
                {errors.nbPortesParEtage && (
                  <p className="text-xs text-red-500">{errors.nbPortesParEtage}</p>
                )}
              </div>
            </div>

            {/* Summary card */}
            {formData.nbEtages && formData.nbPortesParEtage && (
              <div className={`p-4 rounded-lg ${getCardClasses('visits')}`}>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">
                    Total: {parseInt(formData.nbEtages) * parseInt(formData.nbPortesParEtage)}{' '}
                    portes
                  </span>
                </div>
                <p className="text-sm mt-1 opacity-80">
                  {formData.nbEtages} étages × {formData.nbPortesParEtage} portes/étage
                </p>
              </div>
            )}
          </div>
        )

      case 2: // Access step
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Ascenseur présent</Label>
                  <p className="text-sm text-muted-foreground">
                    Y a-t-il un ascenseur dans cet immeuble ?
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowUp className="h-5 w-5 text-gray-400" />
                  <input
                    type="checkbox"
                    id="ascenseurPresent"
                    checked={formData.ascenseurPresent}
                    onChange={e => handleInputChange('ascenseurPresent', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="digitalCode">Code d'accès digital (optionnel)</Label>
                <Input
                  id="digitalCode"
                  value={formData.digitalCode}
                  onChange={e => handleInputChange('digitalCode', e.target.value)}
                  placeholder="Ex: 1234A, A5678..."
                />
                <p className="text-xs text-muted-foreground">Laissez vide si aucun code d'accès</p>
              </div>
            </div>

            {/* Final summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3 border-l-4 border-l-blue-500">
              <h4 className="font-medium text-sm flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Récapitulatif</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-600 text-xs">Adresse:</span>
                    <p className="font-medium">{formData.adresse}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 text-xs">Étages:</span>
                  <span className="font-medium">{formData.nbEtages}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 text-xs">Portes/étage:</span>
                  <span className="font-medium">{formData.nbPortesParEtage}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowUp className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 text-xs">Ascenseur:</span>
                  <Badge
                    variant={formData.ascenseurPresent ? 'default' : 'secondary'}
                    className={formData.ascenseurPresent ? 'bg-green-600' : ''}
                  >
                    {formData.ascenseurPresent ? 'Oui' : 'Non'}
                  </Badge>
                </div>
                {formData.digitalCode && (
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 text-xs">Code:</span>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      {formData.digitalCode}
                    </Badge>
                  </div>
                )}
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Ajouter un immeuble</DialogTitle>
          <DialogDescription className="text-sm">
            Remplissez les informations de l'immeuble en suivant les étapes
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between py-3">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                      isCompleted
                        ? 'bg-green-600 border-green-600 text-white'
                        : isActive
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <div className="text-center mt-1.5">
                    <div
                      className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
                    >
                      {step.title}
                    </div>
                    <div className="text-[10px] text-gray-400 hidden sm:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        <Separator className="my-3" />

        {/* Step content */}
        <div className="py-3 min-h-[280px]">{renderStepContent()}</div>

        <Separator className="my-3" />

        {/* Footer buttons */}
        <DialogFooter>
          <div className="flex justify-between w-full gap-3">
            <Button variant="outline" onClick={isFirstStep ? () => onOpenChange(false) : prevStep}>
              {isFirstStep ? (
                'Annuler'
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </>
              )}
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Créer l'immeuble
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white">
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
