'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Click (or drag the pin) to set a location — free OpenStreetMap tiles, no
// API key. Touches `window` at import time, so callers must load this via
// next/dynamic with ssr:false (see PropertiesMapView for the same pattern).
const DUBAI_CENTER: [number, number] = [25.2048, 55.2708]

// Leaflet's default marker icon resolves to relative image paths that
// don't survive Next.js/Webpack bundling (same reason PropertiesMapView
// uses its own divIcon instead of the built-in one) — without this the
// pin simply never renders. A plain inline SVG teardrop sidesteps that
// entirely; iconAnchor points the tip at the exact coordinate.
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0z" fill="#CB0101"/>
    <circle cx="15" cy="15" r="6" fill="#fff"/>
  </svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
})

export default function LocationPickerMap({
  lat, lng, onPick,
}: {
  lat?: number
  lng?: number
  onPick: (lat: number, lng: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const center: [number, number] = lat !== undefined && lng !== undefined ? [lat, lng] : DUBAI_CENTER
    const map = L.map(containerRef.current, { zoomControl: true }).setView(center, lat !== undefined ? 15 : 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker(center, { draggable: true, icon: pinIcon }).addTo(map)
    marker.on('dragend', () => {
      const p = marker.getLatLng()
      onPickRef.current(p.lat, p.lng)
    })
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onPickRef.current(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map
    markerRef.current = marker

    return () => { map.remove(); mapRef.current = null; markerRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-center and move the pin when lat/lng change from outside (search
  // result picked, or "Use my current location") without rebuilding the map.
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || lat === undefined || lng === undefined) return
    markerRef.current.setLatLng([lat, lng])
    mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 14))
  }, [lat, lng])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
