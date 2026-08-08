import type { Metadata } from 'next'
import DevelopersListClient from './DevelopersListClient'

export const metadata: Metadata = {
  title: 'Dubai Real Estate Developers',
  description: "Browse off-plan projects by developer — Emaar, Damac, and more — all managed end-to-end by our own in-house team.",
  alternates: { canonical: '/developers' },
  openGraph: {
    title: 'Dubai Real Estate Developers',
    description: "Browse off-plan projects by developer, all managed end-to-end by our own in-house team.",
    type: 'website',
    url: '/developers',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dubai Real Estate Developers',
    description: 'Browse off-plan projects by developer.',
  },
}

export default function DevelopersPage() {
  return <DevelopersListClient />
}
