'use client'
import { useState } from 'react'
import { KeyRound, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { propertyAPI } from '@/lib/api'
import RentalAvailabilityFields from '@/components/shared/RentalAvailabilityFields'
import RentalBadge from '@/components/buyer/RentalBadge'
import { rentalStatusOf, toDateInput } from '@/lib/rental'
import type { Property, RentalStatus } from '@/types'

// Seller-side quick update for a rental's availability. Goes through its own endpoint, so changing
// "available now" to "rented until 1 Nov" never sends a live listing back to review.
export default function RentalAvailabilityCard({
  property, onUpdated,
}: {
  property: Property
  onUpdated: (p: Property) => void
}) {
  const [status, setStatus] = useState<RentalStatus>(rentalStatusOf(property) || 'available_now')
  const [date, setDate] = useState(toDateInput(property.availableFrom))
  const [showError, setShowError] = useState(false)
  const [saving, setSaving] = useState(false)

  const saved = rentalStatusOf(property)
  const dirty = status !== saved || (status !== 'available_now' && date !== toDateInput(property.availableFrom))

  const save = async () => {
    if (status !== 'available_now' && !date) { setShowError(true); return }
    setSaving(true)
    try {
      const res = await propertyAPI.updateAvailability(property._id, {
        rentalStatus: status,
        ...(status !== 'available_now' && { availableFrom: date }),
      })
      if (res.data.success) {
        const d = res.data.data
        onUpdated({ ...property, rentalStatus: d.rentalStatus, availableFrom: d.availableFrom })
        toast.success('Rental availability updated')
      }
    } catch (err: any) {
      toast.error(err?.error || err?.response?.data?.error || 'Could not update availability')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <KeyRound size={14} style={{ color: 'var(--teal)' }} /> Rental availability
        </h2>
        <RentalBadge property={property} />
      </div>
      <RentalAvailabilityFields
        status={status}
        date={date}
        onStatus={v => { setStatus(v); setShowError(false) }}
        onDate={v => { setDate(v); setShowError(false) }}
        showError={showError}
      />
      <div className="flex items-center gap-3 mt-4">
        <button onClick={save} disabled={saving || !dirty} className="btn-primary btn-sm gap-2 disabled:opacity-50">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Update availability
        </button>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Applies instantly — your listing stays live.</p>
      </div>
    </div>
  )
}
