'use client'
import { useMemo, useState } from 'react'
import { Sparkles, Loader2, Check, X, Search, Wand2, AlertCircle } from 'lucide-react'
import BlockEditor, { Block, blocksToHtml, htmlToBlocks, blocksHaveContent } from '@/components/shared/BlockEditor'
import { projectAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export interface ProjectSeo { metaTitle: string; metaDescription: string; focusKeyword: string }

// Everything the AI may draw on — built by the project form from its current values.
export interface ProjectFacts {
  title: string; developer?: string; type?: string; status?: string
  area?: string; community?: string; city?: string; emirate?: string
  priceFrom?: number; priceTo?: number
  bedrooms?: string; bathrooms?: string; sizeRange?: string
  handoverQuarter?: string; handoverYear?: string; paymentPlan?: string
  amenities: string[]; landmarks: string[]; floorPlans: string[]; masterPlanNotes?: string
}

type Tone = 'professional' | 'luxury' | 'investor' | 'family'
type Length = 'short' | 'standard' | 'detailed'

const TONES: { v: Tone; l: string }[] = [
  { v: 'professional', l: 'Professional' }, { v: 'luxury', l: 'Luxury' },
  { v: 'investor', l: 'Investor' }, { v: 'family', l: 'Family' },
]
const LENGTHS: { v: Length; l: string; hint: string }[] = [
  { v: 'short', l: 'Short', hint: '~250 words' },
  { v: 'standard', l: 'Standard', hint: '~450 words' },
  { v: 'detailed', l: 'Detailed', hint: '~750 words' },
]

const SITE_SUFFIX = ' | Distress Deals Dubai'

const strip = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const has = (text: string, kw: string) => !!kw && text.toLowerCase().includes(kw.toLowerCase())

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o.v} type="button" onClick={() => onChange(o.v)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: value === o.v ? 'rgba(203,1,1,0.10)' : 'var(--bg-alt)',
            border: `1px solid ${value === o.v ? 'var(--teal)' : 'var(--border)'}`,
            color: value === o.v ? 'var(--teal)' : 'var(--text-mid)',
          }}
        >
          {o.l}{o.hint && <span className="ml-1 opacity-60">{o.hint}</span>}
        </button>
      ))}
    </div>
  )
}

