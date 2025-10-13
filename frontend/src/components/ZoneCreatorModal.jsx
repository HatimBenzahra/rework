import React, { useState, useEffect, useRef } from 'react'
import Map, { Marker, Source, Layer, NavigationControl, useControl } from 'react-map-gl/mapbox'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import mapboxgl from 'mapbox-gl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapSkeleton } from '@/components/LoadingSkeletons'
import { X, Check, Move3D, MousePointerClick, RotateCcw } from 'lucide-react'

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

// Helper functions
function haversineDistance(coords1, coords2) {
  const [lon1, lat1] = coords1
  const [lon2, lat2] = coords2
  const toRad = x => (x * Math.PI) / 180
  const R = 6371e3 // metres
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δφ = toRad(lat2 - lat1)
  const Δλ = toRad(lon2 - lon1)
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

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

// Geocoder Control Component
const GeocoderControl = React.memo(({ onResult, position }) => {
  useControl(
    () => {
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        marker: false,
        countries: 'fr', // France
        language: 'fr',
      })
      geocoder.on('result', onResult)
      return geocoder
    },
    { position }
  )
  return null
})

// 3D Control Component
const ThreeDControl = ({ position, onClick, show3D }) => (
  <div
    className={`mapboxgl-ctrl mapboxgl-ctrl-group ${position.includes('top') ? 'mapboxgl-ctrl-top-right' : 'mapboxgl-ctrl-bottom-right'}`}
    style={{
      position: 'absolute',
      top: position.includes('top') ? '74px' : 'auto',
      bottom: position.includes('bottom') ? '10px' : 'auto',
      right: '10px',
      zIndex: 2,
    }}
  >
    <button
      onClick={onClick}
      className={`mapboxgl-ctrl-icon ${show3D ? 'bg-primary/10 text-primary' : 'bg-card text-foreground'}`}
      style={{
        width: '29px',
        height: '29px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer',
      }}
      title="Mode 3D"
    >
      <Move3D className="h-4 w-4" />
    </button>
  </div>
)

