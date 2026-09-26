'use client'
import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Loader2, Send, Tag, KeyRound, Home, Building2, Trees, Layers, Castle,
  Store, Briefcase, Warehouse, MoreHorizontal, BedDouble, MapPin, Crosshair,
  DollarSign, Sparkles, Camera, UploadCloud, X,
} from 'lucide-react'
import { propertyAPI } from '@/lib/api'
import RentalAvailabilityFields from '@/components/shared/RentalAvailabilityFields'
import { toDateInput, rentalStatusOf } from '@/lib/rental'
import type { RentalStatus } from '@/types'
import { formatPrice } from '@/lib/utils'
import { UAE_EMIRATES } from '@/lib/constants'
import { AMENITY_GROUPS, AMENITY_META } from '@/lib/amenities'
import { reverseGeocode, type GeocodeResult } from '@/lib/distance'
import { LocationSearch } from './LocationSearch'
import StepIndicator from './StepIndicator'
import type { Property } from '@/types'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { trackLead } from '@/lib/leadTracking'

// Sellers only ever give the basics here — no title, description, or precise
// verification detail. The assigned agent still reviews and completes
// everything (see components/shared/PropertyForm) before the listing can go
// live. A short, friendly 4-step wizard: what it is, where it is, the
// details/price/amenities, then (optionally) a few photos.

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="shimmer rounded-xl" style={{ height: '100%' }} />,
})

const RESIDENTIAL_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: Building2 },
  { value: 'villa', label: 'Villa', icon: Home },
  { value: 'townhouse', label: 'Townhouse', icon: Layers },
  { value: 'penthouse', label: 'Penthouse', icon: Castle },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
]
const COMMERCIAL_TYPES = [
  { value: 'retail', label: 'Shop', icon: Store },
  { value: 'office', label: 'Office', icon: Briefcase },
  { value: 'warehouse', label: 'Warehouse', icon: Warehouse },
  { value: 'commercial_villa', label: 'Commercial Villa', icon: Home },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
]
const CATEGORIES = [
  { value: 'residential', label: 'Residential', icon: Home },
  { value: 'commercial', label: 'Commercial', icon: Building2 },
  { value: 'plot', label: 'Land / Plot', icon: Trees },
] as const
type CategoryValue = typeof CATEGORIES[number]['value']

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

// Which step each required field lives on — since every step stays mounted
// (just hidden), a validation error on a step the seller isn't currently
// looking at would otherwise fail silently. This is how we jump them there
// and spell out exactly what's still missing.
const FIELD_META: Record<string, { label: string; step: number }> = {
  city: { label: 'City', step: 2 },
  address: { label: 'Street Name / Street Number / Landmark', step: 2 },
  price: { label: 'Price', step: 3 },
}

interface FormValues {
  price: number; floorArea?: number
  city: string; district?: string; address: string; additionalAddress?: string; unitNo?: string
  area?: string; lat?: number; lng?: number
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
    </div>
  )
}

function SectionTitle({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <h2 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ color: 'var(--text)' }}>
      <Icon size={15} style={{ color: 'var(--teal)' }} />
      {children}
    </h2>
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
            background: value === o.value ? 'rgba(203,1,1,0.10)' : 'transparent',
            color: value === o.value ? 'var(--teal)' : 'var(--text-muted)',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Big icon + label card — friendlier and more scannable than plain text
// pills for the handful of choices that really define the listing.
function IconCard({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border transition-all flex-1"
      style={{
        minWidth: 84,
        borderColor: active ? 'var(--teal)' : 'var(--border)',
        background: active ? 'rgba(203,1,1,0.08)' : 'var(--surface)',
        color: active ? 'var(--teal)' : 'var(--text-mid)',
        cursor: 'pointer',
      }}
    >
      <Icon size={22} />
      <span className="text-xs font-semibold text-center leading-tight">{label}</span>
    </button>
  )
}

