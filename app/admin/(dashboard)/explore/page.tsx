'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Plus, X, Trash2, Pencil, Compass, UploadCloud, Loader2, Star, Search, ExternalLink, EyeOff } from 'lucide-react'
import { placeAPI, uploadAPI } from '@/lib/api'
import { EXPLORE_SECTIONS, EMIRATES, sectionByKey, placeHref } from '@/lib/explore'
import type { Place, PlaceCategory } from '@/types'
import toast from 'react-hot-toast'
import EntitySeoSection, { seoFromRecord, seoToPayload, seoFromSuggestion } from '@/components/admin/seo/EntitySeoSection'
import type { SeoFields } from '@/components/admin/seo/SeoAppearancePanel'

const LocationPickerMap = dynamic(() => import('@/components/shared/LocationPickerMap'), { ssr: false, loading: () => <div className="w-full h-full shimmer" /> })

// UAE Explore manager — every tourist place, restaurant, mall, market, hotel and activity on the site. Search and
// filter the list, then add / edit / hide / delete. Reviews are handled on the Reviews page.

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

const blank = (category: PlaceCategory): any => ({
  name: '', category, subcategory: '', emirate: 'Dubai', area: '', address: '', lat: '', lng: '',
  heroImage: '', creditName: '', creditUrl: '', creditLicense: '', gallery: '',
  summary: '', overview: '', highlights: '', tips: '', faqs: [] as { q: string; a: string }[],
  openingHours: '', phone: '', website: '', priceLevel: '', bestTime: '', duration: '', stars: '', cuisine: '',
  status: 'published', isFeatured: false, slug: '',
})

