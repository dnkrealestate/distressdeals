'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Trash2, Pencil, Building2, UploadCloud, Loader2, Star, Eye, QrCode,
  BarChart3, MessageCircleHeart, Share2, Map as MapIcon, Crosshair, ChevronLeft, ChevronRight, GripVertical,
  Image as ImagePlaceholder, Video as VideoIcon, LayoutGrid as MasterPlanIcon,
} from 'lucide-react'
import { projectAPI, uploadAPI, developerAPI } from '@/lib/api'
import { formatDate, cn, formatPrice } from '@/lib/utils'
import { UAE_EMIRATES, DUBAI_COMMUNITIES } from '@/lib/constants'
import { AMENITY_META, AMENITY_GROUPS } from '@/lib/amenities'
import { reverseGeocode, type GeocodeResult } from '@/lib/distance'
import { LocationSearch } from '@/components/shared/LocationSearch'
import StepIndicator from '@/components/shared/StepIndicator'
import { Block, htmlToBlocks, blocksToHtml } from '@/components/shared/BlockEditor'
import ProjectDescriptionStep, { type ProjectSeo, type ProjectFacts } from '@/components/admin/ProjectDescriptionStep'
import { PerformanceStats } from '@/components/admin/PerformanceStats'
import type { Project, Developer } from '@/types'
import toast from 'react-hot-toast'

const LocationPickerMap = dynamic(() => import('@/components/shared/LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="shimmer rounded-xl" style={{ height: '100%' }} />,
})

const LANDMARK_CATEGORIES = [
  { value: 'metro',    label: 'Metro Station' },
  { value: 'school',   label: 'School'        },
  { value: 'mall',     label: 'Mall'          },
  { value: 'landmark', label: 'Landmark'      },
  { value: 'airport',  label: 'Airport'       },
]

const VIDEO_PLATFORMS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'dailymotion', label: 'Dailymotion' },
  { value: '3d_view', label: '3D View' },
] as const

type VideoPlatform = typeof VIDEO_PLATFORMS[number]['value']
interface VideoEntry { platform: VideoPlatform; url: string; title?: string }

interface FloorPlanEntry { label: string; image: string; bedrooms: string; size: string; price: string }
interface LandmarkEntry { name: string; category: string; lat: string; lng: string }

function PerformanceModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [analytics, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectAPI.getAnalytics(project._id)
      .then(r => { if (r.data.success) setAnalyticsData(r.data.data) })
      .catch(() => toast.error('Failed to load performance data'))
      .finally(() => setLoading(false))
  }, [project._id])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="card w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Performance</h3>
            <p className="text-xs truncate max-w-[280px]" style={{ color: 'var(--text-muted)' }}>{project.title}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <PerformanceStats
          loading={loading}
          stats={[
            { label: 'Views',      value: analytics?.stats?.views || 0, icon: Eye },
            { label: 'Interested', value: analytics?.stats?.leads || 0, icon: MessageCircleHeart },
            { label: 'Shares',     value: analytics?.stats?.shares || 0, icon: Share2 },
          ]}
          conversionRate={analytics?.conversionRate}
          topCountries={analytics?.topCountries}
        />
      </motion.div>
    </motion.div>
  )
}

const STATUS_OPTIONS = [
  { value: 'upcoming',            label: 'Upcoming' },
  { value: 'under_construction',  label: 'Under Construction' },
  { value: 'ready',               label: 'Ready' },
  { value: 'sold_out',            label: 'Sold Out' },
]

const TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa',     label: 'Villa'     },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio',    label: 'Studio'    },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
    </div>
  )
}

// ══════════════════════════ Form ══════════════════════════

