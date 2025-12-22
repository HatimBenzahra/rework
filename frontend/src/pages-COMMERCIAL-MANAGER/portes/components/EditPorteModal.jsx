import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCommercialTheme } from '@/hooks/ui/use-commercial-theme'
import { Calendar, Clock, RotateCcw, Minus, Plus, MessageSquare, FileSignature } from 'lucide-react'

import { useKeyboardVisibility } from '@/hooks/ui/use-keyboard-visibility'

export default function EditPorteModal({
  open,
  onOpenChange,
  selectedPorte,
  immeubleAdresse,
  editForm,
  setEditForm,
  statutOptions,
  isSaving,
  onSave,
  onRepassageChange,
}) {
  const { base, colors, getButtonClasses } = useCommercialTheme()
  const { isKeyboardOpen } = useKeyboardVisibility()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          flex flex-col p-0 overflow-hidden bg-white border border-gray-200 shadow-xl rounded-xl transition-all duration-300
          ${isKeyboardOpen 
            ? '!top-0 !translate-y-0 !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !rounded-none' 
            : '!top-[3%] !translate-y-0 w-[98%] sm:w-[95%] md:w-[95%] lg:w-[92%] max-w-7xl max-h-[96dvh]'
          }
        `}
      >
        <DialogHeader className="px-5 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <DialogTitle className="text-lg md:text-xl font-bold text-gray-900 line-clamp-1">
            {selectedPorte?.nomPersonnalise || `Porte ${selectedPorte?.numero}`}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1 line-clamp-1">
            Étage {selectedPorte?.etage} • {immeubleAdresse}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 block">
                Nom personnalisé
              </label>
              <div className="relative">
                <Input
                  placeholder={selectedPorte ? `Porte ${selectedPorte.numero}` : 'Porte'}
                  value={editForm.nomPersonnalise}
                  onChange={e => setEditForm(prev => ({ ...prev, nomPersonnalise: e.target.value }))}
                  className="h-12 text-base bg-white border-gray-300 text-gray-900 pr-24 focus:ring-2 focus:ring-blue-100"
                />
                {editForm.nomPersonnalise && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditForm(prev => ({ ...prev, nomPersonnalise: '' }))}
                    className="absolute right-2 top-2 h-8 text-xs text-gray-500 hover:text-gray-900"
                  >
                    Effacer
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 block">
                Statut *
              </label>
              <Select
                value={editForm.statut}
                onValueChange={value => setEditForm(prev => ({ ...prev, statut: value }))}
              >
                <SelectTrigger className="h-12 bg-white border-gray-300 text-gray-900 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {statutOptions
                    .filter(option => option.value !== 'NECESSITE_REPASSAGE')
                    .map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="py-3 text-gray-900 focus:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <option.icon className="h-5 w-5 text-gray-600" />
                        <span className="text-base text-gray-900">
                          {option.label}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editForm.statut === 'RENDEZ_VOUS_PRIS' && (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
                <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rendez-vous
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700 block">Date *</label>
                    <input
                      type="date"
                      value={editForm.rdvDate}
                      onChange={e => setEditForm(prev => ({ ...prev, rdvDate: e.target.value }))}
                      className="w-full h-12 px-3 text-base bg-white border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Heure
                    </label>
                    <input
                      type="time"
                      value={editForm.rdvTime}
                      onChange={e => setEditForm(prev => ({ ...prev, rdvTime: e.target.value }))}
                      className="w-full h-12 px-3 text-base bg-white border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {editForm.statut === 'CONTRAT_SIGNE' && (
              <div className="p-4 bg-green-50/50 rounded-xl border border-green-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-100/80">
                      <FileSignature className="h-5 w-5 text-green-700" />
                    </div>
                    <span className="font-bold text-base text-green-700">Contrats</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 bg-white/60 p-3 rounded-xl border border-green-100">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setEditForm(prev => ({ ...prev, nbContrats: Math.max(1, (prev.nbContrats || 1) - 1) }))
                    }}
                    disabled={(editForm.nbContrats || 1) <= 1}
                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-white border border-green-200 text-green-600 shadow-sm disabled:opacity-40 disabled:shadow-none hover:bg-green-50 transition-all"
                  >
                    <Minus className="h-6 w-6" />
                  </button>

                  <span className="text-4xl font-bold text-green-700 min-w-[3ch] text-center">
                    {editForm.nbContrats || 1}
                  </span>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setEditForm(prev => ({ ...prev, nbContrats: (prev.nbContrats || 1) + 1 }))
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-600 text-white shadow-md hover:bg-green-700 active:scale-95 transition-all"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>
            )}

            {(editForm.statut === 'NECESSITE_REPASSAGE' || editForm.statut === 'ABSENT') && (
              <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <RotateCcw className="h-5 w-5 text-orange-600" />
                    <span className="font-bold text-base text-orange-700">Suivi de passage</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white/60 p-1 rounded-lg border border-orange-100">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        const diff = 1 - (selectedPorte?.nbRepassages || 0)
                        if (diff !== 0) onRepassageChange(selectedPorte, diff)
                      }}
                      className={`py-3 text-sm font-bold rounded-md transition-all ${
                        (selectedPorte?.nbRepassages || 0) <= 1
                          ? 'bg-orange-100 text-orange-700 shadow-sm'
                          : 'text-gray-500 hover:bg-orange-50'
                      }`}
                    >
                      1er Passage
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        const diff = 2 - (selectedPorte?.nbRepassages || 0)
                        if (diff !== 0) onRepassageChange(selectedPorte, diff)
                      }}
                      className={`py-3 text-sm font-bold rounded-md transition-all ${
                        (selectedPorte?.nbRepassages || 0) >= 2
                          ? 'bg-orange-100 text-orange-700 shadow-sm'
                          : 'text-gray-500 hover:bg-orange-50'
                      }`}
                    >
                      2ème Passage
                    </button>
                  </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 block">
                Commentaire
              </label>
              <Textarea
                placeholder="Ajouter un commentaire..."
                value={editForm.commentaire}
                onChange={e => setEditForm(prev => ({ ...prev, commentaire: e.target.value }))}
                className="min-h-[100px] text-base bg-white border-gray-300 text-gray-900 resize-none rounded-lg focus:border-gray-400 focus:ring-0"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-12 text-base font-medium border-gray-300 hover:bg-white hover:text-gray-900"
            >
              Annuler
            </Button>
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="h-12 text-base font-bold bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving ? '...' : 'Enregistrer'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
