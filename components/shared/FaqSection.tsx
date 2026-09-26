// Question-and-answer block for guide pages (developers, communities): visible on the page and marked up as
// schema.org FAQPage, so Google can show the answers as rich results. Server component — no JS shipped.
export interface Faq { q: string; a: string }

export default function FaqSection({ title, faqs }: { title: string; faqs: Faq[] }) {
  const list = faqs.filter(f => f.q && f.a)
  if (!list.length) return null
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <section className="pb-20">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="wrap max-w-4xl">
        <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>{title}</h2>
        <div className="space-y-2.5">
          {list.map((f, i) => (
            <details key={i} className="group card px-5 py-4" open={i === 0}>
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-semibold" style={{ color: 'var(--text)' }}>
                <h3 className="text-sm font-semibold">{f.q}</h3>
                <span className="text-lg leading-none transition-transform group-open:rotate-45 flex-shrink-0" style={{ color: 'var(--teal)' }}>+</span>
              </summary>
              <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text-mid)' }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
