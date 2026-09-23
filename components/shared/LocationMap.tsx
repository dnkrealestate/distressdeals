'use client'
import { useEffect, useRef } from 'react'
import { baseMapOptions, useGoogleMapsStatus, useMapTheme, PIN_URL } from '@/lib/googleMaps'
import { MAP_STYLES } from '@/lib/mapStyles'
import MapStatusOverlay from './MapStatusOverlay'

export interface MapLandmark { lat: number; lng: number; title: string }

// A single-location map (property / project detail) in the site's custom
// Google style: brand pin on the location, plus small dots for nearby landmarks.
// Fills its parent, so wrap it in an element with a height. Touches `window`,
// so load via next/dynamic with ssr:false.
export default function LocationMap({
  lat, lng, zoom = 15, landmarks = [],
}: {
  lat: number
  lng: number
  zoom?: number
  landmarks?: MapLandmark[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const theme = useMapTheme()

  const status = useGoogleMapsStatus(g => {
    if (!containerRef.current || mapRef.current) return
    const map = new g.maps.Map(containerRef.current, {
      ...baseMapOptions(theme),
      center: { lat, lng },
      zoom,
      // Sits inside a long scrolling page — cooperative handling stops the map
      // from hijacking the page scroll (ctrl/two-finger to move it instead).
      gestureHandling: 'cooperative',
    })
    new g.maps.Marker({
      position: { lat, lng },
      map,
      zIndex: 10,
      icon: { url: PIN_URL, scaledSize: new g.maps.Size(30, 40), anchor: new g.maps.Point(15, 40) },
    })
    landmarks.forEach(l => {
      new g.maps.Marker({
        position: { lat: l.lat, lng: l.lng },
        map,
        title: l.title,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#FD7147', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
      })
    })
    mapRef.current = map
  })

  useEffect(() => {
    mapRef.current?.setOptions({ styles: MAP_STYLES[theme] })
  }, [theme, status])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'var(--bg-alt)' }} />
      <MapStatusOverlay status={status} />
    </div>
  )
}
