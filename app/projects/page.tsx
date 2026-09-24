import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import ProjectsListClient from './ProjectsListClient'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo('projects', {
    title: 'Off-Plan Projects Dubai | Prices & Payment Plans',
    description: "Explore Dubai's newest off-plan developments — payment plans, handover dates, and prices from leading developers.",
    path: '/projects',
  })
  return { ...seo, twitter: { card: 'summary_large_image', title: seo.title as string, description: seo.description as string } }
}

export default function ProjectsPage() {
  return <ProjectsListClient />
}
