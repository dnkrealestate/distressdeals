import type { Metadata } from 'next'
import ProjectsListClient from './ProjectsListClient'

export const metadata: Metadata = {
  title: 'Off-Plan Projects',
  description: "Explore Dubai's newest off-plan developments — payment plans, handover dates, and prices from leading developers.",
  alternates: { canonical: '/projects' },
  openGraph: {
    title: 'Off-Plan Projects',
    description: "Explore Dubai's newest off-plan developments — payment plans, handover dates, and prices from leading developers.",
    type: 'website',
    url: '/projects',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Off-Plan Projects',
    description: "Explore Dubai's newest off-plan developments.",
  },
}

export default function ProjectsPage() {
  return <ProjectsListClient />
}
