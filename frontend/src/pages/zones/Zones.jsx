import { AdvancedDataTable } from '@/components/tableau'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import { ZoneCreatorModal } from '@/components/ZoneCreatorModal'
import { useRole } from '@/contexts/RoleContext'
import { useZones, useCreateZone, useDirecteurs, useManagers, useCommercials } from '@/services'
import { useState, useMemo } from 'react'
import { apiCache } from '@/services/api-cache'

// Fonction pour récupérer l'adresse via reverse geocoding Mapbox AVEC CACHE
const fetchLocationName = async (longitude, latitude) => {
  // Arrondir les coordonnées pour améliorer le taux de cache hit
  const roundedLng = longitude.toFixed(4)
  const roundedLat = latitude.toFixed(4)
  const cacheKey = `mapbox-geocode:${roundedLng},${roundedLat}`

  // Vérifier le cache d'abord
  const cached = apiCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=place,region,country&language=fr`
    )
    const data = await response.json()

    let locationName
    if (data.features && data.features.length > 0) {
      // Récupérer le lieu le plus pertinent (ville, région, pays)
      const feature = data.features[0]
      locationName = feature.place_name || feature.text
    } else {
      locationName = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
    }

    // Mettre en cache avec un TTL de 30 jours (les adresses ne changent pas souvent)
    apiCache.set(cacheKey, locationName, 30 * 24 * 60 * 60 * 1000)

    return locationName
  } catch (error) {
    console.error('Erreur lors de la récupération du nom de lieu:', error)
    const fallbackName = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
    // Mettre en cache même les erreurs (avec un TTL plus court de 1 heure)
    apiCache.set(cacheKey, fallbackName, 60 * 60 * 1000)
    return fallbackName
  }
}

export default function Zones() {
  const loading = useSimpleLoading(1000)
  const { currentRole } = useRole()
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [zoneLocations, setZoneLocations] = useState({})

  // API hooks
  const { data: zones, refetch: refetchZones } = useZones()
  const { mutate: createZone } = useCreateZone()
  const { data: directeurs } = useDirecteurs()
  const { data: managers } = useManagers()
  const { data: commercials } = useCommercials()

  // Fonction pour charger l'adresse d'une zone spécifique à la demande
  const loadZoneLocation = async (zoneId, xOrigin, yOrigin) => {
    if (zoneLocations[zoneId]) return zoneLocations[zoneId]

    try {
      const location = await fetchLocationName(xOrigin, yOrigin)
      setZoneLocations(prev => ({ ...prev, [zoneId]: location }))
      return location
    } catch (error) {
      console.error("Erreur lors du chargement de l'adresse:", error)
      return `${yOrigin.toFixed(2)}°N, ${xOrigin.toFixed(2)}°E`
    }
  }

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
      cell: row => {
        if (row.location) return row.location
        if (row.xOrigin && row.yOrigin) {
          return (
            <span
              className="cursor-pointer text-blue-600 hover:text-blue-800 underline"
              onClick={() => loadZoneLocation(row.id, row.xOrigin, row.yOrigin)}
              title="Cliquer pour charger l'adresse"
            >
              Charger l'adresse
            </span>
          )
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

  // Enrichir les zones avec l'information d'assignation et localisation
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
        location: zoneLocations[zone.id] || null,
      }
    })
  }, [zones, commercials, zoneLocations])

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

  const handleZoneValidate = async (zoneData, assignedUserId) => {
    try {
      // Créer la zone via l'API
      const newZone = await createZone(zoneData)

      // TODO: Assigner la zone à l'utilisateur sélectionné si nécessaire
      if (assignedUserId && newZone?.id) {
        console.log("Zone à assigner à l'utilisateur:", assignedUserId)
        // await assignZoneToUser(newZone.id, assignedUserId)
      }

      // Rafraîchir la liste des zones
      await refetchZones()

      setShowZoneModal(false)
      console.log('Zone créée avec succès:', zoneData)
    } catch (error) {
      console.error('Erreur lors de la création de la zone:', error)
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
        onEdit={undefined}
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
    </div>
  )
}
