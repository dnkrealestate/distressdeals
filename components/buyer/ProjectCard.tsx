'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, CalendarClock, Wallet2, MessageCircleHeart } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import ImageSlider from '@/components/buyer/ImageSlider'
import ProjectInterestModal from '@/components/buyer/ProjectInterestModal'
import type { Project } from '@/types'

const STATUS_BADGE: Record<string, string> = {
  upcoming: 'badge-blue', under_construction: 'badge-teal', ready: 'badge-green', sold_out: 'badge-gray',
}

export default function ProjectCard({ project, delay = 0 }: { project: Project; delay?: number }) {
  const [interestOpen, setInterestOpen] = useState(false)
  const images = project.images?.length ? project.images : (project.coverImage ? [{ url: project.coverImage }] : [])

  const openInterest = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setInterestOpen(true)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }}>
      <Link href={`/projects/${project.slug}`}>
        <div className="card-hover group h-full flex flex-col overflow-hidden">
          <div className="h-48 relative flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
            <ImageSlider images={images} alt={project.title} sizes="(max-width:768px)100vw,400px" />
            <span className={cn('badge absolute top-3 left-3 text-[10px] capitalize', STATUS_BADGE[project.status])}>
              {project.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex flex-col flex-1 p-5">
            {/* Developer — logo only shown when the developer actually has one on file */}
            <div className="flex items-center gap-2 mb-2">
              {project.developerLogo && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'rgba(49,178,222,0.08)', border: '1px solid rgba(49,178,222,0.20)' }}>
                  <Image src={project.developerLogo} alt={project.developer} width={28} height={28} className="object-cover w-full h-full" />
                </div>
              )}
              <p className="text-xs font-medium truncate" style={{ color: 'var(--teal)' }}>{project.developer}</p>
            </div>

            <h3 className="font-semibold text-base mb-2 leading-snug line-clamp-2 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
              {project.title}
            </h3>

            <p className="text-xs flex items-center gap-1.5 mb-3" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />{project.area}
              {project.bedrooms && <> · {project.bedrooms}</>}
            </p>

            {(project.paymentPlan || project.handoverQuarter || project.handoverYear) && (
              <div className="flex flex-col gap-1.5 mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                {project.paymentPlan && (
                  <span className="flex items-center gap-1.5">
                    <Wallet2 size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />
                    {project.paymentPlan}
                  </span>
                )}
                {(project.handoverQuarter || project.handoverYear) && (
                  <span className="flex items-center gap-1.5">
                    <CalendarClock size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />
                    Handover {project.handoverQuarter} {project.handoverYear}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 mt-auto pt-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <div>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Launch Price</p>
                <p className="text-sm font-bold grad-text">{formatPrice(project.priceFrom)}</p>
              </div>
              <button onClick={openInterest} className="btn-primary btn-sm gap-1.5 flex-shrink-0">
                <MessageCircleHeart size={13} /> Interested
              </button>
            </div>
          </div>
        </div>
      </Link>

      <ProjectInterestModal
        projectId={project._id}
        projectTitle={project.title}
        open={interestOpen}
        onClose={() => setInterestOpen(false)}
      />
    </motion.div>
  )
}
