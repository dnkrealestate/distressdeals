'use client'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Pencil, Trash2, Megaphone, Loader2, UploadCloud, Pause, Play, BarChart3, ExternalLink, Eye, MousePointerClick, Percent,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adAPI, uploadAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Ad, AdPlacement } from '@/types'

// Two artworks per ad: the tall one fills side columns on desktop, the wide one sits inside lists and on phones.
const SIZES = {
  imageTall: { label: 'Sidebar banner', size: '300 × 600', ratio: 0.5, aspect: '1 / 2', hint: 'Shown in the right-hand column on desktop' },
  imageWide: { label: 'Wide banner', size: '1200 × 300', ratio: 4, aspect: '4 / 1', hint: 'Shown inside the list and on phones' },
} as const
type ImageKey = keyof typeof SIZES

const PLACEMENTS: { v: AdPlacement; l: string; hint: string }[] = [
  { v: 'listings', l: 'Listing pages', hint: 'Buy, Rent and New Projects' },
  { v: 'details', l: 'Detail pages', hint: 'Every property and project page' },
]

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  running:   { bg: 'rgba(22,163,74,0.12)',  fg: '#16A34A', label: 'Running' },
  scheduled: { bg: 'rgba(37,99,235,0.12)',  fg: '#2563EB', label: 'Scheduled' },
  paused:    { bg: 'rgba(100,116,139,0.14)', fg: '#64748B', label: 'Paused' },
  ended:     { bg: 'rgba(225,29,72,0.10)',  fg: '#E11D48', label: 'Ended' },
}

const toDateInput = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '')
const n = (v: number) => v.toLocaleString()

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

