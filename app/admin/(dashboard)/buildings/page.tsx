'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Trash2, Pencil, Building2, UploadCloud, Loader2, Star,
} from 'lucide-react'
import { buildingContentAPI, propertyAPI, uploadAPI } from '@/lib/api'
import { HOME_ICON_MAP, HOME_ICON_OPTIONS } from '@/lib/homeIcons'
import type { BuildingContent } from '@/types'
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

function BuildingContentForm({ building, onClose, onSaved }: { building: BuildingContent | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!building
  const [availableAreas, setAvailableAreas] = useState<string[]>([])
  const [heroImage, setHeroImage] = useState(building?.heroImage || '')
  const [uploadingHero, setUploadingHero] = useState(false)
  const [amenities, setAmenities] = useState<{ icon: string; label: string }[]>(building?.amenities || [])
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: building?.name || '', area: building?.area || '', community: building?.community || '',
      developer: building?.developer || '', overview: building?.overview || '',
      yearBuilt: building?.yearBuilt || '', totalFloors: building?.totalFloors || '',
      isFeatured: building?.isFeatured || false,
    },
  })

  useEffect(() => {
    propertyAPI.getAllAreas().then(r => { if (r.data.success) setAvailableAreas((r.data.data || []).map((a: any) => a.area)) }).catch(() => {})
  }, [])

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

  const addAmenity = () => setAmenities(a => [...a, { icon: 'Building2', label: '' }])
  const updateAmenity = (i: number, patch: Partial<{ icon: string; label: string }>) =>
    setAmenities(a => a.map((x, idx) => idx === i ? { ...x, ...patch } : x))
  const removeAmenity = (i: number) => setAmenities(a => a.filter((_, idx) => idx !== i))

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    const payload = {
      name: data.name, area: data.area || undefined, community: data.community || undefined,
      developer: data.developer || undefined, heroImage: heroImage || undefined, overview: data.overview,
      yearBuilt: data.yearBuilt || undefined, totalFloors: data.totalFloors || undefined,
      amenities: amenities.filter(a => a.label.trim()),
      isFeatured: !!data.isFeatured,
    }
    try {
      if (isEdit) await buildingContentAPI.update(building!._id, payload)
      else await buildingContentAPI.create(payload)
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
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{isEdit ? 'Edit' : 'New'} Building Profile</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <Field label="Building Name *">
            {isEdit ? <input className="input" disabled value={building!.name} /> : (
              <input className="input" placeholder="e.g. Marina Gate 1" {...register('name', { required: true })} />
            )}
          </Field>
          {errors.name && <p className="text-xs" style={{ color: '#FB7185' }}>Name is required</p>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Area">
              <select className="select-field w-full" {...register('area')}>
                <option value="">— None —</option>
                {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Community">
              <input className="input" placeholder="e.g. Marina Promenade" {...register('community')} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Developer">
              <input className="input" {...register('developer')} />
            </Field>
            <Field label="Year Built">
              <input className="input" type="number" {...register('yearBuilt')} />
            </Field>
            <Field label="Total Floors">
              <input className="input" type="number" {...register('totalFloors')} />
            </Field>
          </div>

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
            <textarea className="input" rows={4} placeholder="A short profile of this building — unit mix, standout amenities, what it's known for…" {...register('overview')} />
          </Field>

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
                    <input className="input flex-1" placeholder="e.g. Infinity pool with marina views" value={a.label} onChange={e => updateAmenity(i, { label: e.target.value })} />
                    <button type="button" onClick={() => removeAmenity(i)} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
                  </div>
                )
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-mid)' }}>
            <input type="checkbox" {...register('isFeatured')} />
            Feature this building on the Buildings hub
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

export default function AdminBuildingsPage() {
  const [buildings, setBuildings] = useState<BuildingContent[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<BuildingContent | null | 'new'>(null)

  const load = useCallback(() => {
    setLoading(true)
    buildingContentAPI.getAll()
      .then(r => { if (r.data.success) setBuildings(r.data.data || []) })
      .catch(() => toast.error('Failed to load buildings'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const remove = async (building: BuildingContent) => {
    if (!confirm(`Delete the profile for "${building.name}"?`)) return
    try { await buildingContentAPI.delete(building._id); toast.success('Deleted'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Buildings</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Building/tower-level info pages — the finest-grained location tier</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-2">
          <Plus size={13} /> New Building Profile
        </button>
      </header>

      <div className="p-7">
        {loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : buildings.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No building profiles yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {buildings.map(building => (
              <div key={building._id} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
                  {building.heroImage ? <img src={building.heroImage} alt="" className="w-full h-full object-cover" /> : <Building2 size={20} style={{ color: 'var(--teal)', opacity: 0.5 }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    {building.name}
                    {building.isFeatured && <Star size={11} style={{ color: '#F59E0B' }} fill="#F59E0B" />}
                  </p>
                  <p className="text-xs mt-0.5 truncate flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                    {building.area && <span>{building.area}</span>}
                    {building.developer && <span>{building.developer}</span>}
                    {building.yearBuilt && <span>Built {building.yearBuilt}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditing(building)} className="btn-ghost btn-sm p-2"><Pencil size={13} /></button>
                  <button onClick={() => remove(building)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <BuildingContentForm
            building={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
