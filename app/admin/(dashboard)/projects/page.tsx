'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Trash2, Pencil, Building2, UploadCloud, Loader2, Star, Eye, QrCode,
  BarChart3, MessageCircleHeart, Share2, MapPinned, LayoutGrid, Map as MapIcon,
} from 'lucide-react'
import { projectAPI, uploadAPI, developerAPI } from '@/lib/api'
import { formatDate, cn, formatPrice } from '@/lib/utils'
import { UAE_EMIRATES, DUBAI_COMMUNITIES } from '@/lib/constants'
import { AMENITIES } from '@/lib/amenities'
import BlockEditor, { Block, htmlToBlocks, blocksToHtml } from '@/components/shared/BlockEditor'
import { PerformanceStats } from '@/components/admin/PerformanceStats'
import type { Project, Developer } from '@/types'
import toast from 'react-hot-toast'

const LANDMARK_CATEGORIES = [
  { value: 'metro',    label: 'Metro Station' },
  { value: 'school',   label: 'School'        },
  { value: 'mall',     label: 'Mall'          },
  { value: 'landmark', label: 'Landmark'      },
  { value: 'airport',  label: 'Airport'       },
]

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
  const [coverImage, setCoverImage] = useState(project?.coverImage || '')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [gallery, setGallery] = useState<string[]>(project?.images?.map(i => i.url) || [])
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [blocks, setBlocks] = useState<Block[]>(() => htmlToBlocks(project?.description || ''))
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

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="w-full h-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{project ? 'Edit' : 'New'} Project</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Main column */}
          <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-4">
            <div>
              <input
                className="input text-lg font-bold" style={{ padding: '12px 14px' }}
                placeholder="e.g. Boulevard Point" {...register('title', { required: true })}
              />
              {errors.title && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Title is required</p>}
            </div>
            <select className="select-field w-full" {...register('developer', { required: true })}>
              <option value="">Select a developer…</option>
              {project?.developer && !developers.some(d => d.name === project.developer) && (
                <option value={project.developer}>{project.developer} (not in Developers list)</option>
              )}
              {developers.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
            </select>
            {errors.developer && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Developer is required</p>}
            <a href="/admin/developers" target="_blank" rel="noopener noreferrer" className="text-xs inline-block" style={{ color: 'var(--teal)' }}>
              + Add a new developer
            </a>

            <BlockEditor blocks={blocks} onChange={setBlocks} />

            <Field label="Gallery Images">
              <div {...galleryDropzone.getRootProps()} className="rounded-xl p-5 text-center cursor-pointer transition-colors"
                style={{ border: `2px dashed ${galleryDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: galleryDropzone.isDragActive ? 'rgba(49,178,222,0.05)' : 'var(--bg-alt)' }}>
                <input {...galleryDropzone.getInputProps()} />
                {uploadingGallery ? <Loader2 size={18} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} /> : (
                  <>
                    <UploadCloud size={18} style={{ color: 'var(--teal)', margin: '0 auto 6px' }} />
                    <p className="text-xs" style={{ color: 'var(--text)' }}>Drag & drop images, or click to browse</p>
                  </>
                )}
              </div>
              {gallery.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                  {gallery.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {/* Amenities */}
            <Field label="Development Amenities">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITIES.map(a => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setAmenities(am => ({ ...am, [a.key]: !am[a.key] }))}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors"
                    style={{
                      background: amenities[a.key] ? 'rgba(49,178,222,0.10)' : 'var(--bg-alt)',
                      border: `1px solid ${amenities[a.key] ? 'var(--teal)' : 'var(--border)'}`,
                      color: amenities[a.key] ? 'var(--teal)' : 'var(--text-mid)',
                    }}
                  >
                    <a.icon size={13} className="flex-shrink-0" />
                    <span className="truncate">{a.label}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* Floor Plans */}
            <Field label="Floor Plans">
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
            </Field>

            {/* Master Plan */}
            <Field label="Master Plan">
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
            </Field>

            {/* Nearby Landmarks */}
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
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Right-click the location on Google Maps and copy the coordinates.
                </p>
              </div>
            </Field>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-80 flex-shrink-0 overflow-y-auto p-5 space-y-4" style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>
            <button type="submit" disabled={submitting || uploadingCover} className="btn-primary w-full justify-center">
              {submitting ? 'Saving…' : project ? 'Save Changes' : 'Create'}
            </button>

            <div className="card p-4 space-y-3">
              <Field label="Cover Image">
                {coverImage ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                    <img src={coverImage} alt="" className="w-full h-32 object-cover" />
                    <button type="button" onClick={() => setCoverImage('')}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div {...coverDropzone.getRootProps()} className="rounded-xl p-5 text-center cursor-pointer transition-colors"
                    style={{ border: `2px dashed ${coverDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: coverDropzone.isDragActive ? 'rgba(49,178,222,0.05)' : 'var(--bg-alt)' }}>
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

              <div className="grid grid-cols-2 gap-3">
                <Field label="Area *">
                  <input className="input" {...register('area', { required: true })} />
                </Field>
                <Field label="Community (optional)">
                  <select className="select-field" {...register('community')}>
                    <option value="">— None —</option>
                    {DUBAI_COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              {errors.area && <p className="text-xs" style={{ color: '#FB7185' }}>Area is required</p>}
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input className="input" {...register('city')} />
                </Field>
                <Field label="Emirate">
                  <select className="select-field" {...register('emirate')}>
                    {UAE_EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude">
                  <input className="input" type="number" step="any" placeholder="25.1972" {...register('lat')} />
                </Field>
                <Field label="Longitude">
                  <input className="input" type="number" step="any" placeholder="55.2744" {...register('lng')} />
                </Field>
              </div>
              <p className="text-[11px] -mt-2" style={{ color: 'var(--text-muted)' }}>
                Optional — enables the map and nearby-distances section on the project page.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price From (AED) *">
                  <input className="input" type="number" {...register('priceFrom', { required: true, min: 1 })} />
                </Field>
                <Field label="Price To (AED)">
                  <input className="input" type="number" {...register('priceTo')} />
                </Field>
              </div>
              {errors.priceFrom && <p className="text-xs" style={{ color: '#FB7185' }}>Starting price is required</p>}

              <Field label="Type">
                <select className="select-field w-full" {...register('type')}>
                  <option value="">Select type</option>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Bedrooms">
                  <input className="input" placeholder="e.g. Studio - 3BR" {...register('bedrooms')} />
                </Field>
                <Field label="Bathrooms">
                  <input className="input" placeholder="e.g. 1 - 3" {...register('bathrooms')} />
                </Field>
              </div>

              <Field label="Floor Area">
                <input className="input" placeholder="e.g. 650 - 1,850 sqft" {...register('sizeRange')} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
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

              <Field label="Status">
                <select className="select-field" {...register('status')}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>

              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-mid)' }}>
                <input type="checkbox" {...register('isFeatured')} />
                Feature on homepage
              </label>
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