export const ZoneCreatorModal = ({
  onValidate,
  onClose,
  existingZones = [],
  zoneToEdit = null,
  userRole,
  assignableUsers = [],
}) => {
  const isEditMode = !!zoneToEdit
  const mapRef = useRef(null)

  // Initialize state based on edit mode
  const [center, setCenter] = useState(
    isEditMode && zoneToEdit?.xOrigin && zoneToEdit?.yOrigin
      ? [zoneToEdit.xOrigin, zoneToEdit.yOrigin]
      : null
  )
  const [radius, setRadius] = useState(isEditMode ? zoneToEdit?.rayon || 1000 : 0)
  const [step, setStep] = useState(isEditMode ? 3 : 1)
  const [zoneName, setZoneName] = useState(isEditMode ? zoneToEdit?.nom || '' : '')
  const [assignedUserId, setAssignedUserId] = useState(
    isEditMode && zoneToEdit?.assignedUserId ? zoneToEdit.assignedUserId : ''
  )
  const [zoneColor, setZoneColor] = useState(
    isEditMode && zoneToEdit?.id ? getZoneColor(zoneToEdit.id) : '#3388ff'
  )
  const [show3D, setShow3D] = useState(false)
  const [mapLoading, setMapLoading] = useState(true)

  // Map view state - Focus sur l'Île-de-France
  const initialMapViewState =
    isEditMode && zoneToEdit?.xOrigin && zoneToEdit?.yOrigin
      ? {
          longitude: zoneToEdit.xOrigin,
          latitude: zoneToEdit.yOrigin,
          zoom: 12,
        }
      : {
          longitude: 2.3522, // Paris center
          latitude: 48.8566,
          zoom: 10, // Zoom pour voir l'Île-de-France
        }

  // Effect for 3D mode
  useEffect(() => {
    if (mapRef.current) {
      if (show3D) {
        mapRef.current.easeTo({ pitch: 60, duration: 1000 })
      } else {
        mapRef.current.easeTo({ pitch: 0, duration: 1000 })
      }
    }
  }, [show3D])

  // Fit bounds to existing zones when creating new one
  useEffect(() => {
    if (!isEditMode && existingZones.length > 0) {
      const map = mapRef.current
      if (map) {
        const allPoints = existingZones
          .filter(z => z.xOrigin && z.yOrigin)
          .map(z => [z.xOrigin, z.yOrigin])

        if (allPoints.length > 0) {
          const bounds = allPoints.reduce(
            (bounds, coord) => bounds.extend(coord),
            new mapboxgl.LngLatBounds(allPoints[0], allPoints[0])
          )
          map.fitBounds(bounds, { padding: 80, animate: true, maxZoom: 12 })
        }
      }
    }
  }, [isEditMode, existingZones])

  const handleMapClick = e => {
    const { lng, lat } = e.lngLat
    if (step === 1) {
      setCenter([lng, lat])
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleMouseMove = e => {
    if (step === 2 && center) {
      const currentRadius = haversineDistance(center, [e.lngLat.lng, e.lngLat.lat])
      setRadius(currentRadius)
    }
  }

  const handleReset = () => {
    setCenter(null)
    setRadius(0)
    setStep(1)
    setZoneName('')
    setAssignedUserId('')
    setZoneColor('#3388ff')
  }

  const handleValidate = () => {
    if (center && zoneName && radius > 0) {
      const zoneData = {
        nom: zoneName,
        xOrigin: center[0], // longitude
        yOrigin: center[1], // latitude
        rayon: Math.round(radius), // en mètres
      }

      if (isEditMode && zoneToEdit?.id) {
        zoneData.id = zoneToEdit.id
      }

      // Note: color is managed locally on the frontend only
      // It's stored in local state/storage, not in the backend
      onValidate(zoneData, assignedUserId)
    }
  }

  const handleGeocoderResult = e => {
    const { result } = e
    if (result && result.center) {
      mapRef.current?.flyTo({ center: result.center, zoom: 12 })
    }
  }

  // Validation de la couleur pour s'assurer qu'elle est valide
  const validZoneColor = zoneColor.match(/^#[0-9A-Fa-f]{6}$/) ? zoneColor : '#3388ff'

  const isFormValid = center && zoneName && radius > 0 && 
    ((userRole === 'admin' || userRole === 'directeur') ? assignedUserId : true)
  const currentCircleGeoJSON = center && radius > 0 ? createGeoJSONCircle(center, radius) : null

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex flex-col p-4 animate-in fade-in-0">
      <div className="flex-1 w-full relative">
        {mapLoading && (
          <div className="absolute inset-0 z-10">
            <MapSkeleton />
          </div>
        )}
        <Map
          ref={mapRef}
          initialViewState={initialMapViewState}
          style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          cursor={step < 3 ? 'crosshair' : 'default'}
          onLoad={() => setMapLoading(false)}
          onError={() => setMapLoading(false)}
        >
          <NavigationControl position="top-right" />
          <GeocoderControl onResult={handleGeocoderResult} position="top-left" />
          <ThreeDControl position="top-right" onClick={() => setShow3D(!show3D)} show3D={show3D} />

          {/* 3D Buildings Layer */}
          {show3D && (
            <Layer
              id="3d-buildings"
              source="composite"
              source-layer="building"
              filter={['==', 'extrude', 'true']}
              type="fill-extrusion"
              minzoom={15}
              paint={{
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height'],
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height'],
                ],
                'fill-extrusion-opacity': 0.6,
              }}
            />
          )}

          {/* Display existing zones */}
          {existingZones
            .filter(z => z.id !== zoneToEdit?.id && z.xOrigin && z.yOrigin)
            .map(zone => {
              const circle = createGeoJSONCircle([zone.xOrigin, zone.yOrigin], zone.rayon || 1000)
              const color = getZoneColor(zone.id)
              return (
                <Source
                  key={`existing-${zone.id}`}
                  id={`existing-${zone.id}`}
                  type="geojson"
                  data={circle}
                >
                  <Layer
                    key={`fill-existing-${zone.id}`}
                    id={`fill-existing-${zone.id}`}
                    type="fill"
                    paint={{
                      'fill-color': color,
                      'fill-opacity': 0.15,
                    }}
                  />
                  <Layer
                    key={`line-existing-${zone.id}`}
                    id={`line-existing-${zone.id}`}
                    type="line"
                    paint={{
                      'line-color': color,
                      'line-width': 2,
                      'line-dasharray': [2, 2],
                    }}
                  />
                </Source>
              )
            })}

          {/* Display current zone being created/edited */}
          {center && <Marker longitude={center[0]} latitude={center[1]} />}
          {currentCircleGeoJSON && (
            <Source id="current-zone" type="geojson" data={currentCircleGeoJSON}>
              <Layer
                key="current-zone-fill"
                id="current-zone-fill"
                type="fill"
                paint={{ 'fill-color': validZoneColor, 'fill-opacity': 0.35 }}
              />
              <Layer
                key="current-zone-line"
                id="current-zone-line"
                type="line"
                paint={{ 'line-color': validZoneColor, 'line-width': 2 }}
              />
            </Source>
          )}
        </Map>

        {/* Control Panel */}
        <div className="absolute top-4 right-20 bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-card-foreground">
              {isEditMode
                ? 'Modifier la Zone'
                : step === 1
                  ? 'Étape 1: Centre'
                  : step === 2
                    ? 'Étape 2: Rayon'
                    : 'Étape 3: Détails'}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleReset} title="Recommencer">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Step Instructions */}
          {step < 3 && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-foreground flex items-center gap-2">
                <MousePointerClick className="h-4 w-4" />
                {step === 1
                  ? 'Cliquez sur la carte pour placer le centre de la zone.'
                  : 'Déplacez la souris pour ajuster le rayon, puis cliquez pour confirmer.'}
              </p>
            </div>
          )}

          {/* Current Values Display */}
          {center && (
            <div className="mb-4 text-sm text-muted-foreground">
              <p>
                <strong>Centre:</strong> {center[1].toFixed(4)}, {center[0].toFixed(4)}
              </p>
              {radius > 0 && (
                <p>
                  <strong>Rayon:</strong> {(radius / 1000).toFixed(2)} km
                </p>
              )}
            </div>
          )}

          {/* Form Fields (Step 3 or Edit Mode) */}
          {(step >= 3 || isEditMode) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone-name">Nom de la zone *</Label>
                <Input
                  id="zone-name"
                  value={zoneName}
                  onChange={e => setZoneName(e.target.value)}
                  placeholder="Ex: Paris Centre"
                />
              </div>

              {(userRole === 'admin' || userRole === 'directeur') && (
                <div className="space-y-2">
                  <Label htmlFor="assigned-user">
                    {userRole === 'admin' ? 'Assigner à *' : 'Assigner au manager/commercial *'}
                  </Label>
                  <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                    <SelectTrigger id="assigned-user">
                      <SelectValue
                        placeholder={
                          userRole === 'admin'
                            ? 'Sélectionnez directeur/manager/commercial'
                            : 'Sélectionnez manager/commercial'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="z-[150]">
                      {assignableUsers.map(user => (
                        <SelectItem
                          key={`${user.role}-${user.id}`}
                          value={`${user.role}-${user.id}`}
                        >
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleValidate}
              disabled={!isFormValid}
              className="flex-1"
              variant="default"
            >
              <Check className="mr-2 h-4 w-4" />
              {isEditMode ? 'Enregistrer' : 'Créer la zone'}
            </Button>
            <Button onClick={onClose} variant="outline" className="px-6">
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ZoneCreatorModal