export default function SellerListingForm({ property, onSuccess }: { property?: Property; onSuccess: (id: string) => void }) {
  const router = useRouter()
  const isEdit = !!property
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [listingType, setListingType] = useState<string>(property?.listingType || 'sale')
  const [category, setCategory] = useState<CategoryValue>((property?.category as CategoryValue) || 'residential')
  const [type, setType] = useState<string>(property?.type || 'apartment')
  const [bedrooms, setBedrooms] = useState(property?.amenities?.bedrooms !== undefined ? String(Math.min(property.amenities.bedrooms, 8)) : '')
  const [furnishing, setFurnishing] = useState<string>(property?.furnishing || 'unfurnished')
  const [completion, setCompletion] = useState<string>(property?.completion || 'ready')
  const [urgency, setUrgency] = useState<string>(property?.urgency || 'flexible')
  const [rentFrequency, setRentFrequency] = useState<string>(property?.rentFrequency || 'yearly')
  const [rentalStatus, setRentalStatus] = useState<RentalStatus>((property && rentalStatusOf(property)) || 'available_now')
  const [availableFrom, setAvailableFrom] = useState<string>(toDateInput(property?.availableFrom))
  const [availableFromError, setAvailableFromError] = useState(false)
  const rentNeedsDate = listingType === 'rent' && rentalStatus !== 'available_now' && !availableFrom
  const [bedroomsError, setBedroomsError] = useState(false)
  const [missingFields, setMissingFields] = useState<{ key: string; label: string; step: number }[]>([])
  const [amenities, setAmenities] = useState<Record<string, boolean>>(property?.features || {})

  const [newImages, setNewImages] = useState<File[]>([])
  const [locating, setLocating] = useState(false)

  // Same "Located in" line + remount-key fix used on the admin listing
  // wizards — react-hook-form's setValue() updates its internal state, but
  // Area/City/Lat/Lng render as plain <input {...register()}> with no
  // `value` prop, so nothing repaints them without this.
  const [locatedIn, setLocatedIn] = useState(
    property?.location?.area ? `${property.location.emirate || 'Dubai'} / ${property.location.area}` : ''
  )
  const [locationVersion, setLocationVersion] = useState(0)

  const { register, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: property ? {
      price: property.price, floorArea: property.amenities?.floorArea || undefined,
      city: property.location?.city || 'Dubai', district: property.location?.district,
      address: property.location?.address, additionalAddress: property.location?.additionalAddress,
      unitNo: property.location?.unitNo,
      area: property.location?.area, lat: property.location?.coordinates?.lat, lng: property.location?.coordinates?.lng,
    } : {
      city: 'Dubai',
    },
  })

  const typeOptions = category === 'residential' ? RESIDENTIAL_TYPES : category === 'commercial' ? COMMERCIAL_TYPES : []

  const changeCategory = (v: CategoryValue) => {
    setCategory(v)
    if (v === 'plot') { setType('plot'); setBedrooms('') }
    else setType((v === 'residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES)[0].value)
  }

  // Shared by the search box, the interactive map, and "use my current
  // location" — whichever one gives us a place, this is what applies it.
  const applyLocation = (r: GeocodeResult) => {
    const area = r.area || r.label.split(',')[0].trim()
    const emirate = UAE_EMIRATES.find(e => r.label.includes(e))
    setValue('area', area, { shouldDirty: true })
    setValue('address', r.road || r.label, { shouldDirty: true, shouldValidate: true })
    setValue('lat', r.lat, { shouldDirty: true })
    setValue('lng', r.lng, { shouldDirty: true })
    if (emirate) setValue('city', emirate, { shouldDirty: true })
    setLocatedIn(`${emirate || 'Dubai'} / ${area}`)
    setLocationVersion(v => v + 1)
  }

  const onMapPick = async (lat: number, lng: number) => {
    setValue('lat', lat, { shouldDirty: true })
    setValue('lng', lng, { shouldDirty: true })
    setLocationVersion(v => v + 1)
    try {
      const r = await reverseGeocode(lat, lng)
      applyLocation(r)
    } catch { /* keep the pin even if the reverse lookup fails */ }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Your browser doesn't support location"); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const r = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          applyLocation(r)
        } catch {
          setValue('lat', pos.coords.latitude, { shouldDirty: true })
          setValue('lng', pos.coords.longitude, { shouldDirty: true })
          setLocationVersion(v => v + 1)
        } finally {
          setLocating(false)
        }
      },
      () => { toast.error('Could not get your location — check permissions'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const toggleAmenity = (key: string) => setAmenities(a => ({ ...a, [key]: !a[key] }))

  const onDropImages = useCallback((accepted: File[]) => {
    setNewImages(prev => [...prev, ...accepted].slice(0, 20))
  }, [])
  const { getRootProps, getInputProps, open: openUploadDialog, isDragActive } = useDropzone({
    onDrop: onDropImages,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/avif': [] },
    maxSize: 10 * 1024 * 1024,
    noClick: true, // the Upload tile below opens the dialog itself, via its own button
  })
  const removeNewImage = (i: number) => setNewImages(imgs => imgs.filter((_, idx) => idx !== i))

  // Separate from the dropzone above — `capture` makes mobile browsers open
  // the camera directly instead of the file/gallery picker. Desktop browsers
  // without a camera just ignore it and fall back to a normal file picker.
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const onCaptureImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setNewImages(prev => [...prev, file].slice(0, 20))
    e.target.value = ''
  }

  // RHF only validates its own registered fields (city/address/price) — the
  // Category/Type/Bedrooms picks are local state, so they're checked here
  // and merged into the same "what's missing" list before either blocks
  // the actual submit.
  const onInvalid = (formErrors: Record<string, any>) => {
    const missing = Object.keys(formErrors)
      .map(key => FIELD_META[key] && { key, ...FIELD_META[key] })
      .filter(Boolean) as { key: string; label: string; step: number }[]
    if (category === 'residential' && !bedrooms) {
      setBedroomsError(true)
      missing.push({ key: 'bedrooms', label: 'Bedrooms', step: 1 })
    }
    if (rentNeedsDate) {
      setAvailableFromError(true)
      missing.push({ key: 'availableFrom', label: 'Available-from date', step: 1 })
    }
    missing.sort((a, b) => a.step - b.step)
    setMissingFields(missing)
    if (missing.length > 0) {
      setStep(missing[0].step)
      toast.error(`Please complete: ${missing.map(m => m.label).join(', ')}`)
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (category === 'residential' && !bedrooms) {
      setBedroomsError(true)
      setMissingFields([{ key: 'bedrooms', label: 'Bedrooms', step: 1 }])
      setStep(1)
      toast.error('Please complete: Bedrooms')
      return
    }
    if (rentNeedsDate) {
      setAvailableFromError(true)
      setMissingFields([{ key: 'availableFrom', label: 'Available-from date', step: 1 }])
      setStep(1)
      toast.error('Please complete: Available-from date')
      return
    }
    setBedroomsError(false)
    setAvailableFromError(false)
    setMissingFields([])
    setSubmitting(true)
    const payload = {
      category, type, listingType, price: Number(data.price),
      furnishing, completion, urgency,
      ...(listingType === 'rent' && {
        rentFrequency,
        rentalStatus,
        ...(rentalStatus !== 'available_now' && availableFrom && { availableFrom }),
      }),
      ...(category === 'residential' && { bedrooms: Number(bedrooms) }),
      ...(data.floorArea !== undefined && data.floorArea !== null && data.floorArea !== ('' as any) && { floorArea: Number(data.floorArea) }),
      features: amenities,
      location: {
        city: data.city, district: data.district, emirate: data.city,
        address: data.address, additionalAddress: data.additionalAddress, unitNo: data.unitNo,
        area: data.area || undefined,
        ...(data.lat !== undefined && data.lng !== undefined && data.lat !== ('' as any) && data.lng !== ('' as any) && {
          coordinates: { lat: Number(data.lat), lng: Number(data.lng) },
        }),
      },
    }

    try {
      if (isEdit) {
        await propertyAPI.update(property!._id, payload)
        if (newImages.length > 0) {
          const fd = new FormData()
          newImages.forEach(f => fd.append('images', f))
          await propertyAPI.uploadImages(property!._id, fd)
        }
        toast.success(property!.status === 'rejected' ? 'Listing resubmitted for review' : 'Listing updated')
        onSuccess(property!._id)
      } else {
        const fd = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (v === undefined) return
          fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
        })
        newImages.forEach(f => fd.append('images', f))
        const res = await propertyAPI.create(fd)
        trackLead('Seller listing submitted', {
          name: useAuthStore.getState().user?.name, phone: useAuthStore.getState().user?.phone, email: useAuthStore.getState().user?.email,
          extra: { listing: `${type} for ${listingType} in ${payload.location.area || payload.location.city}`, price: payload.price },
        })
        toast.success('Listing submitted — our team will review it and be in touch shortly')
        onSuccess(res.data.data._id)
      }
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save listing')
    } finally {
      setSubmitting(false)
    }
  }

  const goNext = () => setStep(s => Math.min(s + 1, 4))
  const goPrev = () => setStep(s => Math.max(s - 1, 1))

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="max-w-2xl">
      <StepIndicator step={step} onJump={setStep} labels={['Basics', 'Location', 'Details', 'Photos']} />

      {missingFields.length > 0 && (
        <div className="rounded-xl p-4 mb-5 text-sm" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.25)' }}>
          <p className="font-semibold mb-2" style={{ color: '#FB7185' }}>Please complete before submitting:</p>
          <ul className="space-y-1">
            {missingFields.map(m => (
              <li key={m.key}>
                <button
                  type="button"
                  onClick={() => setStep(m.step)}
                  className="underline text-left"
                  style={{ color: '#FB7185', cursor: 'pointer' }}
                >
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Step 1 — Basics ─────────────────────────────────────────── */}
      <div className={step !== 1 ? 'hidden' : 'space-y-5'}>
        <div className="card p-6">
          <SectionTitle icon={Tag}>I am looking to</SectionTitle>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Sell or rent out this property?</p>
          <div className="flex gap-3">
            <IconCard icon={Tag} label="Sell" active={listingType === 'sale'} onClick={() => setListingType('sale')} />
            <IconCard icon={KeyRound} label="Rent" active={listingType === 'rent'} onClick={() => setListingType('rent')} />
          </div>
        </div>

        <div className="card p-6">
          <SectionTitle icon={Building2}>Category *</SectionTitle>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>What kind of property is it?</p>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(c => (
              <IconCard key={c.value} icon={c.icon} label={c.label} active={category === c.value} onClick={() => changeCategory(c.value)} />
            ))}
          </div>
        </div>

        {typeOptions.length > 0 && (
          <div className="card p-6">
            <SectionTitle icon={Layers}>Type *</SectionTitle>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Pick the closest match.</p>
            <div className="flex flex-wrap gap-3">
              {typeOptions.map(t => (
                <IconCard key={t.value} icon={t.icon} label={t.label} active={type === t.value} onClick={() => setType(t.value)} />
              ))}
            </div>
          </div>
        )}

        {category === 'residential' && (
          <div className="card p-6">
            <SectionTitle icon={BedDouble}>Bedrooms *</SectionTitle>
            <div className="mt-3">
              <TabGroup options={BEDROOMS} value={bedrooms} onChange={v => { setBedrooms(v); setBedroomsError(false) }} />
            </div>
            {bedroomsError && <p className="text-xs mt-2" style={{ color: '#FB7185' }}>Please select the number of bedrooms</p>}
          </div>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={goNext} className="btn-primary">Next</button>
        </div>
      </div>

      {/* ── Step 2 — Location ───────────────────────────────────────── */}
      <div className={step !== 2 ? 'hidden' : 'space-y-5'}>
        <div className="card p-6">
          <SectionTitle icon={MapPin}>Where is the property?</SectionTitle>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Search for the area, drop a pin, or use your current location — then tell us how to find it exactly.
          </p>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <LocationSearch defaultQuery={property?.location?.area} onSelect={applyLocation} />
              </div>
              <button
                type="button" onClick={useCurrentLocation} disabled={locating}
                className="btn-outline gap-1.5 flex-shrink-0 justify-center"
              >
                {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
                Use My Location
              </button>
            </div>
            {locatedIn && (
              <p className="text-xs -mt-2" style={{ color: 'var(--text-muted)' }}>Located in: <strong style={{ color: 'var(--text-mid)' }}>{locatedIn}</strong></p>
            )}

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', height: 260 }}>
              <LocationPickerMap lat={getValues('lat')} lng={getValues('lng')} onPick={onMapPick} />
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Tip: click anywhere on the map, or drag the pin, to fine-tune the exact spot.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="City *">
                <input key={`city-${locationVersion}`} className="input" {...register('city', { required: true })} />
              </Field>
              <Field label="District (optional)">
                <input className="input" placeholder="e.g. Al Barsha" {...register('district')} />
              </Field>
            </div>

            <div className="pt-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-mid)' }}>
                Exact address — only ever seen by our team, never shown publicly.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Street Name / Street Number / Landmark *" className="md:col-span-2">
                    <input key={`address-${locationVersion}`} className="input" placeholder="e.g. Villa 12, Al Wasl Road, near XYZ Mall" {...register('address', { required: true })} />
                    {errors.address && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>This field is required</p>}
                  </Field>
                  <Field label="Unit No. (optional)">
                    <input className="input" placeholder="e.g. 1204" {...register('unitNo')} />
                  </Field>
                </div>
                <Field label="Additional / Detailed Address (optional)">
                  <textarea className="input" rows={2} placeholder="Any extra directions or details" {...register('additionalAddress')} />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button type="button" onClick={goPrev} className="btn-ghost">Previous</button>
          <button type="button" onClick={goNext} className="btn-primary">Next</button>
        </div>
      </div>

      {/* ── Step 3 — Details, Price & Amenities ─────────────────────── */}
      <div className={step !== 3 ? 'hidden' : 'space-y-5'}>
        <div className="card p-6">
          <SectionTitle icon={DollarSign}>Property Details &amp; Price</SectionTitle>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Just the basics — our team will contact you to complete the rest before it goes live.
          </p>
          <div className="space-y-4">
            <Field label="Area (sqft)">
              <input className="input" type="number" placeholder="e.g. 1200" {...register('floorArea')} />
              {(watch('floorArea') || 0) > 0 && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {(Number(watch('floorArea')) * 0.092903).toFixed(2)} Square Meters / {(Number(watch('floorArea')) * 0.111111).toFixed(2)} Square Yards
                </p>
              )}
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
            {listingType === 'rent' && (
              <Field label="Rental Availability">
                <RentalAvailabilityFields
                  status={rentalStatus}
                  date={availableFrom}
                  onStatus={v => { setRentalStatus(v); setAvailableFromError(false) }}
                  onDate={v => { setAvailableFrom(v); setAvailableFromError(false) }}
                  showError={availableFromError}
                />
              </Field>
            )}
            <Field label={listingType === 'rent' ? `Expected Rent (AED Per ${rentFrequency === 'monthly' ? 'Month' : 'Year'}) *` : 'Expected Price (AED) *'}>
              <input className="input" type="number" placeholder="0" {...register('price', { required: true, min: 1 })} />
              {(watch('price') || 0) > 0 && (
                <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--teal)' }}>{formatPrice(Number(watch('price')))}</p>
              )}
              {errors.price && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{listingType === 'rent' ? 'Expected rent is required' : 'Expected price is required'}</p>}
            </Field>
          </div>
        </div>

        <div className="card p-6">
          <SectionTitle icon={Sparkles}>Amenities</SectionTitle>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Optional — tick whatever the property already has.</p>
          <div className="space-y-4">
            {AMENITY_GROUPS.map(group => (
              <div key={group.title}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{group.title}</p>
                <div className="flex flex-wrap gap-2">
                  {group.keys.map(key => {
                    const meta = AMENITY_META[key]
                    if (!meta) return null
                    const Icon = meta.icon
                    return (
                      <button
                        key={key} type="button" onClick={() => toggleAmenity(key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                        style={{
                          background: amenities[key] ? 'rgba(203,1,1,0.10)' : 'var(--bg-alt)',
                          border: `1px solid ${amenities[key] ? 'var(--teal)' : 'var(--border)'}`,
                          color: amenities[key] ? 'var(--teal)' : 'var(--text-mid)',
                        }}
                      >
                        <Icon size={12} className="flex-shrink-0" />
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button type="button" onClick={goPrev} className="btn-ghost">Previous</button>
          <button type="button" onClick={goNext} className="btn-primary">Next</button>
        </div>
      </div>

      {/* ── Step 4 — Photos ──────────────────────────────────────────── */}
      <div className={step !== 4 ? 'hidden' : 'space-y-5'}>
        <div className="card p-6">
          <SectionTitle icon={Camera}>Photos</SectionTitle>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Optional, but listings with photos get reviewed faster. You can always send more later.
          </p>

          {isEdit && property!.images?.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
              {property!.images.map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div {...getRootProps()} className="grid grid-cols-2 gap-3">
            <input {...getInputProps()} />
            <button
              type="button"
              onClick={openUploadDialog}
              className="rounded-xl p-6 text-center transition-colors"
              style={{
                border: `2px dashed ${isDragActive ? 'var(--teal)' : 'var(--border)'}`,
                background: isDragActive ? 'rgba(203,1,1,0.05)' : 'var(--bg-alt)',
                cursor: 'pointer',
              }}
            >
              <UploadCloud size={22} style={{ color: 'var(--teal)', margin: '0 auto 8px' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Upload</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>From your device — multiple allowed</p>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="rounded-xl p-6 text-center transition-colors"
              style={{ border: '2px dashed var(--border)', background: 'var(--bg-alt)', cursor: 'pointer' }}
            >
              <Camera size={22} style={{ color: 'var(--teal)', margin: '0 auto 8px' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Camera</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Take a photo now</p>
            </button>
            <input
              ref={cameraInputRef}
              type="file" accept="image/*" capture="environment"
              onChange={onCaptureImage}
              className="hidden"
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Or drag & drop photos anywhere in this box. JPG, PNG, WebP · up to 10MB each.</p>

          {newImages.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4">
              {newImages.map((file, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group" style={{ background: 'var(--bg-alt)' }}>
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button" onClick={() => removeNewImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={goPrev} className="btn-ghost">Previous</button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary gap-2">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit Listing'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
