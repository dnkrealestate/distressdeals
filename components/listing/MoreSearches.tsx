import Link from 'next/link'
import { Search } from 'lucide-react'
import { quickLinkGroups, type QuickLinksData } from '@/lib/quickLinks'

// "More searches" block under the Buy / Rent / New Projects lists — real links (crawlable) to searches that have
// results right now: feature tags, property types, areas, communities, bedrooms / developers. Counts come from
// GET /quick-links, so a link never lands on an empty page.
export type { QuickLinksData }

export default function MoreSearches({ data }: { data: QuickLinksData | null }) {
  if (!data) return null
  const cols = quickLinkGroups(data)
  if (!cols.length) return null
  const { kind } = data
  const title = kind === 'projects' ? 'More Searches for New Projects in UAE' : `More Searches for Properties ${kind === 'rent' ? 'for Rent ' : ''}in UAE`

  return (
    <section className="wrap pt-4 pb-14" aria-labelledby="more-searches">
      <div className="rounded-3xl p-6 md:p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 id="more-searches" className="text-lg md:text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Search size={18} style={{ color: 'var(--teal)' }} /> {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
          {cols.map(col => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>{col.title}</h3>
              <ul className="space-y-2">
                {col.links.slice(0, col.id === 'popular' ? 20 : 10).map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm leading-snug transition-colors hover:text-[var(--teal)] hover:underline" style={{ color: 'var(--text-mid)' }}>
                      {l.label}
                    </Link>
                    <span className="text-[11px] ml-1.5" style={{ color: 'var(--text-muted)' }}>({l.count})</span>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </section>
  )
}
