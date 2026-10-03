import Link from 'next/link'
import { MapPin, Star } from 'lucide-react'
import { placeHref, sectionByKey } from '@/lib/explore'
import type { Place } from '@/types'

// A place in a grid or a row — photo (or the section's icon when there is none), name, where it is, and its rating
// once it has reviews. Server component: plain <img> with lazy loading, no JS.
export default function PlaceCard({ place, compact = false }: { place: Place; compact?: boolean }) {
  const section = sectionByKey(place.category)
  const Icon = section?.icon || MapPin
  const where = [place.area && place.area !== place.emirate ? place.area : '', place.emirate].filter(Boolean).join(', ')
  const tag = place.subcategory || place.cuisine || section?.label
  return (
    <Link href={placeHref(place)} className="card-hover group flex flex-col overflow-hidden h-full">
      <div className={`relative ${compact ? 'h-28 sm:h-32' : 'h-28 sm:h-44'} flex-shrink-0 overflow-hidden flex items-center justify-center`}
        style={{ background: 'linear-gradient(135deg, var(--bg-alt), rgba(203,1,1,0.08))' }}>
        {place.heroImage
          ? <img src={place.heroImage} alt={`${place.name}, ${where}`} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <Icon size={34} style={{ color: 'var(--teal)', opacity: 0.35 }} />}
        {tag && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 max-w-[85%] truncate px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide"
            style={{ background: 'rgba(15,23,42,0.72)', color: '#fff', backdropFilter: 'blur(4px)' }}>{tag}</span>
        )}
        {place.distanceKm != null && (
          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            {place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)} m` : `${place.distanceKm} km`}
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{place.name}</h3>
        <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <MapPin size={11} className="flex-shrink-0" style={{ color: 'var(--teal)' }} /><span className="truncate">{where}</span>
        </p>
        {!compact && place.summary && <div className="hidden sm:block"><p className="text-xs mt-2 leading-relaxed line-clamp-2" style={{ color: 'var(--text-mid)' }}>{place.summary}</p></div>}
        <div className="mt-auto pt-3 flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {place.ratingCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--text)' }}>
              <Star size={12} fill="#F59E0B" stroke="#F59E0B" /> {place.ratingAvg.toFixed(1)}
              <span className="font-normal" style={{ color: 'var(--text-muted)' }}>({place.ratingCount})</span>
            </span>
          ) : <span>Be the first to review</span>}
          {place.stars ? <span>· {place.stars}-star</span> : null}
        </div>
      </div>
    </Link>
  )
}
