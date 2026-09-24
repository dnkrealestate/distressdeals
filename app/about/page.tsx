import type { Metadata } from 'next'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { ContentPageRenderer } from '@/components/ContentPageRenderer'
import { resolveSeo } from '@/lib/seo'
import { getContentPage } from '@/lib/contentPages'
import { PAGE_KEY, FALLBACK_CONTENT } from './fallbackContent'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo(PAGE_KEY, {
    title: 'About Distress Deals Dubai | Verified Distressed Sales',
    description: 'How Distress Deals Dubai sources verified distressed and below-market property across the UAE — one dedicated agent from first enquiry to handover.',
    path: '/about',
  })
}

export default async function AboutPage() {
  const content = await getContentPage(PAGE_KEY, FALLBACK_CONTENT)
  return (
    <div className="page overflow-x-hidden">
      <Navbar />
      <ContentPageRenderer content={content} />
      <Footer />
    </div>
  )
}
