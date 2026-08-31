// Great-circle distance between two lat/lng points, in kilometers. Used for
// "distance to nearest metro/school/mall/landmark/airport" — computed on the
// client from stored coordinates, no server round-trip or paid distance API
// needed since these are straight-line distances, not driving routes.
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistanceKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export interface GeocodeResult { label: string; lat: number; lng: number }

// Free-text place search via OpenStreetMap's Nominatim — no API key needed
// (same "no Google Maps key configured yet" constraint as the rest of the
// map features in this app). Biased to the UAE since that's the only market
// this site operates in. Respects Nominatim's usage policy: no auto-fire on
// every keystroke, callers should debounce.
export async function geocodePlace(query: string): Promise<GeocodeResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ae&limit=5&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json()
  return (data as any[]).map(d => ({ label: d.display_name as string, lat: Number(d.lat), lng: Number(d.lon) }))
}
