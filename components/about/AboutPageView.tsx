import Link from 'next/link'
import { ArrowRight, BadgeCheck, Handshake, ShieldCheck, Users } from 'lucide-react'
import { HOME_ICON_MAP } from '@/lib/homeIcons'
import type { ContentPageData, ContentSection } from '@/types'

// The About page — its own design, driven entirely by the admin-editable content (Admin → Settings → About Page):
//  - a section whose cards are all "Step …" renders as a numbered process
//  - a founders / leadership / team section (or any cards with photos) renders as portrait cards
//  - a long text section with no cards renders as the story layout
//  - anything else is a feature grid. The stats strip is intentionally not shown.
const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
const paras = (s?: string) => decode(s || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
type Cards = NonNullable<ContentSection['cards']>

function FeatureGrid({ cards }: { cards: Cards }) {
  const cols = cards.length % 3 === 0 ? 'lg:grid-cols-3' : cards.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols} gap-5`}>
      {cards.map((c, i) => {
        const Icon = c.icon ? HOME_ICON_MAP[c.icon] : null
        return (
          <div key={i} className="rounded-2xl p-6 h-full transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            {Icon && (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--grad)', boxShadow: '0 8px 20px -8px rgba(203,1,1,0.55)' }}>
                <Icon size={21} color="#fff" />
              </div>
            )}
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text)' }}>{decode(c.title)}</h3>
            {c.body && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>{decode(c.body)}</p>}
          </div>
        )
      })}
    </div>
  )
}

function Steps({ cards }: { cards: Cards }) {
  return (
    <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c, i) => {
        const Icon = c.icon ? HOME_ICON_MAP[c.icon] : null
        return (
          <li key={i} className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white" style={{ background: 'var(--grad)' }}>{i + 1}</span>
              {Icon && <Icon size={20} style={{ color: 'var(--teal)', opacity: 0.8 }} />}
            </div>
            {c.meta && <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--teal)' }}>{decode(c.meta)}</p>}
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text)' }}>{decode(c.title)}</h3>
            {c.body && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>{decode(c.body)}</p>}
          </li>
        )
      })}
    </ol>
  )
}

// Founders / leadership: portrait (or initials until a photo is uploaded in the admin), name, role, short bio.
function TeamGrid({ cards }: { cards: Cards }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${cards.length >= 3 ? 'lg:grid-cols-3' : ''} gap-6 max-w-4xl mx-auto`}>
      {cards.map((c, i) => (
        <div key={i} className="rounded-3xl overflow-hidden h-full flex flex-col"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 12px 32px -18px rgba(15,23,42,0.25)' }}>
          <div className="relative aspect-[4/5] w-full" style={{ background: 'linear-gradient(145deg, #0B1220, #1E293B)' }}>
            {c.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.image} alt={decode(c.title)} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-extrabold text-white" style={{ background: 'var(--grad)' }}>
                  {initials(decode(c.title))}
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-5 pt-16" style={{ background: 'linear-gradient(transparent, rgba(8,12,24,0.85))' }}>
              <h3 className="text-xl font-bold text-white">{decode(c.title)}</h3>
              {c.meta && <p className="text-sm font-semibold mt-0.5" style={{ color: '#FCA5A5' }}>{decode(c.meta)}</p>}
            </div>
          </div>
          {c.body && <p className="p-5 text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>{decode(c.body)}</p>}
        </div>
      ))}
    </div>
  )
}

export function AboutPageView({ content }: { content: ContentPageData }) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden style={{ background: 'radial-gradient(ellipse at 15% 0%, rgba(203,1,1,0.12), transparent 55%), radial-gradient(ellipse at 90% 20%, rgba(253,113,71,0.12), transparent 50%), var(--bg)' }} />
        <div className="wrap relative pt-14 pb-16 md:pt-20 md:pb-24 text-center">
          {content.heroEyebrow && <p className="eyebrow mb-4">{decode(content.heroEyebrow)}</p>}
          <h1 className="heading-xl mb-6 max-w-4xl mx-auto">{decode(content.heroTitle)}</h1>
          <p className="text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-8" style={{ color: 'var(--text-mid)' }}>{decode(content.heroIntro)}</p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Link href="/for-sale" className="btn-primary gap-2">Buy direct <ArrowRight size={16} /></Link>
            <Link href="/sell" className="btn-outline gap-2">Sell direct <Handshake size={16} /></Link>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              { icon: Users, t: 'No third-party agents' },
              { icon: BadgeCheck, t: 'Every listing verified' },
              { icon: ShieldCheck, t: 'One in-house team, start to finish' },
            ].map(({ icon: Icon, t }) => (
              <span key={t} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <Icon size={15} style={{ color: 'var(--teal)' }} /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sections */}
      {content.sections.map((section, i) => {
        const cards = section.cards || []
        const body = paras(section.body)
        const alt = i % 2 === 0 ? 'section section-alt' : 'section'

        // A long story with no cards: heading on the left, the story on the right.
        if (!cards.length && body.length > 1) {
          return (
            <section key={i} className={alt}>
              <div className="wrap grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
                <div className="lg:sticky lg:top-28">
                  <p className="eyebrow mb-3">Our story</p>
                  <h2 className="heading-lg mb-5">{decode(section.heading)}</h2>
                  <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--grad)' }} />
                </div>
                <div className="space-y-5">
                  {body.map((p, j) => (
                    <p key={j} className={j === 0 ? 'text-lg md:text-xl leading-relaxed font-medium' : 'leading-relaxed'}
                      style={{ color: j === 0 ? 'var(--text)' : 'var(--text-mid)' }}>{p}</p>
                  ))}
                </div>
              </div>
            </section>
          )
        }

        const steps = cards.length > 0 && cards.every(c => /step/i.test(c.meta || ''))
        const team = cards.length > 0 && (/founder|leadership|team/i.test(section.heading) || cards.some(c => c.image))
        return (
          <section key={i} className={alt}>
            <div className="wrap">
              <div className="text-center max-w-3xl mx-auto mb-10">
                <h2 className="heading-lg mb-3">{decode(section.heading)}</h2>
                {body.map((p, j) => <p key={j} className="leading-relaxed mb-2" style={{ color: 'var(--text-mid)' }}>{p}</p>)}
              </div>
              {cards.length > 0 && (team ? <TeamGrid cards={cards} /> : steps ? <Steps cards={cards} /> : <FeatureGrid cards={cards} />)}
            </div>
          </section>
        )
      })}

      {/* Closing call to action */}
      {content.ctaTitle && (
        <section className="section">
          <div className="wrap">
            <div className="relative rounded-3xl p-10 md:p-16 text-center overflow-hidden" style={{ background: 'var(--grad)' }}>
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} aria-hidden />
              <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} aria-hidden />
              <h2 className="heading-lg mb-4 relative z-10 text-white">{decode(content.ctaTitle)}</h2>
              {content.ctaBody && <p className="mb-8 max-w-xl mx-auto relative z-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>{decode(content.ctaBody)}</p>}
              <div className="relative z-10 flex flex-wrap justify-center gap-3">
                {content.ctaButtonLabel && content.ctaButtonHref && (
                  <Link href={content.ctaButtonHref} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-bold" style={{ background: '#fff', color: 'var(--teal)' }}>
                    {decode(content.ctaButtonLabel)} <ArrowRight size={16} />
                  </Link>
                )}
                <Link href="/sell" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-bold text-white" style={{ border: '2px solid rgba(255,255,255,0.7)' }}>
                  List your property
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
