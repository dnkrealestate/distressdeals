'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, X, GripVertical, Save, RotateCcw, ExternalLink, ChevronLeft } from 'lucide-react'
import { contentPageAPI } from '@/lib/api'
import { HOME_ICON_MAP, HOME_ICON_OPTIONS } from '@/lib/homeIcons'
import type { ContentPageData, ContentSection, ContentCard, MiniStat } from '@/types'
import toast from 'react-hot-toast'
import { GUIDE_DEFAULTS } from '@/lib/guideContent'

const PAGE_LABELS: Record<string, { label: string; path: string }> = {
  'about':                         { label: 'About Page',              path: '/about' },
  'distress-sale-dubai':           { label: 'Distress Sale Dubai',     path: '/distress-sale-dubai' },
  'distressed-villas-dubai':       { label: 'Distressed Villas Dubai', path: '/distressed-villas-dubai' },
  'dubai-property-auctions':       { label: 'Dubai Property Auctions', path: '/dubai-property-auctions' },
  'sell-property-fast-dubai':      { label: 'Sell Property Fast',      path: '/sell-property-fast-dubai' },
  'free-property-valuation-dubai': { label: 'Free Property Valuation', path: '/free-property-valuation-dubai' },
  'guide-buying':                  { label: 'Buying Guide (Buy page)',  path: '/for-sale#guide-title' },
  'guide-renting':                 { label: 'Renting Guide (Rent page)', path: '/for-rent#guide-title' },
  'guide-new-projects':            { label: 'New Projects Guide',       path: '/projects#guide-title' },
}

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
      <option value="">No icon</option>
      {HOME_ICON_OPTIONS.map(name => <option key={name} value={name}>{name}</option>)}
    </select>
  )
}

function CardEditor({ card, onChange, onRemove }: { card: ContentCard; onChange: (patch: Partial<ContentCard>) => void; onRemove: () => void }) {
  const Icon = card.icon ? HOME_ICON_MAP[card.icon] : null
  return (
    <div className="p-4 rounded-xl space-y-2" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
          {Icon && <Icon size={16} style={{ color: 'var(--teal)' }} />}
        </div>
        <div className="w-32 flex-shrink-0"><IconPicker value={card.icon || ''} onChange={v => onChange({ icon: v || undefined })} /></div>
        <input className="input flex-1" placeholder="Meta (e.g. year, role)" value={card.meta || ''} onChange={e => onChange({ meta: e.target.value })} />
        <button onClick={onRemove} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
      </div>
      <input className="input w-full" placeholder="Title" value={card.title} onChange={e => onChange({ title: e.target.value })} />
      <textarea className="input w-full" rows={2} placeholder="Body" value={card.body} onChange={e => onChange({ body: e.target.value })} />
    </div>
  )
}

