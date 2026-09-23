import { routingAPI } from './api'
import { haversineKm } from './mapPins'

export interface LatLng { lat: number; lng: number }

// A place on the drive-time search, tagged A / B on the map.
export interface DriveOrigin extends LatLng { tag: string; label: string }

export interface DriveMatrix {
  provider: 'google' | 'osrm' | 'estimate'
  durations: (number | null)[][]   // seconds, [origin][destination]
  distances: (number | null)[][]   // metres
}

export async function fetchDriveTimes(origins: LatLng[], destinations: LatLng[]): Promise<DriveMatrix> {
  const res = await routingAPI.driveTimes(
    origins.map(({ lat, lng }) => ({ lat, lng })),
    destinations.map(({ lat, lng }) => ({ lat, lng })),
  )
  return res.data.data as DriveMatrix
}

/** 172 → "3 min", 3900 → "1 h 5 min". */
export function formatDrive(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—'
  const min = Math.max(1, Math.round(seconds / 60))
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export interface RouteStep { text: string; road?: string; distance: number; duration: number }

// One drive: time, distance, the road geometry to draw on the map, and turn-by-turn steps.
export interface RouteInfo {
  provider: 'osrm' | 'estimate'
  duration: number                 // seconds
  distance: number                 // metres
  path: [number, number][]         // [lat, lng] along the road
  steps: RouteStep[]
}

// A route together with where it starts (A / B / you).
export interface RouteView { origin: DriveOrigin; route: RouteInfo }

export async function fetchRoute(origin: LatLng, destination: LatLng): Promise<RouteInfo> {
  const res = await routingAPI.route({ lat: origin.lat, lng: origin.lng }, { lat: destination.lat, lng: destination.lng })
  return res.data.data as RouteInfo
}

export function formatKm(meters: number | null | undefined): string {
  if (meters === null || meters === undefined) return ''
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`
}

// Nothing in the city is reached faster than ~1 km per minute in a straight line, so anything
// farther than this can't be within `minutes` of a place — a cheap pre-filter before asking a router.
export const reachKm = (minutes: number) => Math.min(60, minutes * 1.0)

export const withinReach = (a: LatLng, b: LatLng, minutes: number) =>
  haversineKm(a.lat, a.lng, b.lat, b.lng) <= reachKm(minutes)

export const TAG_COLORS: Record<string, string> = { A: '#1D4ED8', B: '#7C3AED', You: '#2563EB' }
