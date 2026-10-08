'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { propertyAPI, projectAPI } from '@/lib/api'
import { liveOffer } from '@/lib/offer'
import PropertyCard from '@/components/buyer/PropertyCard'
import ProjectCard from '@/components/buyer/ProjectCard'
import type { Property, Project } from '@/types'

// Home page: the listings and projects with a limited-time offer running right now, in one side-scrolling row.
// Renders nothing at all when there are no live offers, so the page is unchanged on ordinary days.
export default function HomeOffers() {
  const [items, setItems] = useState<({ kind: 'property'; item: Property } | { kind: 'project'; item: Project })[]>([])

  useEffect(() => {
    let alive = true
    const rows = (p: Promise<any>) => p.then(r => (r.data.success ? r.data.data.data || [] : [])).catch(() => [])
    Promise.all([rows(projectAPI.getAll({ offer: true, limit: 12 })), rows(propertyAPI.getAll({ offer: true, limit: 12 }))]).then(([projects, properties]) => {
      if (!alive) return
      const all = [
        ...projects.filter((p: Project) => liveOffer(p)).map((item: Project) => ({ kind: 'project' as const, item })),
        ...properties.filter((p: Property) => liveOffer(p)).map((item: Property) => ({ kind: 'property' as const, item })),
      ]
      // Offers ending soonest first; open-ended ones after.
      const end = (x: any) => (x.item.offer?.endsAt ? new Date(x.item.offer.endsAt).getTime() : Infinity)
      setItems(all.sort((a, b) => end(a) - end(b)).slice(0, 16))
    })
    return () => { alive = false }
  }, [])

  if (!items.length) return null
  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, rgba(203,1,1,0.05), transparent 70%)' }}>
      <div className="wrap">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="heading-lg flex items-center gap-2"><Sparkles size={22} style={{ color: 'var(--teal)' }} /> Best UAE Property Offers</h2>
            <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--text-muted)' }}>Exclusive deals, new launches &amp; investment opportunities across the UAE.</p>
          </div>
          <Link href="/for-sale?offer=true" className="btn-outline btn-sm gap-1.5">View all offers <ArrowRight size={13} /></Link>
        </div>
        <div className="flex gap-5 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 snap-x" style={{ scrollbarWidth: 'thin' }}>
          {items.map(x => (
            <div key={`${x.kind}-${x.item._id}`} className="w-[300px] sm:w-[340px] flex-shrink-0 snap-start">
              {x.kind === 'project' ? <ProjectCard project={x.item} markAsProject /> : <PropertyCard property={x.item} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
