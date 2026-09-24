import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import MortgagePageClient from './MortgagePageClient'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo('mortgage', {
    title: 'Dubai Mortgage & Rental Yield Calculator',
    description: 'Estimate your monthly mortgage payments and rental yield on any Dubai property, then get pre-approved through our in-house mortgage team — no third-party redirects.',
    path: '/mortgage',
  })
  return { ...seo, twitter: { card: 'summary_large_image', title: seo.title as string, description: seo.description as string } }
}

export default function MortgagePage() {
  return <MortgagePageClient />
}
