'use client'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { placeAPI } from '@/lib/api'

const LocationMap = dynamic(() => import('@/components/shared/LocationMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full shimmer" />,
})

// The place's exact position on the site's map, with the other places nearby as small dots. Also counts the page view.
export default function PlaceMap({ id, lat, lng, landmarks = [] }: { id?: string; lat: number; lng: number; landmarks?: { lat: number; lng: number; title: string }[] }) {
  useEffect(() => { if (id) placeAPI.trackView(id).catch(() => {}) }, [id])
  return <LocationMap lat={lat} lng={lng} zoom={15} landmarks={landmarks} />
}
