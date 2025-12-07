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
import { Calendar, Clock, RotateCcw, Minus, Plus, MessageSquare } from 'lucide-react'

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-lg mx-auto !bg-white dark:!bg-white !border-gray-200 dark:!border-gray-200 h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-[2vh] py-[1.5vh] border-b !border-gray-200 dark:!border-gray-200 flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold !text-gray-900 dark:!text-gray-900 line-clamp-1">
            {selectedPorte?.nomPersonnalise || `Porte ${selectedPorte?.numero}`}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm !text-gray-600 dark:!text-gray-600 line-clamp-1 mt-1">
            Étage {selectedPorte?.etage} • {immeubleAdresse}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-[2vh] py-[1.5vh] min-h-0">
          <div className="space-y-[1.5vh]">
            <div className="space-y-[0.5vh]">
              <label className="text-[clamp(0.75rem,1.6vh,0.875rem)] font-semibold !text-gray-900 dark:!text-gray-900 flex items-center gap-2">
                Nom personnalisé (optionnel)
              </label>
              <Input
                placeholder={selectedPorte ? `Porte ${selectedPorte.numero}` : 'Porte'}
                value={editForm.nomPersonnalise}
                onChange={e => setEditForm(prev => ({ ...prev, nomPersonnalise: e.target.value }))}
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

            {(editForm.statut === 'NECESSITE_REPASSAGE' || editForm.statut === 'ABSENT') && (
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
                      onClick={() => onRepassageChange(selectedPorte, -1)}
                      disabled={!selectedPorte || selectedPorte.nbRepassages === 0}
                      className={`h-9 w-9 sm:h-10 sm:w-10 p-0 ${colors.danger.bgLight} ${colors.danger.text} hover:${colors.danger.bg} border ${colors.danger.border}`}
                    >
                      <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRepassageChange(selectedPorte, 1)}
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
          </div>
        </div>

        <DialogFooter className="px:[2vh] py-[1.5vh] border-t !border-gray-200 dark:!border-gray-200 flex-shrink-0 px-[2vh]">
          <div className="flex flex-col-reverse sm:flex-row gap-[1vh] w-full">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className={`w-full sm:flex-1 h-10 sm:h-11 text-sm sm:text-base ${getButtonClasses('outline')}`}
            >
              Annuler
            </Button>
            <Button
              variant="ghost"
              onClick={onSave}
              disabled={isSaving}
              className={`w-full sm:flex-1 h-10 sm:h-11 text-sm sm:text-base ${getButtonClasses('primary')}`}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