function PlaceForm({ id, category, onClose, onSaved }: { id: string | null; category: PlaceCategory; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>(blank(category))
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [seo, setSeo] = useState<SeoFields>(seoFromRecord(null))
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<'basics' | 'content' | 'details' | 'seo'>('basics')
  const set = (patch: any) => setF((x: any) => ({ ...x, ...patch }))

  useEffect(() => {
    if (!id) return
    placeAPI.getAdmin(id).then(r => {
      const p: Place = r.data.data
      setF({
        ...blank(p.category), ...p,
        lat: p.coordinates?.lat ?? '', lng: p.coordinates?.lng ?? '',
        creditName: p.heroImageCredit?.name || '', creditUrl: p.heroImageCredit?.url || '', creditLicense: p.heroImageCredit?.license || '',
        gallery: (p.gallery || []).join('\n'), highlights: (p.highlights || []).join('\n'), tips: (p.tips || []).join('\n'),
        faqs: p.faqs || [], stars: p.stars ?? '', slug: p.slug || '',
      })
      setSeo(seoFromRecord(p))
    }).catch(() => toast.error('Could not load this place')).finally(() => setLoading(false))
  }, [id])

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadAPI.image(fd)
      // An uploaded photo is the team's own — drop any earlier photographer credit.
      if (res.data.success) set({ heroImage: res.data.data.url, creditName: '', creditUrl: '', creditLicense: '' })
      else toast.error('Upload failed')
    } catch (err: any) { toast.error(err?.error || 'Failed to upload image') } finally { setUploading(false) }
  }, [])
  const dropzone = useDropzone({ onDrop, accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }, maxSize: 10 * 1024 * 1024, multiple: false })

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name.trim()) { setTab('basics'); return toast.error('Name is required') }
    setSaving(true)
    const payload = {
      name: f.name, category: f.category, subcategory: f.subcategory, emirate: f.emirate, area: f.area, address: f.address,
      coordinates: { lat: f.lat, lng: f.lng },
      heroImage: f.heroImage, heroImageCredit: f.heroImage && (f.creditName || f.creditUrl) ? { name: f.creditName, url: f.creditUrl, license: f.creditLicense } : null,
      gallery: f.gallery, summary: f.summary, overview: f.overview, highlights: f.highlights, tips: f.tips, faqs: f.faqs,
      openingHours: f.openingHours, website: f.website, priceLevel: f.priceLevel, bestTime: f.bestTime, duration: f.duration,
      stars: f.stars, cuisine: f.cuisine, status: f.status, isFeatured: f.isFeatured,
      ...seoToPayload(seo), ...(id && f.slug ? { slug: f.slug } : {}),
    }
    try {
      if (id) await placeAPI.update(id, payload); else await placeAPI.create(payload)
      toast.success(id ? 'Saved' : 'Created')
      onSaved(); onClose()
    } catch (err: any) { toast.error(err?.response?.data?.error || err?.error || 'Failed to save') } finally { setSaving(false) }
  }

  const TABS = [['basics', 'Basics & location'], ['content', 'Guide content'], ['details', 'Visitor details'], ['seo', 'SEO']] as const
  const num = (v: any) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{id ? `Edit ${f.name || 'place'}` : 'New place'}</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>
        <div className="flex gap-1.5 px-6 pt-3 overflow-x-auto scrollbar-hide flex-shrink-0">
          {TABS.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className="px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap"
              style={tab === k ? { background: 'var(--grad)', color: '#fff' } : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>{l}</button>
          ))}
        </div>

        {loading ? <div className="p-16 flex justify-center"><Loader2 className="animate-spin" style={{ color: 'var(--teal)' }} /></div> : (
          <form onSubmit={save} className="flex-1 overflow-y-auto p-6 space-y-4">
            {tab === 'basics' && (
              <>
                <Field label="Name *"><input className="input" value={f.name} onChange={e => set({ name: e.target.value })} placeholder="e.g. Burj Khalifa" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Section *">
                    <select className="select-field w-full" value={f.category} onChange={e => set({ category: e.target.value })}>
                      {EXPLORE_SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Type" hint="Shown as the tag on the card — e.g. Museum, Italian, Water park">
                    <input className="input" value={f.subcategory} onChange={e => set({ subcategory: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Emirate">
                    <select className="select-field w-full" value={f.emirate} onChange={e => set({ emirate: e.target.value })}>
                      {EMIRATES.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </Field>
                  <Field label="Area / district"><input className="input" value={f.area} onChange={e => set({ area: e.target.value })} placeholder="e.g. Downtown Dubai" /></Field>
                </div>
                <Field label="Address"><input className="input" value={f.address} onChange={e => set({ address: e.target.value })} /></Field>
                <Field label="Exact location" hint="Click the map or drag the pin — or type the coordinates.">
                  <div className="h-56 rounded-xl overflow-hidden mb-2" style={{ border: '1px solid var(--border)' }}>
                    <LocationPickerMap key={id || 'new'} lat={num(f.lat)} lng={num(f.lng)} onPick={(lat, lng) => set({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="Latitude" value={f.lat} onChange={e => set({ lat: e.target.value })} />
                    <input className="input" placeholder="Longitude" value={f.lng} onChange={e => set({ lng: e.target.value })} />
                  </div>
                </Field>
                <Field label="Cover photo">
                  {f.heroImage ? (
                    <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                      <img src={f.heroImage} alt="" className="w-full h-40 object-cover" />
                      <button type="button" onClick={() => set({ heroImage: '', creditName: '', creditUrl: '', creditLicense: '' })}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}><X size={13} /></button>
                      {f.creditName && <p className="absolute bottom-0 inset-x-0 text-[10px] px-2 py-1 text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>Photo: {f.creditName}{f.creditLicense ? ` · ${f.creditLicense}` : ''}</p>}
                    </div>
                  ) : (
                    <div {...dropzone.getRootProps()} className="rounded-xl p-5 text-center cursor-pointer"
                      style={{ border: `2px dashed ${dropzone.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: 'var(--bg-alt)' }}>
                      <input {...dropzone.getInputProps()} />
                      {uploading ? <Loader2 size={18} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} /> : (
                        <><UploadCloud size={18} style={{ color: 'var(--teal)', margin: '0 auto 6px' }} /><p className="text-xs" style={{ color: 'var(--text)' }}>Drag & drop, or click to upload</p></>
                      )}
                    </div>
                  )}
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Status">
                    <select className="select-field w-full" value={f.status} onChange={e => set({ status: e.target.value })}>
                      <option value="published">Published — visible on the site</option>
                      <option value="draft">Hidden (draft)</option>
                    </select>
                  </Field>
                  <label className="flex items-center gap-2 text-xs cursor-pointer mt-7" style={{ color: 'var(--text-mid)' }}>
                    <input type="checkbox" checked={!!f.isFeatured} onChange={e => set({ isFeatured: e.target.checked })} /> Featured — shown first
                  </label>
                </div>
              </>
            )}

            {tab === 'content' && (
              <>
                <Field label="Summary" hint="One or two sentences. Shown on cards and used as the search description.">
                  <textarea className="input" rows={2} maxLength={400} value={f.summary} onChange={e => set({ summary: e.target.value })} />
                </Field>
                <Field label="Guide" hint="The main text. Leave a blank line between paragraphs.">
                  <textarea className="input" rows={10} value={f.overview} onChange={e => set({ overview: e.target.value })} />
                </Field>
                <Field label="Highlights" hint="One per line."><textarea className="input" rows={4} value={f.highlights} onChange={e => set({ highlights: e.target.value })} /></Field>
                <Field label="Good to know (tips)" hint="One per line."><textarea className="input" rows={4} value={f.tips} onChange={e => set({ tips: e.target.value })} /></Field>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>Questions & answers</label>
                    <button type="button" onClick={() => set({ faqs: [...f.faqs, { q: '', a: '' }] })} className="btn-ghost btn-sm gap-1"><Plus size={11} /> Add</button>
                  </div>
                  <div className="space-y-2">
                    {f.faqs.map((x: any, i: number) => (
                      <div key={i} className="card p-3 space-y-2">
                        <div className="flex gap-2">
                          <input className="input flex-1" placeholder="Question" value={x.q} onChange={e => set({ faqs: f.faqs.map((y: any, j: number) => j === i ? { ...y, q: e.target.value } : y) })} />
                          <button type="button" onClick={() => set({ faqs: f.faqs.filter((_: any, j: number) => j !== i) })} className="btn-ghost btn-sm p-2"><X size={13} /></button>
                        </div>
                        <textarea className="input" rows={2} placeholder="Answer" value={x.a} onChange={e => set({ faqs: f.faqs.map((y: any, j: number) => j === i ? { ...y, a: e.target.value } : y) })} />
                      </div>
                    ))}
                  </div>
                </div>
                <Field label="More photos" hint="One image address per line."><textarea className="input" rows={3} value={f.gallery} onChange={e => set({ gallery: e.target.value })} /></Field>
              </>
            )}

            {tab === 'details' && (
              <>
                <Field label="Opening hours"><input className="input" value={f.openingHours} onChange={e => set({ openingHours: e.target.value })} placeholder="e.g. Daily 10:00–22:00" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price / entry"><input className="input" value={f.priceLevel} onChange={e => set({ priceLevel: e.target.value })} placeholder="e.g. Free · AED 50–150" /></Field>
                  <Field label="Time needed"><input className="input" value={f.duration} onChange={e => set({ duration: e.target.value })} placeholder="e.g. 2–3 hours" /></Field>
                </div>
                <Field label="Best time to go"><input className="input" value={f.bestTime} onChange={e => set({ bestTime: e.target.value })} placeholder="e.g. Late afternoon, November to March" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Website"><input className="input" value={f.website} onChange={e => set({ website: e.target.value })} placeholder="https://" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cuisine (food)"><input className="input" value={f.cuisine} onChange={e => set({ cuisine: e.target.value })} /></Field>
                  <Field label="Stars (hotels)"><input className="input" type="number" min={1} max={7} value={f.stars} onChange={e => set({ stars: e.target.value })} /></Field>
                </div>
              </>
            )}

            {tab === 'seo' && (
              <>
                {id && (
                  <Field label="Page address" hint="The end of the page’s web address. Changing it breaks links people already shared — only fix real mistakes.">
                    <div className="flex items-center gap-2">
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>/explore/{sectionByKey(f.category)?.path}/</span>
                      <input className="input" value={f.slug} onChange={e => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })} />
                    </div>
                  </Field>
                )}
                <EntitySeoSection
                  seo={seo} onSeoChange={setSeo}
                  text={`${f.summary || ''} ${f.overview || ''}`}
                  fallbackTitle={`${f.name || 'Place'}, ${f.emirate}`}
                  urlPath={`explore/${sectionByKey(f.category)?.path}/${f.slug || 'new-place'}`}
                  note="Written automatically from the place’s name, type, location and summary."
                  keywordHint="e.g. Burj Khalifa"
                  generate={async () => {
                    if (!String(f.name || '').trim()) throw { error: 'Enter the name first' }
                    const r = await placeAPI.seoSuggest({ name: f.name, category: f.category, subcategory: f.subcategory, emirate: f.emirate, area: f.area, summary: f.summary, cuisine: f.cuisine, openingHours: f.openingHours, tips: f.tips })
                    return seoFromSuggestion(r.data.data)
                  }}
                />
              </>
            )}

            <button type="submit" disabled={saving || uploading} className="btn-primary w-full justify-center">{saving ? 'Saving…' : id ? 'Save changes' : 'Create place'}</button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default function AdminExplorePage() {
  const [category, setCategory] = useState<PlaceCategory | ''>('')
  const [emirate, setEmirate] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ data: Place[]; total: number; totalPages: number } | null>(null)
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  const load = useCallback(() => {
    placeAPI.getAllAdmin({ category: category || undefined, emirate: emirate || undefined, status: status || undefined, q: search || undefined, page, limit: 30, sort: search ? 'name' : 'new' })
      .then(r => setData(r.data.data)).catch(() => toast.error('Failed to load places'))
  }, [category, emirate, status, search, page])
  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setTimeout(() => { setSearch(q.trim()); setPage(1) }, 350); return () => clearTimeout(t) }, [q])

  const remove = async (p: Place) => {
    if (!confirm(`Delete "${p.name}"? Its reviews stay in the Reviews list.`)) return
    try { await placeAPI.delete(p._id); toast.success('Deleted'); load() } catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }
  const toggle = async (p: Place, patch: Partial<Place>) => {
    try { await placeAPI.update(p._id, patch); load() } catch { toast.error('Could not update') }
  }

  return (
    <div>
      <header className="flex items-center justify-between gap-3 px-7 py-4 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>UAE Explore</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Tourist places, food, malls, markets, hotels and activities{data ? ` — ${data.total.toLocaleString('en-US')} shown` : ''}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/reviews" className="btn-outline btn-sm gap-2"><Star size={13} /> Reviews</Link>
          <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-2"><Plus size={13} /> New place</button>
        </div>
      </header>

      <div className="p-4 sm:p-7">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-3">
          {[{ key: '', label: 'All sections' }, ...EXPLORE_SECTIONS].map((s: any) => (
            <button key={s.key} onClick={() => { setCategory(s.key); setPage(1) }} className="flex-shrink-0 px-3.5 h-9 rounded-full text-xs font-semibold whitespace-nowrap"
              style={category === s.key ? { background: 'var(--grad)', color: '#fff' } : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>{s.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <label className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input pl-9" placeholder="Search name, area or type…" value={q} onChange={e => setQ(e.target.value)} />
          </label>
          <select className="select-field" style={{ width: 'auto' }} value={emirate} onChange={e => { setEmirate(e.target.value); setPage(1) }}>
            <option value="">All emirates</option>{EMIRATES.map(e => <option key={e}>{e}</option>)}
          </select>
          <select className="select-field" style={{ width: 'auto' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Any status</option><option value="published">Published</option><option value="draft">Hidden</option>
          </select>
        </div>

        {!data ? (
          <div className="space-y-3">{Array(5).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : data.data.length === 0 ? (
          <div className="text-center py-16">
            <Compass size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No places match</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.data.map(p => {
              const s = sectionByKey(p.category)
              const Icon = s?.icon || Compass
              return (
                <div key={p._id} className="card p-3.5 flex items-center gap-4" style={p.status === 'draft' ? { opacity: 0.6 } : undefined}>
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
                    {p.heroImage ? <img src={p.heroImage} alt="" loading="lazy" className="w-full h-full object-cover" /> : <Icon size={20} style={{ color: 'var(--teal)', opacity: 0.5 }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                      {p.name}
                      {p.isFeatured && <Star size={11} style={{ color: '#F59E0B' }} fill="#F59E0B" />}
                      {p.status === 'draft' && <span className="badge badge-gray text-[10px]">Hidden</span>}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {[s?.label, p.subcategory, [p.area, p.emirate].filter(Boolean).join(', '), p.ratingCount ? `★ ${p.ratingAvg.toFixed(1)} (${p.ratingCount})` : '', !p.coordinates?.lat ? 'no map position' : '', !p.heroImage ? 'no photo' : ''].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button title={p.isFeatured ? 'Remove from featured' : 'Feature'} onClick={() => toggle(p, { isFeatured: !p.isFeatured })} className="btn-ghost btn-sm p-2"><Star size={13} fill={p.isFeatured ? '#F59E0B' : 'none'} style={p.isFeatured ? { color: '#F59E0B' } : undefined} /></button>
                    <button title={p.status === 'draft' ? 'Publish' : 'Hide'} onClick={() => toggle(p, { status: p.status === 'draft' ? 'published' : 'draft' })} className="btn-ghost btn-sm p-2"><EyeOff size={13} /></button>
                    {p.status === 'published' && <a title="Open on the site" href={placeHref(p)} target="_blank" rel="noreferrer" className="btn-ghost btn-sm p-2"><ExternalLink size={13} /></a>}
                    <button title="Edit" onClick={() => setEditing(p._id)} className="btn-ghost btn-sm p-2"><Pencil size={13} /></button>
                    <button title="Delete" onClick={() => remove(p)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm">Previous</button>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} of {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm">Next</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && <PlaceForm id={editing === 'new' ? null : editing} category={category || 'attraction'} onClose={() => setEditing(null)} onSaved={load} />}
      </AnimatePresence>
    </div>
  )
}
