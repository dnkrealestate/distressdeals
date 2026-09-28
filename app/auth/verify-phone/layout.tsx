import type { Metadata } from 'next'

// Only ever opened by the mobile app — keep it out of search results.
export const metadata: Metadata = { title: 'Verify your number', robots: { index: false, follow: false } }

export default function VerifyPhoneLayout({ children }: { children: React.ReactNode }) {
  return children
}
