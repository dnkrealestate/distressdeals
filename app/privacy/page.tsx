import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { resolveSeo } from '@/lib/seo'

// Edited in the admin (Settings → Legal pages) — rebuilt from the latest version at most every 60 s.
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('privacy', {
    title: 'Privacy Policy | Distress Deals UAE',
    description: 'How Distress Deals UAE collects, uses, and protects your personal information across our website and mobile app.',
    path: '/privacy',
  })
}

export default function PrivacyPage() {
  return <LegalPage pageKey="privacy" />
}
