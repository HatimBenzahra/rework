import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { ZoneCreatorModal } from '@/components/ZoneCreatorModal'
import { ActionConfirmation } from '@/components/ActionConfirmation'
import { useRole } from '@/contexts/RoleContext'
import {
  useZones,
  useCreateZone,
  useUpdateZone,
  useRemoveZone,
  useDirecteurs,
  useManagers,
  useCommercials,
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
  const { currentRole } = useRole()
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [confirmAction, setConfirmAction] = useState({ isOpen: false, type: '', zone: null, isLoading: false })

  // API hooks
  const { data: zones, refetch: refetchZones } = useZones()
  const { mutate: createZone } = useCreateZone()
  const { mutate: updateZone } = useUpdateZone()
  const { mutate: removeZone } = useRemoveZone()
  const { data: directeurs } = useDirecteurs()
  const { data: managers } = useManagers()
  const { data: commercials } = useCommercials()

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
    if (!zones || !commercials) return zones || []

    return zones.map(zone => {
      // Trouver les commercials assignés à cette zone
      const assignedCommercials = commercials.filter(commercial =>
        commercial.zones?.some(z => z.id === zone.id)
      )

      const assignedTo =
        assignedCommercials.length > 0
          ? assignedCommercials.map(c => `${c.prenom} ${c.nom}`).join(', ')
          : null

      return {
        ...zone,
        assignedTo,
      }
    })
  }, [zones, commercials])

  // Préparer les utilisateurs assignables selon le rôle (seulement pour admin et directeur)
  const getAssignableUsers = () => {
    const users = []

    if (currentRole === 'admin') {
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
    } else if (currentRole === 'directeur') {
      // Directeur peut assigner à ses managers et commerciaux
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
    // Manager ne peut pas créer de zones, donc pas de cas pour 'manager'

    return users
  }

  const handleAddZone = () => {
    setEditingZone(null)
    setShowZoneModal(true)
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
    setEditingZone(confirmAction.zone)
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

  const handleZoneValidate = async (zoneData, assignedUserId) => {
    try {
      if (editingZone) {
        // Modifier la zone existante
        const updatedZone = await updateZone({
          id: editingZone.id,
          ...zoneData,
        })
        console.log('Zone modifiée avec succès:', updatedZone)
      } else {
        // Créer une nouvelle zone
        const newZone = await createZone(zoneData)

        // TODO: Assigner la zone à l'utilisateur sélectionné si nécessaire
        if (assignedUserId && newZone?.id) {
          console.log("Zone à assigner à l'utilisateur:", assignedUserId)
          // await assignZoneToUser(newZone.id, assignedUserId)
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
        <p className="text-muted-foreground text-base">
          Gestion des zones géographiques et suivi des performances territoriales
        </p>
      </div>

      <AdvancedDataTable
        title="Liste des Zones"
        description="Toutes les zones de couverture avec leurs statistiques et performances"
        data={enrichedZones}
        columns={zonesColumns}
        searchKey="nom"
        onAdd={currentRole !== 'manager' ? handleAddZone : undefined}
        addButtonText="Nouvelle Zone"
        detailsPath="/zones"
        onEdit={currentRole !== 'manager' ? handleEditZone : undefined}
        onDelete={currentRole !== 'manager' ? handleDeleteZone : undefined}
        lazyLoaders={[mapboxLazyLoader]}
      />

      {showZoneModal && (
        <ZoneCreatorModal
          onValidate={handleZoneValidate}
          onClose={handleCloseModal}
          existingZones={zones || []}
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
        title={
          confirmAction.type === 'delete'
            ? 'Supprimer la zone'
            : 'Modifier la zone'
        }
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
