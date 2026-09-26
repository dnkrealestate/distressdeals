'use client'
import { useState } from 'react'
import { ArrowUpRight, Bath, Bed, ChevronLeft, ChevronRight, Eye, Heart, Maximize2, Navigation, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { formatPrice, rentSuffix, cn } from '@/lib/utils'
import { formatType, pinHref, type MapPin } from '@/lib/mapPins'
import RentalBadge from '@/components/buyer/RentalBadge'
import DirectionsPanel from '@/components/map/DirectionsPanel'
import type { RouteView } from '@/lib/driveTime'
import type { ResolvedPlace } from '@/lib/placeSearch'

// Floating card shown over the map when a pin is selected — enough to decide
// "worth opening?" without leaving the map, plus the map-only actions
// (Street View, directions).
export default function PinPreviewCard({
  pin, onClose, onStreetView, routes, routesLoading, routesError, hasStart, fromPlace, onFromPlace, stack,
}: {
  pin: MapPin
  // Set when this pin is one of several at the same spot: "‹ 2 of 5 ›".
  stack?: { index: number; total: number; go: (delta: number) => void }
  onClose: () => void
  onStreetView: (pin: MapPin) => Promise<boolean>
  // Directions to this property — the route lines themselves are drawn on the map by the page.
  routes: RouteView[]
  routesLoading: boolean
  routesError: boolean
  hasStart: boolean
  fromPlace: ResolvedPlace | null
  onFromPlace: (p: ResolvedPlace | null) => void
}) {
  const { isAuthenticated } = useAuthStore()
  const { toggleFavorite, isFavorite, toggleProjectFavorite, isProjectFavorite } = useFavoritesStore()
  const isProject = pin.kind === 'project'
  const [loadingSv, setLoadingSv] = useState(false)
  const [stepsOpen, setStepsOpen] = useState(false)
  const fav = isProject ? isProjectFavorite(pin.id) : isFavorite(pin.id)

  const street = async () => {
    setLoadingSv(true)
    const ok = await onStreetView(pin)
    setLoadingSv(false)
    if (!ok) toast.error('No Street View coverage at this spot')
  }

  const location = [pin.community, pin.area].filter(Boolean).join(', ')

  return (
    <div
      className="absolute z-20 left-3 right-3 bottom-3 sm:left-4 sm:right-auto sm:w-[380px] rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {stack && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] font-semibold"
          style={{ background: 'rgba(124,58,237,0.08)', color: '#6D28D9', borderBottom: '1px solid var(--border)' }}>
          <button type="button" onClick={() => stack.go(-1)} aria-label="Previous at this location" className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/60"><ChevronLeft size={14} /></button>
          <span>{stack.index + 1} of {stack.total} at this location</span>
          <button type="button" onClick={() => stack.go(1)} aria-label="Next at this location" className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/60"><ChevronRight size={14} /></button>
        </div>
      )}
      <div className="flex">
        <div className="relative w-[132px] flex-shrink-0" style={{ background: 'var(--bg-alt)' }}>
          {pin.img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pin.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <span
            className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: 'var(--grad)' }}
          >
            {isProject ? (pin.handedOver ? 'Project' : 'New Project') : pin.lt === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
          {pin.lt === 'rent' && (
            <span className="absolute bottom-2 left-2">
              <RentalBadge property={{ listingType: 'rent', rentalStatus: pin.rs, availableFrom: pin.af }} onImage />
            </span>
          )}
          {pin.offPlan && (
            <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#8B5CF6' }}>
              Off-Plan
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 p-3">
          {isProject && <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Starting Price</p>}
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-extrabold grad-text leading-tight">
              {formatPrice(pin.price)}<span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>{rentSuffix({ listingType: pin.lt, rentFrequency: pin.rf })}</span>
            </p>
            <button onClick={onClose} aria-label="Close" className="p-0.5 -mt-0.5 -mr-1 hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              <X size={15} />
            </button>
          </div>
          <p className="text-[13px] font-semibold leading-snug line-clamp-2 mt-0.5" style={{ color: 'var(--text)' }}>{pin.title}</p>
          {isProject && pin.dev && <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>by <span className="font-semibold" style={{ color: 'var(--teal)' }}>{pin.dev}</span></p>}
          {location && <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{location}</p>}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px]" style={{ color: 'var(--text-mid)' }}>
            <span className="font-medium">{formatType(pin.type)}</span>
            {pin.beds > 0 && <span className="inline-flex items-center gap-1"><Bed size={11} />{pin.beds}</span>}
            {pin.baths > 0 && <span className="inline-flex items-center gap-1"><Bath size={11} />{pin.baths}</span>}
            {pin.size > 0 && <span className="inline-flex items-center gap-1"><Maximize2 size={11} />{pin.size.toLocaleString()} sqft</span>}
            {pin.bedsLabel && <span className="inline-flex items-center gap-1"><Bed size={11} />{pin.bedsLabel}</span>}
            {pin.handover && <span>Handover {pin.handover}</span>}
          </div>
          {(pin.ppsf || pin.views > 0) && (
            <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {pin.ppsf ? <span>AED {pin.ppsf.toLocaleString()}/sqft</span> : null}
              {pin.views > 0 ? <span className="inline-flex items-center gap-1"><Eye size={10} />{pin.views.toLocaleString()} views</span> : null}
            </div>
          )}
        </div>
      </div>

      <DirectionsPanel
        routes={routes}
        loading={routesLoading}
        error={routesError}
        fromPlace={fromPlace}
        onFromPlace={onFromPlace}
        stepsOpen={stepsOpen}
        onToggleSteps={() => setStepsOpen(o => !o)}
        hasStart={hasStart}
      />

      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        <a
          href={pinHref(pin)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary btn-sm gap-1 flex-1 justify-center"
        >
          View details <ArrowUpRight size={13} />
        </a>
        <button onClick={street} disabled={loadingSv} className="btn-ghost btn-sm px-2.5" title="Street View">
          {loadingSv ? '…' : 'Street'}
        </button>
        <button
          onClick={() => setStepsOpen(o => !o)}
          disabled={routes.length === 0}
          className="btn-ghost btn-sm px-2.5 disabled:opacity-40"
          title={routes.length ? 'Step-by-step directions' : 'Pick a start point to get directions'}
          aria-pressed={stepsOpen}
          style={stepsOpen ? { color: 'var(--teal)' } : undefined}
        >
          <Navigation size={13} />
        </button>
        <button
          onClick={() => { if (!isAuthenticated) { window.location.href = '/auth/login'; return } isProject ? toggleProjectFavorite(pin.id) : toggleFavorite(pin.id) }}
          className={cn('btn-ghost btn-sm px-2.5')}
          title={fav ? 'Remove from favorites' : 'Save to favorites'}
          style={fav ? { color: '#F43F5E' } : undefined}
        >
          <Heart size={13} fill={fav ? '#F43F5E' : 'none'} />
        </button>
      </div>
    </div>
  )
}
