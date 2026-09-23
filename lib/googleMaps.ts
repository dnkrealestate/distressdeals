'use client'
import { useEffect, useState } from 'react'
import { MAP_STYLES, type MapTheme } from './mapStyles'

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 }

// Brand-red teardrop pin (inline SVG), tip anchored on the exact coordinate — used by
// the location picker and the single-location maps.
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0z" fill="#CB0101"/><circle cx="15" cy="15" r="6" fill="#fff"/></svg>`
export const PIN_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PIN_SVG)}`

export interface MapBounds { swLat: number; swLng: number; neLat: number; neLng: number }

// Options every map on the site shares, so they all look and behave the same.
export function baseMapOptions(theme: MapTheme) {
  return {
    styles: MAP_STYLES[theme],
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
  }
}

// ── Loader ──────────────────────────────────────────────────────────────
// One script tag per page, however many maps mount. Google reports a bad /
// restricted key by calling window.gm_authFailure (the script itself still
// "loads"), so that's tracked separately and surfaced as an error state.
let loaderPromise: Promise<void> | null = null
let authFailed = false
const authListeners = new Set<() => void>()

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (loaderPromise) return loaderPromise
  if ((window as any).google?.maps?.Map) return Promise.resolve()

  ;(window as any).gm_authFailure = () => {
    authFailed = true
    authListeners.forEach(fn => fn())
  }

  loaderPromise = new Promise((resolve, reject) => {
    // With loading=async the script tag "loads" before google.maps.Map (and
    // friends) exist — Google calls `callback` once the loader is ready, and the
    // classes then arrive per-library. Wait for the ones the site uses
    // (maps: Map/OverlayView/Polygon, core: LatLng/Size/…, marker: Marker,
    // streetView: StreetViewService) before resolving.
    ;(window as any).__onGoogleMapsReady = () => {
      const maps = (window as any).google.maps
      Promise.all(['maps', 'core', 'marker', 'streetView'].map(lib => maps.importLibrary(lib)))
        .then(() => resolve())
        .catch(err => { loaderPromise = null; reject(err) })
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&v=weekly&callback=__onGoogleMapsReady`
    script.async = true
    script.onerror = () => { loaderPromise = null; reject(new Error('Failed to load Google Maps')) }
    document.head.appendChild(script)
  })
  return loaderPromise
}

export type MapStatus = 'loading' | 'ready' | 'missing-key' | 'error'

// Loads the Maps script and reports where it got to. `onReady` runs once,
// after the script is available, so callers can construct their google.maps.Map.
export function useGoogleMapsStatus(onReady: (g: any) => void): MapStatus {
  const [status, setStatus] = useState<MapStatus>(GOOGLE_MAPS_API_KEY ? 'loading' : 'missing-key')

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return
    let cancelled = false
    const fail = () => { if (!cancelled) setStatus('error') }
    authListeners.add(fail)
    if (authFailed) fail()

    loadGoogleMaps()
      .then(() => {
        if (cancelled || authFailed) return
        onReady((window as any).google)
        setStatus('ready')
      })
      .catch(fail)

    return () => { cancelled = true; authListeners.delete(fail) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return status
}

// The site's light/dark switch sets data-theme on <html> (see Navbar) — a
// live map has to re-style itself when that flips, not only at first paint.
export function useMapTheme(): MapTheme {
  const [theme, setTheme] = useState<MapTheme>('light')

  useEffect(() => {
    const read = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return theme
}
