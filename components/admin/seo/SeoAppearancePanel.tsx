'use client'
import { useMemo, useState } from 'react'
import { Search, Check, X, Plus } from 'lucide-react'

export interface SeoFields { metaTitle: string; metaDescription: string; focusKeyword: string; keywords: string[] }
export interface SeoCheck { label: string; ok: boolean }

const SITE_SUFFIX = ' | Distress Deals UAE'
const strip = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
export const includesCI = (text: string, kw: string) => !!kw && text.toLowerCase().includes(kw.toLowerCase())

// The opening paragraph: the first <p>, or (for editors that emit <div>s / bare text) whatever comes before the
// first subheading.
function firstParagraph(html: string): string {
  const p = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]
  if (p && strip(p)) return strip(p)
  return strip(html.split(/<h[2-4][^>]*>/i)[0]).slice(0, 400)
}

// Google-style preview, SEO title + meta description, secondary keywords, and a live checklist — shared by the
// project and property forms.
export default function SeoAppearancePanel({
  html, seo, onSeoChange, fallbackTitle, urlPath, extraChecks = [], profile = false,
}: {
  html: string
  seo: SeoFields
  onSeoChange: (s: SeoFields) => void
  fallbackTitle: string
  urlPath: string
  extraChecks?: SeoCheck[]
  // Developer / community profile pages: the body is a short profile, so skip the long-article checks (300 words,
  // subheadings) and check for a real profile instead.
  profile?: boolean
}) {
  const [kwDraft, setKwDraft] = useState('')
  const text = useMemo(() => strip(html), [html])
  const words = text ? text.split(' ').length : 0
  const opening = useMemo(() => firstParagraph(html), [html])
  const headings = useMemo(() => [...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map(m => strip(m[1])), [html])
  const kw = seo.focusKeyword.trim()
  const titleShown = seo.metaTitle.trim() || fallbackTitle
  const metaLen = seo.metaDescription.trim().length

  const checks: SeoCheck[] = [
    { label: 'Focus keyword set', ok: !!kw },
    ...extraChecks,
    { label: 'Keyword in SEO title', ok: includesCI(titleShown, kw) },
    { label: 'Keyword in meta description', ok: includesCI(seo.metaDescription, kw) },
    ...(profile ? [
      { label: `Profile text 80+ words (${words})`, ok: words >= 80 },
      { label: `3+ secondary keywords (${seo.keywords.length})`, ok: seo.keywords.length >= 3 },
    ] : [
      { label: 'Keyword in the opening paragraph', ok: includesCI(opening, kw) },
      { label: 'Keyword in a subheading', ok: headings.some(h => includesCI(h, kw)) },
      { label: 'At least 2 subheadings', ok: headings.length >= 2 },
      { label: `300+ words (${words})`, ok: words >= 300 },
    ]),
    { label: `Meta description 120–160 chars (${metaLen})`, ok: metaLen >= 120 && metaLen <= 160 },
    { label: `SEO title fits search results (${(titleShown + SITE_SUFFIX).length}/65)`, ok: (titleShown + SITE_SUFFIX).length <= 65 },
  ]
  const score = Math.round((checks.filter(c => c.ok).length / checks.length) * 100)
  const scoreColor = score >= 80 ? '#16A34A' : score >= 50 ? '#D97706' : '#DC2626'

  const addKeyword = () => {
    const k = kwDraft.trim()
    if (k && !seo.keywords.some(x => x.toLowerCase() === k.toLowerCase()) && seo.keywords.length < 8) {
      onSeoChange({ ...seo, keywords: [...seo.keywords, k] })
    }
    setKwDraft('')
  }

  return (
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

      <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] mb-0.5 truncate" style={{ color: 'var(--text-muted)' }}>www.distressdealsuae.com › {urlPath.split('/').filter(Boolean).join(' › ')}</p>
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
          <input className="input" maxLength={80} value={seo.metaTitle} placeholder={`${fallbackTitle} (default)`}
            onChange={e => onSeoChange({ ...seo, metaTitle: e.target.value })} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>Meta description</label>
            <span className="text-[11px]" style={{ color: metaLen > 160 ? '#DC2626' : metaLen >= 120 ? '#16A34A' : 'var(--text-muted)' }}>{metaLen}/160</span>
          </div>
          <textarea className="input" rows={3} maxLength={200} value={seo.metaDescription}
            placeholder="Shown under the title in Google results. Aim for 120–160 characters with the focus keyword and one concrete fact."
            onChange={e => onSeoChange({ ...seo, metaDescription: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>
            Secondary keywords <span style={{ color: 'var(--text-muted)' }}>(related searches this page should also cover — up to 8)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {seo.keywords.map(k => (
              <span key={k} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-md text-xs" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>
                {k}
                <button type="button" onClick={() => onSeoChange({ ...seo, keywords: seo.keywords.filter(x => x !== k) })} className="p-0.5 rounded hover:opacity-70" aria-label={`Remove ${k}`}>
                  <X size={11} />
                </button>
              </span>
            ))}
            {seo.keywords.length === 0 && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>None yet. The AI suggests some, or add your own.</span>}
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1" value={kwDraft} placeholder="e.g. 2 bedroom apartment Dubai Marina"
              onChange={e => setKwDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
            />
            <button type="button" onClick={addKeyword} className="btn-outline btn-sm gap-1"><Plus size={13} /> Add</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-5 pt-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
        {checks.map(c => (
          <p key={c.label} className="text-xs flex items-center gap-1.5" style={{ color: c.ok ? 'var(--text-mid)' : 'var(--text-muted)' }}>
            {c.ok ? <Check size={12} style={{ color: '#16A34A' }} className="flex-shrink-0" /> : <X size={12} style={{ color: '#DC2626' }} className="flex-shrink-0" />}
            {c.label}
          </p>
        ))}
      </div>
    </div>
  )
}
