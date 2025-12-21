import { useGestionLogic } from './useGestionLogic'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DndContext,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import { Users, Plus, Info } from 'lucide-react'
import OrganizationTree from './components/OrganizationTree'
import UserCard from './components/UserCard'
import AddUserModal from './components/AddUserModal'
import UnassignedPanel from './components/UnassignedPanel'

/**
 * Page de gestion de l'organisation hiérarchique
 * Permet de visualiser et gérer la structure: Directeurs > Managers > Commerciaux
 * Utilise le drag and drop pour réorganiser la hiérarchie
 */
export default function Gestion() {
  const {
    isAdmin,
    isDirecteur,
    currentUserId,
    loading,
    error,
    organizationData,
    sensors,
    activeId,
    findUser,
    handleDragStart,
    handleDragEnd,
    isAddModalOpen,
    addUserType,
    addUserParent,
    handleOpenAddModal,
    handleCloseAddModal,
    handleUserCreated,
    refetchAll,
    directeurs,
    managers,
  } = useGestionLogic()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestion de l'Organisation</h1>
          <p className="text-muted-foreground text-base">
            Structure hiérarchique et gestion des équipes
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestion de l'Organisation</h1>
          <p className="text-muted-foreground text-base">
            Structure hiérarchique et gestion des équipes
          </p>
        </div>
        <Card className="p-6 border-destructive/50 bg-destructive/10">
          <p className="text-destructive">Erreur lors du chargement des données : {error}</p>
          <Button
            onClick={refetchAll}
            className="mt-2"
            variant="destructive"
          >
            Réessayer
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête compact */}
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion de l'Organisation</h1>
          <p className="text-sm text-muted-foreground">Structure hiérarchique et assignations</p>
        </div>
      </div>

      {/* Carte d'information compacte */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold mb-1">Drag & Drop</h3>
            <p className="text-xs text-muted-foreground">
              Glissez les commerciaux sur les managers ou directeurs, et les managers sur les
              directeurs pour les assigner.
            </p>
          </div>
        </div>
      </Card>

      {/* Bouton d'ajout principal (admin seulement) */}
      {isAdmin && (
        <div className="flex gap-2">
          <Button
            onClick={() => handleOpenAddModal('directeur')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau Directeur
          </Button>
        </div>
      )}

      {/* Layout avec panneau latéral et arbres */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-6 select-none">
          {/* Panneau latéral des non-assignés */}
          <UnassignedPanel
            managers={organizationData.unassigned.managers}
            commercials={organizationData.unassigned.commercials}
            onAddUser={handleOpenAddModal}
            isAdmin={isAdmin}
          />

          {/* Arbres organisationnels */}
          <div className="flex-1">
            <OrganizationTree
              data={organizationData.trees}
              onAddUser={handleOpenAddModal}
              isAdmin={isAdmin}
              isDirecteur={isDirecteur}
              currentUserId={parseInt(currentUserId, 10)}
            />
          </div>
        </div>

        {/* Overlay pour l'élément en cours de drag */}
        <DragOverlay>
          {activeId ? (
            <UserCard
              user={findUser(activeId.split('-')[1], activeId.split('-')[0])}
              type={activeId.split('-')[0]}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal d'ajout d'utilisateur */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSuccess={handleUserCreated}
        userType={addUserType}
        parentId={addUserParent}
        directeurs={directeurs}
        managers={managers}
      />
    </div>
  )
}
