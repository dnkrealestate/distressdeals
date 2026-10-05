import Link from 'next/link'
import { ArrowRight, Landmark, Layers, MapPin } from 'lucide-react'
import type { CommunityContentWithStats, Developer } from '@/types'

// Homepage: property by area, by community and by developer. The lists arrive from the server with the page, so every
// link and its wording is in the HTML search engines read — each one says what the page behind it is about
// ("Property for sale in Dubai Marina", "Emaar projects") instead of a bare name.
type Dev = Developer & { projectCount?: number }
// An area with a page of its own (GET /properties/areas): how many listings and new projects it has right now.
export interface HomeArea { area: string; slug: string; count?: number; projectCount?: number }
const listedIn = (a: HomeArea) => {
  const n = (a.count || 0) + (a.projectCount || 0)
  return n ? `${n} listed` : ''
}
const enc = encodeURIComponent
const chip = { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' } as const

// Community links: a different search phrase each time rather than one repeated 48 times. Every phrase is something
// the community guide actually covers — living there, what is for sale and rent, and prices from our listings.
const COMMUNITY_PHRASES: ((name: string) => string)[] = [
  n => `Property for sale in ${n}`,
  n => `Homes for rent in ${n}`,
  n => `Buy property in ${n}`,
  n => `${n} real estate`,
  n => `Living in ${n}`,
  n => `${n} property prices`,
  n => `Invest in ${n} property`,
  n => `${n} community guide`,
]

function Head({ icon: Icon, eyebrow, title, accent, text, href, cta }: { icon: any; eyebrow: string; title: string; accent: string; text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-6">
      <div className="max-w-2xl">
        <p className="eyebrow mb-2 flex items-center gap-1.5"><Icon size={13} /> {eyebrow}</p>
        <h2 className="heading-md mb-2">{title} <span className="grad-text">{accent}</span></h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p>
      </div>
      <Link href={href} className="btn-ghost btn-sm gap-1.5 flex-shrink-0">{cta} <ArrowRight size={13} /></Link>
    </div>
  )
}

export default function HomeKeywordSections({ areas, communities, developers }: { areas: HomeArea[]; communities: CommunityContentWithStats[]; developers: Dev[] }) {
  if (!areas.length && !communities.length && !developers.length) return null
  const topAreas = areas.slice(0, 9), moreAreas = areas.slice(9, 45)
  const topDevs = developers.slice(0, 12), moreDevs = developers.slice(12, 48)

  return (
    <section className="section" aria-label="Property by area, community and developer">
      <div className="wrap space-y-16">

        {areas.length > 0 && (
          <div>
            <Head icon={MapPin} eyebrow="Property by area" title="Property for Sale & Rent in" accent="Dubai & UAE Areas"
              text="Apartments, villas and townhouses for sale and rent, plus off-plan projects, in the most searched areas of Dubai, Abu Dhabi, Sharjah and the Northern Emirates — each with its own area guide."
              href="/areas" cta={`All ${areas.length} area guides`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topAreas.map(a => (
                <div key={a.slug} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="text-sm font-semibold">
                      <Link href={`/areas/${a.slug}`} className="hover:text-[var(--teal)] transition-colors" style={{ color: 'var(--text)' }}>Property for sale in {a.area}</Link>
                    </h3>
                    {listedIn(a) && <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 flex-shrink-0" style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}>{listedIn(a)}</span>}
                  </div>
                  <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Link href={`/for-sale?area=${enc(a.area)}&type=apartment`} className="hover:underline">Apartments for sale</Link>
                    <Link href={`/for-sale?area=${enc(a.area)}&type=villa`} className="hover:underline">Villas for sale</Link>
                    <Link href={`/for-rent?area=${enc(a.area)}`} className="hover:underline">Property for rent</Link>
                    <Link href={`/projects?area=${enc(a.area)}`} className="hover:underline">Off-plan projects</Link>
                  </p>
                </div>
              ))}
            </div>
            {moreAreas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {moreAreas.map(a => <Link key={a.slug} href={`/areas/${a.slug}`} className="px-3 py-1.5 rounded-full text-xs font-medium" style={chip}>{a.area} property</Link>)}
              </div>
            )}
          </div>
        )}

        {communities.length > 0 && (
          <div>
            <Head icon={Layers} eyebrow="Property by community" title="Popular Communities to" accent="Buy & Rent Property"
              text="Community guides for buyers, tenants and investors — what each community is like to live in, the property types on offer and what is for sale and rent there now."
              href="/communities" cta={`All ${communities.length} communities`} />
            <div className="flex flex-wrap gap-2">
              {communities.slice(0, 48).map((c, i) => (
                <Link key={c._id} href={`/communities/${c.slug}`} className="px-3 py-1.5 rounded-full text-xs font-medium" style={chip}
                  title={`${c.name}${c.area && c.area !== c.name ? `, ${c.area}` : ''} — community guide, property for sale and rent`}>
                  {COMMUNITY_PHRASES[i % COMMUNITY_PHRASES.length](c.name)}{c.area && c.area !== c.name ? <span style={{ color: 'var(--text-muted)' }}>, {c.area}</span> : null}
                </Link>
              ))}
            </div>
          </div>
        )}

        {developers.length > 0 && (
          <div>
            <Head icon={Landmark} eyebrow="Property by developer" title="Top Property Developers in" accent="Dubai & the UAE"
              text="Off-plan and ready projects from the UAE's leading real estate developers — launches, starting prices, payment plans and handover dates, direct from the developer."
              href="/developers" cta={`All ${developers.length} developers`} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {topDevs.map(d => (
                <Link key={d._id} href={`/developers/${d.slug}`} className="card-hover light-card group p-4 flex flex-col items-center text-center gap-2">
                  {/* Every logo sits in the same 88×32 box, whatever its own shape, so the row looks even. */}
                  <span className="w-[88px] h-8 flex items-center justify-center">
                    {d.logo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={d.logo} alt={`${d.name} — property developer in the UAE`} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                      : <Landmark size={22} style={{ color: 'var(--teal)', opacity: 0.4 }} />}
                  </span>
                  <h3 className="text-xs font-semibold leading-snug group-hover:text-[var(--teal)] transition-colors" style={{ color: 'var(--text)' }}>{d.name} projects</h3>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {d.projectCount ? `${d.projectCount} project${d.projectCount === 1 ? '' : 's'} listed` : 'Developer guide'}
                  </span>
                </Link>
              ))}
            </div>
            {moreDevs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {moreDevs.map(d => <Link key={d._id} href={`/developers/${d.slug}`} className="px-3 py-1.5 rounded-full text-xs font-medium" style={chip}>{d.name} projects</Link>)}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
