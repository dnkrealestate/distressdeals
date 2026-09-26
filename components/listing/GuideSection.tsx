import { HOME_ICON_MAP } from '@/lib/homeIcons'
import type { ContentPageData } from '@/types'

// Long-form guide under the Buy / Rent / New Projects lists (content from Admin → Settings → Page content). A
// section whose heading mentions "questions" is an FAQ — shown as expandable answers and marked up as FAQPage.
const isFaq = (h: string) => /question|faq/i.test(h)
const paras = (s?: string) => (s || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)

export default function GuideSection({ content }: { content: ContentPageData | null }) {
  if (!content?.heroTitle) return null
  const faqs = content.sections.filter(s => isFaq(s.heading)).flatMap(s => s.cards || [])
  const faqJsonLd = faqs.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.title, acceptedAnswer: { '@type': 'Answer', text: f.body } })),
  } : null

  return (
    <section className="wrap pb-16" aria-labelledby="guide-title">
      {faqJsonLd && (
        // eslint-disable-next-line react/no-danger
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <article className="rounded-3xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <header className="p-6 md:p-10" style={{ background: 'linear-gradient(135deg, rgba(203,1,1,0.07), transparent 60%)', borderBottom: '1px solid var(--border)' }}>
          {content.heroEyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--teal)' }}>{content.heroEyebrow}</p>}
          <h2 id="guide-title" className="text-xl md:text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>{content.heroTitle}</h2>
          <p className="text-sm md:text-[15px] leading-relaxed max-w-4xl" style={{ color: 'var(--text-mid)' }}>{content.heroIntro}</p>
          {!!content.stats?.length && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {content.stats.map(s => (
                <div key={s.label} className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <p className="text-lg md:text-xl font-bold grad-text leading-tight">{s.value}</p>
                  <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </header>

        <div className="p-6 md:p-10 space-y-10">
          {content.sections.map((sec, i) => isFaq(sec.heading) ? (
            <div key={i}>
              <h3 className="text-base md:text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>{sec.heading}</h3>
              {paras(sec.body).map((p, j) => <p key={j} className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-mid)' }}>{p}</p>)}
              <div className="space-y-2.5">
                {(sec.cards || []).map((c, j) => (
                  <details key={j} className="group rounded-2xl px-5 py-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.title}</h4>
                      <span className="text-lg leading-none transition-transform group-open:rotate-45 flex-shrink-0" style={{ color: 'var(--teal)' }}>+</span>
                    </summary>
                    <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text-mid)' }}>{c.body}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : (
            <div key={i}>
              <h3 className="text-base md:text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>{sec.heading}</h3>
              {paras(sec.body).map((p, j) => <p key={j} className="text-sm leading-relaxed mb-3 max-w-4xl" style={{ color: 'var(--text-mid)' }}>{p}</p>)}
              {!!sec.cards?.length && (
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${sec.cards.length % 3 === 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 mt-4`}>
                  {sec.cards.map((c, j) => {
                    const Icon = c.icon ? HOME_ICON_MAP[c.icon] : null
                    return (
                      <div key={j} className="rounded-2xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2.5 mb-2">
                          {Icon && (
                            <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                              <Icon size={16} style={{ color: 'var(--teal)' }} />
                            </span>
                          )}
                          <div className="min-w-0">
                            {c.meta && <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--teal)' }}>{c.meta}</p>}
                            <h4 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>{c.title}</h4>
                          </div>
                        </div>
                        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-mid)' }}>{c.body}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
