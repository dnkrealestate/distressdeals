import Link from 'next/link'
import { Building2, KeyRound, Home, Sparkles, Calculator, BadgePercent, ClipboardCheck, Tag } from 'lucide-react'

// Property links for guide pages (places, areas, communities, buildings, articles): the searches people make next —
// buy, rent, off-plan, distress deals, valuation, mortgage — narrowed to the page's area when it has one. Plain
// links, so it works in server and client components alike.
const enc = encodeURIComponent

export default function RealEstateLinks({ area, emirate, near, className = '' }: {
  area?: string        // district to narrow the searches to, exactly as listings name it
  emirate?: string
  near?: string        // the place the page is about — used only in the heading ("Property near Burj Khalifa")
  className?: string
}) {
  const where = area || emirate || 'the UAE'
  const q = area ? `?area=${enc(area)}` : emirate ? `?emirate=${enc(emirate)}` : ''
  const and = q ? '&' : '?'
  const searches = [
    { href: `/for-sale${q}${and}type=apartment`, label: `Apartments for sale in ${where}`, icon: Building2 },
    { href: `/for-sale${q}${and}type=villa`, label: `Villas for sale in ${where}`, icon: Home },
    { href: `/for-sale${q}${and}type=townhouse`, label: `Townhouses for sale in ${where}`, icon: Home },
    { href: `/for-rent${q}`, label: `Properties for rent in ${where}`, icon: KeyRound },
    { href: `/projects${q}`, label: `Off-plan projects in ${where}`, icon: Sparkles },
    { href: `/for-sale${q}`, label: `All properties for sale in ${where}`, icon: Tag },
  ]
  const tools = [
    { href: '/distress-sale-dubai', label: 'Distress sale properties in Dubai', icon: BadgePercent },
    { href: '/free-property-valuation-dubai', label: 'Free property valuation', icon: ClipboardCheck },
    { href: '/mortgage', label: 'Mortgage calculator', icon: Calculator },
    { href: '/sell', label: 'Sell or list your property', icon: Tag },
    { href: '/developers', label: 'Property developers in the UAE', icon: Building2 },
    { href: '/areas', label: 'Area guides and property prices', icon: Home },
  ]
  return (
    <section className={`pb-14 ${className}`} aria-label="Property search">
      <div className="wrap">
        <div className="rounded-3xl p-5 md:p-7" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            {near ? `Property for sale and rent near ${near}` : `Real estate in ${where}`}
          </h2>
          <p className="text-sm mt-1 max-w-3xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Browse verified apartments, villas and townhouses for sale and rent{area || emirate ? ` in ${where}` : ''}, new off-plan projects direct from
            developers, and distress deals priced below the market — every listing is checked by our team before it goes live.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mt-5">
            <ul className="space-y-1">
              {searches.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="group flex items-center gap-2.5 py-1.5 text-sm" style={{ color: 'var(--text-mid)' }}>
                    <l.icon size={15} className="flex-shrink-0" style={{ color: 'var(--teal)' }} />
                    <span className="group-hover:underline">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-1">
              {tools.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="group flex items-center gap-2.5 py-1.5 text-sm" style={{ color: 'var(--text-mid)' }}>
                    <l.icon size={15} className="flex-shrink-0" style={{ color: 'var(--teal)' }} />
                    <span className="group-hover:underline">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
