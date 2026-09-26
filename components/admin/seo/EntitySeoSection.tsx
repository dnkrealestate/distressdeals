'use client'
import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import SeoAppearancePanel, { type SeoFields } from './SeoAppearancePanel'

// Search appearance for developer / community pages: focus keyword + the shared Google preview, fields and checklist.
// The server writes these automatically from live data (project counts, prices, areas) whenever they're empty, so
// this is where an admin reviews them, tweaks them, or regenerates them.
export default function EntitySeoSection({
  seo, onSeoChange, text, fallbackTitle, urlPath, generate,
}: {
  seo: SeoFields
  onSeoChange: (s: SeoFields) => void
  text: string                            // the profile / overview text the page shows
  fallbackTitle: string
  urlPath: string
  generate: () => Promise<SeoFields>      // fresh suggestion from the server
}) {
  const [busy, setBusy] = useState(false)
  const regenerate = async () => {
    const filled = seo.metaTitle || seo.metaDescription || seo.keywords.length
    if (filled && !confirm('Replace the current SEO title, description and keywords with freshly written ones?')) return
    setBusy(true)
    try { onSeoChange(await generate()); toast.success('SEO rewritten from the latest data — review, then save') }
    catch (err: any) { toast.error(err?.error || 'Could not write SEO') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl px-4 py-2.5"
        style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.22)' }}>
        <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-mid)' }}>
          <Sparkles size={13} style={{ color: '#16A34A' }} />
          Written automatically from live listings. Leave a field empty and it&apos;s re-written when you save.
        </p>
        <button type="button" onClick={regenerate} disabled={busy}
          className="text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50" style={{ color: '#15803D' }}>
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Regenerate SEO
        </button>
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>
          Focus keyword <span style={{ color: 'var(--text-muted)' }}>(the main search this page should rank for)</span>
        </label>
        <input className="input" maxLength={80} value={seo.focusKeyword} placeholder="e.g. Emaar projects"
          onChange={e => onSeoChange({ ...seo, focusKeyword: e.target.value })} />
      </div>
      <SeoAppearancePanel profile html={text} seo={seo} onSeoChange={onSeoChange} fallbackTitle={fallbackTitle} urlPath={urlPath} />
    </div>
  )
}

export const seoFromRecord = (r?: { metaTitle?: string; metaDescription?: string; focusKeyword?: string; seoKeywords?: string[] } | null): SeoFields => ({
  metaTitle: r?.metaTitle || '', metaDescription: r?.metaDescription || '', focusKeyword: r?.focusKeyword || '', keywords: r?.seoKeywords || [],
})
export const seoToPayload = (s: SeoFields) => ({
  metaTitle: s.metaTitle.trim(), metaDescription: s.metaDescription.trim(), focusKeyword: s.focusKeyword.trim(), seoKeywords: s.keywords,
})
export const seoFromSuggestion = (d: { metaTitle: string; metaDescription: string; focusKeyword: string; seoKeywords: string[] }): SeoFields => ({
  metaTitle: d.metaTitle, metaDescription: d.metaDescription, focusKeyword: d.focusKeyword, keywords: d.seoKeywords,
})
