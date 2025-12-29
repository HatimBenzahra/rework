import React, { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { List, LogOut, AlertTriangle, Zap } from 'lucide-react'

import { useRecording } from '@/hooks/audio/useRecording'
import { useRole } from '@/contexts/userole'
import { usePortesLogic } from './hooks/usePortesLogic'

import EditPorteModal from './components/EditPorteModal'
import PortesListe from './components/PortesListe'
import PortesRapide from './components/PortesRapide'

/**
 * Page de gestion des portes d'un immeuble
 * Agit comme un conteneur principal qui gère les données et le basculement entre les vues.
 */
export default function PortesGestion() {
  const { currentUserId, isManager } = useRole()
  
  // Custom Hook englobant toute la logique
  const { state, actions } = usePortesLogic()
  
  const {
      portes, statsData, loading, loadingImmeuble, immeuble, immeubleId, isFetchingMore,
      selectedFloor, viewMode, showEditModal, selectedPorte, editForm, isSaving, 
      showQuitConfirm, addingEtage, addingPorteToEtage, statutOptions, loadMore, hasMore 
  } = state
  
  const {
      setViewMode, setEditForm, setShowEditModal, setShowQuitConfirm,
      handleFloorSelect, handleEditPorte, handleSavePorte, 
      handleQuickStatusChange, handleRepassageChange, handleAddEtage, 
      handleAddPorteToEtage, handleBackToImmeubles, handleOpenEditModalFromRapide
  } = actions

  // Récupère contexte audio (layout) pour le hook d'enregistrement
  const { audioStatus } = useOutletContext() || {}

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

  return (
    <div className="space-y-3">
      {/* Header avec lien Quitter - TOUJOURS VISIBLE */}
      <div
        className={`top-0 z-[100] -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-transparent border-b border-border/50 flex items-center justify-between`}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowQuitConfirm(true)}
          className="flex items-center gap-2 h-9 bg-red-500 hover:bg-red-600 text-white font-bold shadow-md"
        >
          <LogOut className="h-6 w-6" />
          Quitter
        </Button>
        
        {/* Toggle de mode */}
        <button
          onClick={() => setViewMode(viewMode === 'rapide' ? 'liste' : 'rapide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 text-sm font-bold ${
            viewMode === 'rapide' 
              ? 'bg-white text-gray-700 border border-gray-200' 
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
          }`}
        >
          {viewMode === 'rapide' ? (
            <>
              <List className="h-4 w-4" />
              Mode Liste
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Mode Rapide
            </>
          )}
        </button>
      </div>

      {/* Rendu conditionnel selon le mode */}
      {viewMode === 'rapide' ? (
        <PortesRapide
          portes={portes}
          statsData={statsData}
          onQuickStatusChange={handleQuickStatusChange}
          onSwitchToListMode={() => setViewMode('liste')}
          immeuble={immeuble}
          onOpenEditModal={handleOpenEditModalFromRapide}
          onRepassageChange={handleRepassageChange}
          loadMore={loadMore}
          hasMore={hasMore}
          isFetchingMore={isFetchingMore}
        />
      ) : (
        <PortesListe
          portes={portes}
          statsData={statsData}
          loading={(loading && portes.length === 0) || loadingImmeuble}
          isFetchingMore={isFetchingMore}
          immeuble={immeuble}
          immeubleId={immeubleId}
          onEdit={handleEditPorte}
          onQuickChange={handleQuickStatusChange}
          onRepassageChange={handleRepassageChange}
          onBack={handleBackToImmeubles}
          onAddEtage={handleAddEtage}
          onAddPorteToEtage={handleAddPorteToEtage}
          addingEtage={addingEtage}
          addingPorteToEtage={addingPorteToEtage}
          selectedFloor={selectedFloor}
          onFloorSelect={handleFloorSelect}
        />
      )}

      {/* Dialogue de confirmation pour quitter */}
      <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
        <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <div className="flex items-center gap-3 mb-2">
               <div className="p-3 rounded-full bg-red-100">
                 <AlertTriangle className="h-6 w-6 text-red-600" />
               </div>
               <DialogTitle className="text-xl">Voulez-vous quitter cet immeuble ?</DialogTitle>
             </div>
             <DialogDescription className="text-base"></DialogDescription>
           </DialogHeader>
           <DialogFooter className="flex gap-3 sm:gap-3">
             <Button variant="outline" onClick={() => setShowQuitConfirm(false)} className="flex-1">
               Annuler
             </Button>
             <Button
               variant="destructive"
               onClick={() => {
                 setShowQuitConfirm(false)
                 handleBackToImmeubles()
               }}
               className="flex-1 bg-red-600 hover:bg-red-700"
             >
               <LogOut className="h-4 w-4 mr-2" />
               Oui, quitter
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition (partagé) */}
      <EditPorteModal
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open)
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
