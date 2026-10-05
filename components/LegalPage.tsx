import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { contentPageAPI } from '@/lib/api'
import { LEGAL_DEFAULTS } from '@/lib/legalContent'

// A legal page (privacy / terms / cookies): the version saved in Admin → Settings → Legal pages when there is one,
// otherwise the built-in text. Server component — the text is in the HTML search engines and app stores read.
export default async function LegalPage({ pageKey }: { pageKey: string }) {
  const fallback = LEGAL_DEFAULTS[pageKey]
  let title = fallback.title, updated = fallback.updated, html = fallback.html
  try {
    const res = await contentPageAPI.get(pageKey)
    const saved = res.data.success ? res.data.data : null
    // Only a saved document replaces the built-in one — never a half-empty row.
    if (saved?.bodyHtml && saved.bodyHtml.replace(/<[^>]*>/g, '').trim()) {
      title = saved.heroTitle || fallback.title
      updated = saved.updatedLabel || ''
      html = saved.bodyHtml
    }
  } catch { /* the built-in text stays */ }

  return (
    <div className="page">
      <Navbar />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <p className="eyebrow mb-3">Legal</p>
          <h1 className="heading-xl mb-3">{title}</h1>
          {updated ? <p className="muted mb-10">Last updated: {updated}</p> : <div className="mb-10" />}
          {/* eslint-disable-next-line react/no-danger */}
          <div className="rich-content legal-content" style={{ color: 'var(--text-mid)' }} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </section>
      <Footer />
    </div>
  )
}
