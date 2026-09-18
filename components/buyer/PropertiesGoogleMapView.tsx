'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPinOff } from 'lucide-react'
import { formatPrice, rentSuffix } from '@/lib/utils'
import type { Property } from '@/types'
import type { MapBounds } from './PropertiesMapView'

const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 }
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// Loaded once per page (Google's own loader guards against double-injection,
// but a single shared promise avoids racing two components that mount at
// nearly the same time into loading the script twice).
let loaderPromise: Promise<void> | null = null
function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if ((window as any).google?.maps) return Promise.resolve()
  if (loaderPromise) return loaderPromise
  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&loading=async`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
  return loaderPromise
}

// A small styled price-pill marker, drawn as a plain DOM overlay positioned
// via the map's projection — matches the look of the price bubbles from the
// previous Leaflet map without needing the paid AdvancedMarkerElement setup.
function createPriceOverlay(g: any, map: any, position: any, label: string, onClick: () => void) {
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

// Google Maps replacement for the Leaflet-based PropertiesMapView, used by
// the full-screen /map-search page — same props/behaviour (bounds-based
// "Search this area", fullHeight for the big-map layout) so it drops in
// without the page needing to know which provider is underneath.
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
  const [showSearchHere, setShowSearchHere] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing-key' | 'error'>('loading')
  const [fittedOnce, setFittedOnce] = useState(false)

  // Init once
  useEffect(() => {
    if (!API_KEY) { setStatus('missing-key'); return }
    let cancelled = false
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return
        const g = (window as any).google
        const map = new g.maps.Map(containerRef.current, {
          center: DUBAI_CENTER,
          zoom: 11,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })
        map.addListener('dragend', () => setShowSearchHere(true))
        map.addListener('zoom_changed', () => setShowSearchHere(true))
        mapRef.current = map
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
    return () => { cancelled = true }
  }, [])

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
        createPriceOverlay(g, map, position, label, () => router.push(`/buyer/properties/${p.slug}`))
      )
    })

    // Fit to markers only on first meaningful population, not on every
    // "search this area" refresh — otherwise the map would keep re-centering
    // itself out from under the user right after they moved it.
    if (withCoords.length > 0 && !fittedOnce) {
      const bounds = new g.maps.LatLngBounds()
      withCoords.forEach(p => bounds.extend({ lat: p.location.coordinates!.lat, lng: p.location.coordinates!.lng }))
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

      {status === 'missing-key' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6" style={{ background: 'var(--bg-alt)' }}>
          <MapPinOff size={28} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Map isn't configured yet</p>
          <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Add a Google Maps API key to <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable this map.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6" style={{ background: 'var(--bg-alt)' }}>
          <MapPinOff size={28} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Couldn't load the map</p>
          <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>Check the Google Maps API key and try again.</p>
        </div>
      )}

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
