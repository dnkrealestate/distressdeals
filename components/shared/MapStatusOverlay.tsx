import { MapPinOff } from 'lucide-react'
import type { MapStatus } from '@/lib/googleMaps'

// Shown on top of a map container while Google Maps can't render — no API key
// set yet, or Google rejected the key / the script failed to load.
export default function MapStatusOverlay({ status }: { status: MapStatus }) {
  if (status === 'ready' || status === 'loading') return null

  const missing = status === 'missing-key'
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center px-6" style={{ background: 'var(--bg-alt)' }}>
      <MapPinOff size={28} style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {missing ? "Map isn't configured yet" : "Couldn't load the map"}
      </p>
      <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
        {missing
          ? <>Add a Google Maps API key to <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable this map.</>
          : 'Check that the Google Maps API key is valid, has the Maps JavaScript API enabled, and allows this website.'}
      </p>
    </div>
  )
}
