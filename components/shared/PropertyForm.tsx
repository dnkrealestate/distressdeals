'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, X, ImageIcon, Loader2, Sparkles, QrCode } from 'lucide-react'
import { propertyAPI, projectAPI, uploadAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import { UAE_EMIRATES, DUBAI_COMMUNITIES } from '@/lib/constants'
import RichTextEditor from './RichTextEditor'
import type { Property, Project } from '@/types'
import toast from 'react-hot-toast'

// Agent/admin-only — this is where the details a seller doesn't provide
// (title, description, public area, map location, amenities, features,
// photos) get filled in before a listing can be approved and published.
// Sellers never see this form; they only use SellerListingForm.

const TYPES = ['apartment', 'villa', 'townhouse', 'penthouse', 'studio', 'office', 'retail', 'warehouse', 'plot']
const FURNISHING = ['unfurnished', 'semi_furnished', 'furnished']
const COMPLETION = ['ready', 'off_plan']

const FEATURES: { key: string; label: string }[] = [
  { key: 'pool',            label: 'Swimming Pool'    },
  { key: 'gym',              label: 'Gym'               },
  { key: 'concierge',        label: 'Concierge'         },
  { key: 'security24h',      label: '24h Security'      },
  { key: 'smartHome',        label: 'Smart Home'        },
  { key: 'centralAC',        label: 'Central A/C'       },
  { key: 'builtInWardrobes', label: 'Built-in Wardrobes'},
  { key: 'coveredParking',   label: 'Covered Parking'   },
  { key: 'maidRoom',         label: 'Maid Room'         },
  { key: 'studyRoom',        label: 'Study Room'        },
  { key: 'jacuzzi',          label: 'Jacuzzi'           },
  { key: 'bbqArea',          label: 'BBQ Area'          },
  { key: 'petsAllowed',      label: 'Pets Allowed'      },
  { key: 'childrenPlay',     label: "Children's Play"   },
  { key: 'viewSea',          label: 'Sea View'          },
  { key: 'viewGolf',         label: 'Golf View'         },
  { key: 'viewBurjKhalifa',  label: 'Burj Khalifa View' },
]

interface FormValues {
  title: string; type: string; listingType: string; price: number
  furnishing: string; completion: string; developer?: string; projectName?: string; permitNumber?: string
  address: string; district?: string; additionalAddress?: string
  area: string; community?: string; city: string; emirate: string; lat: number; lng: number
  bedrooms: number; bathrooms: number; parkingSpaces: number; balconies: number
  floorArea: number; plotArea?: number; floor?: number; totalFloors?: number; yearBuilt?: number
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="font-bold text-sm mb-5" style={{ color: 'var(--text)' }}>{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
    </div>
  )
}

export default function PropertyForm({ property, onSuccess }: { property?: Property; onSuccess: (id: string) => void }) {
  const router = useRouter()
  const isEdit = !!property
  const [submitting, setSubmitting] = useState(false)
  const [newImages, setNewImages] = useState<File[]>([])
  const [features, setFeatures] = useState<Record<string, boolean>>(property?.features || {})
  const [description, setDescription] = useState(property?.description || '')
  const [descriptionError, setDescriptionError] = useState(false)

  const [aiDrafting, setAiDrafting] = useState(false)
  const [permitQrImage, setPermitQrImage] = useState(property?.permitQrImage || '')
  const [uploadingQr, setUploadingQr] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const { register, handleSubmit, getValues, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: property ? {
      title: property.title, type: property.type,
      listingType: property.listingType, price: property.price,
      furnishing: property.furnishing, completion: property.completion,
      developer: property.developer, projectName: property.projectName, permitNumber: property.permitNumber,
      address: property.location?.address, district: property.location?.district,
      additionalAddress: property.location?.additionalAddress, area: property.location?.area,
      community: property.location?.community,
      city: property.location?.city || 'Dubai', emirate: property.location?.emirate || 'Dubai',
      lat: property.location?.coordinates?.lat, lng: property.location?.coordinates?.lng,
      bedrooms: property.amenities?.bedrooms, bathrooms: property.amenities?.bathrooms,
      parkingSpaces: property.amenities?.parkingSpaces, balconies: property.amenities?.balconies,
      floorArea: property.amenities?.floorArea, plotArea: (property.amenities as any)?.plotArea,
      floor: (property.amenities as any)?.floor, totalFloors: (property.amenities as any)?.totalFloors,
      yearBuilt: (property.amenities as any)?.yearBuilt,
    } : {
      type: 'apartment', listingType: 'sale', furnishing: 'unfurnished', completion: 'ready',
      city: 'Dubai', emirate: 'Dubai',
    },
  })

  useEffect(() => {
    projectAPI.getAll({ limit: 200 }).then(r => { if (r.data.success) setProjects(r.data.data.data || []) }).catch(() => {})
  }, [])

  // Picking an off-plan project this unit belongs to auto-fills Developer +
  // Project Name from that project's own record, so the two stay consistent
  // instead of the agent retyping (and potentially mistyping) them by hand.
  const onSelectProject = (projectId: string) => {
    const proj = projects.find(p => p._id === projectId)
    if (!proj) return
    setValue('developer', proj.developer)
    setValue('projectName', proj.title)
  }

  const onDropQr = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploadingQr(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadAPI.image(fd)
      if (res.data.success) setPermitQrImage(res.data.data.url)
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload QR image')
    } finally {
      setUploadingQr(false)
    }
  }, [])
  const qrDropzone = useDropzone({
    onDrop: onDropQr,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024, multiple: false,
  })

  const onDrop = useCallback((accepted: File[]) => {
    setNewImages(prev => [...prev, ...accepted].slice(0, 20))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/avif': [] },
    maxSize: 10 * 1024 * 1024,
  })

  const removeNewImage = (i: number) => setNewImages(imgs => imgs.filter((_, idx) => idx !== i))
  const toggleFeature = (key: string) => setFeatures(f => ({ ...f, [key]: !f[key] }))

  // Drafts from whatever's already filled in (title/type/location/amenities)
  // — the agent still reviews and edits before saving, this never publishes on its own.
  const draftWithAI = async () => {
    const v = getValues()
    if (!v.title || !v.type || !v.listingType) {
      toast.error('Fill in title, type, and listing type first')
      return
    }
    setAiDrafting(true)
    try {
      const res = await propertyAPI.aiDescription({
        title: v.title, type: v.type, listingType: v.listingType,
        area: v.area, city: v.city,
        bedrooms: v.bedrooms, bathrooms: v.bathrooms, floorArea: v.floorArea,
        furnishing: v.furnishing,
        features: Object.entries(features).filter(([, on]) => on).map(([key]) => FEATURES.find(f => f.key === key)?.label || key),
      })
      if (res.data.success && res.data.data.description) {
        setDescription(res.data.data.description.replace(/\n/g, '<br/>'))
        setDescriptionError(false)
      }
    } catch (err: any) {
      toast.error(err?.error || 'Failed to draft description')
    } finally {
      setAiDrafting(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    const plainText = description.replace(/<[^>]*>/g, '').trim()
    if (!plainText) { setDescriptionError(true); return }
    setDescriptionError(false)
    setSubmitting(true)
    const payload = {
      title: data.title, description, type: data.type, listingType: data.listingType,
      price: Number(data.price), furnishing: data.furnishing, completion: data.completion,
      developer: data.developer, projectName: data.projectName, permitNumber: data.permitNumber, permitQrImage,
      location: {
        address: data.address, district: data.district, additionalAddress: data.additionalAddress,
        area: data.area, community: data.community || undefined, city: data.city, emirate: data.emirate, country: 'UAE',
        coordinates: { lat: Number(data.lat), lng: Number(data.lng) },
      },
      amenities: {
        bedrooms: Number(data.bedrooms) || 0, bathrooms: Number(data.bathrooms) || 0,
        parkingSpaces: Number(data.parkingSpaces) || 0, balconies: Number(data.balconies) || 0,
        floorArea: Number(data.floorArea) || 0,
        ...(data.plotArea && { plotArea: Number(data.plotArea) }),
        ...(data.floor !== undefined && data.floor !== null && { floor: Number(data.floor) }),
        ...(data.totalFloors && { totalFloors: Number(data.totalFloors) }),
        ...(data.yearBuilt && { yearBuilt: Number(data.yearBuilt) }),
      },
      features,
    }

    try {
      if (isEdit) {
        await propertyAPI.update(property!._id, payload)
        if (newImages.length > 0) {
          const fd = new FormData()
          newImages.forEach(f => fd.append('images', f))
          await propertyAPI.uploadImages(property!._id, fd)
        }
        toast.success('Listing updated')
        onSuccess(property!._id)
      } else {
        if (newImages.length === 0) { toast.error('Add at least one photo'); setSubmitting(false); return }
        const fd = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
        })
        newImages.forEach(f => fd.append('images', f))
        const res = await propertyAPI.create(fd)
        toast.success('Listing submitted for review')
        onSuccess(res.data.data._id)
      }
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save listing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-3xl">

      <Section title="Basics">
        <div className="space-y-4">
          <Field label="Title *">
            <input className="input" placeholder="e.g. Sky Residences Penthouse — Burj Khalifa View" {...register('title', { required: true })} />
            {errors.title && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Title is required</p>}
          </Field>
          <Field label="Description *">
            <div className="flex justify-end mb-1.5">
              <button
                type="button" onClick={draftWithAI} disabled={aiDrafting}
                className="btn-ghost btn-sm gap-1.5 text-xs" style={{ color: '#A855F7' }}
              >
                {aiDrafting ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                Draft with AI
              </button>
            </div>
            <RichTextEditor
              value={description}
              onChange={html => { setDescription(html); if (html.replace(/<[^>]*>/g, '').trim()) setDescriptionError(false) }}
              placeholder={'e.g.\nFully Furnished\nClosed Kitchen\nBalcony\n\nLocated in the heart of Business Bay...'}
            />
            {descriptionError && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Description is required</p>}
          </Field>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Type">
              <select className="select-field" {...register('type')}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Listing">
              <select className="select-field" {...register('listingType')}>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </Field>
            <Field label="Furnishing">
              <select className="select-field" {...register('furnishing')}>
                {FURNISHING.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Completion">
              <select className="select-field" {...register('completion')}>
                {COMPLETION.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Price (AED) *">
              <input className="input" type="number" placeholder="0" {...register('price', { required: true, min: 1 })} />
            </Field>
            <Field label="Developer">
              <input className="input" placeholder="e.g. Emaar Properties" {...register('developer')} />
            </Field>
            <Field label="Project Name">
              <input className="input" placeholder="e.g. Boulevard Point" {...register('projectName')} />
            </Field>
          </div>
          {projects.length > 0 && (
            <Field label="Link to an Off-Plan Project (optional — auto-fills Developer + Project Name above)">
              <select className="select-field" defaultValue="" onChange={e => onSelectProject(e.target.value)}>
                <option value="">— Select a project —</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.title} ({p.developer})</option>)}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="DLD Permit Number (Trakheesi)">
              <input className="input" placeholder="e.g. 71466785292" {...register('permitNumber')} />
            </Field>
            <Field label="DLD Permit QR Code (optional — the real QR from the permit certificate)">
              {permitQrImage ? (
                <div className="relative inline-flex" style={{ background: 'var(--bg-alt)' }}>
                  <img src={permitQrImage} alt="Permit QR" className="w-16 h-16 rounded-lg object-cover" style={{ border: '1px solid var(--border)' }} />
                  <button type="button" onClick={() => setPermitQrImage('')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <div {...qrDropzone.getRootProps()} className="rounded-xl p-3 text-center cursor-pointer transition-colors inline-flex items-center gap-2 px-4"
                  style={{ border: `2px dashed ${qrDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: qrDropzone.isDragActive ? 'rgba(49,178,222,0.05)' : 'var(--bg-alt)' }}>
                  <input {...qrDropzone.getInputProps()} />
                  {uploadingQr ? <Loader2 size={15} className="animate-spin" style={{ color: 'var(--teal)' }} /> : <QrCode size={15} style={{ color: 'var(--teal)' }} />}
                  <span className="text-xs" style={{ color: 'var(--text)' }}>Upload QR image</span>
                </div>
              )}
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Falls back to an auto-generated QR of the number above when left blank.
              </p>
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Location">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Street / Landmark (from seller) *">
              <input className="input" placeholder="Building, street" {...register('address', { required: true })} />
            </Field>
            <Field label="District (from seller)">
              <input className="input" {...register('district')} />
            </Field>
          </div>
          <Field label="Additional Address Details (from seller)">
            <textarea className="input" rows={2} {...register('additionalAddress')} />
          </Field>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Everything above is agent/admin-only and never shown to buyers. Fill in the public fields below for the marketplace listing.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Area * (public)">
              <input className="input" placeholder="e.g. Downtown Dubai" {...register('area', { required: true })} />
            </Field>
            <Field label="Community (optional)">
              <select className="select-field" {...register('community')}>
                <option value="">— None —</option>
                {DUBAI_COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input className="input" {...register('city')} />
            </Field>
            <Field label="Emirate">
              <select className="select-field" {...register('emirate')}>
                {UAE_EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude *">
              <input className="input" type="number" step="any" placeholder="25.1972" {...register('lat', { required: true })} />
            </Field>
            <Field label="Longitude *">
              <input className="input" type="number" step="any" placeholder="55.2744" {...register('lng', { required: true })} />
            </Field>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Tip: right-click the location on Google Maps and copy the coordinates.
          </p>
        </div>
      </Section>

      <Section title="Amenities">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Bedrooms"><input className="input" type="number" {...register('bedrooms')} /></Field>
          <Field label="Bathrooms"><input className="input" type="number" {...register('bathrooms')} /></Field>
          <Field label="Parking Spaces"><input className="input" type="number" {...register('parkingSpaces')} /></Field>
          <Field label="Balconies"><input className="input" type="number" {...register('balconies')} /></Field>
          <Field label="Floor Area (sqft) *"><input className="input" type="number" {...register('floorArea', { required: true })} /></Field>
          <Field label="Plot Area (sqft)"><input className="input" type="number" {...register('plotArea')} /></Field>
          <Field label="Floor #"><input className="input" type="number" {...register('floor')} /></Field>
          <Field label="Total Floors"><input className="input" type="number" {...register('totalFloors')} /></Field>
          <Field label="Year Built"><input className="input" type="number" {...register('yearBuilt')} /></Field>
        </div>
      </Section>

      <Section title="Features">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {FEATURES.map(f => (
            <button
              key={f.key} type="button" onClick={() => toggleFeature(f.key)}
              className={cn('badge cursor-pointer justify-start px-3 py-2 text-xs', features[f.key] ? 'badge-teal' : 'badge-gray')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={isEdit ? 'Add More Photos' : 'Photos *'}>
        {isEdit && property!.images?.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
            {property!.images.map((img, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div
          {...getRootProps()}
          className="rounded-xl p-8 text-center cursor-pointer transition-colors"
          style={{
            border: `2px dashed ${isDragActive ? 'var(--teal)' : 'var(--border)'}`,
            background: isDragActive ? 'rgba(49,178,222,0.05)' : 'var(--bg-alt)',
          }}
        >
          <input {...getInputProps()} />
          <UploadCloud size={24} style={{ color: 'var(--teal)', margin: '0 auto 10px' }} />
          <p className="text-sm" style={{ color: 'var(--text)' }}>Drag & drop images, or click to browse</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>JPG, PNG, WebP, AVIF · up to 10MB each</p>
        </div>

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
      </Section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="btn-primary gap-2">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit for Review'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
      </div>
    </form>
  )
}