function SectionEditor({
  section, onChange, onRemove,
}: { section: ContentSection; onChange: (patch: Partial<ContentSection>) => void; onRemove: () => void }) {
  const cards = section.cards || []

  const updateCard = (i: number, patch: Partial<ContentCard>) => {
    const next = [...cards]; next[i] = { ...next[i], ...patch }
    onChange({ cards: next })
  }
  const addCard = () => onChange({ cards: [...cards, { title: '', body: '' }] })
  const removeCard = (i: number) => onChange({ cards: cards.filter((_, idx) => idx !== i) })

  return (
    <div className="p-4 rounded-xl space-y-3" style={{ border: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
      <div className="flex items-center gap-2">
        <GripVertical size={14} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="flex-shrink-0" />
        <input className="input flex-1 font-semibold" placeholder="Section heading" value={section.heading} onChange={e => onChange({ heading: e.target.value })} />
        <button onClick={onRemove} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
      </div>
      <textarea
        className="input w-full" rows={2} placeholder="Intro paragraph (optional — shown above the cards, or standalone if there are none)"
        value={section.body || ''} onChange={e => onChange({ body: e.target.value })}
      />
      <div className="space-y-2 pl-5">
        {cards.map((c, i) => (
          <CardEditor key={i} card={c} onChange={patch => updateCard(i, patch)} onRemove={() => removeCard(i)} />
        ))}
        <button onClick={addCard} className="btn-ghost btn-sm gap-1.5"><Plus size={12} /> Add card</button>
      </div>
    </div>
  )
}

export default function ContentPageEditor({ params }: { params: { pageKey: string } }) {
  const { pageKey } = params
  const meta = PAGE_LABELS[pageKey]

  const [content, setContent] = useState<ContentPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    contentPageAPI.get(pageKey)
      .then(r => {
        if (r.data.success && r.data.data) setContent(r.data.data)
        // Nothing saved yet — start from what the website shows by default (guides have built-in content).
        else setContent(GUIDE_DEFAULTS[pageKey] ? structuredClone(GUIDE_DEFAULTS[pageKey]) : { pageKey, heroTitle: '', heroIntro: '', sections: [] })
      })
      .catch(() => toast.error('Failed to load page content'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [pageKey])

  const save = async () => {
    if (!content) return
    setSaving(true)
    try {
      const { _id, ...payload } = content
      const res = await contentPageAPI.update(pageKey, payload)
      if (res.data.success) { setContent(res.data.data); toast.success('Page updated') }
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

  const stats = content.stats || []
  const updateStat = (i: number, patch: Partial<MiniStat>) => {
    const next = [...stats]; next[i] = { ...next[i], ...patch }
    setContent({ ...content, stats: next })
  }
  const addStat = () => setContent({ ...content, stats: [...stats, { value: '', label: '' }] })
  const removeStat = (i: number) => setContent({ ...content, stats: stats.filter((_, idx) => idx !== i) })

  const updateSection = (i: number, patch: Partial<ContentSection>) => {
    const next = [...content.sections]; next[i] = { ...next[i], ...patch }
    setContent({ ...content, sections: next })
  }
  const addSection = () => setContent({ ...content, sections: [...content.sections, { heading: '', body: '', cards: [] }] })
  const removeSection = (i: number) => setContent({ ...content, sections: content.sections.filter((_, idx) => idx !== i) })

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <Link href="/admin/settings" className="text-xs flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <ChevronLeft size={12} /> Settings
          </Link>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{meta?.label || pageKey}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Edit this page's body content without a deploy</p>
        </div>
        <div className="flex items-center gap-2">
          {meta && (
            <a href={meta.path} target="_blank" rel="noreferrer" className="btn-ghost btn-sm gap-2">
              <ExternalLink size={13} /> View Live
            </a>
          )}
          <button onClick={load} className="btn-ghost btn-sm gap-2"><RotateCcw size={13} /> Reload</button>
          <button onClick={save} disabled={saving} className="btn-primary btn-sm gap-2"><Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </header>

      <div className="p-7 space-y-5 max-w-3xl">
        <Section title="Hero">
          <div className="space-y-2">
            <input
              className="input w-full" placeholder="Eyebrow (small label above the title, optional)"
              value={content.heroEyebrow || ''} onChange={e => setContent({ ...content, heroEyebrow: e.target.value })}
            />
            <input
              className="input w-full font-semibold" placeholder="Hero title"
              value={content.heroTitle} onChange={e => setContent({ ...content, heroTitle: e.target.value })}
            />
            <textarea
              className="input w-full" rows={3} placeholder="Hero intro paragraph"
              value={content.heroIntro} onChange={e => setContent({ ...content, heroIntro: e.target.value })}
            />
          </div>
        </Section>

        <Section title="Stats Strip" description="Optional row of stats shown under the hero. Leave empty to hide.">
          <div className="space-y-2">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className="input flex-1" placeholder="Value (e.g. 12,000+)" value={s.value} onChange={e => updateStat(i, { value: e.target.value })} />
                <input className="input flex-1" placeholder="Label" value={s.label} onChange={e => updateStat(i, { label: e.target.value })} />
                <button onClick={() => removeStat(i)} className="btn-ghost btn-sm p-2 flex-shrink-0"><X size={13} /></button>
              </div>
            ))}
          </div>
          <button onClick={addStat} className="btn-ghost btn-sm gap-1.5 mt-3"><Plus size={12} /> Add stat</button>
        </Section>

        <Section title="Sections" description="Each section can have an intro paragraph, a grid of cards, or both. Sections alternate background color automatically.">
          <div className="space-y-4">
            {content.sections.map((s, i) => (
              <SectionEditor key={i} section={s} onChange={patch => updateSection(i, patch)} onRemove={() => removeSection(i)} />
            ))}
          </div>
          <button onClick={addSection} className="btn-ghost btn-sm gap-1.5 mt-3"><Plus size={12} /> Add section</button>
        </Section>

        <Section title="Closing Call-to-Action" description="Optional gradient banner shown at the end of the page. Leave the title blank to hide it.">
          <div className="space-y-2">
            <input
              className="input w-full" placeholder="CTA title"
              value={content.ctaTitle || ''} onChange={e => setContent({ ...content, ctaTitle: e.target.value })}
            />
            <textarea
              className="input w-full" rows={2} placeholder="CTA body"
              value={content.ctaBody || ''} onChange={e => setContent({ ...content, ctaBody: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                className="input flex-1" placeholder="Button label"
                value={content.ctaButtonLabel || ''} onChange={e => setContent({ ...content, ctaButtonLabel: e.target.value })}
              />
              <input
                className="input flex-1" placeholder="Button link (e.g. /buyer/properties)"
                value={content.ctaButtonHref || ''} onChange={e => setContent({ ...content, ctaButtonHref: e.target.value })}
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
