import { useState, useMemo, useCallback } from 'react'
import { useRole } from '@/contexts/userole'
import {
  useDirecteursQuery,
  useManagersQuery,
  useCommercialsQuery,
  useUpdateManagerMutation,
  useUpdateCommercialMutation,
} from '@/hooks/metier/react-query'
import { useErrorToast } from '@/hooks/utils/ui/use-error-toast'
import {
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

export function useGestionLogic() {
  const { isAdmin, isDirecteur, currentUserId } = useRole()
  const { showError, showSuccess } = useErrorToast()

  // Récupérer les données avec React Query
  const {
    data: directeurs = [],
    isLoading: loadingDirecteurs,
    error: errorDirecteurs,
    refetch: refetchDirecteurs,
  } = useDirecteursQuery()

  const {
    data: managers = [],
    isLoading: loadingManagers,
    error: errorManagers,
    refetch: refetchManagers,
  } = useManagersQuery()

  const {
    data: commercials = [],
    isLoading: loadingCommercials,
    error: errorCommercials,
    refetch: refetchCommercials,
  } = useCommercialsQuery()

  // Mutations avec optimistic updates
  const { mutate: updateManager } = useUpdateManagerMutation()
  const { mutate: updateCommercial } = useUpdateCommercialMutation()

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
          // React Query va mettre à jour l'UI instantanément avec optimistic update
          updateCommercial(
            {
              id: activeUserId,
              managerId: overUserId,
            },
            {
              onSuccess: () => {
                showSuccess('Commercial assigné au manager avec succès')
              },
            }
          )
        } else if (overType === 'directeur') {
          // Assigner commercial directement à un directeur (sans manager)
          updateCommercial(
            {
              id: activeUserId,
              directeurId: overUserId,
              managerId: null,
            },
            {
              onSuccess: () => {
                showSuccess('Commercial assigné au directeur avec succès')
              },
            }
          )
        }
      } else if (activeType === 'manager') {
        if (overType === 'directeur') {
          // Assigner manager à un directeur
          // Avant de déplacer le manager, récupérer tous ses commerciaux
          const managerCommercials = commercials?.filter(c => c.managerId === activeUserId)

          // Mettre à jour le directeur du manager
          updateManager(
            {
              id: activeUserId,
              directeurId: overUserId,
            },
            {
              onSuccess: () => {
                // Mettre à jour tous les commerciaux du manager pour enlever leur managerId
                // Ils deviendront "sans manager" mais resteront à leur place
                if (managerCommercials && managerCommercials.length > 0) {
                  managerCommercials.forEach(commercial => {
                    updateCommercial({
                      id: commercial.id,
                      managerId: null,
                      // Garder le directeurId s'il existe, sinon le mettre à null aussi
                      directeurId: commercial.directeurId || null,
                    })
                  })
                }

                showSuccess('Manager assigné au directeur avec succès')
              },
            }
          )
        } else {
          // Empêcher le drop de manager sur autre chose qu'un directeur
          showError(
            new Error("Un manager ne peut être assigné qu'à un directeur"),
            'Gestion.handleDragEnd'
          )
          return
        }
      }
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
  const error = errorDirecteurs?.message || errorManagers?.message || errorCommercials?.message

  const refetchAll = () => {
    refetchDirecteurs()
    refetchManagers()
    refetchCommercials()
  }

  return {
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
  }
}
