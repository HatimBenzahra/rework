import { useState, useMemo, useCallback } from 'react'
import { useRole } from '@/contexts/userole'
import {
  useDirecteurs,
  useManagers,
  useCommercials,
  useUpdateManager,
  useUpdateCommercial,
} from '@/services'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
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
  const { currentRole, currentUserId, isAdmin, isDirecteur } = useRole()
  const { showError, showSuccess } = useErrorToast()

  // Récupérer les données
  const {
    data: directeurs,
    loading: loadingDirecteurs,
    error: errorDirecteurs,
    refetch: refetchDirecteurs,
  } = useDirecteurs(parseInt(currentUserId, 10), currentRole)

  const {
    data: managers,
    loading: loadingManagers,
    error: errorManagers,
    refetch: refetchManagers,
  } = useManagers(parseInt(currentUserId, 10), currentRole)

  const {
    data: commercials,
    loading: loadingCommercials,
    error: errorCommercials,
    refetch: refetchCommercials,
  } = useCommercials(parseInt(currentUserId, 10), currentRole)

  // Mutations
  const { mutate: updateManager } = useUpdateManager()
  const { mutate: updateCommercial } = useUpdateCommercial()

  // État local
  const [activeId, setActiveId] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addUserType, setAddUserType] = useState(null)
  const [addUserParent, setAddUserParent] = useState(null)

  // Configuration des sensors pour le drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 3px de mouvement avant de commencer le drag (plus sensible)
      },
    })
  )

  // Construire la structure hiérarchique
  const organizationData = useMemo(() => {
    if (!directeurs || !managers || !commercials)
      return { trees: [], unassigned: { managers: [], commercials: [] } }

    // Créer les arbres pour chaque directeur
    const trees = directeurs.map(directeur => ({
      ...directeur,
      type: 'directeur',
      managers: managers
        .filter(m => m.directeurId === directeur.id)
        .map(manager => ({
          ...manager,
          type: 'manager',
          commercials: commercials
            .filter(c => c.managerId === manager.id)
            .map(commercial => ({
              ...commercial,
              type: 'commercial',
            })),
        })),
      // Commerciaux directs (sans manager)
      directCommercials: commercials
        .filter(c => c.directeurId === directeur.id && !c.managerId)
        .map(commercial => ({
          ...commercial,
          type: 'commercial',
        })),
    }))

    // Trouver les utilisateurs non assignés
    const unassignedManagers = managers
      .filter(m => !m.directeurId)
      .map(m => ({ ...m, type: 'manager' }))

    const unassignedCommercials = commercials
      .filter(c => !c.directeurId && !c.managerId)
      .map(c => ({ ...c, type: 'commercial' }))

    return {
      trees,
      unassigned: {
        managers: unassignedManagers,
        commercials: unassignedCommercials,
      },
    }
  }, [directeurs, managers, commercials])

  // Trouver un utilisateur par ID et type
  const findUser = useCallback(
    (id, type) => {
      const idNum = parseInt(id)
      switch (type) {
        case 'directeur':
          return directeurs?.find(d => d.id === idNum)
        case 'manager':
          return managers?.find(m => m.id === idNum)
        case 'commercial':
          return commercials?.find(c => c.id === idNum)
        default:
          return null
      }
    },
    [directeurs, managers, commercials]
  )

  // Gérer le début du drag
  const handleDragStart = event => {
    setActiveId(event.active.id)
  }

  // Gérer le drop
  const handleDragEnd = async event => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    try {
      // Parser les IDs (format: "type-id" ou "dropzone-type-id")
      const [activeType, activeIdStr] = active.id.split('-')
      const activeUserId = parseInt(activeIdStr)

      // Vérifier si on drop sur une dropzone ou sur une carte
      let overType, overUserId, overIdStr
      if (over.id.startsWith('dropzone-')) {
        // Drop sur une dropzone: "dropzone-manager-5" ou "dropzone-commercial-3" ou "dropzone-direct-commercial-5"
        const parts = over.id.split('-')

        if (parts[1] === 'direct') {
          // dropzone-direct-commercial-5 → directeur avec id 5
          overType = 'directeur'
          overUserId = parseInt(parts[3])
        } else if (parts[1] === 'manager') {
          // dropzone-manager-5 → directeur avec id 5 (drop de manager sur directeur)
          overType = 'directeur'
          overUserId = parseInt(parts[2])
        } else if (parts[1] === 'commercial') {
          // dropzone-commercial-3 → manager avec id 3
          overType = 'manager'
          overUserId = parseInt(parts[2])
        }
      } else {
        // Drop sur une carte d'utilisateur
        ;[overType, overIdStr] = over.id.split('-')
        overUserId = parseInt(overIdStr)
      }

      // Règles de déplacement:
      // 1. Commercial peut être déplacé vers Manager ou Directeur
      // 2. Manager peut SEULEMENT être déplacé vers Directeur
      // 3. Directeur ne peut pas être déplacé

      if (activeType === 'commercial') {
        if (overType === 'manager') {
          // Assigner commercial à un manager
          await updateCommercial({
            id: activeUserId,
            managerId: overUserId,
          })
          showSuccess('Commercial assigné au manager avec succès')
        } else if (overType === 'directeur') {
          // Assigner commercial directement à un directeur (sans manager)
          await updateCommercial({
            id: activeUserId,
            directeurId: overUserId,
            managerId: null,
          })
          showSuccess('Commercial assigné au directeur avec succès')
        }
      } else if (activeType === 'manager') {
        if (overType === 'directeur') {
          // Assigner manager à un directeur
          // Avant de déplacer le manager, récupérer tous ses commerciaux
          const managerCommercials = commercials?.filter(c => c.managerId === activeUserId)

          // Mettre à jour le directeur du manager
          await updateManager({
            id: activeUserId,
            directeurId: overUserId,
          })

          // Mettre à jour tous les commerciaux du manager pour enlever leur managerId
          // Ils deviendront "sans manager" mais resteront à leur place
          if (managerCommercials && managerCommercials.length > 0) {
            await Promise.all(
              managerCommercials.map(commercial =>
                updateCommercial({
                  id: commercial.id,
                  managerId: null,
                  // Garder le directeurId s'il existe, sinon le mettre à null aussi
                  directeurId: commercial.directeurId || null,
                })
              )
            )
          }

          showSuccess('Manager assigné au directeur avec succès')
        } else {
          // Empêcher le drop de manager sur autre chose qu'un directeur
          showError(
            new Error("Un manager ne peut être assigné qu'à un directeur"),
            'Gestion.handleDragEnd'
          )
          return
        }
      }

      // Rafraîchir les données
      await Promise.all([refetchDirecteurs(), refetchManagers(), refetchCommercials()])
    } catch (error) {
      showError(error, 'Gestion.handleDragEnd')
    }
  }

  // Gérer l'ouverture du modal d'ajout
  const handleOpenAddModal = (type, parentId = null) => {
    setAddUserType(type)
    setAddUserParent(parentId)
    setIsAddModalOpen(true)
  }

  // Gérer la fermeture du modal
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
    setAddUserType(null)
    setAddUserParent(null)
  }

  // Gérer la création d'utilisateur
  const handleUserCreated = async () => {
    // Rafraîchir les données
    await Promise.all([refetchDirecteurs(), refetchManagers(), refetchCommercials()])
    handleCloseAddModal()
  }

  const loading = loadingDirecteurs || loadingManagers || loadingCommercials
  const error = errorDirecteurs || errorManagers || errorCommercials

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
            onClick={() => {
              refetchDirecteurs()
              refetchManagers()
              refetchCommercials()
            }}
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
      {/* En-tête */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          Gestion de l'Organisation
        </h1>
        <p className="text-muted-foreground text-base">
          Visualisez et gérez la structure hiérarchique de votre organisation
        </p>
      </div>

      {/* Carte d'information */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold">Comment utiliser le drag & drop</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Glissez un commercial sur un manager pour l'assigner à ce manager</li>
              <li>
                • Glissez un commercial sur un directeur pour l'assigner directement au directeur
              </li>
              <li>• Glissez un manager sur un directeur pour l'assigner à ce directeur</li>
              <li>
                • Utilisez les boutons <Plus className="h-3 w-3 inline" /> pour ajouter de nouveaux
                membres
              </li>
            </ul>
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
