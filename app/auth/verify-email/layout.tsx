import type { Metadata } from 'next'

// An account page — its own title, and not shown in search results.
export const metadata: Metadata = { title: 'Verify Your Email', robots: { index: false, follow: true } }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
