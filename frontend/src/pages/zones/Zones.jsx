import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { ZoneCreatorModal } from '@/components/ZoneCreatorModal'
import { ActionConfirmation } from '@/components/ActionConfirmation'
import { useEntityPage } from '@/hooks/useRoleBasedData'
import { useRole } from '@/contexts/RoleContext'
import {
  useZones,
  useCreateZone,
  useUpdateZone,
  useRemoveZone,
  useDirecteurs,
  useManagers,
  useCommercials,
  useAssignZone,
} from '@/services'
import { useState, useMemo } from 'react'
import { apiCache } from '@/services/api-cache'

// Fonction pour récupérer l'adresse via reverse geocoding Mapbox AVEC CACHE
const fetchLocationName = async (longitude, latitude) => {
  // Arrondir les coordonnées pour améliorer le taux de cache hit
  const roundedLng = longitude.toFixed(4)
  const roundedLat = latitude.toFixed(4)
  // Créer une fonction unique pour cette géolocalisation
  const fetchGeocode = async () => {
    try {
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=place,region,country&language=fr`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        // Récupérer le lieu le plus pertinent (ville, région, pays)
        const feature = data.features[0]
        return feature.place_name || feature.text
      } else {
        return `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du nom de lieu:', error)
      return `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
    }
  }

  // Utiliser ton système de cache avec namespace et gestion de déduplication
  const cacheKey = apiCache.getKey(fetchGeocode, [roundedLng, roundedLat], 'mapbox-geocode')
  return apiCache.fetchWithCache(cacheKey, fetchGeocode)
}

export default function Zones() {
  const loading = useSimpleLoading(1000)
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [confirmAction, setConfirmAction] = useState({
    isOpen: false,
    type: '',
    zone: null,
    isLoading: false,
  })

  // Récupération du rôle de l'utilisateur
  const { currentRole } = useRole()

  // API hooks
  const { data: zonesApi, refetch: refetchZones } = useZones()
  const { mutate: createZone } = useCreateZone()
  const { mutate: updateZone } = useUpdateZone()
  const { mutate: removeZone } = useRemoveZone()
  const { mutate: assignZoneToCommercial } = useAssignZone()
  const { data: directeurs } = useDirecteurs()
  const { data: managers } = useManagers()
  const { data: commercials } = useCommercials()

  // Utilisation du système de rôles pour filtrer les données
  const {
    data: filteredZones,
    permissions,
    description,
  } = useEntityPage('zones', zonesApi || [], { commercials })

  // Configuration pour le lazy loading des adresses
  const mapboxLazyLoader = useMemo(
    () => ({
      namespace: 'mapbox-geocode',
      fetcher: async zone => {
        return fetchLocationName(zone.xOrigin, zone.yOrigin)
      },
      getCacheKey: zone => [zone.xOrigin.toFixed(4), zone.yOrigin.toFixed(4)],
      shouldLoad: (zone, currentData) => {
        return zone.xOrigin && zone.yOrigin && !currentData
      },
      delay: 200, // 200ms entre chaque appel
      maxConcurrent: 3,
    }),
    []
  )

  // Définition des colonnes du tableau
  const zonesColumns = [
    {
      header: 'Nom',
      accessor: 'nom',
      sortable: true,
      className: 'font-medium',
    },
    {
      header: 'Localisation',
      accessor: 'location',
      className: 'hidden sm:table-cell',
      cell: (row, { getLoadedData, isLoading }) => {
        // Utiliser les données chargées dynamiquement
        const loadedLocation = getLoadedData(row, 'mapbox-geocode')

        if (loadedLocation) return loadedLocation

        if (row.xOrigin && row.yOrigin) {
          const isCurrentlyLoading = isLoading(row, 'mapbox-geocode')
          if (isCurrentlyLoading) {
            return (
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>
                Chargement...
              </span>
            )
          }
          // Si pas encore chargé et pas en cours, afficher coordonnées temporaires
          return `${row.yOrigin.toFixed(2)}°N, ${row.xOrigin.toFixed(2)}°E`
        }

        return 'Coordonnées non disponibles'
      },
    },
    {
      header: 'Date de création',
      accessor: 'createdAt',
      sortable: true,
      className: 'hidden md:table-cell',
      cell: row => new Date(row.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      header: 'Assigné à',
      accessor: 'assignedTo',
      className: 'hidden lg:table-cell',
      cell: row => row.assignedTo || 'Non assigné',
    },
    {
      header: 'Rayon (km)',
      accessor: 'rayon',
      sortable: true,
      className: 'hidden xl:table-cell text-start',
      cell: row => `${(row.rayon / 1000).toFixed(1)} km`,
    },
  ]

  // Enrichir les zones avec l'information d'assignation
  const enrichedZones = useMemo(() => {
    if (!filteredZones) return []

    return filteredZones.map(zone => {
      const assignedToList = []

      // 1. Vérifier l'assignation directe au directeur
      if (zone.directeurId && directeurs) {
        const directeur = directeurs.find(d => d.id === zone.directeurId)
        if (directeur) {
          assignedToList.push(`${directeur.prenom} ${directeur.nom} (Directeur)`)
        }
      }

      // 2. Vérifier l'assignation directe au manager
      if (zone.managerId && managers) {
        const manager = managers.find(m => m.id === zone.managerId)
        if (manager) {
          assignedToList.push(`${manager.prenom} ${manager.nom} (Manager)`)
        }
      }

      // 3. Trouver les commerciaux assignés à cette zone (via CommercialZone)
      if (commercials) {
        const assignedCommercials = commercials.filter(commercial =>
          commercial.zones?.some(z => z.id === zone.id)
        )
        if (assignedCommercials.length > 0) {
          assignedCommercials.forEach(c => {
            assignedToList.push(`${c.prenom} ${c.nom} (Commercial)`)
          })
        }
      }

      const assignedTo = assignedToList.length > 0 ? assignedToList.join(', ') : null

      return {
        ...zone,
        assignedTo,
      }
    })
  }, [filteredZones, directeurs, managers, commercials])

  // Préparer les utilisateurs assignables selon le rôle
  const getAssignableUsers = () => {
    const users = []

    // Les permissions sont déjà gérées par le système de rôles
    // On peut toujours proposer l'assignation si on a les droits d'ajout/édition
    if (permissions.canAdd || permissions.canEdit) {
      if (directeurs) {
        users.push(
          ...directeurs.map(d => ({
            id: d.id,
            name: `${d.prenom} ${d.nom}`,
            role: 'directeur',
          }))
        )
      }
      if (managers) {
        users.push(
          ...managers.map(m => ({
            id: m.id,
            name: `${m.prenom} ${m.nom}`,
            role: 'manager',
          }))
        )
      }
      if (commercials) {
        users.push(
          ...commercials.map(c => ({
            id: c.id,
            name: `${c.prenom} ${c.nom}`,
            role: 'commercial',
          }))
        )
      }
    }

    return users
  }

  const handleAddZone = () => {
    setEditingZone(null)
    setShowZoneModal(true)
  }

  /**
   * Détermine l'utilisateur assigné à une zone (format: "role-id")
   * @param {object} zone - La zone à analyser
   * @returns {string} Format: "directeur-5", "manager-3", "commercial-7" ou ""
   */
  const getAssignedUserIdFromZone = zone => {
    if (!zone) return ''

    // Priorité: directeur > manager > commercial
    if (zone.directeurId) {
      return `directeur-${zone.directeurId}`
    }

    if (zone.managerId) {
      return `manager-${zone.managerId}`
    }

    // Pour les commerciaux, prendre le premier assigné s'il y en a
    if (zone.commercials && zone.commercials.length > 0) {
      return `commercial-${zone.commercials[0].commercialId}`
    }

    return ''
  }

  const handleEditZone = zone => {
    setConfirmAction({
      isOpen: true,
      type: 'edit',
      zone,
      isLoading: false,
    })
  }

  const confirmEditZone = () => {
    // Enrichir la zone avec l'utilisateur assigné actuel
    const zoneWithAssignment = {
      ...confirmAction.zone,
      assignedUserId: getAssignedUserIdFromZone(confirmAction.zone),
    }
    setEditingZone(zoneWithAssignment)
    setShowZoneModal(true)
    setConfirmAction({ isOpen: false, type: '', zone: null, isLoading: false })
  }

  const handleDeleteZone = zone => {
    setConfirmAction({
      isOpen: true,
      type: 'delete',
      zone,
      isLoading: false,
    })
  }

  const confirmDeleteZone = async () => {
    setConfirmAction(prev => ({ ...prev, isLoading: true }))
    try {
      await removeZone(confirmAction.zone.id)
      await refetchZones()
      console.log('Zone supprimée avec succès')
      setConfirmAction({ isOpen: false, type: '', zone: null, isLoading: false })
    } catch (error) {
      console.error('Erreur lors de la suppression de la zone:', error)
      setConfirmAction(prev => ({ ...prev, isLoading: false }))
    }
  }

  /**
   * Parse l'assignedUserId (format: "role-id") et retourne le rôle et l'ID
   * @param {string} assignedUserId - Format: "directeur-5", "manager-3", "commercial-7"
   * @returns {{role: string, id: number} | null}
   */
  const parseAssignedUserId = assignedUserId => {
    if (!assignedUserId || typeof assignedUserId !== 'string') return null

    const parts = assignedUserId.split('-')
    if (parts.length !== 2) return null

    const [role, idStr] = parts
    const id = parseInt(idStr, 10)

    if (isNaN(id)) return null

    return { role, id }
  }

  /**
   * Prépare les données de la zone avec l'assignation appropriée
   * @param {object} zoneData - Données de base de la zone
   * @param {string} assignedUserId - Format: "role-id"
   * @returns {object} Données enrichies avec directeurId ou managerId
   */
  const prepareZoneDataWithAssignment = (zoneData, assignedUserId) => {
    const assignment = parseAssignedUserId(assignedUserId)

    if (!assignment) return zoneData

    const enrichedData = { ...zoneData }

    // Réinitialiser les assignations existantes
    enrichedData.directeurId = null
    enrichedData.managerId = null

    // Ajouter l'assignation appropriée selon le rôle
    if (assignment.role === 'directeur') {
      enrichedData.directeurId = assignment.id
    } else if (assignment.role === 'manager') {
      enrichedData.managerId = assignment.id
    }
    // Pour les commerciaux, on ne définit pas directeurId/managerId
    // L'assignation se fait via la mutation assignZoneToCommercial

    return enrichedData
  }

  const handleZoneValidate = async (zoneData, assignedUserId) => {
    try {
      const assignment = parseAssignedUserId(assignedUserId)

      if (editingZone) {
        // Modifier la zone existante
        const enrichedData = prepareZoneDataWithAssignment(zoneData, assignedUserId)
        const updatedZone = await updateZone({
          id: editingZone.id,
          ...enrichedData,
        })

        // Si c'est un commercial, gérer l'assignation via la mutation spécifique
        if (assignment?.role === 'commercial') {
          // Note: Pour l'instant on ne gère que l'ajout, pas le remplacement
          // Une amélioration future serait de gérer les assignations multiples
          console.log(
            'Assignation commercial lors de la modification - à implémenter si nécessaire'
          )
        }

        console.log('Zone modifiée avec succès:', updatedZone)
      } else {
        // Créer une nouvelle zone
        const enrichedData = prepareZoneDataWithAssignment(zoneData, assignedUserId)
        const newZone = await createZone(enrichedData)

        // Si c'est un commercial, l'assigner à la zone via la mutation spécifique
        if (assignment?.role === 'commercial' && newZone?.id) {
          try {
            await assignZoneToCommercial({
              commercialId: assignment.id,
              zoneId: newZone.id,
            })
            console.log(`Zone ${newZone.id} assignée au commercial ${assignment.id}`)
          } catch (assignError) {
            console.error("Erreur lors de l'assignation du commercial:", assignError)
            // La zone est créée mais l'assignation a échoué
            // On pourrait afficher un message à l'utilisateur ici
          }
        }

        console.log('Zone créée avec succès:', newZone)
      }

      // Rafraîchir la liste des zones
      await refetchZones()
      setShowZoneModal(false)
    } catch (error) {
      console.error(
        `Erreur lors de ${editingZone ? 'la modification' : 'la création'} de la zone:`,
        error
      )
    }
  }

  const handleCloseModal = () => {
    setShowZoneModal(false)
    setEditingZone(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Zones</h1>
          <p className="text-muted-foreground text-base">
            Gestion des zones géographiques et suivi des performances territoriales
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Zones</h1>
        <p className="text-muted-foreground text-base">{description}</p>
      </div>

      <AdvancedDataTable
        title="Liste des Zones"
        description={description}
        data={enrichedZones}
        columns={zonesColumns}
        searchKey="nom"
        onAdd={permissions.canAdd ? handleAddZone : undefined}
        addButtonText="Nouvelle Zone"
        detailsPath="/zones"
        onEdit={permissions.canEdit ? handleEditZone : undefined}
        onDelete={permissions.canDelete ? handleDeleteZone : undefined}
        lazyLoaders={[mapboxLazyLoader]}
      />

      {showZoneModal && (
        <ZoneCreatorModal
          onValidate={handleZoneValidate}
          onClose={handleCloseModal}
          existingZones={filteredZones || []}
          zoneToEdit={editingZone}
          userRole={currentRole}
          assignableUsers={getAssignableUsers()}
        />
      )}

      <ActionConfirmation
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ isOpen: false, type: '', zone: null, isLoading: false })}
        onConfirm={confirmAction.type === 'delete' ? confirmDeleteZone : confirmEditZone}
        type={confirmAction.type}
        title={confirmAction.type === 'delete' ? 'Supprimer la zone' : 'Modifier la zone'}
        description={
          confirmAction.type === 'delete'
            ? 'Cette action supprimera définitivement la zone et toutes ses associations avec les commerciaux.'
            : 'Vous allez modifier les paramètres de cette zone.'
        }
        itemName={confirmAction.zone?.nom}
        confirmText={confirmAction.type === 'delete' ? 'Supprimer' : 'Modifier'}
        isLoading={confirmAction.isLoading}
      />
    </div>
  )
}