// ── Image upload for one artwork ──
function ArtworkUpload({ which, value, onChange }: { which: ImageKey; value: string; onChange: (url: string) => void }) {
  const spec = SIZES[which]
  const [busy, setBusy] = useState(false)
  const [warn, setWarn] = useState('')

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    // Check the proportions before uploading — a square image would be cropped badly in a 1:2 or 4:1 frame.
    const dims = await new Promise<{ w: number; h: number } | null>(resolve => {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(file)
    })
    setWarn(dims && Math.abs(dims.w / dims.h - spec.ratio) / spec.ratio > 0.15
      ? `This image is ${dims.w} × ${dims.h} — best at ${spec.size}, or it will be cropped.` : '')
    setBusy(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadAPI.image(fd)
      onChange(res.data.data.url)
    } catch (err: any) {
      toast.error(err?.error || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }, [onChange, spec])
  const dz = useDropzone({ onDrop, accept: { 'image/*': [] }, maxSize: 10 * 1024 * 1024, multiple: false })

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>{spec.label} <span style={{ color: 'var(--text-muted)' }}>· {spec.size}</span></label>
        {value && <button type="button" onClick={() => { onChange(''); setWarn('') }} className="text-[11px] hover:underline" style={{ color: '#E11D48' }}>Remove</button>}
      </div>
      <div {...dz.getRootProps()} className="relative rounded-xl overflow-hidden cursor-pointer transition-colors"
        style={{ aspectRatio: spec.aspect, maxHeight: which === 'imageTall' ? 300 : undefined, margin: which === 'imageTall' ? '0 auto' : undefined,
          border: `2px dashed ${dz.isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: 'var(--bg-alt)' }}>
        <input {...dz.getInputProps()} />
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
            {busy ? <Loader2 size={18} className="animate-spin" style={{ color: 'var(--teal)' }} /> : (
              <>
                <UploadCloud size={18} style={{ color: 'var(--teal)' }} className="mb-1" />
                <p className="text-[11px]" style={{ color: 'var(--text)' }}>Drop or click</p>
              </>
            )}
          </div>
        )}
        {busy && value && <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}><Loader2 size={18} className="animate-spin text-white" /></div>}
      </div>
      <p className="text-[11px] mt-1" style={{ color: warn ? '#D97706' : 'var(--text-muted)' }}>{warn || spec.hint}</p>
    </div>
  )
}

// ── Create / edit ──
function AdForm({ ad, onClose, onSaved }: { ad: Ad | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    title: ad?.title || '', advertiser: ad?.advertiser || '', targetUrl: ad?.targetUrl || '',
    imageTall: ad?.imageTall || '', imageWide: ad?.imageWide || '',
    placements: (ad?.placements || ['listings', 'details']) as AdPlacement[],
    startsAt: toDateInput(ad?.startsAt), endsAt: toDateInput(ad?.endsAt),
    priority: ad?.priority ?? 0, isActive: ad?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(p => ({ ...p, [k]: v }))
  const setTall = useCallback((u: string) => set('imageTall', u), [])
  const setWide = useCallback((u: string) => set('imageWide', u), [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.imageTall && !f.imageWide) { toast.error('Upload at least one banner image'); return }
    if (!f.placements.length) { toast.error('Choose where the ad shows'); return }
    setSaving(true)
    const payload = {
      ...f,
      startsAt: f.startsAt ? new Date(`${f.startsAt}T00:00:00`).toISOString() : null,
      endsAt: f.endsAt ? new Date(`${f.endsAt}T23:59:59`).toISOString() : null,
    }
    try {
      if (ad) await adAPI.update(ad._id, payload)
      else await adAPI.create(payload)
      toast.success(ad ? 'Ad updated' : 'Ad created')
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save the ad')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{ad ? 'Edit' : 'New'} Ad</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>

        <form onSubmit={save} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ad title *" hint="For your reference and the image's alt text">
              <input className="input" required value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Emaar Beachfront launch" />
            </Field>
            <Field label="Advertiser">
              <input className="input" value={f.advertiser} onChange={e => set('advertiser', e.target.value)} placeholder="e.g. Emaar Properties" />
            </Field>
          </div>
          <Field label="Page link *" hint="Where a click goes — a full link (https://…) or a page on this site (/projects/…). Clicks are counted, then redirected.">
            <input className="input" required value={f.targetUrl} onChange={e => set('targetUrl', e.target.value)} placeholder="https://… or /projects/…" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-start">
            <ArtworkUpload which="imageTall" value={f.imageTall} onChange={setTall} />
            <ArtworkUpload which="imageWide" value={f.imageWide} onChange={setWide} />
          </div>
          <p className="text-[11px] -mt-2" style={{ color: 'var(--text-muted)' }}>
            Upload both for the best result — if only one is uploaded it's used everywhere (cropped to fit). Images are stored as WebP.
          </p>

          <Field label="Show on">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLACEMENTS.map(p => {
                const on = f.placements.includes(p.v)
                return (
                  <label key={p.v} className="flex items-start gap-2.5 rounded-xl p-3 cursor-pointer"
                    style={{ border: `1px solid ${on ? 'var(--teal)' : 'var(--border)'}`, background: on ? 'rgba(203,1,1,0.04)' : 'var(--surface)' }}>
                    <input type="checkbox" className="mt-0.5" checked={on}
                      onChange={() => set('placements', on ? f.placements.filter(x => x !== p.v) : [...f.placements, p.v])} />
                    <span>
                      <span className="block text-sm font-medium" style={{ color: 'var(--text)' }}>{p.l}</span>
                      <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.hint}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Start date" hint="Empty = now">
              <input type="date" className="input" value={f.startsAt} onChange={e => set('startsAt', e.target.value)} />
            </Field>
            <Field label="End date" hint="Empty = no end">
              <input type="date" className="input" value={f.endsAt} min={f.startsAt || undefined} onChange={e => set('endsAt', e.target.value)} />
            </Field>
            <Field label="Priority" hint="Higher shows first">
              <input type="number" min={0} max={100} className="input" value={f.priority} onChange={e => set('priority', Number(e.target.value))} />
            </Field>
            <Field label="Status">
              <label className="flex items-center gap-2 h-11 text-sm cursor-pointer" style={{ color: 'var(--text)' }}>
                <input type="checkbox" checked={f.isActive} onChange={e => set('isActive', e.target.checked)} />
                {f.isActive ? 'Active' : 'Paused'}
              </label>
            </Field>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
            {saving ? 'Saving…' : ad ? 'Save changes' : 'Create ad'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ── 30-day performance ──
function AdStatsModal({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const [rows, setRows] = useState<{ day: string; impressions: number; clicks: number }[] | null>(null)
  useEffect(() => { adAPI.stats(ad._id, 30).then(r => setRows(r.data.data)).catch(() => setRows([])) }, [ad._id])
  const max = Math.max(1, ...(rows || []).map(r => r.impressions))
  const tot = (rows || []).reduce((a, r) => ({ i: a.i + r.impressions, c: a.c + r.clicks }), { i: 0, c: 0 })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{ad.title}</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 30 days</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[{ l: 'Views', v: n(tot.i) }, { l: 'Clicks', v: n(tot.c) }, { l: 'Click rate', v: tot.i ? `${(tot.c / tot.i * 100).toFixed(2)}%` : '—' }].map(s => (
            <div key={s.l} className="rounded-xl p-3" style={{ background: 'var(--bg-alt)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{s.v}</p>
            </div>
          ))}
        </div>
        {!rows ? <div className="shimmer h-40 rounded-xl" /> : (
          <>
            <div className="flex items-end gap-[3px] h-40">
              {rows.map(r => (
                <div key={r.day} className="flex-1 flex flex-col justify-end h-full group relative" title={`${formatDate(r.day)} — ${r.impressions} views, ${r.clicks} clicks`}>
                  <div className="rounded-t-sm" style={{ height: `${(r.impressions / max) * 100}%`, minHeight: r.impressions ? 2 : 0, background: 'rgba(203,1,1,0.25)' }} />
                  <div className="absolute bottom-0 inset-x-0 rounded-t-sm" style={{ height: `${(r.clicks / max) * 100}%`, minHeight: r.clicks ? 2 : 0, background: 'var(--teal)' }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
              <span>{formatDate(rows[0]?.day)}</span><span>{formatDate(rows[rows.length - 1]?.day)}</span>
            </div>
            <div className="flex gap-4 text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(203,1,1,0.25)' }} /> Views</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--teal)' }} /> Clicks</span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// ── Page ──
export default function AdsManagerPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Ad | null | 'new'>(null)
  const [statsFor, setStatsFor] = useState<Ad | null>(null)
  const [tab, setTab] = useState<'all' | 'running' | 'scheduled' | 'paused' | 'ended'>('all')

  const load = useCallback(() => {
    adAPI.list().then(r => setAds(r.data.data || [])).catch(() => toast.error('Failed to load ads')).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const toggle = async (ad: Ad) => {
    try { await adAPI.update(ad._id, { isActive: !ad.isActive }); toast.success(ad.isActive ? 'Ad paused' : 'Ad resumed'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to update') }
  }
  const remove = async (ad: Ad) => {
    if (!confirm(`Delete "${ad.title}" and its statistics?`)) return
    try { await adAPI.delete(ad._id); toast.success('Deleted'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

  const shown = ads.filter(a => tab === 'all' || a.status === tab)
  const totals = ads.reduce((t, a) => ({ i: t.i + a.impressions, c: t.c + a.clicks }), { i: 0, c: 0 })
  const running = ads.filter(a => a.status === 'running').length

  return (
    <div>
      <header className="flex items-center justify-between gap-3 px-7 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}><Megaphone size={17} style={{ color: 'var(--teal)' }} /> Ads Manager</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Banner ads on the listing, property and project pages — several running ads rotate automatically</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-2"><Plus size={13} /> New Ad</button>
      </header>

      <div className="p-7 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Megaphone, l: 'Running now', v: n(running) },
            { icon: Eye, l: 'Total views', v: n(totals.i) },
            { icon: MousePointerClick, l: 'Total clicks', v: n(totals.c) },
            { icon: Percent, l: 'Click rate', v: totals.i ? `${(totals.c / totals.i * 100).toFixed(2)}%` : '—' },
          ].map(s => (
            <div key={s.l} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(203,1,1,0.08)' }}><s.icon size={16} style={{ color: 'var(--teal)' }} /></div>
              <div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
                <p className="text-lg font-bold leading-tight" style={{ color: 'var(--text)' }}>{s.v}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'running', 'scheduled', 'paused', 'ended'] as const).map(t => {
            const count = t === 'all' ? ads.length : ads.filter(a => a.status === t).length
            return (
              <button key={t} onClick={() => setTab(t)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
                style={tab === t ? { background: 'var(--grad)', color: '#fff' } : { color: 'var(--text-mid)', border: '1px solid var(--border)' }}>
                {t} · {count}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
        ) : shown.length === 0 ? (
          <div className="card p-12 text-center">
            <Megaphone size={26} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{ads.length ? 'No ads in this view' : 'No ads yet'}</p>
            {!ads.length && <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>Create your first banner — it appears on the site as soon as it's saved.</p>}
            {!ads.length && <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-1.5"><Plus size={13} /> New Ad</button>}
          </div>
        ) : (
          <div className="space-y-2.5">
            {shown.map(ad => {
              const st = STATUS_STYLE[ad.status || 'paused']
              return (
                <div key={ad._id} className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-full md:w-48 flex-shrink-0 rounded-xl overflow-hidden" style={{ aspectRatio: '4 / 1', background: 'var(--bg-alt)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {(ad.imageWide || ad.imageTall) && <img src={ad.imageWide || ad.imageTall} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{ad.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {ad.advertiser && <>{ad.advertiser} · </>}
                      {ad.placements.map(p => PLACEMENTS.find(x => x.v === p)?.l).join(' + ')}
                      {' · '}{ad.startsAt ? formatDate(ad.startsAt) : 'Now'} → {ad.endsAt ? formatDate(ad.endsAt) : 'No end'}
                      {ad.createdBy && <> · by {ad.createdBy.name}</>}
                    </p>
                    <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] inline-flex items-center gap-1 mt-0.5 truncate max-w-full hover:underline" style={{ color: 'var(--teal)' }}>
                      <ExternalLink size={10} /> {ad.targetUrl}
                    </a>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center flex-shrink-0">
                    {[{ l: 'Views', v: n(ad.impressions) }, { l: 'Clicks', v: n(ad.clicks) }, { l: 'CTR', v: `${ad.ctr ?? 0}%` }].map(s => (
                      <div key={s.l}>
                        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{s.v}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggle(ad)} className="btn-ghost btn-sm p-2" title={ad.isActive ? 'Pause' : 'Resume'}>{ad.isActive ? <Pause size={13} /> : <Play size={13} />}</button>
                    <button onClick={() => setStatsFor(ad)} className="btn-ghost btn-sm p-2" title="Performance"><BarChart3 size={13} /></button>
                    <button onClick={() => setEditing(ad)} className="btn-ghost btn-sm p-2" title="Edit"><Pencil size={13} /></button>
                    <button onClick={() => remove(ad)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && <AdForm ad={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={load} />}
        {statsFor && <AdStatsModal ad={statsFor} onClose={() => setStatsFor(null)} />}
      </AnimatePresence>
    </div>
  )
}
