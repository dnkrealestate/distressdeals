import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HOME_ICON_MAP } from '@/lib/homeIcons'
import type { ContentPageData } from '@/types'

// Renders the hero, optional stats strip, sections (each an optional prose paragraph and/or a card grid), and
// closing CTA for any page built on the generic ContentPage shape — the 5 distress-sale landing pages and
// About all share this one renderer, driven entirely by admin-editable data (see
// app/admin/(dashboard)/settings/content/[pageKey]). No client JS needed; this is plain server-renderable markup.
export function ContentPageRenderer({ content }: { content: ContentPageData }) {
  return (
    <>
      <section className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          {content.heroEyebrow && <p className="eyebrow mb-3">{content.heroEyebrow}</p>}
          <h1 className="heading-xl mb-6">{content.heroTitle}</h1>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-mid)' }}>{content.heroIntro}</p>
        </div>
      </section>

      {!!content.stats?.length && (
        <section className="py-10" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
          <div className="wrap">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {content.stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-extrabold grad-text mb-1">{s.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.sections.map((section, i) => (
        <section key={i} className={i % 2 === 0 ? 'section section-alt' : 'section'}>
          <div className="wrap" style={{ maxWidth: 820 }}>
            <h2 className="heading-lg mb-6">{section.heading}</h2>
            {section.body && <p className="mb-8 leading-relaxed" style={{ color: 'var(--text-mid)' }}>{section.body}</p>}
            {!!section.cards?.length && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {section.cards.map((card, ci) => {
                  const Icon = card.icon ? HOME_ICON_MAP[card.icon] : null
                  return (
                    <div key={ci} className="card p-6">
                      {Icon && (
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.18)' }}>
                          <Icon size={20} style={{ color: 'var(--teal)' }} />
                        </div>
                      )}
                      {card.meta && <p className="text-xs font-semibold mb-1" style={{ color: 'var(--teal)' }}>{card.meta}</p>}
                      <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text)' }}>{card.title}</h3>
                      {card.body && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{card.body}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      ))}

      {content.ctaTitle && (
        <section className="section">
          <div className="wrap">
            <div className="relative rounded-3xl p-10 md:p-16 text-center overflow-hidden" style={{ background: 'var(--grad)' }}>
              <h2 className="heading-lg mb-4 relative z-10 text-white">{content.ctaTitle}</h2>
              {content.ctaBody && (
                <p className="mb-8 max-w-md mx-auto relative z-10 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{content.ctaBody}</p>
              )}
              {content.ctaButtonLabel && content.ctaButtonHref && (
                <Link
                  href={content.ctaButtonHref}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold relative z-10"
                  style={{ background: '#fff', color: 'var(--teal)' }}
                >
                  {content.ctaButtonLabel} <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
