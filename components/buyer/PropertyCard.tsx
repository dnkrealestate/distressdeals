'use client'

import { useState }     from 'react'
import Link            from 'next/link'
import { useRouter }   from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MapPin, Bed, Bath, Maximize2, Home,
  GitCompare, MessageCircleHeart,
} from 'lucide-react'

import { useAuthStore }      from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useCompareStore }   from '@/store/compareStore'
import { formatPrice, formatArea, cn, rentSuffix } from '@/lib/utils'
import ImageSlider            from '@/components/buyer/ImageSlider'
import { SpecPill }           from '@/components/buyer/SpecPill'
import LeadModal              from '@/app/buyer/LeadModal'
import type { Property }     from '@/types'

function formatType(type?: string): string {
  if (!type) return ''
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/* ── Badge helper ────────────────────────────────────────── */
function ListingBadge({ type }: { type: string }) {
  const isSale = type === 'sale'
  return (
    <span
      className={cn('badge text-[10px]', isSale ? 'badge-teal' : 'badge-blue')}
    >
      {isSale ? 'For Sale' : 'For Rent'}
    </span>
  )
}

/* ── Card skeleton ───────────────────────────────────────── */
function CardSkeleton({ compact, layout }: { compact?: boolean; layout?: 'grid' | 'row' }) {
  if (layout === 'row') {
    return (
      <div className="card overflow-hidden animate-pulse flex flex-col sm:flex-row">
        <div className="shimmer h-56 sm:h-auto sm:w-[340px] sm:self-stretch flex-shrink-0" />
        <div className="p-5 space-y-3 flex-1">
          <div className="shimmer h-6 w-40 rounded-lg" />
          <div className="shimmer h-4 w-3/4 rounded-lg" />
          <div className="shimmer h-3 w-1/2 rounded-lg" />
          <div className="flex gap-4 pt-2">
            <div className="shimmer h-3 w-12 rounded" />
            <div className="shimmer h-3 w-12 rounded" />
            <div className="shimmer h-3 w-16 rounded" />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className={cn('shimmer', compact ? 'h-44' : 'h-56')} />
      <div className="p-4 space-y-3">
        <div className="shimmer h-5 w-32 rounded-lg" />
        <div className="shimmer h-4 w-full rounded-lg" />
        <div className="shimmer h-3 w-2/3 rounded-lg" />
        <div className="flex gap-4 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <div className="shimmer h-3 w-12 rounded" />
          <div className="shimmer h-3 w-12 rounded" />
          <div className="shimmer h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  )
}

/* ── Main card ───────────────────────────────────────────── */
export default function PropertyCard({
  property,
  loading  = false,
  compact  = false,
  layout   = 'grid',
}: {
  property?: Property
  loading?:  boolean
  compact?:  boolean
  layout?:   'grid' | 'row'
}) {
  const router = useRouter()
  const { isAuthenticated }                         = useAuthStore()
  const { toggleFavorite, isFavorite }              = useFavoritesStore()
  const { addToCompare, removeFromCompare,
          isInCompare, compareList }                 = useCompareStore()
  const [leadOpen, setLeadOpen] = useState(false)

  if (loading) return <CardSkeleton compact={compact} layout={layout} />

  const p = property!

  const fav   = isFavorite(p._id)
  const inCmp = isInCompare(p._id)

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) { window.location.href = '/auth/login'; return }
    toggleFavorite(p._id)
  }

  const handleCmp = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    inCmp ? removeFromCompare(p._id) : addToCompare(p)
  }

  // The card is already one big link to the detail page — this button is
  // an explicit affordance for buyers who don't realise that, so it needs
  // its own handler (nesting a second <Link> inside the outer one is
  // invalid HTML) rather than relying on click-bubbling.
  const openDetails = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    router.push(`/buyer/properties/${p.slug || p._id}`)
  }

  const openLead = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setLeadOpen(true)
  }

  const leadModal = (
    <AnimatePresence>
      {leadOpen && <LeadModal property={p} onClose={() => setLeadOpen(false)} />}
    </AnimatePresence>
  )

  if (layout === 'row') {
    return (
      <>
      <Link href={`/buyer/properties/${p.slug || p._id}`}>
        <div className="prop-card group flex flex-col sm:flex-row">

          {/* ── Image — full height, stretches to match the body ──── */}
          <div className="relative overflow-hidden flex-shrink-0 h-56 sm:h-auto sm:w-[340px] sm:self-stretch">
            <ImageSlider images={p.images} alt={p.title} sizes="(max-width:768px)100vw,340px" />

            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 45%)' }} />

            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <ListingBadge type={p.listingType} />
              {p.completion === 'off_plan' && <span className="badge badge-purple text-[10px]">Off-Plan</span>}
              {p.isFeatured && (
                <span className="badge text-[10px]" style={{ background: 'rgba(203,1,1,0.20)', color: '#CB0101', border: '1px solid rgba(203,1,1,0.40)' }}>
                  ✦ Featured
                </span>
              )}
            </div>
          </div>

          {/* ── Body ───────────────────────────────────── */}
          <div className="flex flex-col flex-1 p-5 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold grad-text">{formatPrice(p.price)}</span>
                {p.listingType === 'rent' && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rentSuffix(p)}</span>}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={handleFav}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: fav ? 'rgba(244,63,94,0.10)' : 'var(--bg-alt)', border: '1px solid var(--border)' }}
                >
                  <Heart size={13} fill={fav ? '#F43F5E' : 'none'} style={{ color: fav ? '#F43F5E' : 'var(--text-muted)' }} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={handleCmp}
                  disabled={compareList.length >= 2 && !inCmp}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{ background: inCmp ? 'rgba(203,1,1,0.10)' : 'var(--bg-alt)', border: '1px solid var(--border)' }}
                >
                  <GitCompare size={13} style={{ color: inCmp ? 'var(--teal)' : 'var(--text-muted)' }} />
                </motion.button>
              </div>
            </div>

            <h3 className="font-semibold text-[1.3rem] line-clamp-1 mb-1.5 leading-snug transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
              {p.title}
            </h3>

            <div className="flex items-center gap-1.5 text-[0.9rem] mb-4">
              <MapPin size={12} style={{ color: 'var(--teal)', opacity: 0.8, flexShrink: 0 }} />
              <span className="truncate font-semibold" style={{ color: 'var(--text-mid)' }}>{p.location?.area}, {p.location?.city}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-4">
              {p.type && <SpecPill icon={Home} bold>{formatType(p.type)}</SpecPill>}
              {(p.amenities?.bedrooms ?? 0) > 0 && <SpecPill icon={Bed} bold>{p.amenities!.bedrooms} Bed</SpecPill>}
              {(p.amenities?.bathrooms ?? 0) > 0 && <SpecPill icon={Bath} bold>{p.amenities!.bathrooms} Bath</SpecPill>}
              {(p.amenities?.floorArea ?? 0) > 0 && <SpecPill icon={Maximize2} bold>{formatArea(p.amenities!.floorArea)} sqft</SpecPill>}
              {p.pricePerSqft && (
                <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  AED {Math.round(p.pricePerSqft).toLocaleString()}/sqft
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-auto pt-3.5" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <button onClick={openLead} className="btn-primary btn-sm gap-1.5">
                <MessageCircleHeart size={13} /> Interested
              </button>
              <button onClick={openDetails} className="btn-outline btn-sm gap-1.5">
                More Details
              </button>
            </div>
          </div>
        </div>
      </Link>
      {leadModal}
      </>
    )
  }

  return (
    <>
    <Link href={`/buyer/properties/${p.slug || p._id}`}>
      <div className="prop-card group h-full">

        {/* ── Image ──────────────────────────────────── */}
        <div
          className={cn(
            'relative overflow-hidden flex-shrink-0',
            compact ? 'h-44' : 'h-56'
          )}
        >
          <ImageSlider images={p.images} alt={p.title} sizes="(max-width:768px)100vw,(max-width:1200px)50vw,33vw" />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }}
          />

          {/* Hover teal shimmer */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(203,1,1,0.12), transparent 60%)' }}
          />

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <ListingBadge type={p.listingType} />

            {p.completion === 'off_plan' && (
              <span className="badge badge-purple text-[10px]">Off-Plan</span>
            )}

            {p.isFeatured && (
              <span
                className="badge text-[10px]"
                style={{
                  background:  'rgba(203,1,1,0.20)',
                  color:       '#CB0101',
                  border:      '1px solid rgba(203,1,1,0.40)',
                }}
              >
                ✦ Featured
              </span>
            )}
          </div>

          {/* Action buttons (hover) */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={handleFav}
              className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors"
              style={{
                background: fav ? 'rgba(244,63,94,0.85)' : 'rgba(0,0,0,0.50)',
                border:     '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <Heart
                size={13}
                fill={fav ? 'white' : 'none'}
                className="text-white"
              />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={handleCmp}
              disabled={compareList.length >= 2 && !inCmp}
              className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors disabled:opacity-40"
              style={{
                background: inCmp ? 'rgba(203,1,1,0.85)' : 'rgba(0,0,0,0.50)',
                border:     '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <GitCompare size={13} className="text-white" />
            </motion.button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-4">

          {/* Price row */}
          <div className="flex items-baseline justify-between mb-1.5">
            <span
              className="text-xl font-bold grad-text"
            >
              {formatPrice(p.price)}
            </span>

            {p.listingType === 'rent' && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rentSuffix(p)}</span>
            )}

            {p.pricePerSqft && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                AED {Math.round(p.pricePerSqft).toLocaleString()}/sqft
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="font-semibold text-sm line-clamp-2 mb-2 leading-snug transition-colors group-hover:text-[var(--teal)]"
            style={{ color: 'var(--text)' }}
          >
            {p.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            <MapPin size={11} style={{ color: 'var(--teal)', opacity: 0.7, flexShrink: 0 }} />
            <span className="truncate">
              {p.location?.area}, {p.location?.city}
            </span>
          </div>

          {/* Specs */}
          <div
            className="flex items-center gap-1.5 text-xs mt-auto pt-3 flex-wrap"
            style={{ borderTop: '1px solid var(--border-soft)' }}
          >
            {p.type && <SpecPill icon={Home}>{formatType(p.type)}</SpecPill>}
            {(p.amenities?.bedrooms ?? 0) > 0 && <SpecPill icon={Bed}>{p.amenities!.bedrooms} Bed</SpecPill>}
            {(p.amenities?.bathrooms ?? 0) > 0 && <SpecPill icon={Bath}>{p.amenities!.bathrooms} Bath</SpecPill>}
            {(p.amenities?.floorArea ?? 0) > 0 && <SpecPill icon={Maximize2}>{formatArea(p.amenities!.floorArea)} sqft</SpecPill>}
          </div>

          {/* Interested CTA */}
          <button onClick={openLead} className="btn-primary btn-sm w-full justify-center gap-1.5 mt-3">
            <MessageCircleHeart size={13} /> Interested
          </button>
        </div>
      </div>
    </Link>
    {leadModal}
    </>
  )
}