import type { Metadata } from 'next'

// A redirect/verification step, not content — keep it out of search results.
export const metadata: Metadata = { title: 'List your property', robots: { index: false, follow: true } }

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children
}
