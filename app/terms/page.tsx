import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { resolveSeo } from '@/lib/seo'

// Edited in the admin (Settings → Legal pages) — rebuilt from the latest version at most every 60 s.
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('terms', {
    title: 'Terms of Service | Distress Deals UAE',
    description: 'The terms that govern your use of the Distress Deals UAE website and mobile app.',
    path: '/terms',
  })
}

export default function TermsPage() {
  return <LegalPage pageKey="terms" />
}
