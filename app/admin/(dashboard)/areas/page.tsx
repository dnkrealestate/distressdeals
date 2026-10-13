'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Trash2, Pencil, MapPin, UploadCloud, Loader2, Star, Layers, Sparkles, RefreshCw, ExternalLink, Wand2, AlertCircle,
} from 'lucide-react'
import { areaContentAPI, propertyAPI, uploadAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { HOME_ICON_MAP, HOME_ICON_OPTIONS } from '@/lib/homeIcons'
import type { AreaContentWithStats } from '@/types'
import toast from 'react-hot-toast'
import EntitySeoSection, { seoFromRecord, seoToPayload, seoFromSuggestion } from '@/components/admin/seo/EntitySeoSection'
import type { SeoFields } from '@/components/admin/seo/SeoAppearancePanel'

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Umm Al Quwain', 'Fujairah']

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
  const [sections, setSections] = useState<{ heading: string; body: string }[]>(area?.sections || [])
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>(area?.faqs || [])
  const [seo, setSeo] = useState<SeoFields>(seoFromRecord(area))

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { area: area?.area || '', emirate: area?.emirate || 'Dubai', overview: area?.overview || '', isFeatured: area?.isFeatured || false },
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
      emirate: data.emirate,
      sections: sections.filter(s => s.heading.trim() && s.body.trim()),
      faqs: faqs.filter(f => f.q.trim() && f.a.trim()),
      ...seoToPayload(seo),
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
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{isEdit ? 'Edit' : 'New'} Area Guide</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <Field label="Area *">
            {isEdit ? (
              <input className="input" disabled value={area!.area} />
            ) : (
              <>
                {/* Type any area, or pick one that already has listings — the name must match the one listings use. */}
                <input className="input" list="area-names" placeholder="e.g. Dubai Marina" {...register('area', { required: true })} />
                <datalist id="area-names">{availableAreas.map(a => <option key={a} value={a} />)}</datalist>
              </>
            )}
          </Field>
          {errors.area && <p className="text-xs" style={{ color: '#FB7185' }}>Area is required</p>}

          <Field label="Emirate">
            <select className="select-field w-full" {...register('emirate')}>
              {EMIRATES.map(e => <option key={e}>{e}</option>)}
            </select>
          </Field>

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
            <textarea className="input" rows={5} placeholder="A short narrative about this area — vibe, who it suits, what it's known for…" {...register('overview')} />
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>Guide sections <span style={{ color: 'var(--text-muted)' }}>(each becomes a heading on the page)</span></label>
              <button type="button" onClick={() => setSections(s => [...s, { heading: '', body: '' }])} className="btn-ghost btn-sm gap-1"><Plus size={11} /> Add</button>
            </div>
            <div className="space-y-2">
              {sections.map((s, i) => (
                <div key={i} className="card p-3 space-y-2">
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Heading — e.g. Property types in Dubai Marina" value={s.heading} onChange={e => setSections(x => x.map((y, j) => j === i ? { ...y, heading: e.target.value } : y))} />
                    <button type="button" onClick={() => setSections(x => x.filter((_, j) => j !== i))} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
                  </div>
                  <textarea className="input" rows={4} placeholder="Text for this section" value={s.body} onChange={e => setSections(x => x.map((y, j) => j === i ? { ...y, body: e.target.value } : y))} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>Questions &amp; answers</label>
              <button type="button" onClick={() => setFaqs(f => [...f, { q: '', a: '' }])} className="btn-ghost btn-sm gap-1"><Plus size={11} /> Add</button>
            </div>
            <div className="space-y-2">
              {faqs.map((f, i) => (
                <div key={i} className="card p-3 space-y-2">
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Question" value={f.q} onChange={e => setFaqs(x => x.map((y, j) => j === i ? { ...y, q: e.target.value } : y))} />
                    <button type="button" onClick={() => setFaqs(x => x.filter((_, j) => j !== i))} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
                  </div>
                  <textarea className="input" rows={2} placeholder="Answer" value={f.a} onChange={e => setFaqs(x => x.map((y, j) => j === i ? { ...y, a: e.target.value } : y))} />
                </div>
              ))}
            </div>
          </div>

          <EntitySeoSection
            seo={seo} onSeoChange={setSeo}
            text={`${watch('overview') || ''} ${sections.map(s => s.body).join(' ')}`}
            fallbackTitle={`${watch('area') || 'Area'}: Area Guide & Properties`}
            urlPath={`areas/${(watch('area') || 'new-area').toLowerCase().trim().replace(/\s+/g, '-')}`}
            note="Written automatically from the area’s name, emirate and overview."
            keywordHint="e.g. Dubai Marina properties"
            generate={async () => {
              const v = watch()
              if (!String(v.area || '').trim()) throw { error: 'Enter the area name first' }
              const r = await areaContentAPI.seoSuggest({ area: v.area, emirate: v.emirate, overview: v.overview })
              return seoFromSuggestion(r.data.data)
            }}
          />

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
  const [missing, setMissing] = useState<{ area: string; projects: number; emirate: string; check: { reason: string; at: number } | null }[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const loadMissing = useCallback(() => { areaContentAPI.missing().then(r => r.data.success && setMissing(r.data.data || [])).catch(() => {}) }, [])
  useEffect(() => { loadMissing() }, [loadMissing])

  // Automatic area pages: nearby places from OpenStreetMap + our Explore guides, "About" written from those facts.
  const run = async (key: string, fn: () => Promise<any>, ok: (r: any) => string) => {
    setBusy(key)
    const t = toast.loading('Working — map lookups can take up to a minute…')
    try { const r = await fn(); toast.success(ok(r.data), { id: t }); load(); loadMissing() }
    catch (err: any) { toast.error(err?.error || 'Failed', { id: t }) }
    finally { setBusy(null) }
  }
  const refreshNearby = (a: AreaContentWithStats) => run(`n-${a._id}`, () => areaContentAPI.refreshNearby(a._id), d => `Found ${d.meta?.found ?? 0} nearby places`)
  const rewriteAbout = (a: AreaContentWithStats) => {
    if (!confirm(`Replace the About text, sections, FAQs and highlights of "${a.area}" with a fresh version written from its facts?${a.auto?.created ? '' : ' This area has a hand-written guide — it will be overwritten.'}`)) return
    run(`a-${a._id}`, () => areaContentAPI.rewriteAbout(a._id), d => `About written (${d.meta?.source === 'ai' ? 'AI, from facts' : 'from facts'})`)
  }
  const createPage = (area: string, force = false) => run(`c-${area}`, () => areaContentAPI.autoCreate(area, force), d => d.data?.created ? `Page created: /areas/${d.data.slug}` : (d.data?.reason || 'Done'))

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
        {missing.length > 0 && (
          <div className="card p-4 mb-5" style={{ borderColor: 'rgba(245,158,11,0.4)' }}>
            <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}><AlertCircle size={14} style={{ color: '#D97706' }} /> Project areas without a page ({missing.length})</p>
            <p className="text-xs mt-1 mb-3" style={{ color: 'var(--text-muted)' }}>
              A new area entered on a project gets its page automatically when OpenStreetMap knows it as a district. These were skipped — often a project name typed into the area field (better fixed on the project). If one is a real area, create its page anyway.
            </p>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {missing.map(m => (
                <div key={m.area} className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--bg-alt)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{m.area}</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.emirate} · {m.projects} project{m.projects === 1 ? '' : 's'}{m.check ? ` · ${m.check.reason}` : ''}</span>
                  <span className="flex-1" />
                  <button disabled={!!busy} onClick={() => createPage(m.area)} className="btn-outline btn-sm gap-1 disabled:opacity-50">{busy === `c-${m.area}` ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Check &amp; create</button>
                  <button disabled={!!busy} onClick={() => confirm(`Create a page for "${m.area}" without the district check?`) && createPage(m.area, true)} className="btn-ghost btn-sm disabled:opacity-50">Create anyway</button>
                </div>
              ))}
            </div>
          </div>
        )}
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
                    {area.emirate && <span>{area.emirate}</span>}
                    <span className="flex items-center gap-1"><Layers size={10} /> {area.count} listing{area.count === 1 ? '' : 's'}</span>
                    <span>{area.sections?.length || 0} section{area.sections?.length === 1 ? '' : 's'}</span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {area.nearby?.length || 0} nearby</span>
                    {area.auto?.created && <span className="px-1.5 rounded text-[10px] font-semibold" style={{ background: 'rgba(14,165,233,0.12)', color: '#0369A1' }} title={area.auto.contentEdited ? 'Created automatically, edited by the team' : 'Created automatically'}>Auto{area.auto.contentEdited ? ' · edited' : ''}</span>}
                    {area.avgPrice > 0 && <span>avg {formatPrice(Math.round(area.avgPrice))}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a href={`/areas/${area.slug}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm p-2" title="View page"><ExternalLink size={13} /></a>
                  <button disabled={!!busy} onClick={() => refreshNearby(area)} className="btn-ghost btn-sm p-2 disabled:opacity-50" title="Refresh nearby places (hospitals, schools, metro, malls…)">{busy === `n-${area._id}` ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}</button>
                  <button disabled={!!busy} onClick={() => rewriteAbout(area)} className="btn-ghost btn-sm p-2 disabled:opacity-50" title="Write the About text again from the facts">{busy === `a-${area._id}` ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}</button>
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
