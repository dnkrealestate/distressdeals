// Automatic SEO fields for a project, rebuilt as the description is written. Pure and instant (no AI call) — it
// combines the project facts with what the description actually says, following the same rules the SEO checklist
// scores: keyword up front in the title, title ≤ 65 chars with the site suffix, meta description 120–160 chars
// containing the keyword, and a handful of distinct long-tail keywords.
import type { SeoFields } from '@/components/admin/seo/SeoAppearancePanel'

export interface AutoSeoFacts {
  title: string; developer?: string; type?: string; status?: string
  area?: string; community?: string; city?: string; emirate?: string
  priceFrom?: number; bedrooms?: string
  handoverQuarter?: string; handoverYear?: string; paymentPlan?: string
}

const SITE_SUFFIX_LEN = ' | Distress Deals UAE'.length
const TITLE_MAX = 65 - SITE_SUFFIX_LEN
const META_MIN = 120, META_MAX = 160

const STOP = new Set(('a an and are as at be by for from has have in is it its of on or our the this that to with your you ' +
  'will can all more most very into over their there these those which who also than then out up per each any new ' +
  'offers offer features featuring located location project projects residents home homes living life').split(' '))

const strip = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
const has = (text: string, part?: string) => !!part && text.toLowerCase().includes(part.toLowerCase())
const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/\s+([,.:;!?])/g, '$1').trim()

function compactPrice(n: number): string {
  if (n >= 1_000_000) return `AED ${+(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `AED ${Math.round(n / 1_000)}K`
  return `AED ${n.toLocaleString('en-US')}`
}

// "Apartment" → "Apartments"; "Villa" → "Villas"; leaves "Studio" etc. sensible.
const pluralType = (t?: string) => !t ? 'Homes' : /s$/i.test(t) ? t : /y$/i.test(t) ? t.replace(/y$/i, 'ies') : `${t}s`
const isOffPlan = (s?: string) => !!s && s !== 'ready'

// Cut at a word boundary to at most `max` chars, ending cleanly.
function fit(s: string, max: number): string {
  s = clean(s)
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const lastSentence = cut.lastIndexOf('. ')
  if (lastSentence >= META_MIN - 10) return cut.slice(0, lastSentence + 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:–-]+$/, '') + '…'
}

function sentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+/g) || (text ? [text] : [])).map(s => clean(s)).filter(s => s.length > 25)
}

// The most-repeated meaningful 2–3 word phrases in the description ("private beach", "golf course views").
function topPhrases(text: string, exclude: string[], n: number): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean)
  const counts = new Map<string, number>()
  for (const size of [3, 2]) {
    for (let i = 0; i + size <= words.length; i++) {
      const g = words.slice(i, i + size)
      if (STOP.has(g[0]) || STOP.has(g[g.length - 1]) || g.some(w => w.length < 3 || /^\d+$/.test(w))) continue
      const k = g.join(' ')
      counts.set(k, (counts.get(k) || 0) + (size === 3 ? 1.5 : 1))
    }
  }
  const ex = exclude.map(e => e.toLowerCase())
  return [...counts.entries()]
    .filter(([k, c]) => c >= 2 && !ex.some(e => e.includes(k) || k.includes(e)))
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .filter((k, i, arr) => !arr.slice(0, i).some(p => p.includes(k) || k.includes(p)))
    .slice(0, n)
}

export function buildAutoSeo(html: string, f: AutoSeoFacts, focusKeyword = ''): SeoFields {
  const title = clean(f.title || '')
  const area = f.area || f.community || f.city || ''
  const text = strip(html)
  const types = pluralType(f.type)
  const handover = f.handoverYear ? `${f.handoverQuarter ? `${f.handoverQuarter} ` : ''}${f.handoverYear}` : ''
  const price = f.priceFrom ? compactPrice(f.priceFrom) : ''

  // Focus keyword: the project name plus where it is — what people actually search for.
  const kw = focusKeyword.trim() || clean(`${title}${area && !has(title, area) ? ` ${area}` : ''}`)

  // SEO title: keyword first, then the strongest extra that still fits.
  const titleCandidates = [
    price && `${kw} | ${isOffPlan(f.status) ? 'Off-Plan ' : ''}From ${price}`,
    price && `${kw} | From ${price}`,
    f.developer && !has(kw, f.developer) && `${kw} by ${f.developer}`,
    handover && `${kw} | Handover ${handover}`,
    `${kw} | ${types}`,
    kw,
    title,
  ].filter(Boolean) as string[]
  const metaTitle = titleCandidates.find(t => t.length <= TITLE_MAX) || fit(title, TITLE_MAX)

  // Meta description: a fact-packed opener with the keyword, then the description's own words to reach 120–160.
  const opener = clean([
    `${isOffPlan(f.status) ? 'Off-plan ' : ''}${f.bedrooms ? `${f.bedrooms} bed ` : ''}${types.toLowerCase()} at ${kw}`,
    f.developer && !has(kw, f.developer) ? ` by ${f.developer}` : '',
    price ? `, from ${price}` : '',
    handover && isOffPlan(f.status) ? `, handover ${handover}` : '',
    f.paymentPlan ? `, ${f.paymentPlan} payment plan` : '',
    '.',
  ].join('')).replace(/^./, c => c.toUpperCase())
  let meta = opener
  for (const s of sentences(text)) {
    if (meta.length >= META_MIN) break
    if (has(meta, s.slice(0, 30))) continue
    meta = `${meta} ${s}`
  }
  if (meta.length < META_MIN) meta = `${meta} Verified listing on Distress Deals UAE — enquire today.`
  const metaDescription = fit(meta, META_MAX)

  // Secondary keywords: long-tail searches around the project + the description's own recurring phrases.
  const base = [
    title && area && !has(title, area) ? `${title} ${area}` : title,
    f.developer && `${f.developer} ${isOffPlan(f.status) ? 'off-plan ' : ''}projects`,
    area && `${isOffPlan(f.status) ? 'off-plan ' : ''}${types.toLowerCase()} in ${area}`,
    area && `${types.toLowerCase()} for sale in ${area}`,
    f.bedrooms && area && `${f.bedrooms} bedroom ${(f.type || 'apartment').toLowerCase()} ${area}`,
    f.paymentPlan && `${f.paymentPlan} payment plan ${f.emirate || 'Dubai'}`,
    handover && isOffPlan(f.status) && `handover ${handover} ${f.emirate || 'Dubai'}`,
  ].filter(Boolean) as string[]
  const phrases = topPhrases(text, [kw, title, area], 3)
  const seen = new Set<string>([kw.toLowerCase()])
  const keywords: string[] = []
  for (const k of [...base.slice(0, 5), ...phrases, ...base.slice(5)]) {
    const v = clean(k).slice(0, 60)
    if (v && !seen.has(v.toLowerCase()) && keywords.length < 8) { seen.add(v.toLowerCase()); keywords.push(v) }
  }

  return { focusKeyword: kw, metaTitle, metaDescription, keywords }
}
