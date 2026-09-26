import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { projectAPI } from '@/lib/api'
import ProjectDetailClient from './ProjectDetailClient'
import type { Project } from '@/types'

const getProject = cache(async (slug: string): Promise<Project | null> => {
  try {
    const res = await projectAPI.getOne(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const project = await getProject(params.slug)
  if (!project) return { title: 'Project Not Found' }

  const title = project.metaTitle?.trim() || `${project.title} by ${project.developer}`
  const description = project.metaDescription?.trim()
    || `Starting from ${project.priceFrom.toLocaleString()} AED in ${project.area}, Dubai. ${project.bedrooms ? `${project.bedrooms} · ` : ''}Handover ${project.handoverQuarter || ''} ${project.handoverYear || ''}.`.trim()
  const images = project.coverImage ? [{ url: project.coverImage }] : undefined

  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { title, description, type: 'website', url: `/projects/${project.slug}`, images },
    twitter: { card: 'summary_large_image', title, description, images: project.coverImage ? [project.coverImage] : undefined },
  }
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = await getProject(params.slug)
  if (!project) notFound()
  // Opened by an address it had before being renamed — send visitors (and search engines) to the current one.
  if (project.slug && project.slug !== params.slug.toLowerCase()) permanentRedirect(`/projects/${project.slug}`)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: project.title,
    description: project.description.replace(/<[^>]*>/g, '').slice(0, 300),
    image: project.coverImage ? [project.coverImage, ...project.images.map(i => i.url)] : project.images.map(i => i.url),
    address: { '@type': 'PostalAddress', addressLocality: project.area, addressRegion: project.emirate, addressCountry: 'AE' },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.distressdealsuae.com' },
      { '@type': 'ListItem', position: 2, name: 'Projects', item: 'https://www.distressdealsuae.com/projects' },
      { '@type': 'ListItem', position: 3, name: project.title, item: `https://www.distressdealsuae.com/projects/${project.slug}` },
    ],
  }

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProjectDetailClient project={project} />
    </>
  )
}
