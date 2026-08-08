'use client'

import Link            from 'next/link'
import { motion }      from 'framer-motion'
import {
  Heart, MapPin, Bed, Bath, Maximize2,
  Eye, TrendingUp, GitCompare,
} from 'lucide-react'

import { useAuthStore }      from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useCompareStore }   from '@/store/compareStore'
import { formatPrice, formatArea, cn, rentSuffix } from '@/lib/utils'
import ImageSlider            from '@/components/buyer/ImageSlider'
import type { Property }     from '@/types'

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
        <div className="shimmer h-56 sm:h-52 sm:w-[340px] flex-shrink-0" />
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
  const { isAuthenticated }                         = useAuthStore()
  const { toggleFavorite, isFavorite }              = useFavoritesStore()
  const { addToCompare, removeFromCompare,
          isInCompare, compareList }                 = useCompareStore()

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

  if (layout === 'row') {
    return (
      <Link href={`/buyer/properties/${p.slug || p._id}`}>
        <div className="prop-card group flex flex-col sm:flex-row">

          {/* ── Image ──────────────────────────────────── */}
          <div className="relative overflow-hidden flex-shrink-0 h-56 sm:h-52 sm:w-[340px]">
            <ImageSlider images={p.images} alt={p.title} sizes="(max-width:768px)100vw,340px" />

            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 45%)' }} />

            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <ListingBadge type={p.listingType} />
              {p.completion === 'off_plan' && <span className="badge badge-purple text-[10px]">Off-Plan</span>}
              {p.isFeatured && (
                <span className="badge text-[10px]" style={{ background: 'rgba(49,178,222,0.20)', color: '#31B2DE', border: '1px solid rgba(49,178,222,0.40)' }}>
                  ✦ Featured
                </span>
              )}
            </div>

            <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>
              <span className="flex items-center gap-1"><Eye size={11} />{p.stats?.views || 0}</span>
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
                  style={{ background: inCmp ? 'rgba(49,178,222,0.10)' : 'var(--bg-alt)', border: '1px solid var(--border)' }}
                >
                  <GitCompare size={13} style={{ color: inCmp ? 'var(--teal)' : 'var(--text-muted)' }} />
                </motion.button>
              </div>
            </div>

            <h3 className="font-semibold text-base line-clamp-1 mb-1.5 leading-snug transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
              {p.title}
            </h3>

            <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={11} style={{ color: 'var(--teal)', opacity: 0.7, flexShrink: 0 }} />
              <span className="truncate">{p.location?.area}, {p.location?.city}</span>
            </div>

            <div className="flex items-center gap-5 text-xs mt-auto pt-3 flex-wrap" style={{ borderTop: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}>
              {(p.amenities?.bedrooms ?? 0) > 0 && (
                <span className="flex items-center gap-1.5"><Bed size={13} style={{ color: 'var(--teal)', opacity: 0.6 }} />{p.amenities!.bedrooms} Bed</span>
              )}
              {(p.amenities?.bathrooms ?? 0) > 0 && (
                <span className="flex items-center gap-1.5"><Bath size={13} style={{ color: 'var(--teal)', opacity: 0.6 }} />{p.amenities!.bathrooms} Bath</span>
              )}
              {(p.amenities?.floorArea ?? 0) > 0 && (
                <span className="flex items-center gap-1.5"><Maximize2 size={13} style={{ color: 'var(--teal)', opacity: 0.6 }} />{formatArea(p.amenities!.floorArea)} sqft</span>
              )}
              {p.pricePerSqft && (
                <span className="font-medium" style={{ color: 'var(--text-mid)' }}>
                  AED {Math.round(p.pricePerSqft).toLocaleString()}/sqft
                </span>
              )}
              <span className="btn-primary btn-sm ml-auto flex-shrink-0" style={{ pointerEvents: 'none' }}>
                View Details
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
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
            style={{ background: 'linear-gradient(135deg, rgba(49,178,222,0.12), transparent 60%)' }}
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
                  background:  'rgba(49,178,222,0.20)',
                  color:       '#31B2DE',
                  border:      '1px solid rgba(49,178,222,0.40)',
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
                background: inCmp ? 'rgba(49,178,222,0.85)' : 'rgba(0,0,0,0.50)',
                border:     '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <GitCompare size={13} className="text-white" />
            </motion.button>
          </div>

          {/* Bottom stats */}
          {!compact && (
            <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {p.stats?.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp size={11} />
                {p.stats?.leads || 0} leads
              </span>
            </div>
          )}
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
            className="flex items-center gap-4 text-xs mt-auto pt-3"
            style={{ borderTop: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}
          >
            {(p.amenities?.bedrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <Bed size={12} style={{ color: 'var(--teal)', opacity: 0.6 }} />
                {p.amenities!.bedrooms} Bed
              </span>
            )}
            {(p.amenities?.bathrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <Bath size={12} style={{ color: 'var(--teal)', opacity: 0.6 }} />
                {p.amenities!.bathrooms} Bath
              </span>
            )}
            {(p.amenities?.floorArea ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <Maximize2 size={12} style={{ color: 'var(--teal)', opacity: 0.6 }} />
                {formatArea(p.amenities!.floorArea)} sqft
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}