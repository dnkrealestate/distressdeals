import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import BuildingsListClient from './BuildingsListClient'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('buildings', {
    title: 'Dubai Buildings & Towers Directory',
    description: 'Building-level guides for Dubai towers and developments — amenities, developer, and year built.',
    path: '/buildings',
  })
}

export default function BuildingsPage() {
  return <BuildingsListClient />
}
