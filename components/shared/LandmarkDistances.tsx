'use client'
import { HeartPulse, TrainFront, GraduationCap, ShoppingBag, Landmark as LandmarkIcon, Plane } from 'lucide-react'
import { haversineKm, formatDistanceKm } from '@/lib/distance'

// The nearby landmarks our team added to a project or a listing, grouped by kind, nearest first. Distances are worked
// out here from the two sets of coordinates (never stored), so they stay right when either point is edited.
export interface Landmark { name: string; category: string; lat: number; lng: number }

export const LANDMARK_ICON: Record<string, any> = {
  metro: TrainFront, school: GraduationCap, mall: ShoppingBag, landmark: LandmarkIcon, airport: Plane, hospital: HeartPulse,
}
export const LANDMARK_LABEL: Record<string, string> = {
  metro: 'Metro Stations', school: 'Schools', mall: 'Malls', landmark: 'Landmarks', airport: 'Airports', hospital: 'Hospitals',
}

export default function LandmarkDistances({ landmarks, coords }: { landmarks: Landmark[]; coords?: { lat: number; lng: number } | null }) {
  const grouped = landmarks.reduce((acc, lm) => {
    (acc[lm.category] ||= []).push(lm)
    return acc
  }, {} as Record<string, Landmark[]>)
  if (!Object.keys(grouped).length) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {Object.entries(grouped).map(([category, items]) => {
        const Icon = LANDMARK_ICON[category] || LandmarkIcon
        const withDistance = items
          .map(lm => ({ ...lm, km: coords ? haversineKm(coords.lat, coords.lng, lm.lat, lm.lng) : null }))
          .sort((a, b) => (a.km ?? 0) - (b.km ?? 0))
        return (
          <div key={category} className="rounded-xl p-4" style={{ background: 'var(--bg-alt)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={14} style={{ color: 'var(--teal)' }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-mid)' }}>{LANDMARK_LABEL[category] || category}</p>
            </div>
            <div className="space-y-2">
              {withDistance.map(lm => (
                <div key={lm.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate" style={{ color: 'var(--text-mid)' }}>{lm.name}</span>
                  {lm.km !== null && <span className="font-semibold flex-shrink-0" style={{ color: 'var(--text)' }}>{formatDistanceKm(lm.km)}</span>}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
