import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import DevelopersListClient from './DevelopersListClient'

// Content is edited in the admin — rebuild this page from the latest data at most every 60 s (otherwise a production
// build freezes it at build time and edits never show).
export const revalidate = 60

// Editable in Admin → SEO ("Developers").
export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('developers', {
    title: 'Dubai Property Developers & Projects',
    description: 'Compare Dubai and UAE developers — Emaar, DAMAC, Sobha, Aldar, Nakheel and more. Live off-plan projects, starting prices, payment plans and handover dates.',
    path: '/developers',
  })
}

export default function DevelopersPage() {
  return <DevelopersListClient />
}
