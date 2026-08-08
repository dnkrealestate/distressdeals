import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, MapPin, Layers } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ProjectCard from '@/components/buyer/ProjectCard'
import { projectAPI, developerAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { DeveloperWithStats, Project } from '@/types'

const SITE_URL = 'https://distressdeals.ae'

const getDeveloper = cache(async (slug: string): Promise<DeveloperWithStats | null> => {
  try {
    const res = await developerAPI.getBySlug(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

const getDeveloperProjects = cache(async (developer: string): Promise<Project[]> => {
  try {
    const res = await projectAPI.getAll({ developer, limit: 100 })
    return res.data.success ? res.data.data.data || [] : []
  } catch {
    return []
  }
})

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const dev = await getDeveloper(params.slug)
  if (!dev) return { title: 'Developer Not Found' }

  const title = `${dev.name} — Off-Plan Projects in Dubai`
  const description = dev.description || `${dev.projectCount} project${dev.projectCount === 1 ? '' : 's'} by ${dev.name}, starting from ${formatPrice(dev.minPriceFrom)}. Every project managed end-to-end by our own in-house team.`

  return {
    title,
    description,
    alternates: { canonical: `/developers/${dev.slug}` },
    openGraph: { title, description, type: 'website', url: `/developers/${dev.slug}` },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function DeveloperDetailPage({ params }: { params: { slug: string } }) {
  const dev = await getDeveloper(params.slug)
  if (!dev) notFound()

  const projects = await getDeveloperProjects(dev.name)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Developers', item: `${SITE_URL}/developers` },
      { '@type': 'ListItem', position: 3, name: dev.name, item: `${SITE_URL}/developers/${dev.slug}` },
    ],
  }
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: dev.name,
    ...(dev.website ? { url: dev.website } : {}),
    ...(dev.logo ? { logo: dev.logo } : {}),
  }

  return (
    <div className="page overflow-x-hidden">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      <Navbar />

      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }} />
        <div className="wrap relative z-10">
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            <Link href="/developers" className="hover:underline">Developers</Link> / {dev.name}
          </p>
          <div className="flex items-center gap-4 mb-3">
            {dev.logo ? (
              <span className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <Image src={dev.logo} alt={dev.name} width={56} height={56} className="object-contain w-full h-full p-2" />
              </span>
            ) : (
              <Building2 size={28} style={{ color: 'var(--teal)' }} />
            )}
            <h1 className="heading-xl">{dev.name}</h1>
          </div>
          <p className="text-base max-w-2xl leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            {dev.description || `${dev.projectCount} project${dev.projectCount === 1 ? '' : 's'} managed end-to-end by our own in-house team — not the developer's own sales funnel.`}
          </p>
          <div className="flex items-center gap-4 text-xs mb-10 flex-wrap" style={{ color: 'var(--text-muted)' }}>
            {dev.headquarters && <span>{dev.headquarters}</span>}
            {dev.establishedYear && <span>Est. {dev.establishedYear}</span>}
            {dev.website && (
              <a href={dev.website} target="_blank" rel="noopener noreferrer nofollow" className="hover:underline" style={{ color: 'var(--teal)' }}>
                Visit website ↗
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div className="stat-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(49,178,222,0.10)', border: '1px solid rgba(49,178,222,0.20)' }}>
                <Layers size={16} style={{ color: 'var(--teal)' }} />
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{dev.projectCount}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Active Projects</p>
            </div>
            <div className="stat-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(49,178,222,0.10)', border: '1px solid rgba(49,178,222,0.20)' }}>
                <MapPin size={16} style={{ color: 'var(--teal)' }} />
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{dev.minPriceFrom > 0 ? formatPrice(dev.minPriceFrom) : '—'}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Starting From</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section pb-20">
        <div className="wrap">
          <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text)' }}>
            Projects by {dev.name}
          </h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, i) => <ProjectCard key={project._id} project={project} delay={i * 0.05} />)}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No live projects from {dev.name} right now.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
