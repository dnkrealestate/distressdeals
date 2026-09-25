'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  UploadCloud, X, ImageIcon, Loader2, QrCode, Crosshair,
  Home, Building2, Tag, KeyRound, Plus, Image as ImagePlaceholder, Video as VideoIcon,
} from 'lucide-react'
import { propertyAPI, projectAPI, uploadAPI } from '@/lib/api'
import { cn, formatPrice } from '@/lib/utils'
import { UAE_EMIRATES } from '@/lib/constants'
import CommunitySelect, { useCommunities, matchCommunity } from './CommunitySelect'
import { reverseGeocode, type GeocodeResult } from '@/lib/distance'
import { LocationSearch } from './LocationSearch'
import StepIndicator from './StepIndicator'
import RichTextEditor from './RichTextEditor'
import AiWriterCard, { type Tone, type Length, type WriterInput } from '@/components/admin/seo/AiWriterCard'
import SeoAppearancePanel, { type SeoFields, includesCI } from '@/components/admin/seo/SeoAppearancePanel'
import type { Property, Project, RentalStatus } from '@/types'
import RentalAvailabilityFields from '@/components/shared/RentalAvailabilityFields'
import { toDateInput, rentalStatusOf } from '@/lib/rental'
import toast from 'react-hot-toast'

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="shimmer rounded-xl" style={{ height: '100%' }} />,
})

// Agent/admin-only — this is where the details a seller doesn't provide
// (title, description, public area, map location, amenities, features,
// photos) get filled in before a listing can be approved and published.
// Sellers never see this form; they only use SellerListingForm.
//
// Laid out as a 4-step wizard (Details / Amenities / Uploads / Description) — Description last so the AI
// writer can draw on everything entered before it. Otherwise mirrors the
// Bayut Profolio "Add Property" flow. All steps stay mounted in the
// DOM (just visually hidden) so react-hook-form keeps every field's value
// across step navigation — only one <form>/onSubmit for the whole wizard.

const RESIDENTIAL_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
]
const COMMERCIAL_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail / Shop' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'commercial_villa', label: 'Commercial Villa' },
  { value: 'plot', label: 'Plot / Land' },
]
const OFF_PLAN_SALE_TYPES = [
  { value: 'primary', label: 'Primary (from Developer)' },
  { value: 'resale', label: 'Resale' },
]
const OWNERSHIP_STATUSES = [
  { value: 'freehold', label: 'Freehold' },
  { value: 'leasehold', label: 'Leasehold' },
]
const VIDEO_PLATFORMS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'dailymotion', label: 'Dailymotion' },
  { value: '3d_view', label: '3D View' },
] as const

type VideoPlatform = typeof VIDEO_PLATFORMS[number]['value']
interface VideoEntry { platform: VideoPlatform; url: string; title?: string }

// Amenity checkboxes, grouped the same way as the Bayut wizard's Amenities
// step. "Floor" and "View" (attribute fields, not booleans) are rendered as
// plain inputs at the top of Miscellaneous instead of being forced into
// this checkbox shape.
const AMENITY_GROUPS: { title: string; items: { key: string; label: string }[] }[] = [
  { title: 'Recreation and Family', items: [
    { key: 'bbqArea', label: 'Barbeque Area' },
    { key: 'dayCareCenter', label: 'Day Care Center' },
    { key: 'childrenPlay', label: 'Kids Play Area' },
    { key: 'lawnOrGarden', label: 'Lawn or Garden' },
    { key: 'cafeteriaCanteen', label: 'Cafeteria or Canteen' },
  ] },
  { title: 'Health and Fitness', items: [
    { key: 'firstAidMedical', label: 'First Aid Medical Center' },
    { key: 'gym', label: 'Gym or Health Club' },
    { key: 'jacuzzi', label: 'Jacuzzi' },
    { key: 'sauna', label: 'Sauna' },
    { key: 'steamRoom', label: 'Steam Room' },
    { key: 'pool', label: 'Swimming Pool' },
    { key: 'facilitiesForDisabled', label: 'Facilities for Disabled' },
  ] },
  { title: 'Laundry and Kitchen', items: [
    { key: 'laundryRoom', label: 'Laundry Room' },
    { key: 'laundryFacility', label: 'Laundry Facility' },
    { key: 'sharedKitchen', label: 'Shared Kitchen' },
  ] },
  { title: 'Building', items: [
    { key: 'balconyOrTerrace', label: 'Balcony or Terrace' },
    { key: 'lobbyInBuilding', label: 'Lobby in Building' },
    { key: 'serviceElevators', label: 'Service Elevators' },
    { key: 'prayerRoom', label: 'Prayer Room' },
    { key: 'receptionRoom', label: 'Reception/Waiting Room' },
    { key: 'elevatorsInBuilding', label: 'Elevators in Building' },
    { key: 'coveredParking', label: 'Covered Parking' },
  ] },
  { title: 'Business and Security', items: [
    { key: 'businessCenter', label: 'Business Center' },
    { key: 'conferenceRoom', label: 'Conference Room' },
    { key: 'security24h', label: 'Security Staff' },
    { key: 'cctvSecurity', label: 'CCTV Security' },
  ] },
  { title: 'Miscellaneous', items: [
    { key: 'freehold', label: 'Freehold' },
    { key: 'atmFacility', label: 'ATM Facility' },
    { key: 'maidRoom', label: 'Maids Room' },
    { key: 'concierge', label: '24 Hours Concierge' },
    { key: 'viewSea', label: 'Sea View' },
    { key: 'viewGolf', label: 'Golf View' },
    { key: 'viewBurjKhalifa', label: 'Burj Khalifa View' },
  ] },
  { title: 'Technology', items: [
    { key: 'broadbandInternet', label: 'Broadband Internet' },
    { key: 'satelliteTV', label: 'Satellite/Cable TV' },
    { key: 'intercom', label: 'Intercom' },
  ] },
  { title: 'Features', items: [
    { key: 'doubleGlazedWindows', label: 'Double Glazed Windows' },
    { key: 'centralAC', label: 'Centrally Air-Conditioned' },
    { key: 'centralHeating', label: 'Central Heating' },
    { key: 'electricityBackup', label: 'Electricity Backup' },
    { key: 'smartHome', label: 'Smart Home' },
    { key: 'storageAreas', label: 'Storage Areas' },
    { key: 'studyRoom', label: 'Study Room' },
    { key: 'builtInWardrobes', label: 'Built-in Wardrobes' },
    { key: 'petsAllowed', label: 'Pets Allowed' },
  ] },
  { title: 'Cleaning and Maintenance', items: [
    { key: 'wasteDisposal', label: 'Waste Disposal' },
    { key: 'maintenanceStaff', label: 'Maintenance Staff' },
    { key: 'cleaningServices', label: 'Cleaning Services' },
  ] },
]

