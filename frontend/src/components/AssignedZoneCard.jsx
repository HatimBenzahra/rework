import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Maximize2, X, Lock, Unlock, Building2 } from 'lucide-react'
import { MapSkeleton } from '@/components/LoadingSkeletons'
import { apiCache } from '@/services/api-cache'
import { logError } from '@/services/graphql-errors'

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

// Generate a deterministic color from zone ID
function getZoneColor(zoneId) {
  const colors = [
    '#3388ff', // Blue
    '#ff6b6b', // Red
    '#51cf66', // Green
    '#ffd93d', // Yellow
    '#a78bfa', // Purple
    '#f59e0b', // Orange
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Dark Orange
  ]
  return colors[zoneId % colors.length]
}

function createGeoJSONCircle(center, radiusInMeters, points = 64) {
  const coords = { latitude: center[1], longitude: center[0] }
  const km = radiusInMeters / 1000
  const ret = []
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180))
  const distanceY = km / 110.574
  let theta, x, y
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI)
    x = distanceX * Math.cos(theta)
    y = distanceY * Math.sin(theta)
    ret.push([coords.longitude + x, coords.latitude + y])
  }
  ret.push(ret[0])
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ret] },
    properties: {},
  }
}

// Fonction pour récupérer l'adresse via reverse geocoding Mapbox AVEC CACHE
const fetchLocationName = async (longitude, latitude) => {
  const roundedLng = longitude.toFixed(4)
  const roundedLat = latitude.toFixed(4)

  const fetchGeocode = async () => {
    try {
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=place,region,country&language=fr`
      )

      if (!response.ok) {
        throw new Error(`Erreur Mapbox API: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        return feature.place_name || feature.text
      } else {
        return `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
      }
    } catch (error) {
      // Utiliser le système centralisé de logging d'erreurs
      logError(error, 'AssignedZoneCard.fetchLocationName', {
        longitude,
        latitude,
      })
      return `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
    }
  }

  const cacheKey = apiCache.getKey(fetchGeocode, [roundedLng, roundedLat], 'mapbox-geocode')
  return apiCache.fetchWithCache(cacheKey, fetchGeocode)
}

/**
 * Composant pour afficher la zone assignée à un commercial/manager/directeur
 * @param {Object} props
 * @param {Object} props.zone - Objet zone avec xOrigin, yOrigin, rayon, nom, id, immeubles
 * @param {string} props.assignmentDate - Date d'assignation au format ISO
 * @param {number} props.immeublesCount - Nombre d'immeubles dans la zone
 * @param {string} props.className - Classes CSS supplémentaires
 */
