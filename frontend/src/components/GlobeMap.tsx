import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Photo } from '../contexts/PhotoContext'
import { normalizeLocationToCity, cityCoordinates } from '../utils/cityNormalizer'
import { getImageUrl } from '../utils/imageUrl'

interface GlobeMapProps {
  photos: Photo[]
}

interface MemoryLocation {
  id: string
  lat: number
  lng: number
  name: string
  photos: Photo[]
}

// Liberty uses familiar blue water and natural land colours while retaining
// the detailed vector tiles needed when the globe is zoomed into a 2D map.
const MAP_STYLE = '/map-assets/liberty.json'
const CAMERA_STORAGE_KEY = '_travel_map_camera_v2'
const ENTRY_ZOOM = 0.25
const DEFAULT_ZOOM = 1.2

function finiteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function distanceInKm(a: MemoryLocation, b: MemoryLocation) {
  const radians = Math.PI / 180
  const deltaLat = (b.lat - a.lat) * radians
  const deltaLng = (b.lng - a.lng) * radians
  const value = Math.sin(deltaLat / 2) ** 2
    + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(deltaLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function createStableClusterData(locations: MemoryLocation[], zoom: number) {
  const radiusKm = zoom >= 8 ? 0 : 5200 / Math.pow(2, zoom)
  const groups: MemoryLocation[][] = []

  for (const location of [...locations].sort((a, b) => a.id.localeCompare(b.id))) {
    const group = groups.find(items => radiusKm > 0 && distanceInKm(items[0], location) <= radiusKm)
    if (group) group.push(location)
    else groups.push([location])
  }

  return {
    type: 'FeatureCollection' as const,
    features: groups.map(items => {
      const photoCount = items.reduce((total, item) => total + item.photos.length, 0)
      const lat = items.reduce((total, item) => total + item.lat * item.photos.length, 0) / photoCount
      const lng = items.reduce((total, item) => total + item.lng * item.photos.length, 0) / photoCount
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        properties: {
          markerId: items.length === 1 ? items[0].id : '',
          locationCount: items.length,
          photoCount
        }
      }
    })
  }
}

function applyNaturalGlobeColors(style: maplibregl.StyleSpecification) {
  const colors: Record<string, Record<string, string>> = {
    background: { 'background-color': '#86B96F' },
    water: { 'fill-color': '#3B8EDB' },
    park: { 'fill-color': '#68AA5F' },
    landcover_wood: { 'fill-color': '#4F9657' },
    landcover_grass: { 'fill-color': '#78B968' },
    landcover_ice: { 'fill-color': '#F1FAFF' },
    landcover_sand: { 'fill-color': '#D8BE78' }
  }

  for (const layer of style.layers) {
    const paint = colors[layer.id]
    if (paint) Object.assign(layer.paint || (layer.paint = {}), paint)
  }

}

export default function GlobeMap({ photos }: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const [selectedLocation, setSelectedLocation] = useState<MemoryLocation | null>(null)
  const [activeScrollIndex, setActiveScrollIndex] = useState(0)
  const [mapError, setMapError] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  const locations = useMemo(() => {
    const grouped = new Map<string, MemoryLocation>()

    for (const photo of photos) {
      let lat = photo.latitude
      let lng = photo.longitude
      let name = photo.city?.name || photo.admin1?.name || photo.country?.name || photo.locationTxt || 'Unknown place'

      if (!finiteCoordinate(lat) || !finiteCoordinate(lng)) {
        if (finiteCoordinate(photo.city?.latitude) && finiteCoordinate(photo.city?.longitude)) {
          lat = photo.city.latitude
          lng = photo.city.longitude
        } else if (photo.city?.id && cityCoordinates[photo.city.id]) {
          lat = cityCoordinates[photo.city.id].lat
          lng = cityCoordinates[photo.city.id].lng
        } else if (photo.locationTxt) {
          const normalized = normalizeLocationToCity(photo.locationTxt)
          if (normalized?.coordinates) {
            lat = normalized.coordinates.lat
            lng = normalized.coordinates.lng
            name = normalized.cityName || name
          }
        } else if (finiteCoordinate(photo.admin1?.latitude) && finiteCoordinate(photo.admin1?.longitude)) {
          lat = photo.admin1.latitude
          lng = photo.admin1.longitude
        } else if (finiteCoordinate(photo.country?.latitude) && finiteCoordinate(photo.country?.longitude)) {
          lat = photo.country.latitude
          lng = photo.country.longitude
        }
      }

      if (!finiteCoordinate(lat) || !finiteCoordinate(lng)) continue

      // More decimal places avoid merging nearby but distinct city locations.
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
      const displayPhoto = { ...photo, _displayLoc: name } as Photo
      const existing = grouped.get(key)
      if (existing) {
        existing.photos.push(displayPhoto)
      } else {
        grouped.set(key, { id: key, lat, lng, name, photos: [displayPhoto] })
      }
    }

    for (const item of grouped.values()) {
      item.photos.sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime())
    }
    return Array.from(grouped.values())
  }, [photos])

  const locationsById = useMemo(
    () => new Map(locations.map(item => [item.id, item])),
    [locations]
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false
    let map: maplibregl.Map | null = null

    let initialCenter: [number, number] = [0, 20]
    if (locations.length > 0) {
      initialCenter = [locations[0].lng, locations[0].lat]
    }

    const initializeMap = async () => {
      try {
        // Declare the projection before sources are initialized. Switching to
        // globe after style.load can leave Safari with a projected background
        // but no vector tiles until the next full style reload.
        const response = await fetch(MAP_STYLE)
        if (!response.ok) throw new Error(`Map style request failed: ${response.status}`)
        const style = await response.json() as maplibregl.StyleSpecification
        style.projection = { type: 'globe' }
        applyNaturalGlobeColors(style)
        if (cancelled || !containerRef.current) return

        const initializedMap = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: initialCenter,
          zoom: ENTRY_ZOOM,
          minZoom: 0,
          maxZoom: 19,
          attributionControl: false
        })
        map = initializedMap
        mapRef.current = initializedMap

        let rotationStopped = false
        let entryComplete = false
        const stopRotation = () => {
          rotationStopped = true
          initializedMap.stop()
        }
        const spinGlobe = () => {
          if (cancelled || rotationStopped || initializedMap.getZoom() >= 3) return
          const center = initializedMap.getCenter()
          initializedMap.easeTo({
            center: [center.lng - 3, center.lat],
            duration: 1000,
            easing: value => value
          })
        }

        const canvas = initializedMap.getCanvas()
        canvas.addEventListener('pointerdown', stopRotation, { passive: true })
        canvas.addEventListener('wheel', stopRotation, { passive: true })

        let entranceStarted = false
        const startEntrance = () => {
          if (cancelled || entranceStarted) return
          entranceStarted = true
          setMapReady(true)
          requestAnimationFrame(() => {
            initializedMap.easeTo({
              center: initialCenter,
              zoom: DEFAULT_ZOOM,
              duration: 1400,
              easing: value => 1 - Math.pow(1 - value, 3)
            })
            initializedMap.once('moveend', () => {
              entryComplete = true
              spinGlobe()
            })
          })
        }

        initializedMap.on('sourcedata', event => {
          if (event.sourceId === 'openmaptiles' && event.isSourceLoaded) startEntrance()
        })

        initializedMap.on('error', event => {
          console.error('MapLibre rendering error', event.error)
        })

        initializedMap.on('load', () => {
          setMapError(false)
      const data = createStableClusterData(locations, initializedMap.getZoom())

      initializedMap.addSource('memory-locations', {
        type: 'geojson',
        data
      })
      initializedMap.addLayer({
        id: 'memory-clusters',
        type: 'circle',
        source: 'memory-locations',
        filter: ['>', ['get', 'locationCount'], 1],
        paint: {
          'circle-color': '#111827',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
          'circle-radius': ['interpolate', ['linear'], ['get', 'photoCount'], 1, 14, 10, 22]
        }
      })
      initializedMap.addLayer({
        id: 'memory-points',
        type: 'circle',
        source: 'memory-locations',
        filter: ['==', ['get', 'locationCount'], 1],
        paint: {
          'circle-color': '#FF2D55',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
          'circle-radius': ['interpolate', ['linear'], ['get', 'photoCount'], 1, 9, 10, 16]
        }
      })
      initializedMap.addLayer({
        id: 'memory-point-count',
        type: 'symbol',
        source: 'memory-locations',
        filter: ['any', ['>', ['get', 'locationCount'], 1], ['>', ['get', 'photoCount'], 1]],
        layout: {
          'text-field': ['to-string', ['get', 'photoCount']],
          'text-size': 12,
          'text-allow-overlap': true
        },
        paint: { 'text-color': '#ffffff' }
      })

      initializedMap.on('click', 'memory-clusters', (event: maplibregl.MapLayerMouseEvent) => {
        const feature = event.features?.[0]
        if (!feature || feature.geometry.type !== 'Point') return
        initializedMap.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom: Math.min(initializedMap.getZoom() + 2.5, 10),
          duration: 900
        })
      })

      initializedMap.on('click', 'memory-points', (event: maplibregl.MapLayerMouseEvent) => {
        const markerId = String(event.features?.[0]?.properties?.markerId || '')
        const item = locationsById.get(markerId)
        if (!item) return
        setSelectedLocation(item)
        setActiveScrollIndex(0)
        initializedMap.easeTo({ center: [item.lng, item.lat], zoom: Math.max(initializedMap.getZoom(), 10) })
      })

      initializedMap.on('mouseenter', 'memory-points', () => { initializedMap.getCanvas().style.cursor = 'pointer' })
      initializedMap.on('mouseleave', 'memory-points', () => { initializedMap.getCanvas().style.cursor = '' })
      initializedMap.on('mouseenter', 'memory-clusters', () => { initializedMap.getCanvas().style.cursor = 'pointer' })
      initializedMap.on('mouseleave', 'memory-clusters', () => { initializedMap.getCanvas().style.cursor = '' })

      initializedMap.on('zoomend', () => {
        const source = initializedMap.getSource('memory-locations') as maplibregl.GeoJSONSource
        source.setData(createStableClusterData(locations, initializedMap.getZoom()))
      })

        })

        initializedMap.on('moveend', () => {
          const center = initializedMap.getCenter()
          sessionStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify({
            lng: center.lng,
            lat: center.lat,
            zoom: initializedMap.getZoom()
          }))
          if (entryComplete) spinGlobe()
        })
      } catch (error) {
        console.error('Unable to initialize travel map', error)
        if (!cancelled) setMapError(true)
      }
    }

    void initializeMap()

    return () => {
      cancelled = true
      map?.remove()
      mapRef.current = null
    }
  }, [locations, locationsById])

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const next = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth)
    setActiveScrollIndex(next)
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0B0C10] pb-24">
      <div
        ref={containerRef}
        className={`absolute inset-0 transition-opacity duration-200 ${mapReady ? 'opacity-100' : 'opacity-0'}`}
      />

      {mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-8 text-center text-sm text-white/70">
          Map failed to load. Check your connection and reopen the page.
        </div>
      )}

      <div className="pointer-events-none absolute left-6 top-[calc(env(safe-area-inset-top,40px)+16px)] z-10 rounded-2xl bg-black/35 px-4 py-3 backdrop-blur-lg">
        <h1 className="text-2xl font-bold tracking-tight text-white">Travel Map</h1>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/65">
          {locations.length} locations visited
        </p>
      </div>

      {selectedLocation && selectedLocation.photos.length > 0 && (
        <div className="pointer-events-auto absolute bottom-[100px] left-0 right-0 z-20">
          <div
            className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 touch-pan-x"
            onScroll={handleScroll}
          >
            {selectedLocation.photos.map(photo => {
              const imageUrl = getImageUrl(photo.images?.[0]?.imageUrl || photo.imageUrl) || ''
              const date = new Date(photo.happenedAt).toLocaleDateString('zh-CN', {
                year: 'numeric', month: 'long', day: 'numeric'
              })
              return (
                <div
                  key={photo.id}
                  className="relative flex w-[calc(100vw-2rem)] flex-shrink-0 snap-center cursor-pointer items-center gap-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#1A1B22]/85 p-3 pr-4 backdrop-blur-2xl"
                  onClick={event => {
                    const rect = event.currentTarget.getBoundingClientRect()
                    navigate(`/memory/${photo.id}`, {
                      state: {
                        photo,
                        from: 'love-memories',
                        backgroundLocation: routeLocation,
                        sourceRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
                      }
                    })
                  }}
                >
                  {imageUrl && <img src={imageUrl} alt={photo.title} className="relative z-10 h-24 w-20 rounded-2xl object-cover shadow-lg" />}
                  <div className="relative z-10 min-w-0 flex-1">
                    <span className="text-[10px] font-medium text-white/70">{date}</span>
                    <h3 className="line-clamp-1 text-lg font-bold text-white">{photo.title}</h3>
                    <p className="mt-1 line-clamp-1 text-[10px] font-semibold tracking-wider text-gray-400">{selectedLocation.name}</p>
                  </div>
                  <ArrowUpRight className="relative z-10 h-5 w-5 flex-shrink-0 text-white" />
                </div>
              )
            })}
          </div>
          {selectedLocation.photos.length > 1 && (
            <div className="flex justify-center">
              <div className="flex gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
                {selectedLocation.photos.map((_, index) => (
                  <span key={index} className={`h-1.5 w-1.5 rounded-full ${index === activeScrollIndex ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
