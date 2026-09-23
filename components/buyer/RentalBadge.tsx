import { Calendar } from 'lucide-react'
import { rentalLabel, rentalStatusOf, RENTAL_TONE } from '@/lib/rental'

// Small "Available now / Available 1 Nov / Rented · free 1 Nov" pill for rent listings.
// `onImage` = sits over a photo, so it gets a solid background to stay legible.
export default function RentalBadge({
  property, onImage = false, className = '',
}: {
  property: { listingType?: string; rentalStatus?: string; availableFrom?: string | Date | null }
  onImage?: boolean
  className?: string
}) {
  const status = rentalStatusOf(property)
  if (!status) return null
  const tone = RENTAL_TONE[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${className}`}
      style={onImage ? { background: 'rgba(255,255,255,0.94)', color: tone.fg, boxShadow: '0 1px 4px rgba(0,0,0,0.18)' } : { background: tone.bg, color: tone.fg }}
    >
      {status === 'available_now'
        ? <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone.fg }} />
        : <Calendar size={10} />}
      {rentalLabel(property)}
    </span>
  )
}
