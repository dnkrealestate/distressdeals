'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Flame, Building2, MapPin, BedDouble, Briefcase, ArrowRight, ChevronRight } from 'lucide-react'
import { quickLinkGroups, LISTING_BASE, type QuickLinksData, type QuickLinkGroup } from '@/lib/quickLinks'
import type { ListingKind } from '@/lib/listingTags'

// Homepage "Popular Real Estate Searches" — For sale / For rent / New projects tabs, each with four aligned cards
// of live search links (counts from GET /quick-links). Every tab is in the HTML (inactive ones just hidden), so all
// the links are crawlable.
const TABS: { kind: ListingKind; label: string }[] = [
  { kind: 'sale', label: 'For Sale' },
  { kind: 'rent', label: 'For Rent' },
  { kind: 'projects', label: 'New Projects' },
]
const ICON: Record<QuickLinkGroup['id'], any> = { popular: Flame, types: Building2, areas: MapPin, extra: BedDouble, communities: MapPin }
const MAX_LINKS = 7
// Literal class names so Tailwind keeps them.
const COLS: Record<number, string> = { 1: 'lg:grid-cols-1 max-w-md mx-auto', 2: 'lg:grid-cols-2 max-w-4xl mx-auto', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' }

export default function PopularSearches({ data }: { data: Partial<Record<ListingKind, QuickLinksData | null>> }) {
  const tabs = TABS
    .map(t => ({ ...t, groups: data[t.kind] ? quickLinkGroups(data[t.kind]!).filter(g => g.id !== 'communities').slice(0, 4) : [] }))
    .filter(t => t.groups.length > 0)
  const [active, setActive] = useState<ListingKind>(tabs[0]?.kind || 'sale')
  if (!tabs.length) return null

  return (
    <section className="section section-alt" aria-labelledby="popular-searches">
      <div className="wrap">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <p className="eyebrow mb-3">Explore</p>
          <h2 id="popular-searches" className="heading-lg mb-3">
            Popular Real Estate <span className="grad-text">Searches</span>
          </h2>
          <p className="muted max-w-2xl mx-auto">
            Jump straight to the most searched properties across the UAE — every link opens live, verified listings direct from owners and developers.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div role="tablist" aria-label="Search type" className="inline-flex p-1 rounded-2xl gap-1 max-w-full overflow-x-auto"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 14px -6px rgba(15,23,42,0.12)', scrollbarWidth: 'none' }}>
            {tabs.map(t => {
              const on = t.kind === active
              return (
                <button key={t.kind} role="tab" aria-selected={on} aria-controls={`ps-${t.kind}`} onClick={() => setActive(t.kind)}
                  className="px-5 sm:px-7 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                  style={on ? { background: 'var(--grad)', color: '#fff', boxShadow: '0 6px 16px rgba(203,1,1,0.25)' } : { color: 'var(--text-mid)' }}>
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {tabs.map(t => (
          // A class, not the hidden attribute — display:grid would override [hidden]. Columns follow the card count.
          <div key={t.kind} id={`ps-${t.kind}`} role="tabpanel" aria-hidden={t.kind !== active}
            className={`${t.kind === active ? 'grid' : 'hidden'} grid-cols-1 sm:grid-cols-2 ${COLS[t.groups.length] || 'lg:grid-cols-4'} gap-5 items-stretch`}>
            {t.groups.map((g, gi) => {
              const Icon = g.id === 'extra' && t.kind === 'projects' ? Briefcase : ICON[g.id]
              return (
                <motion.nav key={g.id} aria-label={`${t.label}: ${g.title}`}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: gi * 0.06 }}
                  className="rounded-2xl p-5 flex flex-col h-full"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                  <div className="flex items-center gap-2.5 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                      <Icon size={16} style={{ color: 'var(--teal)' }} />
                    </span>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{g.title}</h3>
                  </div>
                  <ul className="space-y-0.5 flex-1">
                    {g.links.slice(0, MAX_LINKS).map(l => (
                      <li key={l.href}>
                        <Link href={l.href}
                          className="group flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 text-[13px] leading-snug transition-colors hover:bg-[rgba(203,1,1,0.05)]"
                          style={{ color: 'var(--text-mid)' }}>
                          <span className="group-hover:text-[var(--teal)] transition-colors">{l.label}</span>
                          <span className="text-[11px] font-semibold tabular-nums rounded-full px-2 py-0.5 flex-shrink-0 mt-px"
                            style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}>{l.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href={LISTING_BASE[t.kind]} className="mt-4 pt-3 text-xs font-semibold inline-flex items-center gap-1 group"
                    style={{ color: 'var(--teal)', borderTop: '1px solid var(--border-soft)' }}>
                    View all {t.label.toLowerCase()} <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.nav>
              )
            })}
          </div>
        ))}

        <div className="text-center mt-8">
          <Link href="/map-search" className="btn-outline btn-sm gap-1.5 inline-flex">
            Search everything on the map <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
