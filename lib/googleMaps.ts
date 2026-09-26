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

// ── Place search ────────────────────────────────────────────────────────
// Google Places autocomplete (the classic JS service — "Places API (New)" isn't enabled on this key). Unlike
// OpenStreetMap it knows buildings, towers and off-plan project names, not just streets and districts.
export interface PlaceSuggestion { placeId: string; main: string; secondary: string }
export interface PlaceDetails {
  name: string; label: string; lat: number; lng: number
  area?: string; road?: string; emirate?: string
}

let placesPromise: Promise<any> | null = null
function loadPlaces(): Promise<any> {
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error('no key'))
  if (authFailed) return Promise.reject(new Error('Google Maps key rejected'))
  placesPromise ??= loadGoogleMaps()
    .then(() => (window as any).google.maps.importLibrary('places'))
    .catch(err => { placesPromise = null; throw err })
  return placesPromise
}

// One token per search → pick, so Google bills the keystrokes and the details lookup as a single session.
export async function newPlacesSession(): Promise<any> {
  const places = await loadPlaces()
  return new places.AutocompleteSessionToken()
}

export async function searchPlaces(input: string, sessionToken?: any): Promise<PlaceSuggestion[]> {
  const places = await loadPlaces()
  const service = new places.AutocompleteService()
  return new Promise((resolve, reject) => {
    service.getPlacePredictions(
      { input, sessionToken, componentRestrictions: { country: 'ae' }, language: 'en' },
      (preds: any[] | null, status: string) => {
        if (status === 'ZERO_RESULTS') return resolve([])
        if (status !== 'OK' || !preds) return reject(new Error(status))
        resolve(preds.map(p => ({
          placeId: p.place_id,
          main: p.structured_formatting?.main_text || p.description,
          secondary: p.structured_formatting?.secondary_text || '',
        })))
      },
    )
  })
}

export async function getPlaceDetails(placeId: string, sessionToken?: any): Promise<PlaceDetails> {
  const places = await loadPlaces()
  const service = new places.PlacesService(document.createElement('div'))
  return new Promise((resolve, reject) => {
    service.getDetails(
      { placeId, sessionToken, language: 'en', fields: ['name', 'formatted_address', 'geometry', 'address_components'] },
      (d: any, status: string) => {
        if (status !== 'OK' || !d?.geometry?.location) return reject(new Error(status))
        const comp = (...types: string[]) => {
          for (const t of types) {
            const c = (d.address_components || []).find((x: any) => x.types.includes(t))
            if (c) return c.long_name as string
          }
        }
        resolve({
          name: d.name,
          label: d.formatted_address?.startsWith(d.name) ? d.formatted_address : `${d.name}, ${d.formatted_address}`,
          lat: d.geometry.location.lat(),
          lng: d.geometry.location.lng(),
          // Dubai districts (Dubai Marina, Business Bay…) come back as sublocality/neighborhood — or occasionally as a
          // bare "political" component, which is taken before falling back to the city.
          area: comp('neighborhood', 'sublocality_level_1', 'sublocality')
            || (d.address_components || []).find((x: any) => x.types.length === 1 && x.types[0] === 'political')?.long_name
            || comp('locality'),
          road: [comp('street_number'), comp('route')].filter(Boolean).join(' ') || undefined,
          emirate: comp('administrative_area_level_1', 'locality'),
        })
      },
    )
  })
}

// ── Nearby places (project landmarks) ───────────────────────────────────
export type NearbyKind = 'metro' | 'hospital' | 'school' | 'mall' | 'airport' | 'landmark'
export interface NearbyPlace { placeId: string; name: string; address?: string; lat: number; lng: number; reviews: number }

// How each kind is searched. Nearest-first for everyday places; airports and major sights by prominence within a
// wide radius (the nearest "airport" is otherwise a helipad), then sorted by distance by the caller.
// Google tags many small businesses with these types (a psychiatry clinic as "hospital", an online shop as
// "shopping_mall"), so apart from metro stations the search is by prominence within a radius, and only well-known
// places are kept: enough Google reviews and a name that fits.
interface NearbyQuery { type: string; keyword?: string; radius?: number; minReviews?: number; name?: RegExp; notName?: RegExp; prefer?: RegExp; fallback?: { type: string; keyword: string } }
const NEARBY_QUERY: Record<NearbyKind, NearbyQuery> = {
  metro:    { type: 'subway_station', fallback: { type: 'transit_station', keyword: 'metro station' } },
  hospital: { type: 'hospital', keyword: 'hospital', radius: 15000, minReviews: 150, name: /hospital|medical city|healthcare city|medical cent(er|re)|clinic/i, prefer: /hospital/i, notName: /psychiatr|dental|pharmacy|\blab\b|laborator|veterinar|pet\b/i },
  school:   { type: 'school', keyword: 'school', radius: 12000, minReviews: 25, name: /school|academy|college|institute|university|lyc[eé]e|gems|dess|kings'?|repton|nord anglia/i, notName: /nursery|early childhood|driving|dance|tuition|training cent|wellness|well-?being|fighting|martial|karate|taekwondo|boxing|jiu|gym|fitness|yoga|swim|music|language cent|coaching/i },
  mall:     { type: 'shopping_mall', keyword: 'mall', radius: 10000, minReviews: 500, notName: /supermarket|hypermarket|online|\bstore\b|\bshop\b/i },
  airport:  { type: 'airport', keyword: 'international airport', radius: 90000, name: /airport/i, notName: /department|office|authority|lounge|parking|cargo|terminal building|club|academy/i },
  landmark: { type: 'tourist_attraction', radius: 20000, minReviews: 1500 },
}

export async function nearbyPlaces(center: { lat: number; lng: number }, kind: NearbyKind): Promise<NearbyPlace[]> {
  const places = await loadPlaces()
  const service = new places.PlacesService(document.createElement('div'))
  const g = (window as any).google
  const run = (type: string, keyword?: string, radius?: number) => new Promise<NearbyPlace[]>((resolve, reject) => {
    const req: any = { location: new g.maps.LatLng(center.lat, center.lng), type, language: 'en' }
    if (keyword) req.keyword = keyword
    if (radius) req.radius = radius
    else req.rankBy = g.maps.places.RankBy.DISTANCE
    service.nearbySearch(req, (res: any[] | null, status: string) => {
      if (status === 'ZERO_RESULTS') return resolve([])
      if (status !== 'OK' || !res) return reject(new Error(status))
      resolve(res.filter(r => r.geometry?.location).map(r => ({
        placeId: r.place_id, name: r.name, address: r.vicinity, reviews: r.user_ratings_total || 0,
        lat: r.geometry.location.lat(), lng: r.geometry.location.lng(),
      })))
    })
  })
  const q = NEARBY_QUERY[kind]
  let list = await run(q.type, q.keyword, q.radius)
  if (!list.length && q.fallback) list = await run(q.fallback.type, q.fallback.keyword)
  const good = list.filter(p => (!q.name || q.name.test(p.name)) && !(q.notName && q.notName.test(p.name)) && p.reviews >= (q.minReviews || 0))
  // Too strict for a quiet area? Fall back to the name rules alone rather than show nothing.
  const preferred = q.prefer ? good.filter(p => q.prefer!.test(p.name)) : []
  if (preferred.length >= 3) return preferred
  return good.length >= 2 ? good : list.filter(p => (!q.name || q.name.test(p.name)) && !(q.notName && q.notName.test(p.name)))
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
