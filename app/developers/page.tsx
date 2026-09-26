import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import DevelopersListClient from './DevelopersListClient'

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
