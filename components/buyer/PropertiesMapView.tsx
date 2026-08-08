'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search } from 'lucide-react'
import { formatPrice, rentSuffix } from '@/lib/utils'
import type { Property } from '@/types'

const DUBAI_CENTER: [number, number] = [25.2048, 55.2708]

export interface MapBounds { swLat: number; swLng: number; neLat: number; neLng: number }

// Loaded via next/dynamic({ ssr: false }) — Leaflet touches `window` at
// import time, which crashes during Next's server render of a 'use client'
// component, so this must never execute on the server.
export default function PropertiesMapView({
  properties, onSearchThisArea, searching,
}: {
  properties: Property[]
  onSearchThisArea: (bounds: MapBounds) => void
  searching?: boolean
}) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const [showSearchHere, setShowSearchHere] = useState(false)

  // Init once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: true }).setView(DUBAI_CENTER, 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    markersRef.current = L.layerGroup().addTo(map)
    map.on('moveend', () => setShowSearchHere(true))
    mapRef.current = map

    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Re-plot markers whenever the result set changes
  useEffect(() => {
    const map = mapRef.current
    const group = markersRef.current
    if (!map || !group) return
    group.clearLayers()

    const withCoords = properties.filter(p => p.location?.coordinates?.lat && p.location?.coordinates?.lng)
    withCoords.forEach(p => {
      const { lat, lng } = p.location.coordinates!
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:var(--grad,#31B2DE);color:#fff;font-size:11px;font-weight:700;padding:5px 9px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,0.25);white-space:nowrap;transform:translate(-50%,-50%);cursor:pointer;">${formatPrice(p.price)}${rentSuffix(p)}</div>`,
        iconSize: [0, 0],
      })
      const marker = L.marker([lat, lng], { icon }).addTo(group)
      marker.on('click', () => router.push(`/buyer/properties/${p.slug}`))
      marker.bindTooltip(p.title, { direction: 'top', offset: [0, -14] })
    })

    // Fit to markers only on first meaningful population, not on every
    // "search this area" refresh — otherwise the map would keep re-centering
    // itself out from under the user right after they moved it.
    if (withCoords.length > 0 && !showSearchHere) {
      const bounds = L.latLngBounds(withCoords.map(p => [p.location.coordinates!.lat, p.location.coordinates!.lng] as [number, number]))
      map.fitBounds(bounds.pad(0.25), { maxZoom: 14 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties])

  const searchThisArea = () => {
    const map = mapRef.current
    if (!map) return
    const b = map.getBounds()
    onSearchThisArea({ swLat: b.getSouth(), swLng: b.getWest(), neLat: b.getNorth(), neLng: b.getEast() })
    setShowSearchHere(false)
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 600, border: '1px solid var(--border)' }}>
      <div ref={containerRef} className="w-full h-full" />
      {showSearchHere && (
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
