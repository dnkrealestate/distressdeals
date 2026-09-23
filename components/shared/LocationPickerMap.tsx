'use client'
import { useEffect, useRef } from 'react'
import { DUBAI_CENTER, PIN_URL, baseMapOptions, useGoogleMapsStatus, useMapTheme } from '@/lib/googleMaps'
import { MAP_STYLES } from '@/lib/mapStyles'
import MapStatusOverlay from './MapStatusOverlay'

// Click the map (or drag the pin) to set a location. Same custom Google map
// as the property maps. Touches `window`, so callers load this via next/dynamic
// with ssr:false.

export default function LocationPickerMap({
  lat, lng, onPick,
}: {
  lat?: number
  lng?: number
  onPick: (lat: number, lng: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const theme = useMapTheme()

  const status = useGoogleMapsStatus(g => {
    if (!containerRef.current || mapRef.current) return
    const hasPoint = lat !== undefined && lng !== undefined
    const center = hasPoint ? { lat: lat as number, lng: lng as number } : DUBAI_CENTER

    const map = new g.maps.Map(containerRef.current, {
      ...baseMapOptions(theme),
      center,
      zoom: hasPoint ? 15 : 10,
      // The picker often sits inside a scrolling form — let a single finger/wheel drive the map.
      gestureHandling: 'greedy',
    })
    // Legacy google.maps.Marker: it's the one marker type that supports
    // dragging without a Cloud Map ID (AdvancedMarkerElement requires one).
    const marker = new g.maps.Marker({
      position: center,
      map,
      draggable: true,
      icon: { url: PIN_URL, scaledSize: new g.maps.Size(30, 40), anchor: new g.maps.Point(15, 40) },
    })
    marker.addListener('dragend', () => {
      const p = marker.getPosition()
      onPickRef.current(p.lat(), p.lng())
    })
    map.addListener('click', (e: any) => {
      marker.setPosition(e.latLng)
      onPickRef.current(e.latLng.lat(), e.latLng.lng())
    })

    mapRef.current = map
    markerRef.current = marker
  })

  useEffect(() => {
    mapRef.current?.setOptions({ styles: MAP_STYLES[theme] })
  }, [theme, status])

  // Re-center and move the pin when lat/lng change from outside (search
  // result picked, or "Use my current location") without rebuilding the map.
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker || lat === undefined || lng === undefined) return
    marker.setPosition({ lat, lng })
    map.panTo({ lat, lng })
    if ((map.getZoom() ?? 0) < 14) map.setZoom(14)
  }, [lat, lng, status])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'var(--bg-alt)' }} />
      <MapStatusOverlay status={status} />
    </div>
  )
}
