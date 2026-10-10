import type { Metadata } from 'next'

// A redirect/verification step, not content — keep it out of search results.
export const metadata: Metadata = {
  title: 'List Your Property for Sale or Rent in Dubai & UAE',
  description: 'List your property with Distress Deals UAE: verified listing, real buyers and tenants, and one dedicated agent handling every enquiry — no third-party brokers.',
  alternates: { canonical: '/sell' },
  robots: { index: true, follow: true },
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children
}
