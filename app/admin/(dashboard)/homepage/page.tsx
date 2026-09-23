'use client'
import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Plus, X, GripVertical, Save, RotateCcw, Eye, MousePointerClick, UploadCloud, Loader2 } from 'lucide-react'
import { homepageAPI, uploadAPI } from '@/lib/api'
import { HOME_ICON_MAP, HOME_ICON_OPTIONS } from '@/lib/homeIcons'
import type { HomepageContent, WhyCard, StatItem, MiniStat } from '@/types'
import toast from 'react-hot-toast'

const CTA_LABELS: Record<string, string> = {
  hero_explore_properties:  'Hero — Explore Properties',
  hero_list_property:       'Hero — List Your Property',
  cta_get_started:          'Bottom Banner — Get Started Free',
  cta_talk_to_expert:       'Bottom Banner — Talk to an Expert',
  mortgage_get_preapproved: 'Mortgage — Get Pre-Approved',
  hero_map_search:          'Hero — Map Search button',
  map_banner:               'Explore on the Map banner',
}

interface HomepageAnalytics { views: number; ctaClicks: Record<string, number> }

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>{title}</h2>
      {description && <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      <div className={description ? 'mt-4' : 'mt-1'}>{children}</div>
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

function BannerSlot({
  label, defaultSrc, value, onChange,
}: { label: string; defaultSrc: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadAPI.image(fd)
      if (res.data.success) onChange(res.data.data.url)
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-mid)' }}>{label}</p>
      <div className="relative rounded-xl overflow-hidden group" style={{ background: 'var(--bg-alt)', aspectRatio: '16/9' }}>
        <img src={value || defaultSrc} alt="" className="w-full h-full object-cover" />
        {!value && (
          <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
            Using default
          </span>
        )}
        <div
          {...getRootProps()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          <input {...getInputProps()} />
          {uploading ? <Loader2 size={18} className="animate-spin text-white" /> : <UploadCloud size={18} className="text-white" />}
          <span className="text-xs font-medium text-white">{isDragActive ? 'Drop to upload' : 'Replace image'}</span>
        </div>
        {value && (
          <button
            type="button" onClick={() => onChange('')}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white z-10"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

function ShadeColorField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-mid)' }}>{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-11 h-11 rounded-lg cursor-pointer flex-shrink-0"
          style={{ border: '1px solid var(--border)', padding: 2, background: 'var(--bg-alt)' }}
        />
        <input
          className="input flex-1 font-mono text-xs"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#FD7147"
        />
      </div>
    </div>
  )
}

export default function AdminHomepagePage() {
  const [content, setContent] = useState<HomepageContent | null>(null)
  const [analytics, setAnalytics] = useState<HomepageAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    homepageAPI.get()
      .then(r => { if (r.data.success) setContent(r.data.data) })
      .catch(() => toast.error('Failed to load homepage content'))
      .finally(() => setLoading(false))
    homepageAPI.getAnalytics()
      .then(r => { if (r.data.success) setAnalytics(r.data.data) })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!content) return
    setSaving(true)
    try {
      const { _id, ...payload } = content
      const res = await homepageAPI.update(payload)
      if (res.data.success) { setContent(res.data.data); toast.success('Homepage updated') }
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !content) {
    return (
      <div className="p-7 space-y-4">
        {Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
      </div>
    )
  }

  // ── Hero headlines (string[]) ──────────────────────
  const updateHeadline = (i: number, v: string) => {
    const next = [...content.heroHeadlines]; next[i] = v
    setContent({ ...content, heroHeadlines: next })
  }
  const addHeadline = () => setContent({ ...content, heroHeadlines: [...content.heroHeadlines, ''] })
  const removeHeadline = (i: number) => setContent({ ...content, heroHeadlines: content.heroHeadlines.filter((_, idx) => idx !== i) })

  // ── Hero mini stats ─────────────────────────────────
  const updateMiniStat = (i: number, patch: Partial<MiniStat>) => {
    const next = [...content.heroMiniStats]; next[i] = { ...next[i], ...patch }
    setContent({ ...content, heroMiniStats: next })
  }
  const addMiniStat = () => setContent({ ...content, heroMiniStats: [...content.heroMiniStats, { value: '', label: '' }] })
  const removeMiniStat = (i: number) => setContent({ ...content, heroMiniStats: content.heroMiniStats.filter((_, idx) => idx !== i) })

  // ── Why cards ────────────────────────────────────────
  const updateWhyCard = (i: number, patch: Partial<WhyCard>) => {
    const next = [...content.whyCards]; next[i] = { ...next[i], ...patch }
    setContent({ ...content, whyCards: next })
  }
  const addWhyCard = () => setContent({ ...content, whyCards: [...content.whyCards, { icon: 'CheckCircle2', title: '', description: '' }] })
  const removeWhyCard = (i: number) => setContent({ ...content, whyCards: content.whyCards.filter((_, idx) => idx !== i) })

  // ── Stats strip ──────────────────────────────────────
  const updateStat = (i: number, patch: Partial<StatItem>) => {
    const next = [...content.statsStrip]; next[i] = { ...next[i], ...patch }
    setContent({ ...content, statsStrip: next })
  }
  const addStat = () => setContent({ ...content, statsStrip: [...content.statsStrip, { icon: 'Users', value: '', label: '' }] })
  const removeStat = (i: number) => setContent({ ...content, statsStrip: content.statsStrip.filter((_, idx) => idx !== i) })

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Homepage</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Edit the hero, stats, and "why choose us" sections without a deploy</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost btn-sm gap-2"><RotateCcw size={13} /> Reload</button>
          <button onClick={save} disabled={saving} className="btn-primary btn-sm gap-2"><Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </header>

      <div className="p-7 space-y-5 max-w-3xl">
        {analytics && (
          <Section title="Performance" description="Views and CTA clicks tracked from the live homepage.">
            <div className="flex items-center gap-3 mb-4 p-4 rounded-xl" style={{ background: 'var(--bg-alt)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                <Eye size={18} style={{ color: 'var(--teal)' }} />
              </div>
              <div>
                <p className="text-xl font-bold grad-text">{analytics.views.toLocaleString()}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total page views</p>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(CTA_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between text-sm py-1.5">
                  <span className="flex items-center gap-2" style={{ color: 'var(--text-mid)' }}>
                    <MousePointerClick size={13} style={{ color: 'var(--text-muted)' }} />{label}
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{(analytics.ctaClicks[key] || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Hero Headlines" description="Rotates every few seconds on the homepage hero. 'Dream', Dubai's, and Luxury are auto-highlighted.">
          <div className="space-y-2">
            {content.heroHeadlines.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <GripVertical size={14} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="flex-shrink-0" />
                <input className="input flex-1" value={h} onChange={e => updateHeadline(i, e.target.value)} placeholder="Headline" />
                <button onClick={() => removeHeadline(i)} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
              </div>
            ))}
          </div>
          <button onClick={addHeadline} className="btn-ghost btn-sm gap-1.5 mt-3"><Plus size={12} /> Add headline</button>
        </Section>

        <Section title="Hero Subtitle">
          <textarea
            className="input" rows={3} value={content.heroSubtitle}
            onChange={e => setContent({ ...content, heroSubtitle: e.target.value })}
          />
        </Section>

        <Section title="Hero Banner Images" description="Background images behind the hero headline. Hover a tile to replace it, or clear it to fall back to the site default.">
          <div className="grid grid-cols-2 gap-4">
            <BannerSlot
              label="Desktop — Day"
              defaultSrc="/banners/home_banner_day.webp"
              value={content.heroBannerDesktopDay || ''}
              onChange={v => setContent({ ...content, heroBannerDesktopDay: v })}
            />
            <BannerSlot
              label="Desktop — Night"
              defaultSrc="/banners/home_banner_night.webp"
              value={content.heroBannerDesktopNight || ''}
              onChange={v => setContent({ ...content, heroBannerDesktopNight: v })}
            />
            <BannerSlot
              label="Mobile — Day"
              defaultSrc="/banners/home_banner_day_mobile.webp"
              value={content.heroBannerMobileDay || ''}
              onChange={v => setContent({ ...content, heroBannerMobileDay: v })}
            />
            <BannerSlot
              label="Mobile — Night"
              defaultSrc="/banners/home_banner_night_mobile.webp"
              value={content.heroBannerMobileNight || ''}
              onChange={v => setContent({ ...content, heroBannerMobileNight: v })}
            />
          </div>
        </Section>

        <Section title="Hero Ambient Shades" description="Colors of the two soft glows drifting behind the hero banner photo.">
          <div className="grid grid-cols-2 gap-4">
            <ShadeColorField
              label="Shade 1"
              value={content.heroShadeColor1 || '#FD7147'}
              onChange={v => setContent({ ...content, heroShadeColor1: v })}
            />
            <ShadeColorField
              label="Shade 2"
              value={content.heroShadeColor2 || '#95E4FF'}
              onChange={v => setContent({ ...content, heroShadeColor2: v })}
            />
          </div>
        </Section>

        <Section title="Hero Mini Stats" description="The three small stats shown under the hero CTAs.">
          <div className="space-y-2">
            {content.heroMiniStats.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className="input flex-1" placeholder="Value (e.g. 2,400+)" value={s.value} onChange={e => updateMiniStat(i, { value: e.target.value })} />
                <input className="input flex-1" placeholder="Label" value={s.label} onChange={e => updateMiniStat(i, { label: e.target.value })} />
                <button onClick={() => removeMiniStat(i)} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
              </div>
            ))}
          </div>
          <button onClick={addMiniStat} className="btn-ghost btn-sm gap-1.5 mt-3"><Plus size={12} /> Add stat</button>
        </Section>

        <Section title="Stats Strip" description="The stat bar shown just below the search bar.">
          <div className="space-y-2">
            {content.statsStrip.map((s, i) => {
              const Icon = HOME_ICON_MAP[s.icon]
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                    {Icon && <Icon size={16} style={{ color: 'var(--teal)' }} />}
                  </div>
                  <div className="w-32 flex-shrink-0"><IconPicker value={s.icon} onChange={v => updateStat(i, { icon: v })} /></div>
                  <input className="input flex-1" placeholder="Value" value={s.value} onChange={e => updateStat(i, { value: e.target.value })} />
                  <input className="input flex-1" placeholder="Label" value={s.label} onChange={e => updateStat(i, { label: e.target.value })} />
                  <button onClick={() => removeStat(i)} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
                </div>
              )
            })}
          </div>
          <button onClick={addStat} className="btn-ghost btn-sm gap-1.5 mt-3"><Plus size={12} /> Add stat</button>
        </Section>

        <Section title="Why Choose Us Cards">
          <div className="space-y-4">
            {content.whyCards.map((w, i) => {
              const Icon = HOME_ICON_MAP[w.icon]
              return (
                <div key={i} className="p-4 rounded-xl space-y-2" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                      {Icon && <Icon size={16} style={{ color: 'var(--teal)' }} />}
                    </div>
                    <div className="w-32 flex-shrink-0"><IconPicker value={w.icon} onChange={v => updateWhyCard(i, { icon: v })} /></div>
                    <input className="input flex-1" placeholder="Title" value={w.title} onChange={e => updateWhyCard(i, { title: e.target.value })} />
                    <button onClick={() => removeWhyCard(i)} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
                  </div>
                  <textarea
                    className="input" rows={2} placeholder="Description" value={w.description}
                    onChange={e => updateWhyCard(i, { description: e.target.value })}
                  />
                </div>
              )
            })}
          </div>
          <button onClick={addWhyCard} className="btn-ghost btn-sm gap-1.5 mt-3"><Plus size={12} /> Add card</button>
        </Section>
      </div>
    </div>
  )
}