interface FormValues {
  title: string; titleAr?: string; price: number
  developer?: string; projectName?: string; permitNumber?: string
  address: string; district?: string; additionalAddress?: string; unitNo?: string
  area: string; community?: string; city: string; emirate: string; lat: number; lng: number
  bedrooms: number; bathrooms: number; parkingSpaces: number; balconies: number
  floorArea: number; plotArea?: number; floor?: number; totalFloors?: number; yearBuilt?: number
  view?: string; petPolicy?: string; otherRooms?: string; otherFacilities?: string
  nearbySchools?: string; nearbyHospitals?: string; nearbyShoppingMalls?: string
  distanceFromAirport?: number; nearbyPublicTransport?: string; otherNearbyPlaces?: string
  financingInstitutionNames?: string
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
    </div>
  )
}

function CharCount({ value, max }: { value: string; max: number }) {
  return <p className="text-[11px] mt-1 text-right" style={{ color: 'var(--text-muted)' }}>Character count: {value.length}/{max}</p>
}


/* ── Big icon+label option card — Property Category / Purpose ───────── */
function OptionCard({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl border transition-all flex-1"
      style={{
        borderColor: active ? 'var(--teal)' : 'var(--border)',
        background:  active ? 'rgba(203,1,1,0.06)' : 'var(--surface)',
        color:       active ? 'var(--teal)' : 'var(--text-mid)',
        cursor: 'pointer',
      }}
    >
      <Icon size={22} />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  )
}

