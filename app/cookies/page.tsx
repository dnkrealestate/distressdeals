import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { resolveSeo } from '@/lib/seo'

// Edited in the admin (Settings → Legal pages) — rebuilt from the latest version at most every 60 s.
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('cookies', {
    title: 'Cookie Policy | Distress Deals UAE',
    description: 'How Distress Deals UAE uses cookies, local storage, and analytics tools on our website.',
    path: '/cookies',
  })
}

export default function CookiesPage() {
  return <LegalPage pageKey="cookies" />
}
