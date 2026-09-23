'use client'
import { GOOGLE_MAPS_API_KEY, loadGoogleMaps, type MapBounds } from './googleMaps'
import { geocodePlace } from './distance'

// "Find a place on the map": Google Places autocomplete (UAE only, biased to Dubai), falling back to
// the free OSM geocoder if Places isn't reachable, so the search box never goes dead.

export interface PlaceSuggestion {
  id: string
  main: string          // "Dubai Marina"
  secondary?: string    // "Dubai - United Arab Emirates"
  // Present for the OSM fallback (Google suggestions are resolved on pick).
  lat?: number
  lng?: number
}

export interface ResolvedPlace {
  label: string
  lat: number
  lng: number
  viewport?: MapBounds  // an area/neighbourhood has bounds to frame; a building/POI doesn't
}

let placesLib: Promise<any> | null = null
function loadPlaces(): Promise<any> {
  if (!placesLib) {
    placesLib = loadGoogleMaps()
      .then(() => (window as any).google.maps.importLibrary('places'))
      .catch(err => { placesLib = null; throw err })
  }
  return placesLib
}

let sessionToken: any = null   // groups one typing session's autocomplete + details into a single billed session
let service: any = null
let detailsService: any = null

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const places = await loadPlaces()
      service ??= new places.AutocompleteService()
      sessionToken ??= new places.AutocompleteSessionToken()
      const g = (window as any).google.maps
      const predictions: any[] = await new Promise((resolve, reject) => {
        service.getPlacePredictions(
          {
            input: q,
            sessionToken,
            componentRestrictions: { country: 'ae' },
            // Dubai-centred bias, not a restriction — other emirates still come back.
            locationBias: { center: { lat: 25.2048, lng: 55.2708 }, radius: 60000 },
            language: 'en',
          },
          (res: any[] | null, status: string) => {
            if (status === g.places.PlacesServiceStatus.OK) resolve(res || [])
            else if (status === g.places.PlacesServiceStatus.ZERO_RESULTS) resolve([])
            else reject(new Error(status))
          },
        )
      })
      return predictions.slice(0, 6).map(p => ({
        id: p.place_id,
        main: p.structured_formatting?.main_text || p.description,
        secondary: p.structured_formatting?.secondary_text,
      }))
    } catch {
      // fall through to the OSM geocoder
    }
  }

  const results = await geocodePlace(q)
  return results.slice(0, 5).map((r, i) => {
    const [main, ...rest] = r.label.split(',')
    return { id: `osm-${i}-${r.lat},${r.lng}`, main: main.trim(), secondary: rest.slice(0, 2).join(',').trim() || undefined, lat: r.lat, lng: r.lng }
  })
}

export async function resolvePlace(s: PlaceSuggestion): Promise<ResolvedPlace> {
  if (s.lat !== undefined && s.lng !== undefined) return { label: s.main, lat: s.lat, lng: s.lng }

  const places = await loadPlaces()
  detailsService ??= new places.PlacesService(document.createElement('div'))
  const g = (window as any).google.maps
  const token = sessionToken
  sessionToken = null   // a pick ends the session; the next keystroke starts a new one
  return new Promise((resolve, reject) => {
    detailsService.getDetails(
      { placeId: s.id, fields: ['geometry', 'name'], sessionToken: token },
      (place: any, status: string) => {
        if (status !== g.places.PlacesServiceStatus.OK || !place?.geometry?.location) return reject(new Error(status))
        const vp = place.geometry.viewport
        resolve({
          label: place.name || s.main,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          viewport: vp ? { swLat: vp.getSouthWest().lat(), swLng: vp.getSouthWest().lng(), neLat: vp.getNorthEast().lat(), neLng: vp.getNorthEast().lng() } : undefined,
        })
      },
    )
  })
}