function ProjectForm({ project, onClose, onSaved }: { project: Project | null; onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState<number>(1)
  const [uploadTab, setUploadTab] = useState<'images' | 'floorplans' | 'masterplan' | 'videos'>('images')

  const [coverImage, setCoverImage] = useState(project?.coverImage || '')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [gallery, setGallery] = useState<string[]>(project?.images?.map(i => i.url) || [])
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [blocks, setBlocks] = useState<Block[]>(() => htmlToBlocks(project?.description || ''))
  const [seo, setSeo] = useState<ProjectSeo>({
    metaTitle: project?.metaTitle || '', metaDescription: project?.metaDescription || '', focusKeyword: project?.focusKeyword || '',
    keywords: project?.seoKeywords || [],
  })
  const [submitting, setSubmitting] = useState(false)
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [permitQrImage, setPermitQrImage] = useState(project?.permitQrImage || '')
  const [uploadingQr, setUploadingQr] = useState(false)

  const [amenities, setAmenities] = useState<Record<string, boolean>>(project?.amenities || {})
  const [floorPlans, setFloorPlans] = useState<FloorPlanEntry[]>(
    (project?.floorPlans || []).map(f => ({ label: f.label, image: f.image, bedrooms: f.bedrooms || '', size: f.size || '', price: f.price ? String(f.price) : '' }))
  )
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState<number | null>(null)
  const [masterPlanImage, setMasterPlanImage] = useState(project?.masterPlan?.image || '')
  const [masterPlanDescription, setMasterPlanDescription] = useState(project?.masterPlan?.description || '')
  const [uploadingMasterPlan, setUploadingMasterPlan] = useState(false)
  const [landmarks, setLandmarks] = useState<LandmarkEntry[]>(
    (project?.landmarks || []).map(l => ({ name: l.name, category: l.category, lat: String(l.lat), lng: String(l.lng) }))
  )
  const [videos, setVideos] = useState<VideoEntry[]>(project?.videos || [])
  const [videoDraft, setVideoDraft] = useState<VideoEntry>({ platform: 'youtube', url: '', title: '' })

  // "Located in: Emirate / Area" line + a remount-key bump — mirrors the
  // same fix used on the Property wizard: react-hook-form's setValue()
  // updates its internal state, but Area/Emirate/Lat/Lng render as plain
  // <input {...register()}> with no `value` prop, so nothing tells React
  // to repaint them; bumping `key` forces a remount that picks up the fresh value.
  const [locatedIn, setLocatedIn] = useState(
    project?.area ? `${project.emirate || 'Dubai'} / ${project.area}` : ''
  )
  const [locationVersion, setLocationVersion] = useState(0)

  useEffect(() => {
    developerAPI.getAll().then(r => {
      if (r.data.success) {
        setDevelopers(r.data.data || [])
        // The <select>'s options don't exist until this list loads — a plain
        // register()'d value set before then never gets re-applied once they
        // do, which is why the field looked "reset" and re-triggered the
        // required-field error on every edit. Force it back in once the
        // matching <option> actually exists.
        if (project?.developer) setValue('developer', project.developer)
      }
    }).catch(() => {})
  }, [project?.developer])

  const uploadSingleImage = async (file: File): Promise<string | null> => {
    const fd = new FormData(); fd.append('image', file)
    const res = await uploadAPI.image(fd)
    return res.data.success ? res.data.data.url : null
  }

  const onDropFloorPlanImage = async (index: number, accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploadingFloorPlan(index)
    try {
      const url = await uploadSingleImage(file)
      if (url) setFloorPlans(fp => fp.map((f, i) => i === index ? { ...f, image: url } : f))
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload floor plan image')
    } finally {
      setUploadingFloorPlan(null)
    }
  }

  const onDropMasterPlan = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploadingMasterPlan(true)
    try {
      const url = await uploadSingleImage(file)
      if (url) setMasterPlanImage(url)
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload master plan image')
    } finally {
      setUploadingMasterPlan(false)
    }
  }, [])
  const masterPlanDropzone = useDropzone({
    onDrop: onDropMasterPlan,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024, multiple: false,
  })

  const addFloorPlan = () => setFloorPlans(fp => [...fp, { label: '', image: '', bedrooms: '', size: '', price: '' }])
  const removeFloorPlan = (i: number) => setFloorPlans(fp => fp.filter((_, idx) => idx !== i))
  const updateFloorPlan = (i: number, patch: Partial<FloorPlanEntry>) => setFloorPlans(fp => fp.map((f, idx) => idx === i ? { ...f, ...patch } : f))

  const addLandmark = () => setLandmarks(l => [...l, { name: '', category: 'metro', lat: '', lng: '' }])
  const removeLandmark = (i: number) => setLandmarks(l => l.filter((_, idx) => idx !== i))
  const updateLandmark = (i: number, patch: Partial<LandmarkEntry>) => setLandmarks(l => l.map((x, idx) => idx === i ? { ...x, ...patch } : x))

  const addVideo = () => {
    if (!videoDraft.url.trim()) { toast.error('Add a video link first'); return }
    setVideos(v => [...v, { ...videoDraft }])
    setVideoDraft({ platform: 'youtube', url: '', title: '' })
  }
  const removeVideo = (i: number) => setVideos(v => v.filter((_, idx) => idx !== i))

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

  const { register, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm({
    defaultValues: {
      title:           project?.title || '',
      developer:       project?.developer || '',
      area:            project?.area || '',
      community:       project?.community || '',
      city:            project?.city || 'Dubai',
      emirate:         project?.emirate || 'Dubai',
      priceFrom:       project?.priceFrom || '',
      priceTo:         project?.priceTo || '',
      type:            project?.type || '',
      bedrooms:        project?.bedrooms || '',
      bathrooms:       project?.bathrooms || '',
      sizeRange:       project?.sizeRange || '',
      handoverQuarter: project?.handoverQuarter || '',
      handoverYear:    project?.handoverYear || '',
      paymentPlan:     project?.paymentPlan || '',
      permitNumber:    project?.permitNumber || '',
      status:          project?.status || 'upcoming',
      isFeatured:      project?.isFeatured || false,
      lat:             project?.coordinates?.lat ?? '',
      lng:             project?.coordinates?.lng ?? '',
    },
  })

  // Google picks carry area/emirate directly; OpenStreetMap ones are parsed from the label, as in the Property wizard.
  const onLocationSelect = (r: GeocodeResult) => {
    const area = r.area || r.label.split(',')[0].trim()
    const emirate = UAE_EMIRATES.find(e => e === r.emirate) || UAE_EMIRATES.find(e => r.label.includes(e))
    setValue('area', area, { shouldDirty: true, shouldValidate: true })
    setValue('lat', r.lat as any, { shouldDirty: true })
    setValue('lng', r.lng as any, { shouldDirty: true })
    if (emirate) setValue('emirate', emirate, { shouldDirty: true })
    setLocatedIn(`${emirate || getValues('emirate') || 'Dubai'} / ${area}`)
    setLocationVersion(v => v + 1)
  }

  const onMapPick = async (lat: number, lng: number) => {
    setValue('lat', lat as any, { shouldDirty: true })
    setValue('lng', lng as any, { shouldDirty: true })
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
          setValue('lat', pos.coords.latitude as any, { shouldDirty: true })
          setValue('lng', pos.coords.longitude as any, { shouldDirty: true })
          setLocationVersion(v => v + 1)
        } finally {
          setLocating(false)
        }
      },
      () => { toast.error('Could not get your location — check permissions'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const onDropCover = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadAPI.image(fd)
      if (res.data.success) setCoverImage(res.data.data.url)
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload image')
    } finally {
      setUploadingCover(false)
    }
  }, [])
  const coverDropzone = useDropzone({
    onDrop: onDropCover,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [], 'image/avif': [] },
    maxSize: 10 * 1024 * 1024, multiple: false,
  })

  const onDropGallery = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) return
    setUploadingGallery(true)
    try {
      const uploaded: string[] = []
      for (const file of accepted) {
        const fd = new FormData(); fd.append('image', file)
        const res = await uploadAPI.image(fd)
        if (res.data.success) uploaded.push(res.data.data.url)
      }
      setGallery(prev => [...prev, ...uploaded])
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload one or more images')
    } finally {
      setUploadingGallery(false)
    }
  }, [])
  const galleryDropzone = useDropzone({
    onDrop: onDropGallery,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [], 'image/avif': [] },
    maxSize: 10 * 1024 * 1024, multiple: true,
  })

  const removeGalleryImage = (i: number) => setGallery(g => g.filter((_, idx) => idx !== i))
  // Gallery order is the order visitors see on the project page — drag a thumbnail, or use its arrows, to move it.
  const moveGalleryImage = (from: number, to: number) => setGallery(g => {
    if (to < 0 || to >= g.length || from === to) return g
    const next = [...g]; const [item] = next.splice(from, 1); next.splice(to, 0, item)
    return next
  })
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    const payload: any = {
      title: data.title, developer: data.developer,
      description: blocksToHtml(blocks),
      coverImage, images: gallery.map(url => ({ url })),
      area: data.area, community: data.community || undefined, city: data.city, emirate: data.emirate,
      priceFrom: Number(data.priceFrom), priceTo: data.priceTo !== '' ? Number(data.priceTo) : undefined,
      type: data.type || undefined,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms || undefined,
      sizeRange: data.sizeRange || undefined,
      handoverQuarter: data.handoverQuarter || undefined,
      handoverYear: data.handoverYear ? Number(data.handoverYear) : undefined,
      paymentPlan: data.paymentPlan || undefined,
      permitNumber: data.permitNumber || undefined,
      permitQrImage: permitQrImage || undefined,
      status: data.status,
      isFeatured: !!data.isFeatured,
      coordinates: (data.lat !== '' && data.lng !== '') ? { lat: Number(data.lat), lng: Number(data.lng) } : undefined,
      amenities,
      floorPlans: floorPlans
        .filter(f => f.label && f.image)
        .map(f => ({ label: f.label, image: f.image, bedrooms: f.bedrooms || undefined, size: f.size || undefined, price: f.price !== '' ? Number(f.price) : undefined })),
      masterPlan: masterPlanImage ? { image: masterPlanImage, description: masterPlanDescription || undefined } : undefined,
      landmarks: landmarks
        .filter(l => l.name && l.lat !== '' && l.lng !== '')
        .map(l => ({ name: l.name, category: l.category, lat: Number(l.lat), lng: Number(l.lng) })),
      videos,
      metaTitle: seo.metaTitle.trim(),
      metaDescription: seo.metaDescription.trim(),
      focusKeyword: seo.focusKeyword.trim(),
      seoKeywords: seo.keywords,
    }

    try {
      if (project) await projectAPI.update(project._id, payload)
      else await projectAPI.create(payload)
      toast.success(project ? 'Updated' : 'Created')
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const goNext = () => setStep(s => Math.min(s + 1, 4))
  const goPrev = () => setStep(s => Math.max(s - 1, 1))

  // Required fields all live in step 1 — if any are missing when saving from the last step, take the admin there.
  const onInvalid = () => { setStep(1); toast.error('Fill in the required fields in Details first') }

  // The form's current values, in words, for the AI description writer.
  const getFacts = (): ProjectFacts => {
    const v = getValues()
    const category = (c: string) => LANDMARK_CATEGORIES.find(x => x.value === c)?.label || c
    return {
      title: v.title || '', developer: v.developer || undefined,
      type: TYPE_OPTIONS.find(t => t.value === v.type)?.label || v.type || undefined,
      status: v.status || undefined,
      area: v.area || undefined, community: v.community || undefined, city: v.city || undefined, emirate: v.emirate || undefined,
      priceFrom: Number(v.priceFrom) || undefined, priceTo: Number(v.priceTo) || undefined,
      bedrooms: v.bedrooms || undefined, bathrooms: v.bathrooms || undefined, sizeRange: v.sizeRange || undefined,
      handoverQuarter: v.handoverQuarter || undefined, handoverYear: v.handoverYear ? String(v.handoverYear) : undefined,
      paymentPlan: v.paymentPlan || undefined,
      amenities: Object.keys(amenities).filter(k => amenities[k]).map(k => AMENITY_META[k]?.label || k),
      landmarks: landmarks.filter(l => l.name.trim()).map(l => `${l.name.trim()} (${category(l.category)})`),
      floorPlans: floorPlans.filter(f => f.label.trim()).map(f =>
        [f.label.trim(), f.bedrooms, f.size, f.price && `from AED ${Number(f.price).toLocaleString('en-US')}`].filter(Boolean).join(', ')),
      masterPlanNotes: masterPlanDescription.trim() || undefined,
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="w-full h-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{project ? 'Edit' : 'New'} Project</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault() }}
          className="flex-1 min-h-0 overflow-y-auto p-6"
        >
          <StepIndicator step={step} onJump={setStep} labels={['Details', 'Amenities', 'Uploads', 'Description']} />

          {/* ── Step 1 — Details ─────────────────────────────────── */}
          <div className={cn('space-y-5', step !== 1 && 'hidden')}>
            <div className="card p-6">
              <h3 className="font-bold text-sm mb-5" style={{ color: 'var(--text)' }}>Project Basics</h3>
              <div className="space-y-4">
                <div>
                  <input
                    className="input text-lg font-bold" style={{ padding: '12px 14px' }}
                    placeholder="e.g. Boulevard Point" {...register('title', { required: true })}
                  />
                  {errors.title && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Title is required</p>}
                </div>
                <Field label="Developer *">
                  <select className="select-field w-full" {...register('developer', { required: true })}>
                    <option value="">Select a developer…</option>
                    {project?.developer && !developers.some(d => d.name === project.developer) && (
                      <option value={project.developer}>{project.developer} (not in Developers list)</option>
                    )}
                    {developers.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                  </select>
                  {errors.developer && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Developer is required</p>}
                  <a href="/admin/developers" target="_blank" rel="noopener noreferrer" className="text-xs inline-block mt-1.5" style={{ color: 'var(--teal)' }}>
                    + Add a new developer
                  </a>
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Type">
                    <select className="select-field w-full" {...register('type')}>
                      <option value="">Select type</option>
                      {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select className="select-field" {...register('status')}>
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Handover Quarter">
                    <input className="input" placeholder="e.g. Q4" {...register('handoverQuarter')} />
                  </Field>
                  <Field label="Handover Year">
                    <input className="input" type="number" placeholder="e.g. 2027" {...register('handoverYear')} />
                  </Field>
                </div>
                <Field label="Payment Plan">
                  <input className="input" placeholder="e.g. 60/40 Post-Handover" {...register('paymentPlan')} />
                </Field>
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-mid)' }}>
                  <input type="checkbox" {...register('isFeatured')} />
                  Feature on homepage
                </label>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-sm mb-5" style={{ color: 'var(--text)' }}>Location and Address</h3>
              <div className="space-y-4">
                <Field label="Location *">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 min-w-0">
                      <LocationSearch defaultQuery={project?.area} onSelect={onLocationSelect} />
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

                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', height: 240 }}>
                  <LocationPickerMap
                    lat={Number(getValues('lat')) || undefined}
                    lng={Number(getValues('lng')) || undefined}
                    onPick={onMapPick}
                  />
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Tip: click anywhere on the map, or drag the pin, to fine-tune the exact spot.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Area *">
                    <input key={`area-${locationVersion}`} className="input" {...register('area', { required: true })} />
                    {errors.area && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Area is required</p>}
                  </Field>
                  <Field label="Community">
                    <select className="select-field" {...register('community')}>
                      <option value="">— None —</option>
                      {DUBAI_COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="City">
                    <input className="input" {...register('city')} />
                  </Field>
                  <Field label="Emirate">
                    <select key={`emirate-${locationVersion}`} className="select-field" {...register('emirate')}>
                      {UAE_EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitude">
                    <input key={`lat-${locationVersion}`} className="input" type="number" step="any" placeholder="25.1972" {...register('lat')} />
                  </Field>
                  <Field label="Longitude">
                    <input key={`lng-${locationVersion}`} className="input" type="number" step="any" placeholder="55.2744" {...register('lng')} />
                  </Field>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Optional — enables the map and nearby-distances section on the project page.
                </p>

                <div className="pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <Field label="Nearby Landmarks (for distance calculations on the project page)">
                    <div className="space-y-2">
                      {landmarks.map((lm, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <select
                            className="select-field text-xs w-32 flex-shrink-0"
                            value={lm.category} onChange={e => updateLandmark(i, { category: e.target.value })}
                          >
                            {LANDMARK_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                          <input
                            className="input text-xs flex-1" placeholder="Name, e.g. Business Bay Metro Station"
                            value={lm.name} onChange={e => updateLandmark(i, { name: e.target.value })}
                          />
                          <input
                            className="input text-xs w-24" type="number" step="any" placeholder="Lat"
                            value={lm.lat} onChange={e => updateLandmark(i, { lat: e.target.value })}
                          />
                          <input
                            className="input text-xs w-24" type="number" step="any" placeholder="Lng"
                            value={lm.lng} onChange={e => updateLandmark(i, { lng: e.target.value })}
                          />
                          <button type="button" onClick={() => removeLandmark(i)} className="btn-ghost btn-sm p-1.5 flex-shrink-0" style={{ color: '#FB7185' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addLandmark} className="btn-outline btn-sm gap-1.5">
                        <Plus size={13} /> Add Landmark
                      </button>
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-sm mb-5" style={{ color: 'var(--text)' }}>Project Details</h3>
              <div className="space-y-4">
                <Field label="Reference Number">
                  <input className="input" value={project?.referenceId || 'Assigned on save'} disabled style={{ opacity: 0.7 }} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Price From (AED) *">
                    <input className="input" type="number" {...register('priceFrom', { required: true, min: 1 })} />
                    {Number(watch('priceFrom') || 0) > 0 && (
                      <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--teal)' }}>{formatPrice(Number(watch('priceFrom')))}</p>
                    )}
                  </Field>
                  <Field label="Price To (AED)">
                    <input className="input" type="number" {...register('priceTo')} />
                    {Number(watch('priceTo') || 0) > 0 && (
                      <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--teal)' }}>{formatPrice(Number(watch('priceTo')))}</p>
                    )}
                  </Field>
                </div>
                {errors.priceFrom && <p className="text-xs" style={{ color: '#FB7185' }}>Starting price is required</p>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Bedrooms">
                    <input className="input" placeholder="e.g. Studio - 3BR" {...register('bedrooms')} />
                  </Field>
                  <Field label="Bathrooms">
                    <input className="input" placeholder="e.g. 1 - 3" {...register('bathrooms')} />
                  </Field>
                  <Field label="Floor Area">
                    <input className="input" placeholder="e.g. 650 - 1,850 sqft" {...register('sizeRange')} />
                  </Field>
                </div>
                <Field label="DLD Permit Number">
                  <input className="input" {...register('permitNumber')} />
                </Field>
                <Field label="DLD Permit QR Code (optional — the real QR from the permit certificate)">
                  {permitQrImage ? (
                    <div className="relative inline-flex">
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
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Falls back to an auto-generated QR of the number above when left blank.
                  </p>
                </Field>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={goNext} className="btn-primary">Next</button>
            </div>
          </div>

          {/* ── Step 2 — Amenities ───────────────────────────────── */}
          <div className={cn('space-y-5', step !== 2 && 'hidden')}>
            {AMENITY_GROUPS.map(group => (
              <div key={group.title} className="card p-6">
                <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>{group.title}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.keys.map(key => {
                    const meta = AMENITY_META[key]
                    if (!meta) return null
                    const Icon = meta.icon
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAmenities(am => ({ ...am, [key]: !am[key] }))}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors"
                        style={{
                          background: amenities[key] ? 'rgba(203,1,1,0.10)' : 'var(--bg-alt)',
                          border: `1px solid ${amenities[key] ? 'var(--teal)' : 'var(--border)'}`,
                          color: amenities[key] ? 'var(--teal)' : 'var(--text-mid)',
                        }}
                      >
                        <Icon size={13} className="flex-shrink-0" />
                        <span className="truncate">{meta.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <button type="button" onClick={goPrev} className="btn-ghost">Previous</button>
              <button type="button" onClick={goNext} className="btn-primary">Next</button>
            </div>
          </div>

          {/* ── Step 3 — Uploads ─────────────────────────────────── */}
          <div className={cn('space-y-5', step !== 3 && 'hidden')}>
            <div className="card p-6">
              <div className="flex gap-2 mb-5 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
                {([
                  { v: 'images', l: 'Images', icon: ImagePlaceholder },
                  { v: 'floorplans', l: 'Floor Plans', icon: UploadCloud },
                  { v: 'masterplan', l: 'Master Plan', icon: MasterPlanIcon },
                  { v: 'videos', l: 'Videos', icon: VideoIcon },
                ] as const).map(t => (
                  <button
                    key={t.v} type="button" onClick={() => setUploadTab(t.v)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors"
                    style={{ borderColor: uploadTab === t.v ? 'var(--teal)' : 'transparent', color: uploadTab === t.v ? 'var(--teal)' : 'var(--text-muted)' }}
                  >
                    <t.icon size={15} />
                    {t.l}
                  </button>
                ))}
              </div>

              {uploadTab === 'images' && (
                <div className="space-y-5">
                  <Field label="Cover Image">
                    {coverImage ? (
                      <div className="relative rounded-xl overflow-hidden max-w-sm" style={{ background: 'var(--bg-alt)' }}>
                        <img src={coverImage} alt="" className="w-full h-40 object-cover" />
                        <button type="button" onClick={() => setCoverImage('')}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div {...coverDropzone.getRootProps()} className="rounded-xl p-6 text-center cursor-pointer transition-colors max-w-sm"
                        style={{ border: `2px dashed ${coverDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: coverDropzone.isDragActive ? 'rgba(203,1,1,0.05)' : 'var(--bg-alt)' }}>
                        <input {...coverDropzone.getInputProps()} />
                        {uploadingCover ? <Loader2 size={18} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} /> : (
                          <>
                            <UploadCloud size={18} style={{ color: 'var(--teal)', margin: '0 auto 6px' }} />
                            <p className="text-xs" style={{ color: 'var(--text)' }}>Drag & drop, or click</p>
                          </>
                        )}
                      </div>
                    )}
                  </Field>

                  <Field label="Gallery Images">
                    <div {...galleryDropzone.getRootProps()} className="rounded-xl p-5 text-center cursor-pointer transition-colors"
                      style={{ border: `2px dashed ${galleryDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: galleryDropzone.isDragActive ? 'rgba(203,1,1,0.05)' : 'var(--bg-alt)' }}>
                      <input {...galleryDropzone.getInputProps()} />
                      {uploadingGallery ? <Loader2 size={18} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} /> : (
                        <>
                          <UploadCloud size={18} style={{ color: 'var(--teal)', margin: '0 auto 6px' }} />
                          <p className="text-xs" style={{ color: 'var(--text)' }}>Drag & drop images, or click to browse — multiple allowed</p>
                        </>
                      )}
                    </div>
                    {gallery.length > 0 && (
                      <>
                        <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
                          Drag the photos (or use the arrows) to set the order they appear in on the project page.
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                          {gallery.map((url, i) => (
                            <div
                              key={url}
                              draggable
                              onDragStart={e => { setDragFrom(i); e.dataTransfer.effectAllowed = 'move' }}
                              onDragOver={e => { e.preventDefault(); if (dragOver !== i) setDragOver(i) }}
                              onDragLeave={() => setDragOver(o => (o === i ? null : o))}
                              onDrop={e => { e.preventDefault(); if (dragFrom !== null) moveGalleryImage(dragFrom, i); setDragFrom(null); setDragOver(null) }}
                              onDragEnd={() => { setDragFrom(null); setDragOver(null) }}
                              className="group relative aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all"
                              style={{
                                background: 'var(--bg-alt)',
                                opacity: dragFrom === i ? 0.4 : 1,
                                outline: dragOver === i && dragFrom !== i ? '2px solid var(--teal)' : 'none',
                                outlineOffset: 2,
                              }}
                            >
                              <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                              <span className="absolute top-1 left-1 min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                                {i + 1}
                              </span>
                              <button type="button" onClick={() => removeGalleryImage(i)} title="Remove"
                                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                                <X size={11} />
                              </button>
                              <div className="absolute bottom-0 inset-x-0 flex items-center justify-between p-1" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.55))' }}>
                                <button type="button" onClick={() => moveGalleryImage(i, i - 1)} disabled={i === 0} title="Move earlier"
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white disabled:opacity-30" style={{ background: 'rgba(0,0,0,0.5)' }}>
                                  <ChevronLeft size={13} />
                                </button>
                                <GripVertical size={13} className="text-white opacity-70" />
                                <button type="button" onClick={() => moveGalleryImage(i, i + 1)} disabled={i === gallery.length - 1} title="Move later"
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white disabled:opacity-30" style={{ background: 'rgba(0,0,0,0.5)' }}>
                                  <ChevronRight size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </Field>
                </div>
              )}

              {uploadTab === 'floorplans' && (
                <div className="space-y-3">
                  {floorPlans.map((fp, i) => (
                    <div key={i} className="p-3 rounded-xl space-y-2" style={{ border: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
                      <div className="flex items-start gap-3">
                        <label className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer flex items-center justify-center"
                          style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
                          <input
                            type="file" accept="image/*" className="hidden"
                            onChange={e => e.target.files?.[0] && onDropFloorPlanImage(i, [e.target.files[0]])}
                          />
                          {uploadingFloorPlan === i ? (
                            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--teal)' }} />
                          ) : fp.image ? (
                            <img src={fp.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <UploadCloud size={16} style={{ color: 'var(--teal)' }} />
                          )}
                        </label>
                        <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                          <input
                            className="input text-xs col-span-2" placeholder="Label, e.g. 1 Bedroom"
                            value={fp.label} onChange={e => updateFloorPlan(i, { label: e.target.value })}
                          />
                          <input
                            className="input text-xs" placeholder="Bedrooms, e.g. 1BR"
                            value={fp.bedrooms} onChange={e => updateFloorPlan(i, { bedrooms: e.target.value })}
                          />
                          <input
                            className="input text-xs" placeholder="Size, e.g. 750 sqft"
                            value={fp.size} onChange={e => updateFloorPlan(i, { size: e.target.value })}
                          />
                          <input
                            className="input text-xs col-span-2" type="number" placeholder="Price (AED, optional)"
                            value={fp.price} onChange={e => updateFloorPlan(i, { price: e.target.value })}
                          />
                        </div>
                        <button type="button" onClick={() => removeFloorPlan(i)} className="btn-ghost btn-sm p-1.5 flex-shrink-0" style={{ color: '#FB7185' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addFloorPlan} className="btn-outline btn-sm gap-1.5">
                    <Plus size={13} /> Add Floor Plan
                  </button>
                </div>
              )}

              {uploadTab === 'masterplan' && (
                <div className="flex items-start gap-3">
                  <div {...masterPlanDropzone.getRootProps()} className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer flex items-center justify-center"
                    style={{ background: 'var(--bg-alt)', border: `1px dashed ${masterPlanDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}` }}>
                    <input {...masterPlanDropzone.getInputProps()} />
                    {uploadingMasterPlan ? (
                      <Loader2 size={18} className="animate-spin" style={{ color: 'var(--teal)' }} />
                    ) : masterPlanImage ? (
                      <>
                        <img src={masterPlanImage} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={e => { e.stopPropagation(); setMasterPlanImage('') }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                          <X size={11} />
                        </button>
                      </>
                    ) : (
                      <UploadCloud size={18} style={{ color: 'var(--teal)' }} />
                    )}
                  </div>
                  <textarea
                    className="input text-xs flex-1" rows={4}
                    placeholder="Master plan description — layout highlights, phasing, facilities…"
                    value={masterPlanDescription} onChange={e => setMasterPlanDescription(e.target.value)}
                  />
                </div>
              )}

              {uploadTab === 'videos' && (
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
                    <Field label="Video Link">
                      <div className="md:col-span-2">
                        <input
                          className="input" placeholder="https://…"
                          value={videoDraft.url}
                          onChange={e => setVideoDraft(d => ({ ...d, url: e.target.value }))}
                        />
                      </div>
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

          {/* ── Step 4 — Description (last, so the AI can use everything entered before it) ── */}
          <div className={cn('space-y-5', step !== 4 && 'hidden')}>
            <ProjectDescriptionStep
              blocks={blocks} onBlocksChange={setBlocks}
              seo={seo} onSeoChange={setSeo}
              getFacts={getFacts} slug={project?.slug} onJump={setStep}
            />

            <div className="flex items-center justify-between">
              <button type="button" onClick={goPrev} className="btn-ghost">Previous</button>
              <button type="submit" disabled={submitting || uploadingCover} className="btn-primary">
                {submitting ? 'Saving…' : project ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ══════════════════════════ Page ══════════════════════════

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Project | null | 'new'>(null)
  const [perfProject, setPerfProject] = useState<Project | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    projectAPI.getAll({ limit: 100 })
      .then(r => { if (r.data.success) setProjects(r.data.data.data || []) })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const remove = async (project: Project) => {
    if (!confirm(`Delete "${project.title}"?`)) return
    try { await projectAPI.delete(project._id); toast.success('Deleted'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Projects</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Off-plan & new development listings</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-2">
          <Plus size={13} /> New Project
        </button>
      </header>

      <div className="p-7">
        {loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No projects yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(project => (
              <div key={project._id} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                  {project.coverImage && <img src={project.coverImage} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    {project.title}
                    {project.isFeatured && <Star size={11} style={{ color: '#F59E0B' }} fill="#F59E0B" />}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {project.referenceId && <span className="font-mono">{project.referenceId} · </span>}
                    {project.developer} · {project.area} · from {formatPrice(project.priceFrom)}
                    {' · '}<Eye size={10} className="inline" /> {project.views}
                  </p>
                </div>
                <span className="badge badge-gray capitalize">{project.status.replace('_', ' ')}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setPerfProject(project)} className="btn-ghost btn-sm p-2" title="Performance"><BarChart3 size={13} /></button>
                  <button onClick={() => setEditing(project)} className="btn-ghost btn-sm p-2"><Pencil size={13} /></button>
                  <button onClick={() => remove(project)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <ProjectForm
            project={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={load}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {perfProject && <PerformanceModal project={perfProject} onClose={() => setPerfProject(null)} />}
      </AnimatePresence>
    </div>
  )
}