export default function AssignedZoneCard({
  zone,
  assignmentDate,
  className = '',
  fullWidth = false,
}) {
  const mapRef = useRef(null)
  const navigate = useNavigate()
  const [mapLoading, setMapLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMapLocked, setIsMapLocked] = useState(true) // Map verrouillée par défaut
  const [locationName, setLocationName] = useState('Chargement...')

  // Charger le nom de la localisation
  useEffect(() => {
    if (zone?.xOrigin && zone?.yOrigin) {
      fetchLocationName(zone.xOrigin, zone.yOrigin)
        .then(name => {
          setLocationName(name)
        })
        .catch(error => {
          // Gérer les erreurs de géocodage silencieusement
          logError(error, 'AssignedZoneCard.useEffect.fetchLocationName', {
            zoneId: zone.id,
            zoneName: zone.nom,
          })
          setLocationName(`${zone.yOrigin.toFixed(2)}°N, ${zone.xOrigin.toFixed(2)}°E`)
        })
    }
  }, [zone])

  const zoneColor = useMemo(() => {
    return zone?.id ? getZoneColor(zone.id) : '#3388ff'
  }, [zone?.id])

  const circleGeoJSON = useMemo(() => {
    if (!zone?.xOrigin || !zone?.yOrigin || !zone?.rayon) return null
    return createGeoJSONCircle([zone.xOrigin, zone.yOrigin], zone.rayon)
  }, [zone])

  // Filtrer les immeubles qui ont des coordonnées valides
  const immeublesWithCoordinates = useMemo(() => {
    if (!zone?.immeubles) return []
    return zone.immeubles.filter(
      immeuble =>
        immeuble.latitude != null &&
        immeuble.longitude != null &&
        !isNaN(immeuble.latitude) &&
        !isNaN(immeuble.longitude)
    )
  }, [zone?.immeubles])

  // Fonction pour gérer le clic sur un immeuble
  const handleImmeubleClick = immeubleId => {
    navigate(`/immeubles/${immeubleId}`)
  }

  if (!zone) {
    return (
      <Card className={`border-2 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Aucune zone assignée</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const MapContent = ({ height = '300px', showControls = false }) => (
    <div style={{ height, width: '100%', position: 'relative' }}>
      {mapLoading && (
        <div className="absolute inset-0 z-10">
          <MapSkeleton />
        </div>
      )}

      {/* Overlay de verrouillage */}
      {isMapLocked && !isFullscreen && (
        <div
          className="absolute inset-0 z-20 bg-transparent cursor-pointer flex items-center justify-center group"
          onClick={() => setIsMapLocked(false)}
        >
          <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Unlock className="h-4 w-4" />
              <span>Cliquez pour déverrouiller la carte</span>
            </div>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: zone.xOrigin,
          latitude: zone.yOrigin,
          zoom: 11,
        }}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onLoad={() => setMapLoading(false)}
        onError={error => {
          logError(error, 'AssignedZoneCard.Map.onError', {
            zoneId: zone?.id,
            zoneName: zone?.nom,
          })
          setMapLoading(false)
        }}
        attributionControl={false}
        scrollZoom={!isMapLocked || isFullscreen}
        dragPan={!isMapLocked || isFullscreen}
        dragRotate={!isMapLocked || isFullscreen}
        doubleClickZoom={!isMapLocked || isFullscreen}
        touchZoomRotate={!isMapLocked || isFullscreen}
      >
        {showControls && <NavigationControl position="top-right" />}

        {/* Centre de la zone */}
        <Marker longitude={zone.xOrigin} latitude={zone.yOrigin} />

        {/* Immeubles sur la carte */}
        {immeublesWithCoordinates.map(immeuble => (
          <Marker
            key={`immeuble-${immeuble.id}`}
            longitude={immeuble.longitude}
            latitude={immeuble.latitude}
          >
            <div
              className="relative cursor-pointer group"
              title={`${immeuble.adresse}\n${immeuble.nbEtages} étages, ${immeuble.nbPortesParEtage} portes/étage\nCliquez pour voir les détails`}
              onClick={e => {
                e.stopPropagation()
                handleImmeubleClick(immeuble.id)
              }}
            >
              {/* Icône bâtiment */}
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg border-2 border-white hover:bg-blue-700 hover:scale-110 transition-all duration-200 active:scale-95">
                <Building2 className="h-4 w-4" />
              </div>

              {/* Tooltip au survol */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <div className="font-medium">{immeuble.adresse}</div>
                <div className="text-gray-300">
                  {immeuble.nbEtages} étages • {immeuble.nbPortesParEtage} portes/étage
                </div>
                <div className="text-gray-300">
                  Total: {immeuble.nbEtages * immeuble.nbPortesParEtage} portes
                </div>
                <div className="text-blue-300 mt-1 text-center">
                  👆 Cliquez pour voir les détails
                </div>
                {/* Flèche du tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </Marker>
        ))}

        {/* Cercle de la zone */}
        {circleGeoJSON && (
          <Source id="zone-circle" type="geojson" data={circleGeoJSON}>
            <Layer
              id="zone-fill"
              type="fill"
              paint={{ 'fill-color': zoneColor, 'fill-opacity': 0.25 }}
            />
            <Layer
              id="zone-line"
              type="line"
              paint={{ 'line-color': zoneColor, 'line-width': 2 }}
            />
          </Source>
        )}
      </Map>
    </div>
  )

  return (
    <>
      <Card className={`border-2 ${className}`}>
        <CardContent className="pt-6">
          {fullWidth ? (
            /* Layout pleine largeur avec map en haut */
            <div className="space-y-6">
              {/* Map en pleine largeur */}
              <div className="relative">
                <div className="aspect-[21/9] rounded-lg overflow-hidden border-2 relative">
                  <MapContent height="100%" showControls={true} />

                  {/* Boutons de contrôle */}
                  <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2">
                    <Button
                      variant={isMapLocked ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => setIsMapLocked(!isMapLocked)}
                      className="shadow-lg"
                      title={isMapLocked ? 'Déverrouiller la carte' : 'Verrouiller la carte'}
                    >
                      {isMapLocked ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Verrouillée
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Déverrouillée
                        </>
                      )}
                    </Button>

                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsFullscreen(true)}
                      className="shadow-lg"
                      title="Agrandir la carte"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Informations sous la map */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                      Zone
                    </p>
                  </div>
                  <p className="text-xl font-bold">{zone.nom}</p>
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                      Localisation
                    </p>
                  </div>
                  <p className="font-semibold">{locationName}</p>
                </div>

                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                    Rayon de couverture
                  </p>
                  <p className="text-xl font-bold">{(zone.rayon / 1000).toFixed(1)} km</p>
                </div>

                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                    Surface totale
                  </p>
                  <p className="text-xl font-bold">
                    {(Math.PI * Math.pow(zone.rayon / 1000, 2)).toFixed(1)} km²
                  </p>
                </div>
              </div>

              {assignmentDate && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium mb-1">
                        Date d'assignation
                      </p>
                      <p className="font-semibold">
                        {new Date(assignmentDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Layout original avec 2 colonnes */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations à gauche */}
              <div className="flex flex-col justify-between space-y-4">
                {/* Header avec infos */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold">{zone.nom}</h3>
                    <Badge>Zone assignée</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium mb-1">
                          Localisation
                        </p>
                        <p className="font-semibold">{locationName}</p>
                      </div>
                    </div>

                    {assignmentDate && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium mb-1">
                            Date d'assignation
                          </p>
                          <p className="font-semibold">
                            {new Date(assignmentDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium mb-2">
                      Rayon de couverture
                    </p>
                    <p className="text-2xl font-bold">{(zone.rayon / 1000).toFixed(1)} km</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                        Surface
                      </p>
                      <p className="font-semibold">
                        {(Math.PI * Math.pow(zone.rayon / 1000, 2)).toFixed(1)} km²
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                        Immeubles géolocalisés
                      </p>
                      <p className="font-semibold text-lg">{immeublesWithCoordinates.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte carrée à droite */}
              <div className="relative">
                <div className="aspect-square rounded-lg overflow-hidden border-2 relative">
                  <MapContent height="100%" />

                  {/* Boutons de contrôle */}
                  <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2">
                    <Button
                      variant={isMapLocked ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => setIsMapLocked(!isMapLocked)}
                      className="shadow-lg"
                      title={isMapLocked ? 'Déverrouiller la carte' : 'Verrouiller la carte'}
                    >
                      {isMapLocked ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Verrouillée
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Déverrouillée
                        </>
                      )}
                    </Button>

                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsFullscreen(true)}
                      className="shadow-lg"
                      title="Agrandir la carte"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal plein écran */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col p-4 animate-in fade-in-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{zone.nom}</h2>
              <p className="text-muted-foreground">{locationName}</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => setIsFullscreen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 rounded-lg overflow-hidden border-2">
            <MapContent height="100%" showControls={true} />
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4 p-4 bg-card rounded-lg border">
            <div>
              <p className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
                Nom de la zone
              </p>
              <p className="font-semibold">{zone.nom}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
                Rayon
              </p>
              <p className="font-semibold">{(zone.rayon / 1000).toFixed(1)} km</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
                Immeubles géolocalisés
              </p>
              <p className="font-semibold text-lg">{immeublesWithCoordinates.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
                Date d'assignation
              </p>
              <p className="font-semibold">
                {assignmentDate
                  ? new Date(assignmentDate).toLocaleDateString('fr-FR')
                  : 'Non disponible'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