/* ── Small pill toggle — Furnishing / Off-Plan Sale Type / Ownership ──── */
function ToggleGroup({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value} type="button" onClick={() => onChange(o.value)}
          className="px-4 py-2 rounded-xl text-xs font-medium border transition-all"
          style={{
            borderColor: value === o.value ? 'var(--teal)' : 'var(--border)',
            background:  value === o.value ? 'rgba(203,1,1,0.10)' : 'transparent',
            color:       value === o.value ? 'var(--teal)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function PropertyForm({ property, onSuccess }: { property?: Property; onSuccess: (id: string) => void }) {
  const router = useRouter()
  const isEdit = !!property
  const [step, setStep] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)
  const [newImages, setNewImages] = useState<File[]>([])
  const [features, setFeatures] = useState<Record<string, boolean>>(property?.features || {})
  const [description, setDescription] = useState(property?.description || '')
  const [descriptionAr, setDescriptionAr] = useState(property?.descriptionAr || '')
  const [descriptionError, setDescriptionError] = useState(false)

  const [category, setCategory] = useState<'residential' | 'commercial'>(property?.category === 'commercial' ? 'commercial' : 'residential')
  const [type, setType] = useState<string>(property?.type || 'apartment')
  const [listingType, setListingType] = useState(property?.listingType || 'sale')
  const [rentalStatus, setRentalStatus] = useState<RentalStatus>((property && rentalStatusOf(property)) || 'available_now')
  const [availableFrom, setAvailableFrom] = useState<string>(toDateInput(property?.availableFrom))
  const [availableFromError, setAvailableFromError] = useState(false)
  const [furnishing, setFurnishing] = useState<'unfurnished' | 'furnished'>(property?.furnishing === 'furnished' ? 'furnished' : 'unfurnished')
  const [completion, setCompletion] = useState<string>(property?.completion || 'ready')
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    property?.expectedCompletionDate ? property.expectedCompletionDate.slice(0, 10) : ''
  )
  const [offPlanSaleType, setOffPlanSaleType] = useState<string>(property?.offPlanSaleType || 'primary')
  const [ownershipStatus, setOwnershipStatus] = useState<string>(property?.ownershipStatus || 'freehold')
  const [financingAvailable, setFinancingAvailable] = useState(!!property?.financingAvailable)

  // "Located in: Emirate / Area" confirmation line — set once a location
  // search result has been picked (or pre-filled from the existing listing).
  const [locatedIn, setLocatedIn] = useState(
    property?.location?.area ? `${property.location.emirate || 'Dubai'} / ${property.location.area}` : ''
  )
  // Bumped on every picked search result so the (uncontrolled, ref-based)
  // Area/Lat/Lng inputs below remount with the freshly geocoded values —
  // react-hook-form's setValue() updates its internal state, but these
  // fields render as plain <input {...register()}> with no `value` prop,
  // so nothing tells React to re-paint them; a `key` bump forces it.
  const [locationVersion, setLocationVersion] = useState(0)

  const [seo, setSeo] = useState<SeoFields>({
    metaTitle: property?.metaTitle || '', metaDescription: property?.metaDescription || '',
    focusKeyword: property?.focusKeyword || '', keywords: property?.seoKeywords || [],
  })
  const [tone, setTone] = useState<Tone>('professional')
  const [length, setLength] = useState<Length>('standard')
  const [writeTitle, setWriteTitle] = useState(true)
  const [aiDrafting, setAiDrafting] = useState(false)
  const [permitQrImage, setPermitQrImage] = useState(property?.permitQrImage || '')
  const [uploadingQr, setUploadingQr] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])

  const [uploadTab, setUploadTab] = useState<'images' | 'videos'>('images')
  const [videos, setVideos] = useState<VideoEntry[]>(property?.videos || [])
  const [videoDraft, setVideoDraft] = useState<VideoEntry>({ platform: 'youtube', url: '', title: '' })

  const typeOptions = category === 'residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES
  const changeCategory = (v: 'residential' | 'commercial') => {
    setCategory(v)
    setType((v === 'residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES)[0].value)
  }

  const { register, handleSubmit, getValues, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: property ? {
      title: property.title, titleAr: property.titleAr, price: property.price,
      developer: property.developer, projectName: property.projectName, permitNumber: property.permitNumber,
      address: property.location?.address, district: property.location?.district,
      additionalAddress: property.location?.additionalAddress, unitNo: property.location?.unitNo,
      area: property.location?.area, community: property.location?.community,
      city: property.location?.city || 'Dubai', emirate: property.location?.emirate || 'Dubai',
      lat: property.location?.coordinates?.lat, lng: property.location?.coordinates?.lng,
      bedrooms: property.amenities?.bedrooms, bathrooms: property.amenities?.bathrooms,
      parkingSpaces: property.amenities?.parkingSpaces, balconies: property.amenities?.balconies,
      floorArea: property.amenities?.floorArea, plotArea: property.amenities?.plotArea,
      floor: property.amenities?.floor, totalFloors: property.amenities?.totalFloors,
      yearBuilt: property.amenities?.yearBuilt,
      view: property.amenities?.view, petPolicy: property.amenities?.petPolicy,
      otherRooms: property.amenities?.otherRooms, otherFacilities: property.amenities?.otherFacilities,
      nearbySchools: property.amenities?.nearbySchools, nearbyHospitals: property.amenities?.nearbyHospitals,
      nearbyShoppingMalls: property.amenities?.nearbyShoppingMalls, distanceFromAirport: property.amenities?.distanceFromAirport,
      nearbyPublicTransport: property.amenities?.nearbyPublicTransport, otherNearbyPlaces: property.amenities?.otherNearbyPlaces,
      financingInstitutionNames: property.financingInstitutionNames,
    } : {
      city: 'Dubai', emirate: 'Dubai',
    },
  })

  const builtUpAreaSqft = watch('floorArea') || 0
  const builtUpAreaSqm = (Number(builtUpAreaSqft) * 0.092903).toFixed(2)
  const builtUpAreaSqyd = (Number(builtUpAreaSqft) * 0.111111).toFixed(2)

  const titleValue = watch('title') || ''
  const titleArValue = watch('titleAr') || ''

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

  // A Nominatim result's label reads most-specific-first, comma-separated
  // (e.g. "Downtown Dubai, Dubai, United Arab Emirates") — the first segment
  // is the Area, and whichever UAE_EMIRATES name appears anywhere in the
  // label (if any) becomes the Emirate. Falls back to leaving Emirate as-is
  // when the label doesn't clearly name one (still fills Area + coordinates).
  const communities = useCommunities()

  const onLocationSelect = (r: GeocodeResult) => {
    const area = r.area || r.label.split(',')[0].trim()
    const community = matchCommunity(communities, r.name, r.area)
    if (community && !getValues('community')) setValue('community', community.name, { shouldDirty: true })
    const emirate = UAE_EMIRATES.find(e => r.label.includes(e))
    setValue('area', area, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setValue('address', r.road || r.label, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setValue('lat', r.lat, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setValue('lng', r.lng, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    if (emirate) setValue('emirate', emirate, { shouldDirty: true })
    setLocatedIn(`${emirate || getValues('emirate') || 'Dubai'} / ${area}`)
    setLocationVersion(v => v + 1)
  }

  const onMapPick = async (lat: number, lng: number) => {
    setValue('lat', lat, { shouldDirty: true })
    setValue('lng', lng, { shouldDirty: true })
    setLocationVersion(v => v + 1)
    try {
      const r = await reverseGeocode(lat, lng)
      onLocationSelect(r)
    } catch { /* keep the pin even if the reverse lookup fails */ }
  }

  const [locating, setLocating] = useState(false)
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Your browser doesn't support location"); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const r = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          onLocationSelect(r)
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

  const addVideo = () => {
    if (!videoDraft.url.trim()) { toast.error('Add a video link first'); return }
    setVideos(v => [...v, { ...videoDraft }])
    setVideoDraft({ platform: 'youtube', url: '', title: '' })
  }
  const removeVideo = (i: number) => setVideos(v => v.filter((_, idx) => idx !== i))

  const typeLabel = [...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES].find(t => t.value === type)?.label || type
  const featureLabels = () => Object.entries(features).filter(([, on]) => on)
    .map(([key]) => AMENITY_GROUPS.flatMap(g => g.items).find(f => f.key === key)?.label || key)

  // Everything filled in across the earlier steps, as the AI writer's facts. Unit number and street address are
  // deliberately left out — they never belong in public copy.
  const getFacts = () => {
    const v = getValues()
    const nearby = [
      v.nearbySchools && `Schools: ${v.nearbySchools}`,
      v.nearbyHospitals && `Hospitals: ${v.nearbyHospitals}`,
      v.nearbyShoppingMalls && `Shopping: ${v.nearbyShoppingMalls}`,
      v.nearbyPublicTransport && `Public transport: ${v.nearbyPublicTransport}`,
      v.distanceFromAirport && `Airport: ${v.distanceFromAirport} km away`,
      v.otherNearbyPlaces && `Other: ${v.otherNearbyPlaces}`,
    ].filter(Boolean) as string[]
    const availability = listingType !== 'rent' ? undefined
      : rentalStatus === 'available_now' ? 'available now'
      : rentalStatus === 'occupied' ? `currently tenanted${availableFrom ? `, available from ${availableFrom}` : ''}`
      : availableFrom ? `available from ${availableFrom}` : 'available soon'
    return {
      currentTitle: v.title || undefined,
      category, type: typeLabel, listingType, rentFrequency: property?.rentFrequency,
      price: v.price, furnishing,
      completion, expectedCompletion: completion === 'off_plan' ? expectedCompletionDate || undefined : undefined,
      offPlanSaleType: completion === 'off_plan' ? offPlanSaleType : undefined,
      ownership: ownershipStatus,
      financing: financingAvailable ? `available${v.financingInstitutionNames ? ` via ${v.financingInstitutionNames}` : ''}` : undefined,
      developer: v.developer, projectName: v.projectName,
      area: v.area, community: v.community, city: v.city, emirate: v.emirate,
      bedrooms: v.bedrooms, bathrooms: v.bathrooms, parkingSpaces: v.parkingSpaces, balconies: v.balconies,
      floorArea: v.floorArea, plotArea: v.plotArea, floor: v.floor, totalFloors: v.totalFloors, yearBuilt: v.yearBuilt,
      view: v.view, petPolicy: v.petPolicy, otherRooms: v.otherRooms, otherFacilities: v.otherFacilities,
      nearby, features: featureLabels(), availability,
    }
  }

  // Writes the title (optional), description and SEO fields from the facts above — the agent still reviews and
  // edits before saving; nothing is saved or published by this.
  const generateWithAI = async () => {
    const facts = getFacts()
    const hasCopy = !!description.replace(/<[^>]*>/g, '').trim() || (writeTitle && !!facts.currentTitle)
    if (hasCopy && !confirm(`Replace the current ${writeTitle ? 'title and description' : 'description'} with a new AI draft?`)) return
    setAiDrafting(true)
    try {
      const res = await propertyAPI.aiDescription({ ...facts, focusKeyword: seo.focusKeyword.trim() || undefined, tone, length, writeTitle })
      const d = res.data.data
      setDescription(d.html)
      setDescriptionError(false)
      if (writeTitle && d.title) setValue('title', d.title, { shouldDirty: true, shouldValidate: true })
      setSeo({
        focusKeyword: seo.focusKeyword.trim() || d.focusKeyword || '',
        metaTitle: d.metaTitle || seo.metaTitle,
        metaDescription: d.metaDescription || seo.metaDescription,
        keywords: d.keywords?.length ? d.keywords : seo.keywords,
      })
      toast.success('Draft ready — review it before saving')
    } catch (err: any) {
      toast.error(err?.code === 'ECONNABORTED' ? 'The AI took too long to respond — please try again' : err?.error || 'Could not generate with AI')
    } finally {
      setAiDrafting(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    const plainText = description.replace(/<[^>]*>/g, '').trim()
    if (!plainText) { setDescriptionError(true); setStep(4); toast.error('Add a description (or generate one with AI)'); return }
    setDescriptionError(false)
    if (listingType === 'rent' && rentalStatus !== 'available_now' && !availableFrom) {
      setAvailableFromError(true); setStep(1)
      toast.error('Please choose the date the rental becomes available')
      return
    }
    setAvailableFromError(false)
    setSubmitting(true)
    const payload = {
      title: data.title, titleAr: data.titleAr || undefined,
      description, descriptionAr: descriptionAr || undefined,
      category, type, listingType,
      price: Number(data.price), furnishing, completion,
      ...(listingType === 'rent' && {
        rentalStatus,
        ...(rentalStatus !== 'available_now' && availableFrom && { availableFrom }),
      }),
      ...(completion === 'off_plan' && {
        expectedCompletionDate: expectedCompletionDate || undefined,
        offPlanSaleType,
      }),
      ownershipStatus,
      financingAvailable,
      ...(financingAvailable && { financingInstitutionNames: data.financingInstitutionNames }),
      developer: data.developer, projectName: data.projectName, permitNumber: data.permitNumber, permitQrImage,
      location: {
        address: data.address, district: data.district, additionalAddress: data.additionalAddress, unitNo: data.unitNo,
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
        ...(data.view && { view: data.view }),
        ...(data.petPolicy && { petPolicy: data.petPolicy }),
        ...(data.otherRooms && { otherRooms: data.otherRooms }),
        ...(data.otherFacilities && { otherFacilities: data.otherFacilities }),
        ...(data.nearbySchools && { nearbySchools: data.nearbySchools }),
        ...(data.nearbyHospitals && { nearbyHospitals: data.nearbyHospitals }),
        ...(data.nearbyShoppingMalls && { nearbyShoppingMalls: data.nearbyShoppingMalls }),
        ...(data.distanceFromAirport && { distanceFromAirport: Number(data.distanceFromAirport) }),
        ...(data.nearbyPublicTransport && { nearbyPublicTransport: data.nearbyPublicTransport }),
        ...(data.otherNearbyPlaces && { otherNearbyPlaces: data.otherNearbyPlaces }),
      },
      features,
      videos,
      metaTitle: seo.metaTitle.trim(),
      metaDescription: seo.metaDescription.trim(),
      focusKeyword: seo.focusKeyword.trim(),
      seoKeywords: seo.keywords,
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
        if (newImages.length === 0) { toast.error('Add at least one photo'); setSubmitting(false); setStep(3); return }
        const fd = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (v === undefined) return
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

  const goNext = () => setStep(s => Math.min(s + 1, 4))
  const goPrev = () => setStep(s => Math.max(s - 1, 1))

  // Title is the only required field on the last step; everything else required lives in Details.
  const onInvalid = (errs: Record<string, unknown>) => {
    const onlyTitle = Object.keys(errs).every(k => k === 'title')
    setStep(onlyTitle ? 4 : 1)
    toast.error(onlyTitle ? 'Add a listing title (or generate one with AI)' : 'Fill in the required fields in Details first')
  }

  const aiInputs: WriterInput[] = (() => {
    const v = getValues()
    const featureCount = Object.values(features).filter(Boolean).length
    const nearbyCount = [v.nearbySchools, v.nearbyHospitals, v.nearbyShoppingMalls, v.nearbyPublicTransport, v.distanceFromAirport, v.otherNearbyPlaces].filter(Boolean).length
    return [
      { label: `${typeLabel} for ${listingType}`, ok: true, step: 1 },
      { label: 'Location', ok: !!v.area, step: 1 },
      { label: 'Price', ok: Number(v.price) > 0, step: 1 },
      { label: 'Size', ok: Number(v.floorArea) > 0, step: 1 },
      { label: 'Bedrooms & baths', ok: v.bedrooms !== undefined && String(v.bedrooms) !== '' && !!v.bathrooms, step: 1 },
      { label: 'Developer / project', ok: !!(v.developer || v.projectName), step: 1 },
      { label: 'View', ok: !!v.view, step: 2 },
      { label: featureCount ? `${featureCount} feature${featureCount > 1 ? 's' : ''}` : 'Features', ok: featureCount > 0, step: 2 },
      { label: nearbyCount ? `${nearbyCount} nearby place${nearbyCount > 1 ? 's' : ''}` : 'Nearby places', ok: nearbyCount > 0, step: 2 },
    ]
  })()
  const areaValue = watch('area') || ''
  const autoTitle = `${Number(watch('bedrooms')) ? `${watch('bedrooms')} Bedroom ` : ''}${typeLabel} for ${listingType === 'rent' ? 'Rent' : 'Sale'}${areaValue ? ` in ${areaValue}` : ''}, Dubai`

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault() }}
      className="max-w-3xl"
    >
      <StepIndicator step={step} onJump={setStep} labels={['Details', 'Amenities', 'Uploads', 'Description']} />

      {/* ── Step 1 — Details ─────────────────────────────────────── */}
      <div className={cn('space-y-5', step !== 1 && 'hidden')}>
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-5" style={{ color: 'var(--text)' }}>Type and Purpose</h2>
          <div className="space-y-5">
            <Field label="Property Category *">
              <div className="flex gap-3">
                <OptionCard icon={Home} label="Residential" active={category === 'residential'} onClick={() => changeCategory('residential')} />
                <OptionCard icon={Building2} label="Commercial" active={category === 'commercial'} onClick={() => changeCategory('commercial')} />
              </div>
            </Field>
            <Field label="Sub Category *">
              <select className="select-field" value={type} onChange={e => setType(e.target.value)}>
                {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Furnishing Status">
              <ToggleGroup
                options={[{ value: 'unfurnished', label: 'Unfurnished' }, { value: 'furnished', label: 'Furnished' }]}
                value={furnishing}
                onChange={v => setFurnishing(v as 'unfurnished' | 'furnished')}
              />
            </Field>
            <Field label="Purpose *">
              <div className="flex gap-3">
                <OptionCard icon={Tag} label="For Sale" active={listingType === 'sale'} onClick={() => setListingType('sale')} />
                <OptionCard icon={KeyRound} label="For Rent" active={listingType === 'rent'} onClick={() => setListingType('rent')} />
              </div>
            </Field>
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
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-sm mb-5" style={{ color: 'var(--text)' }}>Location and Address</h2>
          <div className="space-y-4">
            <Field label="Location *">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 min-w-0">
                  <LocationSearch defaultQuery={property?.location?.area} onSelect={onLocationSelect} />
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
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Located in: <strong style={{ color: 'var(--text-mid)' }}>{locatedIn}</strong></p>
              )}
            </Field>

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', height: 260 }}>
              <LocationPickerMap lat={Number(watch('lat')) || undefined} lng={Number(watch('lng')) || undefined} onPick={onMapPick} />
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Tip: click anywhere on the map, or drag the pin, to fine-tune the exact spot.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Location (Area) *" className="col-span-2">
                <input key={`area-${locationVersion}`} className="input" placeholder="e.g. Downtown Dubai" {...register('area', { required: true })} />
                {errors.area && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Location is required</p>}
              </Field>
              <Field label="Community">
                <CommunitySelect key={`community-${locationVersion}`} field={register('community')} value={watch('community')} emirate={watch('emirate')} list={communities} />
              </Field>
              <Field label="Emirate">
                <select key={`emirate-${locationVersion}`} className="select-field" {...register('emirate')}>
                  {UAE_EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Address *" className="md:col-span-2">
                <input key={`address-${locationVersion}`} className="input" placeholder="Building, street" {...register('address', { required: true })} />
                {errors.address && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Address is required</p>}
              </Field>
              <Field label="Unit No.">
                <input className="input" placeholder="e.g. 1204" {...register('unitNo')} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="City">
                <input className="input" {...register('city')} />
              </Field>
              <Field label="District">
                <input className="input" {...register('district')} />
              </Field>
            </div>
            <Field label="Additional Address Details">
              <textarea className="input" rows={2} {...register('additionalAddress')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude *">
                <input key={`lat-${locationVersion}`} className="input" type="number" step="any" placeholder="25.1972" {...register('lat', { required: true })} />
              </Field>
              <Field label="Longitude *">
                <input key={`lng-${locationVersion}`} className="input" type="number" step="any" placeholder="55.2744" {...register('lng', { required: true })} />
              </Field>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tip: right-click the location on Google Maps and copy the coordinates.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <Field label="Completion Status">
                <ToggleGroup
                  options={[{ value: 'ready', label: 'Ready' }, { value: 'off_plan', label: 'Off-Plan' }]}
                  value={completion}
                  onChange={setCompletion}
                />
              </Field>
              {completion === 'off_plan' && (
                <Field label="Off-Plan Sale Type">
                  <select className="select-field" value={offPlanSaleType} onChange={e => setOffPlanSaleType(e.target.value)}>
                    {OFF_PLAN_SALE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              )}
            </div>
            {completion === 'off_plan' && (
              <Field label="Expected Completion Date">
                <input className="input" type="date" value={expectedCompletionDate} onChange={e => setExpectedCompletionDate(e.target.value)} />
              </Field>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-sm mb-5" style={{ color: 'var(--text)' }}>Property Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Reference Number">
                <input className="input" value={property?.referenceId || 'Assigned on save'} disabled style={{ opacity: 0.7 }} />
              </Field>
              <Field label="Permit Number (DLD/Trakheesi)">
                <input className="input" placeholder="e.g. 71466785292" {...register('permitNumber')} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="All Inclusive Price (AED) *">
                <input className="input" type="number" placeholder="0" {...register('price', { required: true, min: 1 })} />
                {(watch('price') || 0) > 0 && (
                  <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--teal)' }}>{formatPrice(Number(watch('price')))}</p>
                )}
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Built-up Area (Square Feet) *">
                <input className="input" type="number" {...register('floorArea', { required: true })} />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{builtUpAreaSqm} Square Meters / {builtUpAreaSqyd} Square Yards</p>
              </Field>
              <Field label="Plot Area (sqft)"><input className="input" type="number" {...register('plotArea')} /></Field>
              <Field label="Bedrooms"><input className="input" type="number" {...register('bedrooms')} /></Field>
              <Field label="Bathrooms"><input className="input" type="number" {...register('bathrooms')} /></Field>
              <Field label="Parking Spaces"><input className="input" type="number" {...register('parkingSpaces')} /></Field>
              <Field label="Balconies"><input className="input" type="number" {...register('balconies')} /></Field>
              <Field label="Floor #"><input className="input" type="number" {...register('floor')} /></Field>
              <Field label="Total Floors"><input className="input" type="number" {...register('totalFloors')} /></Field>
              <Field label="Year Built"><input className="input" type="number" {...register('yearBuilt')} /></Field>
            </div>

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
                  style={{ border: `2px dashed ${qrDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: qrDropzone.isDragActive ? 'rgba(203,1,1,0.05)' : 'var(--bg-alt)' }}>
                  <input {...qrDropzone.getInputProps()} />
                  {uploadingQr ? <Loader2 size={15} className="animate-spin" style={{ color: 'var(--teal)' }} /> : <QrCode size={15} style={{ color: 'var(--teal)' }} />}
                  <span className="text-xs" style={{ color: 'var(--text)' }}>Upload QR image</span>
                </div>
              )}
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Falls back to an auto-generated QR of the number above when left blank.</p>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <Field label="Ownership Status">
                <ToggleGroup options={OWNERSHIP_STATUSES} value={ownershipStatus} onChange={setOwnershipStatus} />
              </Field>
              <Field label="Financing Available">
                <ToggleGroup
                  options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
                  value={financingAvailable ? 'yes' : 'no'}
                  onChange={v => setFinancingAvailable(v === 'yes')}
                />
              </Field>
            </div>
            {financingAvailable && (
              <Field label="Financing Institution Names">
                <input className="input" placeholder="e.g. Emirates NBD, ADCB" {...register('financingInstitutionNames')} />
              </Field>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={goNext} className="btn-primary">Next</button>
        </div>
      </div>

      {/* ── Step 2 — Amenities ───────────────────────────────────── */}
      <div className={cn('space-y-5', step !== 2 && 'hidden')}>
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>Other Main Features</h2>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Free-text details — leave blank if not applicable.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="View"><input className="input" placeholder="e.g. Sea View" {...register('view')} /></Field>
            <Field label="Floor"><input className="input" type="number" {...register('floor')} /></Field>
            <Field label="Pet Policy"><input className="input" {...register('petPolicy')} /></Field>
            <Field label="Other Rooms"><input className="input" {...register('otherRooms')} /></Field>
            <Field label="Other Facilities"><input className="input" {...register('otherFacilities')} /></Field>
            <Field label="Land Area (sqft)"><input className="input" type="number" {...register('plotArea')} /></Field>
            <Field label="Nearby Schools"><input className="input" {...register('nearbySchools')} /></Field>
            <Field label="Nearby Hospitals"><input className="input" {...register('nearbyHospitals')} /></Field>
            <Field label="Nearby Shopping Malls"><input className="input" {...register('nearbyShoppingMalls')} /></Field>
            <Field label="Distance From Airport (kms)"><input className="input" type="number" {...register('distanceFromAirport')} /></Field>
            <Field label="Nearby Public Transport"><input className="input" {...register('nearbyPublicTransport')} /></Field>
            <Field label="Other Nearby Places"><input className="input" {...register('otherNearbyPlaces')} /></Field>
          </div>
        </div>

        {AMENITY_GROUPS.map(group => (
          <div key={group.title} className="card p-6">
            <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>{group.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {group.items.map(f => (
                <button
                  key={f.key} type="button" onClick={() => toggleFeature(f.key)}
                  className={cn('badge cursor-pointer justify-start px-3 py-2 text-xs', features[f.key] ? 'badge-teal' : 'badge-gray')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between">
          <button type="button" onClick={goPrev} className="btn-ghost">Previous</button>
          <button type="button" onClick={goNext} className="btn-primary">Next</button>
        </div>
      </div>

      {/* ── Step 3 — Uploads ─────────────────────────────────────── */}
      <div className={cn('space-y-5', step !== 3 && 'hidden')}>
        <div className="card p-6">
          <div className="flex gap-2 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
            {(['images', 'videos'] as const).map(t => (
              <button
                key={t} type="button" onClick={() => setUploadTab(t)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors"
                style={{ borderColor: uploadTab === t ? 'var(--teal)' : 'transparent', color: uploadTab === t ? 'var(--teal)' : 'var(--text-muted)' }}
              >
                {t === 'images' ? <ImagePlaceholder size={15} /> : <VideoIcon size={15} />}
                {t === 'images' ? 'Images' : 'Videos'}
              </button>
            ))}
          </div>

          {uploadTab === 'images' ? (
            <>
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
                  background: isDragActive ? 'rgba(203,1,1,0.05)' : 'var(--bg-alt)',
                }}
              >
                <input {...getInputProps()} />
                <UploadCloud size={24} style={{ color: 'var(--teal)', margin: '0 auto 10px' }} />
                <p className="text-sm" style={{ color: 'var(--text)' }}>Drag & drop images, or click to browse</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>JPG, PNG, WebP, AVIF · up to 10MB each · multiple allowed</p>
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
            </>
          ) : (
            <>
              {videos.length > 0 && (
                <div className="space-y-2 mb-5">
                  {videos.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-alt)' }}>
                      <VideoIcon size={16} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{v.title || v.url}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{v.platform.replace('_', ' ')}</p>
                      </div>
                      <button type="button" onClick={() => removeVideo(i)} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface)' }}>
                        <X size={12} style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <Field label="Platform">
                  <select
                    className="select-field"
                    value={videoDraft.platform}
                    onChange={e => setVideoDraft(d => ({ ...d, platform: e.target.value as VideoPlatform }))}
                  >
                    {VIDEO_PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </Field>
                <Field label="Video Link" className="md:col-span-2">
                  <input
                    className="input" placeholder="https://…"
                    value={videoDraft.url}
                    onChange={e => setVideoDraft(d => ({ ...d, url: e.target.value }))}
                  />
                </Field>
                <Field label="Video Title">
                  <input
                    className="input" placeholder="Optional"
                    value={videoDraft.title}
                    onChange={e => setVideoDraft(d => ({ ...d, title: e.target.value }))}
                  />
                </Field>
              </div>
              <button type="button" onClick={addVideo} className="btn-outline btn-sm gap-1.5 mt-4">
                <Plus size={13} /> Add Video
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={goPrev} className="btn-ghost">Previous</button>
          <button type="button" onClick={goNext} className="btn-primary">Next</button>
        </div>
      </div>

      {/* ── Step 4 — Title, Description & SEO (last, so the AI can use everything entered before it) ── */}
      <div className={cn('space-y-5', step !== 4 && 'hidden')}>
        <AiWriterCard
          subtitle="Writes the listing title, an SEO-optimised description, search title, meta description and related keywords from what you entered in the earlier steps. It uses only those facts and never mentions the unit number or street address."
          inputs={aiInputs} onJump={setStep}
          focusKeyword={seo.focusKeyword} onFocusKeywordChange={v => setSeo(s => ({ ...s, focusKeyword: v }))}
          keywordPlaceholder={`e.g. ${Number(watch('bedrooms')) ? `${watch('bedrooms')} bedroom ` : ''}${typeLabel.toLowerCase()} for ${listingType} in ${areaValue || 'Dubai Marina'}`}
          tone={tone} onTone={setTone} length={length} onLength={setLength}
          generating={aiDrafting} hasContent={!!description.replace(/<[^>]*>/g, '').trim()} onGenerate={generateWithAI}
          extraOptions={
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-mid)' }}>
              <input type="checkbox" checked={writeTitle} onChange={e => setWriteTitle(e.target.checked)} />
              Also write the listing title
            </label>
          }
        />

        <div className="card p-6">
          <h2 className="font-bold text-sm mb-5" style={{ color: 'var(--text)' }}>Title &amp; Description</h2>
          <div className="space-y-4">
            <Field label="Title *">
              <input className="input" placeholder="e.g. Sky Residences Penthouse — Burj Khalifa View" {...register('title', { required: true })} />
              {errors.title && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Title is required</p>}
              <CharCount value={titleValue} max={150} />
            </Field>
            <Field label="Title (Arabic)">
              <input className="input" dir="rtl" {...register('titleAr')} />
              <CharCount value={titleArValue} max={150} />
            </Field>
            <Field label="Description *">
              <RichTextEditor
                value={description}
                onChange={html => { setDescription(html); if (html.replace(/<[^>]*>/g, '').trim()) setDescriptionError(false) }}
                placeholder={'e.g.\nFully Furnished\nClosed Kitchen\nBalcony\n\nLocated in the heart of Business Bay...'}
              />
              {descriptionError && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Description is required</p>}
            </Field>
            <Field label="Description (Arabic)">
              <textarea className="input" dir="rtl" rows={4} value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} />
              <CharCount value={descriptionAr} max={2000} />
            </Field>
          </div>
        </div>

        <SeoAppearancePanel
          html={description} seo={seo} onSeoChange={setSeo}
          fallbackTitle={autoTitle}
          urlPath={`buyer/properties/${property?.slug || 'your-listing'}`}
          extraChecks={[{ label: 'Keyword in listing title', ok: includesCI(titleValue, seo.focusKeyword.trim()) }]}
        />

        <div className="flex items-center justify-between">
          <button type="button" onClick={goPrev} className="btn-ghost">Previous</button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary gap-2">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
