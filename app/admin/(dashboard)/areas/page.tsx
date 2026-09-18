'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Trash2, Pencil, MapPin, UploadCloud, Loader2, Star, Layers,
} from 'lucide-react'
import { areaContentAPI, propertyAPI, uploadAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { HOME_ICON_MAP, HOME_ICON_OPTIONS } from '@/lib/homeIcons'
import type { AreaContentWithStats } from '@/types'
import toast from 'react-hot-toast'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
    </div>
  )
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="select-field" value={value} onChange={e => onChange(e.target.value)}>
      {HOME_ICON_OPTIONS.map(name => <option key={name} value={name}>{name}</option>)}
    </select>
  )
}

// ══════════════════════════ Form ══════════════════════════

function AreaContentForm({ area, onClose, onSaved }: { area: AreaContentWithStats | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!area
  const [availableAreas, setAvailableAreas] = useState<string[]>([])
  const [heroImage, setHeroImage] = useState(area?.heroImage || '')
  const [uploadingHero, setUploadingHero] = useState(false)
  const [highlights, setHighlights] = useState<string[]>(area?.highlights?.map(h => h.label) || [])
  const [amenities, setAmenities] = useState<{ icon: string; label: string }[]>(area?.amenities || [])
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { area: area?.area || '', overview: area?.overview || '', isFeatured: area?.isFeatured || false },
  })

  useEffect(() => {
    if (!isEdit) {
      propertyAPI.getAllAreas().then(r => { if (r.data.success) setAvailableAreas((r.data.data || []).map((a: any) => a.area)) }).catch(() => {})
    }
  }, [isEdit])

  const onDropHero = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploadingHero(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadAPI.image(fd)
      if (res.data.success) setHeroImage(res.data.data.url)
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload image')
    } finally {
      setUploadingHero(false)
    }
  }, [])
  const heroDropzone = useDropzone({
    onDrop: onDropHero,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024, multiple: false,
  })

  const addHighlight = () => setHighlights(h => [...h, ''])
  const updateHighlight = (i: number, v: string) => setHighlights(h => h.map((x, idx) => idx === i ? v : x))
  const removeHighlight = (i: number) => setHighlights(h => h.filter((_, idx) => idx !== i))

  const addAmenity = () => setAmenities(a => [...a, { icon: 'MapPin', label: '' }])
  const updateAmenity = (i: number, patch: Partial<{ icon: string; label: string }>) =>
    setAmenities(a => a.map((x, idx) => idx === i ? { ...x, ...patch } : x))
  const removeAmenity = (i: number) => setAmenities(a => a.filter((_, idx) => idx !== i))

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    const payload = {
      area: data.area,
      heroImage: heroImage || undefined,
      overview: data.overview,
      highlights: highlights.filter(h => h.trim()).map(label => ({ label })),
      amenities: amenities.filter(a => a.label.trim()),
      isFeatured: !!data.isFeatured,
    }
    try {
      if (isEdit) await areaContentAPI.update(area!._id, payload)
      else await areaContentAPI.create(payload)
      toast.success(isEdit ? 'Updated' : 'Created')
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
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{isEdit ? 'Edit' : 'New'} Area Profile</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <Field label="Area *">
            {isEdit ? (
              <input className="input" disabled value={area!.area} />
            ) : (
              <select className="select-field w-full" {...register('area', { required: true })}>
                <option value="">Select an area…</option>
                {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
          </Field>
          {errors.area && <p className="text-xs" style={{ color: '#FB7185' }}>Area is required</p>}

          <Field label="Hero Image">
            {heroImage ? (
              <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                <img src={heroImage} alt="" className="w-full h-32 object-cover" />
                <button type="button" onClick={() => setHeroImage('')}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div {...heroDropzone.getRootProps()} className="rounded-xl p-5 text-center cursor-pointer transition-colors"
                style={{ border: `2px dashed ${heroDropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: heroDropzone.isDragActive ? 'rgba(203,1,1,0.05)' : 'var(--bg-alt)' }}>
                <input {...heroDropzone.getInputProps()} />
                {uploadingHero ? <Loader2 size={18} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} /> : (
                  <>
                    <UploadCloud size={18} style={{ color: 'var(--teal)', margin: '0 auto 6px' }} />
                    <p className="text-xs" style={{ color: 'var(--text)' }}>Drag & drop, or click</p>
                  </>
                )}
              </div>
            )}
          </Field>

          <Field label="Overview">
            <textarea className="input" rows={4} placeholder="A short narrative about this area — vibe, who it suits, what it's known for…" {...register('overview')} />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>Highlights</label>
              <button type="button" onClick={addHighlight} className="btn-ghost btn-sm gap-1"><Plus size={11} /> Add</button>
            </div>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className="input flex-1" placeholder="e.g. 5 minutes to Downtown Dubai" value={h} onChange={e => updateHighlight(i, e.target.value)} />
                  <button type="button" onClick={() => removeHighlight(i)} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>Amenities</label>
              <button type="button" onClick={addAmenity} className="btn-ghost btn-sm gap-1"><Plus size={11} /> Add</button>
            </div>
            <div className="space-y-2">
              {amenities.map((a, i) => {
                const Icon = HOME_ICON_MAP[a.icon]
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                      {Icon && <Icon size={16} style={{ color: 'var(--teal)' }} />}
                    </div>
                    <div className="w-36 flex-shrink-0"><IconPicker value={a.icon} onChange={v => updateAmenity(i, { icon: v })} /></div>
                    <input className="input flex-1" placeholder="e.g. Dubai Metro — 3 min walk" value={a.label} onChange={e => updateAmenity(i, { label: e.target.value })} />
                    <button type="button" onClick={() => removeAmenity(i)} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
                  </div>
                )
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-mid)' }}>
            <input type="checkbox" {...register('isFeatured')} />
            Feature this area on the Areas hub
          </label>

          <button type="submit" disabled={submitting || uploadingHero} className="btn-primary w-full justify-center">
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ══════════════════════════ Page ══════════════════════════

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<AreaContentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AreaContentWithStats | null | 'new'>(null)

  const load = useCallback(() => {
    setLoading(true)
    areaContentAPI.getAll()
      .then(r => { if (r.data.success) setAreas(r.data.data || []) })
      .catch(() => toast.error('Failed to load areas'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const remove = async (area: AreaContentWithStats) => {
    if (!confirm(`Delete the profile for "${area.area}"? The area itself keeps working from live listing data — this only removes the extra content.`)) return
    try { await areaContentAPI.delete(area._id); toast.success('Deleted'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Areas & Communities</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Insights copy shown on each area's public page, on top of live listing stats</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-2">
          <Plus size={13} /> New Area Profile
        </button>
      </header>

      <div className="p-7">
        {loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : areas.length === 0 ? (
          <div className="text-center py-16">
            <MapPin size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No area profiles yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {areas.map(area => (
              <div key={area._id} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
                  {area.heroImage ? <img src={area.heroImage} alt="" className="w-full h-full object-cover" /> : <MapPin size={20} style={{ color: 'var(--teal)', opacity: 0.5 }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    {area.area}
                    {area.isFeatured && <Star size={11} style={{ color: '#F59E0B' }} fill="#F59E0B" />}
                  </p>
                  <p className="text-xs mt-0.5 truncate flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Layers size={10} /> {area.count} listing{area.count === 1 ? '' : 's'}</span>
                    {area.avgPrice > 0 && <span>avg {formatPrice(Math.round(area.avgPrice))}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditing(area)} className="btn-ghost btn-sm p-2"><Pencil size={13} /></button>
                  <button onClick={() => remove(area)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <AreaContentForm
            area={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
