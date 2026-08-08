'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Building2, MapPin, CalendarClock } from 'lucide-react'
import { projectAPI } from '@/lib/api'
import { formatPrice, cn } from '@/lib/utils'
import type { Project } from '@/types'

const STATUS_BADGE: Record<string, string> = {
  upcoming: 'badge-blue', under_construction: 'badge-teal', ready: 'badge-green', sold_out: 'badge-gray',
}

function ProjectCard({ project, delay }: { project: Project; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }}>
      <Link href={`/projects/${project.slug}`}>
        <div className="card-hover group h-full flex flex-col">
          <div className="h-44 relative flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
            {project.coverImage ? (
              <Image src={project.coverImage} alt={project.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px)100vw,400px" />
            ) : (
              <Building2 size={36} style={{ color: 'var(--teal)', opacity: 0.35 }} />
            )}
            <span className={cn('badge absolute top-3 left-3 text-[10px] capitalize', STATUS_BADGE[project.status])}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex flex-col flex-1 p-5">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--teal)' }}>{project.developer}</p>
            <h3 className="font-semibold text-base mb-2 leading-snug line-clamp-2 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
              {project.title}
            </h3>
            <p className="text-xs flex items-center gap-1.5 mb-4" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />{project.area}
            </p>
            <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <div>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>From</p>
                <p className="text-sm font-bold grad-text">{formatPrice(project.priceFrom)}</p>
              </div>
              {(project.handoverQuarter || project.handoverYear) && (
                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <CalendarClock size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />
                  {project.handoverQuarter} {project.handoverYear}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function FeaturedProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectAPI.getAll({ featured: 'true', limit: 3 })
      .then(r => { if (r.data.success) setProjects(r.data.data.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && projects.length === 0) return null

  return (
    <section className="section">
      <div className="wrap">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12 flex-wrap gap-4"
        >
          <div>
            <p className="eyebrow mb-3">New Developments</p>
            <h2 className="heading-lg mb-3">
              Featured <span className="grad-text">Off-Plan Projects</span>
            </h2>
            <p className="muted">Flexible payment plans from Dubai's leading developers</p>
          </div>
          <Link href="/projects" className="btn-ghost btn-sm hidden md:flex">
            View All <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array(3).fill(null).map((_, i) => <div key={i} className="shimmer h-72 rounded-2xl" />)
            : projects.map((project, i) => <ProjectCard key={project._id} project={project} delay={i * 0.08} />)
          }
        </div>

        <div className="flex justify-center mt-8 md:hidden">
          <Link href="/projects" className="btn-ghost btn-sm">
            View All Projects <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