export default function ProjectDescriptionStep({
  blocks, onBlocksChange, seo, onSeoChange, getFacts, slug, onJump,
}: {
  blocks: Block[]
  onBlocksChange: (b: Block[]) => void
  seo: ProjectSeo
  onSeoChange: (s: ProjectSeo) => void
  getFacts: () => ProjectFacts
  slug?: string
  onJump: (step: number) => void
}) {
  const [tone, setTone] = useState<Tone>('professional')
  const [length, setLength] = useState<Length>('standard')
  const [generating, setGenerating] = useState(false)
  // Re-read the form whenever this step renders, so the checklist reflects edits made in earlier steps.
  const facts = getFacts()

  const inputs = [
    { label: 'Developer',    ok: !!facts.developer,                  step: 1 },
    { label: 'Location',     ok: !!facts.area,                       step: 1 },
    { label: 'Price',        ok: !!facts.priceFrom,                  step: 1 },
    { label: 'Unit mix',     ok: !!facts.bedrooms,                   step: 1 },
    { label: 'Sizes',        ok: !!facts.sizeRange,                  step: 1 },
    { label: 'Handover',     ok: !!(facts.handoverYear || facts.handoverQuarter), step: 1 },
    { label: 'Payment plan', ok: !!facts.paymentPlan,                step: 1 },
    { label: facts.landmarks.length ? `${facts.landmarks.length} landmark${facts.landmarks.length > 1 ? 's' : ''}` : 'Landmarks', ok: facts.landmarks.length > 0, step: 1 },
    { label: facts.amenities.length ? `${facts.amenities.length} amenities` : 'Amenities', ok: facts.amenities.length > 0, step: 2 },
    { label: facts.floorPlans.length ? `${facts.floorPlans.length} floor plan${facts.floorPlans.length > 1 ? 's' : ''}` : 'Floor plans', ok: facts.floorPlans.length > 0, step: 3 },
  ]
  const missing = inputs.filter(i => !i.ok)

  const generate = async () => {
    if (!facts.title.trim()) { toast.error('Add the project name in Details first'); onJump(1); return }
    if (blocksHaveContent(blocks) && !confirm('Replace the current description with a new AI draft?')) return
    setGenerating(true)
    try {
      const res = await projectAPI.aiDescription({ ...facts, focusKeyword: seo.focusKeyword.trim() || undefined, tone, length })
      const d = res.data.data
      onBlocksChange(htmlToBlocks(d.html))
      onSeoChange({
        focusKeyword: seo.focusKeyword.trim() || d.focusKeyword || '',
        metaTitle: d.metaTitle || seo.metaTitle,
        metaDescription: d.metaDescription || seo.metaDescription,
      })
      toast.success('Description drafted — review it before saving')
    } catch (err: any) {
      toast.error(err?.error || 'Could not generate a description')
    } finally {
      setGenerating(false)
    }
  }

  // ── SEO checks, recomputed as the admin edits ──
  const html = useMemo(() => blocksToHtml(blocks), [blocks])
  const text = useMemo(() => strip(html), [html])
  const words = text ? text.split(' ').length : 0
  const firstPara = strip(blocks.find(b => b.type === 'paragraph' && b.html?.trim())?.html || '')
  const headings = blocks.filter(b => b.type === 'heading').map(b => strip(b.html || ''))
  const kw = seo.focusKeyword.trim()
  const titleShown = seo.metaTitle.trim() || `${facts.title || 'Project name'}${facts.developer ? ` by ${facts.developer}` : ''}`
  const metaLen = seo.metaDescription.trim().length

  const checks = [
    { label: 'Focus keyword set', ok: !!kw },
    { label: 'Keyword in SEO title', ok: has(titleShown, kw) },
    { label: 'Keyword in meta description', ok: has(seo.metaDescription, kw) },
    { label: 'Keyword in the opening paragraph', ok: has(firstPara, kw) },
    { label: 'Keyword in a subheading', ok: headings.some(h => has(h, kw)) },
    { label: 'At least 2 subheadings', ok: headings.length >= 2 },
    { label: `300+ words (${words})`, ok: words >= 300 },
    { label: `Meta description 120–160 chars (${metaLen})`, ok: metaLen >= 120 && metaLen <= 160 },
    { label: `SEO title fits search results (${(titleShown + SITE_SUFFIX).length}/65)`, ok: (titleShown + SITE_SUFFIX).length <= 65 },
  ]
  const score = Math.round((checks.filter(c => c.ok).length / checks.length) * 100)
  const scoreColor = score >= 80 ? '#16A34A' : score >= 50 ? '#D97706' : '#DC2626'

  return (
    <div className="space-y-5">
      {/* ── AI writer ── */}
      <div className="card p-6" style={{ borderColor: 'rgba(203,1,1,0.25)' }}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>AI Description Writer</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Writes an SEO-optimised description from what you entered in the earlier steps, using only those facts. Nothing is invented.
            </p>
          </div>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>What the AI will use</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {inputs.map(i => (
            <button
              key={i.label} type="button" onClick={() => !i.ok && onJump(i.step)}
              title={i.ok ? undefined : `Missing — go to step ${i.step}`}
              className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium', !i.ok && 'cursor-pointer hover:opacity-80')}
              style={i.ok
                ? { background: 'rgba(22,163,74,0.10)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.25)' }
                : { background: 'var(--bg-alt)', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}
            >
              {i.ok ? <Check size={11} /> : <X size={11} />} {i.label}
            </button>
          ))}
        </div>
        {missing.length > 0 && (
          <p className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
            Tap a missing item to fill it in. More detail gives a more specific description that ranks better.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="md:col-span-2">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>
              Focus keyword <span style={{ color: 'var(--text-muted)' }}>(what buyers would type into Google; leave blank to let the AI choose)</span>
            </label>
            <input
              className="input" value={seo.focusKeyword}
              placeholder={facts.title ? `e.g. ${facts.title}${facts.area ? ` ${facts.area}` : ''}` : 'e.g. off-plan apartments in Dubai Hills'}
              onChange={e => onSeoChange({ ...seo, focusKeyword: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Tone</label>
            <Segmented value={tone} options={TONES} onChange={setTone} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Length</label>
            <Segmented value={length} options={LENGTHS} onChange={setLength} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <button type="button" onClick={generate} disabled={generating} className="btn-primary gap-2">
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            {generating ? 'Writing…' : blocksHaveContent(blocks) ? 'Regenerate with AI' : 'Generate with AI'}
          </button>
          <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <AlertCircle size={11} /> Always read the draft before saving. You can edit every line below.
          </span>
        </div>
      </div>

      {/* ── The description itself ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Description</h3>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{words} words</span>
        </div>
        <BlockEditor blocks={blocks} onChange={onBlocksChange} />
      </div>

      {/* ── Search appearance ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}><Search size={14} /> Search Appearance (SEO)</h3>
          <div className="flex items-center gap-2">
            <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: scoreColor }} />
            </div>
            <span className="text-xs font-bold" style={{ color: scoreColor }}>SEO {score}%</span>
          </div>
        </div>

        {/* Google-style result preview */}
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] mb-0.5 truncate" style={{ color: 'var(--text-muted)' }}>www.distressdealsuae.com › projects › {slug || 'your-project'}</p>
          <p className="text-base leading-snug truncate" style={{ color: '#1a0dab' }}>{titleShown}{SITE_SUFFIX}</p>
          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-mid)' }}>
            {seo.metaDescription.trim() || <span style={{ color: 'var(--text-muted)' }}>No meta description yet — the page will fall back to an auto-generated line.</span>}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>SEO title</label>
              <span className="text-[11px]" style={{ color: seo.metaTitle.length > 45 ? '#D97706' : 'var(--text-muted)' }}>{seo.metaTitle.length}/45</span>
            </div>
            <input
              className="input" maxLength={80} value={seo.metaTitle}
              placeholder={`${facts.title || 'Project'}${facts.developer ? ` by ${facts.developer}` : ''} (default)`}
              onChange={e => onSeoChange({ ...seo, metaTitle: e.target.value })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>Meta description</label>
              <span className="text-[11px]" style={{ color: metaLen > 160 ? '#DC2626' : metaLen >= 120 ? '#16A34A' : 'var(--text-muted)' }}>{metaLen}/160</span>
            </div>
            <textarea
              className="input" rows={3} maxLength={200} value={seo.metaDescription}
              placeholder="Shown under the title in Google results. Aim for 120–160 characters with the focus keyword and one concrete fact."
              onChange={e => onSeoChange({ ...seo, metaDescription: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-5 pt-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
          {checks.map(c => (
            <p key={c.label} className="text-xs flex items-center gap-1.5" style={{ color: c.ok ? 'var(--text-mid)' : 'var(--text-muted)' }}>
              {c.ok
                ? <Check size={12} style={{ color: '#16A34A' }} className="flex-shrink-0" />
                : <X size={12} style={{ color: '#DC2626' }} className="flex-shrink-0" />}
              {c.label}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
