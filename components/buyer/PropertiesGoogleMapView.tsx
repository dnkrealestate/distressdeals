'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { formatPrice, rentSuffix } from '@/lib/utils'
import { DUBAI_CENTER, baseMapOptions, useGoogleMapsStatus, useMapTheme, type MapBounds } from '@/lib/googleMaps'
import { MAP_STYLES } from '@/lib/mapStyles'
import MapStatusOverlay from '@/components/shared/MapStatusOverlay'
import type { Property } from '@/types'

export type { MapBounds }

// A small styled price-pill marker, drawn as a plain DOM overlay positioned
// via the map's projection — matches the look of the price bubbles from the
// previous Leaflet map without needing the paid AdvancedMarkerElement setup.
function createPriceOverlay(g: any, map: any, position: any, label: string, title: string, onClick: () => void) {
  class PriceOverlay extends g.maps.OverlayView {
    div: HTMLDivElement | null = null
    onAdd() {
      const div = document.createElement('div')
      Object.assign(div.style, {
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        background: 'var(--grad, #CB0101)',
        color: '#fff',
        fontSize: '11px',
        fontWeight: '700',
        padding: '5px 9px',
        borderRadius: '999px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      } as CSSStyleDeclaration)
      div.textContent = label
      div.title = title
      div.addEventListener('click', onClick)
      this.div = div
      this.getPanes().overlayMouseTarget.appendChild(div)
    }
    draw() {
      if (!this.div) return
      const point = this.getProjection()?.fromLatLngToDivPixel(position)
      if (point) {
        this.div.style.left = `${point.x}px`
        this.div.style.top = `${point.y}px`
      }
    }
    onRemove() {
      this.div?.remove()
      this.div = null
    }
  }
  const overlay = new PriceOverlay()
  overlay.setMap(map)
  return overlay
}

// The site's property map (custom-styled Google Maps) — used by the results
// page and the full-screen /map-search page. Supports bounds-based "Search This
// Area" and a fullHeight layout for the big-map page.
export default function PropertiesGoogleMapView({
  properties, onSearchThisArea, searching, fullHeight,
}: {
  properties: Property[]
  onSearchThisArea: (bounds: MapBounds) => void
  searching?: boolean
  fullHeight?: boolean
}) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  // True while the map is moving because WE fitted it to the markers — that must not offer "Search This Area".
  const programmaticRef = useRef(false)
  const [showSearchHere, setShowSearchHere] = useState(false)
  const [fittedOnce, setFittedOnce] = useState(false)
  const theme = useMapTheme()

  // Init once, as soon as the Maps script is available.
  const status = useGoogleMapsStatus(g => {
    if (!containerRef.current || mapRef.current) return
    const map = new g.maps.Map(containerRef.current, {
      ...baseMapOptions(theme),
      center: DUBAI_CENTER,
      zoom: 11,
    })
    map.addListener('dragend', () => setShowSearchHere(true))
    map.addListener('zoom_changed', () => { if (!programmaticRef.current) setShowSearchHere(true) })
    mapRef.current = map
  })

  // Follow the site's light/dark switch.
  useEffect(() => {
    mapRef.current?.setOptions({ styles: MAP_STYLES[theme] })
  }, [theme, status])

  // Re-plot markers whenever the result set changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') return
    const g = (window as any).google

    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []

    const withCoords = properties.filter(p => p.location?.coordinates?.lat && p.location?.coordinates?.lng)
    withCoords.forEach(p => {
      const { lat, lng } = p.location.coordinates!
      const position = new g.maps.LatLng(lat, lng)
      const label = `${formatPrice(p.price)}${rentSuffix(p)}`
      overlaysRef.current.push(
        createPriceOverlay(g, map, position, label, p.title, () => router.push(`/buyer/properties/${p.slug}`))
      )
    })

    // Fit to markers only on first meaningful population, not on every
    // "search this area" refresh — otherwise the map would keep re-centering
    // itself out from under the user right after they moved it.
    if (withCoords.length > 0 && !fittedOnce) {
      const bounds = new g.maps.LatLngBounds()
      withCoords.forEach(p => bounds.extend({ lat: p.location.coordinates!.lat, lng: p.location.coordinates!.lng }))
      programmaticRef.current = true
      g.maps.event.addListenerOnce(map, 'idle', () => { programmaticRef.current = false })
      map.fitBounds(bounds, 60)
      setFittedOnce(true)
    }
  }, [properties, status])

  const searchThisArea = () => {
    const map = mapRef.current
    if (!map) return
    const b = map.getBounds()
    if (!b) return
    const ne = b.getNorthEast()
    const sw = b.getSouthWest()
    onSearchThisArea({ swLat: sw.lat(), swLng: sw.lng(), neLat: ne.lat(), neLng: ne.lng() })
    setShowSearchHere(false)
  }

  return (
    <div
      className={fullHeight ? 'relative w-full h-full overflow-hidden' : 'relative w-full rounded-2xl overflow-hidden'}
      style={fullHeight ? {} : { height: 600, border: '1px solid var(--border)' }}
    >
      <div ref={containerRef} className="w-full h-full" style={{ background: 'var(--bg-alt)' }} />

      <MapStatusOverlay status={status} />

      {status === 'ready' && showSearchHere && (
        <button
          onClick={searchThisArea}
          disabled={searching}
          className="btn-primary btn-sm gap-2 absolute top-4 left-1/2 -translate-x-1/2 z-[1000] shadow-lg"
        >
          <Search size={13} /> {searching ? 'Searching…' : 'Search This Area'}
        </button>
      )}
    </div>
  )
}
