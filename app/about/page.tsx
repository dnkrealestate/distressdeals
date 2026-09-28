import type { Metadata } from 'next'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { AboutPageView } from '@/components/about/AboutPageView'
import { resolveSeo } from '@/lib/seo'
import { getContentPage } from '@/lib/contentPages'
import { PAGE_KEY, FALLBACK_CONTENT } from './fallbackContent'

// Content is edited in the admin — rebuild this page from the latest data at most every 60 s (otherwise a production
// build freezes it at build time and edits never show).
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo(PAGE_KEY, {
    title: 'About Us | Buy Direct, Sell Direct — No Third-Party Agents',
    description: 'Distress Deals UAE: buy and sell property directly with owners and developers — verified listings, real prices and one in-house team from first enquiry to handover.',
    path: '/about',
  })
}

export default async function AboutPage() {
  const content = await getContentPage(PAGE_KEY, FALLBACK_CONTENT)
  return (
    <div className="page overflow-x-hidden">
      <Navbar />
      <AboutPageView content={content} />
      <Footer />
    </div>
  )
}
