'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Loader2, Send } from 'lucide-react'
import { propertyAPI } from '@/lib/api'
import type { Property } from '@/types'
import toast from 'react-hot-toast'

// Sellers only ever give the basics here — no title, description, most
// amenities, features, photos, or precise map location. The assigned agent
// fills all of that in (see components/shared/PropertyForm) before the
// listing can go live.

const RESIDENTIAL_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'plot', label: 'Land' },
  { value: 'other', label: 'Other' },
]
const COMMERCIAL_TYPES = [
  { value: 'retail', label: 'Shop' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'commercial_villa', label: 'Commercial Villa' },
  { value: 'plot', label: 'Land' },
  { value: 'other', label: 'Other' },
]
const BEDROOMS = [
  { value: '0', label: 'Studio' },
  { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' },
  { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' },
  { value: '7', label: '7' }, { value: '8', label: '8+' },
]
const FURNISHING = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi-furnished' },
  { value: 'furnished', label: 'Furnished' },
]
const COMPLETION = [
  { value: 'ready', label: 'Ready' },
  { value: 'off_plan', label: 'Off-Plan' },
]
const URGENCY = [
  { value: 'this_month', label: 'This month' },
  { value: 'within_2_months', label: 'Within 2 months' },
  { value: 'flexible', label: 'Flexible' },
]
const RENT_FREQUENCY = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
]

interface FormValues {
  price: number; floorArea?: number
  city: string; district?: string; address: string; additionalAddress?: string
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
    </div>
  )
}

function TabGroup({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="px-4 py-2 rounded-xl text-xs font-medium border transition-all"
          style={{
            borderColor: value === o.value ? 'var(--teal)' : 'var(--border)',
            background: value === o.value ? 'rgba(49,178,222,0.10)' : 'transparent',
            color: value === o.value ? 'var(--teal)' : 'var(--text-muted)',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function SellerListingForm({ property, onSuccess }: { property?: Property; onSuccess: (id: string) => void }) {
  const router = useRouter()
  const isEdit = !!property
  const [submitting, setSubmitting] = useState(false)

  const [listingType, setListingType] = useState<string>(property?.listingType || 'sale')
  const [category, setCategory] = useState<'residential' | 'commercial'>(property?.category || 'residential')
  const [type, setType] = useState<string>(property?.type || 'apartment')
  const [bedrooms, setBedrooms] = useState(property?.amenities?.bedrooms !== undefined ? String(Math.min(property.amenities.bedrooms, 8)) : '')
  const [furnishing, setFurnishing] = useState<string>(property?.furnishing || 'unfurnished')
  const [completion, setCompletion] = useState<string>(property?.completion || 'ready')
  const [urgency, setUrgency] = useState<string>(property?.urgency || 'flexible')
  const [rentFrequency, setRentFrequency] = useState<string>(property?.rentFrequency || 'yearly')
  const [bedroomsError, setBedroomsError] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: property ? {
      price: property.price, floorArea: property.amenities?.floorArea || undefined,
      city: property.location?.city || 'Dubai', district: property.location?.district,
      address: property.location?.address, additionalAddress: property.location?.additionalAddress,
    } : {
      city: 'Dubai',
    },
  })

  const typeOptions = category === 'residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES

  const changeCategory = (v: string) => {
    const cat = v as 'residential' | 'commercial'
    setCategory(cat)
    setType((cat === 'residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES)[0].value)
  }

  const onSubmit = async (data: FormValues) => {
    if (category === 'residential' && !bedrooms) { setBedroomsError(true); return }
    setBedroomsError(false)
    setSubmitting(true)
    const payload = {
      category, type, listingType, price: Number(data.price),
      furnishing, completion, urgency,
      ...(listingType === 'rent' && { rentFrequency }),
      ...(category === 'residential' && { bedrooms: Number(bedrooms) }),
      ...(data.floorArea !== undefined && data.floorArea !== null && data.floorArea !== ('' as any) && { floorArea: Number(data.floorArea) }),
      location: {
        city: data.city, district: data.district,
        address: data.address, additionalAddress: data.additionalAddress,
      },
    }

    try {
      if (isEdit) {
        await propertyAPI.update(property!._id, payload)
        toast.success(property!.status === 'rejected' ? 'Listing resubmitted for review' : 'Listing updated')
        onSuccess(property!._id)
      } else {
        const fd = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (v === undefined) return
          fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
        })
        const res = await propertyAPI.create(fd)
        toast.success('Listing submitted — our team will review it and be in touch shortly')
        onSuccess(res.data.data._id)
      }
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save listing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="card p-6">
        <h2 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>I am looking to</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Sell or rent out this property?</p>
        <TabGroup
          options={[{ value: 'sale', label: 'Sell' }, { value: 'rent', label: 'Rent' }]}
          value={listingType}
          onChange={setListingType}
        />
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>Category &amp; Type *</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>What kind of property is it?</p>
        <div className="space-y-4">
          <TabGroup
            options={[{ value: 'residential', label: 'Residential' }, { value: 'commercial', label: 'Commercial' }]}
            value={category}
            onChange={changeCategory}
          />
          <TabGroup options={typeOptions} value={type} onChange={setType} />
        </div>
      </div>

      {category === 'residential' && (
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>Bedrooms *</h2>
          <TabGroup options={BEDROOMS} value={bedrooms} onChange={v => { setBedrooms(v); setBedroomsError(false) }} />
          {bedroomsError && <p className="text-xs mt-2" style={{ color: '#FB7185' }}>Please select the number of bedrooms</p>}
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>Property Details</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          Just the basics — our team will contact you to complete the rest before it goes live.
        </p>
        <div className="space-y-4">
          <Field label="Area (sqft)">
            <input className="input" type="number" placeholder="e.g. 1200" {...register('floorArea')} />
          </Field>
          <Field label="Furnishing">
            <TabGroup options={FURNISHING} value={furnishing} onChange={setFurnishing} />
          </Field>
          {listingType === 'sale' && (
            <Field label="Completion">
              <TabGroup options={COMPLETION} value={completion} onChange={setCompletion} />
            </Field>
          )}
          <Field label="Urgency">
            <TabGroup options={URGENCY} value={urgency} onChange={setUrgency} />
          </Field>
          {listingType === 'rent' && (
            <Field label="Rent Frequency">
              <TabGroup options={RENT_FREQUENCY} value={rentFrequency} onChange={setRentFrequency} />
            </Field>
          )}
          <Field label={listingType === 'rent' ? `Expected Rent (AED Per ${rentFrequency === 'monthly' ? 'Month' : 'Year'}) *` : 'Expected Price (AED) *'}>
            <input className="input" type="number" placeholder="0" {...register('price', { required: true, min: 1 })} />
            {errors.price && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{listingType === 'rent' ? 'Expected rent is required' : 'Expected price is required'}</p>}
          </Field>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>Location</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          These details are only ever visible to our agents and admins — never shown publicly.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="City *">
              <input className="input" {...register('city', { required: true })} />
            </Field>
            <Field label="District (optional)">
              <input className="input" placeholder="e.g. Al Barsha" {...register('district')} />
            </Field>
          </div>
          <Field label="Street Name / Street Number / Landmark *">
            <input className="input" placeholder="e.g. Villa 12, Al Wasl Road, near XYZ Mall" {...register('address', { required: true })} />
            {errors.address && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>This field is required</p>}
          </Field>
          <Field label="Additional / Detailed Address (optional)">
            <textarea className="input" rows={2} placeholder="Any extra directions or details" {...register('additionalAddress')} />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="btn-primary gap-2">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit Listing'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
      </div>
    </form>
  )
}
