import type { Metadata } from 'next'
import MortgagePageClient from './MortgagePageClient'

export const metadata: Metadata = {
  title: 'Mortgage & Rental Yield Calculators',
  description: 'Estimate your monthly mortgage payments and rental yield on any Dubai property, then get pre-approved through our in-house mortgage team — no third-party redirects.',
  alternates: { canonical: '/mortgage' },
  openGraph: {
    title: 'Mortgage & Rental Yield Calculators',
    description: 'Estimate your monthly mortgage payments and rental yield on any Dubai property.',
    type: 'website',
    url: '/mortgage',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mortgage & Rental Yield Calculators',
    description: 'Estimate your monthly mortgage payments and rental yield on any Dubai property.',
  },
}

export default function MortgagePage() {
  return <MortgagePageClient />
}
