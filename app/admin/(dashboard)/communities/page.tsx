'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Trash2, Pencil, Layers, UploadCloud, Loader2, Star, Sparkles, Search, MapPin,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { LocationSearch } from '@/components/shared/LocationSearch'
import { UAE_EMIRATES } from '@/lib/constants'
import type { GeocodeResult } from '@/lib/distance'
import { communityContentAPI, propertyAPI, uploadAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { HOME_ICON_MAP, HOME_ICON_OPTIONS } from '@/lib/homeIcons'
import type { CommunityContentWithStats } from '@/types'
import toast from 'react-hot-toast'
import { useFormDraft } from '@/lib/useFormDraft'

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

function CommunityContentForm({ community, initialName, onClose, onSaved }: { community: CommunityContentWithStats | null; initialName?: string; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!community
  const [availableAreas, setAvailableAreas] = useState<string[]>([])
  const [heroImage, setHeroImage] = useState(community?.heroImage || '')
  const [heroCredit, setHeroCredit] = useState<{ name: string; url: string; license?: string } | null>(community?.heroImageCredit || null)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [highlights, setHighlights] = useState<string[]>(community?.highlights?.map(h => h.label) || [])
  const [amenities, setAmenities] = useState<{ icon: string; label: string }[]>(community?.amenities || [])
  const [submitting, setSubmitting] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(community?.coordinates)
  const [address, setAddress] = useState(community?.address || '')
  const [aiBusy, setAiBusy] = useState(false)

  const defaults = {
    name: community?.name || initialName || '', area: community?.area || '', emirate: community?.emirate || 'Dubai',
    overview: community?.overview || '', isFeatured: community?.isFeatured || false,
  }
  const { register, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({ defaultValues: defaults })

  // Everything typed or picked is kept as a draft until it's saved (see lib/useFormDraft).
  const draft = useFormDraft({
    key: `community:${community?._id || 'new'}`,
    values: { ...watch(), heroImage, heroCredit, highlights, amenities, coords: coords || null, address },
    onRestore: d => {
      const { heroImage: h, heroCredit: hc, highlights: hl, amenities: am, coords: c, address: ad, ...fields } = d
      reset(fields as any); setHeroImage(h || ''); setHeroCredit(hc || null); setHighlights(hl || []); setAmenities(am || [])
      setCoords(c || undefined); setAddress(ad || '')
    },
  })
  draft.onDiscard(() => {
    reset(defaults); setHeroImage(community?.heroImage || ''); setHeroCredit(community?.heroImageCredit || null); setHighlights(community?.highlights?.map(h => h.label) || [])
    setAmenities(community?.amenities || []); setCoords(community?.coordinates); setAddress(community?.address || '')
  })

  // Step 1 — pick the place on Google Maps: fills the name, emirate, parent area and map pin.
  const onPlace = (r: GeocodeResult) => {
    if (!isEdit) setValue('name', r.name || r.label.split(',')[0].trim(), { shouldValidate: true })
    const emirate = UAE_EMIRATES.find(e => e === r.emirate) || UAE_EMIRATES.find(e => r.label.includes(e))
    if (emirate) setValue('emirate', emirate)
    if (r.area && r.area.toLowerCase() !== (r.name || '').toLowerCase() && !getValues('area')) setValue('area', r.area)
    setCoords({ lat: r.lat, lng: r.lng })
    setAddress(r.label)
  }

  // Step 2 — let the AI write the profile from the name + location.
  const fillWithAI = async () => {
    const name = (isEdit ? community!.name : getValues('name')).trim()
    if (!name) { toast.error('Search the community or type its name first'); return }
    setAiBusy(true)
    try {
      const res = await communityContentAPI.aiFill({ name, area: getValues('area') || undefined, emirate: getValues('emirate'), address: address || undefined, coordinates: coords })
      const d = res.data.data
      if (d.overview) setValue('overview', d.overview)
      if (d.area && !getValues('area')) setValue('area', d.area)
      if (d.emirate) setValue('emirate', d.emirate)
      if (d.highlights?.length) setHighlights(d.highlights.map((h: any) => h.label))
      if (d.amenities?.length) setAmenities(d.amenities)
      toast.success('Details filled — review and save')
    } catch (err: any) {
      toast.error(err?.error || 'AI could not fill the details')
    } finally {
      setAiBusy(false)
    }
  }

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
    accept: { 'image/*': [] },
    maxSize: 15 * 1024 * 1024, multiple: false,
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
      name: data.name, area: data.area || undefined, emirate: data.emirate,
      coordinates: coords, address: address || undefined,
      heroImage: heroImage || undefined,
      heroImageCredit: heroImage && heroCredit ? heroCredit : undefined,
      overview: data.overview,
      highlights: highlights.filter(h => h.trim()).map(label => ({ label })),
      amenities: amenities.filter(a => a.label.trim()),
      isFeatured: !!data.isFeatured,
    }
    try {
      if (isEdit) await communityContentAPI.update(community!._id, payload)
      else await communityContentAPI.create(payload)
      toast.success(isEdit ? 'Updated' : 'Created')
      draft.clear()
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
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{isEdit ? 'Edit' : 'New'} Community Profile</h2>
          <button type="button" onClick={() => draft.guard(onClose)} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {draft.banner}
          {draft.dialog}
          {/* 1. Find it on the map  2. Let AI write it */}
          <div className="rounded-xl p-3.5 space-y-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
            <Field label="1 · Find the community on Google Maps">
              <LocationSearch defaultQuery={community?.name || initialName} onSelect={onPlace} />
              {coords && (
                <p className="text-[11px] mt-1.5 flex items-center gap-1 truncate" style={{ color: 'var(--text-muted)' }}>
                  <MapPin size={11} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                  <span className="truncate">{address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}</span>
                </p>
              )}
            </Field>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>2 · Fill the overview, highlights and nearby amenities automatically</p>
              <button type="button" onClick={fillWithAI} disabled={aiBusy} className="btn-primary btn-sm gap-1.5 flex-shrink-0">
                {aiBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {aiBusy ? 'Writing…' : 'Fill with AI'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Community Name *">
              {isEdit ? <input className="input" disabled value={community!.name} /> : (
                <input className="input" placeholder="e.g. Old Town" {...register('name', { required: true })} />
              )}
            </Field>
            <Field label="Emirate">
              <select className="select-field w-full" {...register('emirate')}>
                {UAE_EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </Field>
            <Field label="Parent Area (optional)">
              <input className="input" list="community-parent-areas" placeholder="e.g. Downtown Dubai" {...register('area')} />
              <datalist id="community-parent-areas">
                {availableAreas.map(a => <option key={a} value={a} />)}
              </datalist>
            </Field>
          </div>
          {errors.name && <p className="text-xs" style={{ color: '#FB7185' }}>Name is required</p>}

          <Field label="Cover Image">
            {heroImage ? (
              <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                <img src={heroImage} alt="" className="w-full h-32 object-cover" />
                {heroCredit && (
                  <span className="absolute bottom-1.5 left-2 text-[10px] text-white px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    Photo: {heroCredit.name}{heroCredit.license ? ` · ${heroCredit.license}` : ''}
                  </span>
                )}
                <button type="button" onClick={() => { setHeroImage(''); setHeroCredit(null) }}
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
            <textarea className="input" rows={4} placeholder="A short narrative about this community — vibe, who it suits, what it's known for…" {...register('overview')} />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>Highlights</label>
              <button type="button" onClick={addHighlight} className="btn-ghost btn-sm gap-1"><Plus size={11} /> Add</button>
            </div>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className="input flex-1" placeholder="e.g. Direct Metro access" value={h} onChange={e => updateHighlight(i, e.target.value)} />
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
                    <input className="input flex-1" placeholder="e.g. Dubai Tram — 5 min walk" value={a.label} onChange={e => updateAmenity(i, { label: e.target.value })} />
                    <button type="button" onClick={() => removeAmenity(i)} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
                  </div>
                )
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-mid)' }}>
            <input type="checkbox" {...register('isFeatured')} />
            Feature this community on the homepage & Communities hub
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

function AdminCommunitiesPageInner() {
  const searchParams = useSearchParams()
  const [communities, setCommunities] = useState<CommunityContentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  // "Add new community" from a listing form opens straight into the new-community form.
  const [editing, setEditing] = useState<CommunityContentWithStats | null | 'new'>(() => (searchParams.get('new') ? 'new' : null))
  const [q, setQ] = useState('')
  const [emirateFilter, setEmirateFilter] = useState('')
  const shown = communities.filter(c =>
    (!emirateFilter || (c.emirate || 'Dubai') === emirateFilter) &&
    (!q.trim() || `${c.name} ${c.area || ''}`.toLowerCase().includes(q.trim().toLowerCase())))

  const load = useCallback(() => {
    setLoading(true)
    communityContentAPI.getAll()
      .then(r => { if (r.data.success) setCommunities(r.data.data || []) })
      .catch(() => toast.error('Failed to load communities'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const remove = async (community: CommunityContentWithStats) => {
    if (!confirm(`Delete the profile for "${community.name}"?`)) return
    try { await communityContentAPI.delete(community._id); toast.success('Deleted'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Communities</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>A separate section from Areas — sub-neighbourhoods and standalone communities</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-2">
          <Plus size={13} /> New Community Profile
        </button>
      </header>

      <div className="p-7">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="input-glass flex items-center gap-2 h-10 px-3 rounded-xl flex-1">
            <Search size={14} style={{ color: 'var(--teal)' }} />
            <input className="bg-transparent flex-1 text-sm outline-none min-w-0" style={{ color: 'var(--text)' }}
              placeholder="Search communities…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="select-field h-10 sm:w-48" value={emirateFilter} onChange={e => setEmirateFilter(e.target.value)}>
            <option value="">All emirates · {communities.length}</option>
            {UAE_EMIRATES.map(e => {
              const n = communities.filter(c => (c.emirate || 'Dubai') === e).length
              return n ? <option key={e} value={e}>{e} · {n}</option> : null
            })}
          </select>
        </div>
        {loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16">
            <Layers size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{communities.length ? 'No communities match your search' : 'No community profiles yet'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shown.map(community => (
              <div key={community._id} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
                  {community.heroImage ? <img src={community.heroImage} alt="" className="w-full h-full object-cover" /> : <Layers size={20} style={{ color: 'var(--teal)', opacity: 0.5 }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    {community.name}
                    {community.isFeatured && <Star size={11} style={{ color: '#F59E0B' }} fill="#F59E0B" />}
                  </p>
                  <p className="text-xs mt-0.5 truncate flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                    <span>{community.emirate || 'Dubai'}</span>
                    {community.area && <span>in {community.area}</span>}
                    <span>{community.count} listing{community.count === 1 ? '' : 's'}</span>
                    {community.avgPrice > 0 && <span>avg {formatPrice(Math.round(community.avgPrice))}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditing(community)} className="btn-ghost btn-sm p-2"><Pencil size={13} /></button>
                  <button onClick={() => remove(community)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <CommunityContentForm
            community={editing === 'new' ? null : editing}
            initialName={editing === 'new' ? searchParams.get('name') || undefined : undefined}
            onClose={() => { setEditing(null); if (searchParams.get('new')) window.history.replaceState(null, '', '/admin/communities') }}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// useSearchParams (the ?new=1 link) needs a Suspense boundary.
export default function AdminCommunitiesPage() {
  return <Suspense fallback={null}><AdminCommunitiesPageInner /></Suspense>
}
