'use client'
import { useMemo, useState } from 'react'
import BlockEditor, { Block, blocksToHtml, htmlToBlocks, blocksHaveContent } from '@/components/shared/BlockEditor'
import AiWriterCard, { type Tone, type Length } from '@/components/admin/seo/AiWriterCard'
import SeoAppearancePanel, { type SeoFields } from '@/components/admin/seo/SeoAppearancePanel'
import { projectAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export type ProjectSeo = SeoFields

// Everything the AI may draw on — built by the project form from its current values.
export interface ProjectFacts {
  title: string; developer?: string; type?: string; status?: string
  area?: string; community?: string; city?: string; emirate?: string
  priceFrom?: number; priceTo?: number
  bedrooms?: string; bathrooms?: string; sizeRange?: string
  handoverQuarter?: string; handoverYear?: string; paymentPlan?: string
  amenities: string[]; landmarks: string[]; floorPlans: string[]; masterPlanNotes?: string
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
  // Re-read on every render, so the chips reflect edits made in earlier steps.
  const facts = getFacts()
  const html = useMemo(() => blocksToHtml(blocks), [blocks])
  const hasContent = blocksHaveContent(blocks)

  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
  const inputs = [
    { label: 'Developer',    ok: !!facts.developer, step: 1 },
    { label: 'Location',     ok: !!facts.area, step: 1 },
    { label: 'Price',        ok: !!facts.priceFrom, step: 1 },
    { label: 'Unit mix',     ok: !!facts.bedrooms, step: 1 },
    { label: 'Sizes',        ok: !!facts.sizeRange, step: 1 },
    { label: 'Handover',     ok: !!(facts.handoverYear || facts.handoverQuarter), step: 1 },
    { label: 'Payment plan', ok: !!facts.paymentPlan, step: 1 },
    { label: facts.landmarks.length ? plural(facts.landmarks.length, 'landmark') : 'Landmarks', ok: facts.landmarks.length > 0, step: 1 },
    { label: facts.amenities.length ? plural(facts.amenities.length, 'amenity', 'amenities') : 'Amenities', ok: facts.amenities.length > 0, step: 2 },
    { label: facts.floorPlans.length ? plural(facts.floorPlans.length, 'floor plan') : 'Floor plans', ok: facts.floorPlans.length > 0, step: 3 },
  ]

  const generate = async () => {
    if (!facts.title.trim()) { toast.error('Add the project name in Details first'); onJump(1); return }
    if (hasContent && !confirm('Replace the current description with a new AI draft?')) return
    setGenerating(true)
    try {
      const res = await projectAPI.aiDescription({ ...facts, focusKeyword: seo.focusKeyword.trim() || undefined, tone, length })
      const d = res.data.data
      onBlocksChange(htmlToBlocks(d.html))
      onSeoChange({
        focusKeyword: seo.focusKeyword.trim() || d.focusKeyword || '',
        metaTitle: d.metaTitle || seo.metaTitle,
        metaDescription: d.metaDescription || seo.metaDescription,
        keywords: d.keywords?.length ? d.keywords : seo.keywords,
      })
      toast.success('Description drafted — review it before saving')
    } catch (err: any) {
      toast.error(err?.code === 'ECONNABORTED' ? 'The AI took too long to respond — please try again' : err?.error || 'Could not generate a description')
    } finally {
      setGenerating(false)
    }
  }

  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="space-y-5">
      <AiWriterCard
        subtitle="Writes an SEO-optimised description, search title, meta description and related keywords from what you entered in the earlier steps. It uses only those facts and invents nothing."
        inputs={inputs} onJump={onJump}
        focusKeyword={seo.focusKeyword} onFocusKeywordChange={v => onSeoChange({ ...seo, focusKeyword: v })}
        keywordPlaceholder={facts.title ? `e.g. ${facts.title}${facts.area ? ` ${facts.area}` : ''}` : 'e.g. off-plan apartments in Dubai Hills'}
        tone={tone} onTone={setTone} length={length} onLength={setLength}
        generating={generating} hasContent={hasContent} onGenerate={generate}
      />

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Description</h3>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{words} words</span>
        </div>
        <BlockEditor blocks={blocks} onChange={onBlocksChange} />
      </div>

      <SeoAppearancePanel
        html={html} seo={seo} onSeoChange={onSeoChange}
        fallbackTitle={`${facts.title || 'Project name'}${facts.developer ? ` by ${facts.developer}` : ''}`}
        urlPath={`projects/${slug || 'your-project'}`}
      />
    </div>
  )
}
