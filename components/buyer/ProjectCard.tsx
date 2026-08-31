'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MapPin, BedDouble, Bath, Home, MessageCircleHeart, ArrowRight } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import ImageSlider from '@/components/buyer/ImageSlider'
import { SpecPill } from '@/components/buyer/SpecPill'
import ProjectInterestModal from '@/components/buyer/ProjectInterestModal'
import type { Project } from '@/types'

const STATUS_BADGE: Record<string, string> = {
  upcoming: 'badge-blue', under_construction: 'badge-teal', ready: 'badge-green', sold_out: 'badge-gray',
}

// Divided stat bar — label above value, columns split by a thin vertical
// rule, no icons or tinted backgrounds. Used for the card's three headline
// numbers (Launch Price / Payment Plan / Handover).
function StatBar({ items }: { items: { label: string; value: string }[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex items-stretch rounded-xl mb-4" style={{ border: '1px solid var(--border)' }}>
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex-1 min-w-0 px-3 py-2.5 text-center"
          style={i > 0 ? { borderLeft: '1px solid var(--border)' } : undefined}
        >
          <p className="text-[10px] mb-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
          <p className="text-sm font-bold truncate" style={{ color: 'var(--teal)' }}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}

// Location / bedrooms / bathrooms / type — icon + semibold text, plain
// (no tinted chip) so it reads as detail copy rather than another stat.
function DetailItem({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <Icon size={12} style={{ color: 'var(--teal)', opacity: 0.8, flexShrink: 0 }} />
      <span className="font-semibold truncate" style={{ color: 'var(--text-mid)' }}>{children}</span>
    </span>
  )
}

function DetailsRow({ project }: { project: Project }) {
  return (
    <div className="text-[0.9rem] mb-4">
      {/* Row 1 — location, full width */}
      <div className="mb-1.5">
        <DetailItem icon={MapPin}>{project.area}{project.community ? `, ${project.community}` : ''}</DetailItem>
      </div>
      {/* Row 2 — type / bedrooms / bathrooms, highlighted as tinted chips */}
      <div className="flex flex-wrap gap-2">
        {project.type && (
          <SpecPill icon={Home} size={13} bold>{project.type.charAt(0).toUpperCase() + project.type.slice(1)}</SpecPill>
        )}
        {project.bedrooms && <SpecPill icon={BedDouble} size={13} bold>{project.bedrooms}</SpecPill>}
        {project.bathrooms && <SpecPill icon={Bath} size={13} bold>{project.bathrooms}</SpecPill>}
      </div>
    </div>
  )
}

// Bayut-style developer badge — bottom-right of the image, a dark rectangle
// sized to show the WHOLE logo (object-contain, no crop into a circle),
// since developer logos are usually wide lockups rather than square marks.
function DeveloperBadge({ project }: { project: Project }) {
  if (!project.developerLogo) return null
  return (
    <div
      className="absolute bottom-3 right-3 z-10 rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ width: 72, height: 34, background: 'rgba(10,10,10,0.88)', boxShadow: '0 2px 10px rgba(0,0,0,0.25)', padding: '5px 8px' }}
    >
      <Image src={project.developerLogo} alt={project.developer} width={64} height={28} className="object-contain w-full h-full" />
    </div>
  )
}

export default function ProjectCard({
  project, delay = 0, layout = 'grid',
}: {
  project: Project
  delay?: number
  layout?: 'grid' | 'row'
}) {
  const router = useRouter()
  const [interestOpen, setInterestOpen] = useState(false)
  const images = project.images?.length ? project.images : (project.coverImage ? [{ url: project.coverImage }] : [])

  const openInterest = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setInterestOpen(true)
  }

  // The card is already one big link to the detail page — this button is
  // an explicit affordance for buyers who don't realise that, so it needs
  // its own handler (nesting a second <Link> inside the outer one is
  // invalid HTML) rather than relying on click-bubbling.
  const openDetails = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    router.push(`/projects/${project.slug}`)
  }

  const handover = [project.handoverQuarter, project.handoverYear].filter(Boolean).join(' ')

  const statItems = [
    { label: 'Launch Price', value: formatPrice(project.priceFrom) },
    project.paymentPlan && { label: 'Payment Plan', value: project.paymentPlan },
    handover && { label: 'Handover', value: handover },
  ].filter(Boolean) as { label: string; value: string }[]

  const interestModal = (
    <ProjectInterestModal
      projectId={project._id}
      projectTitle={project.title}
      open={interestOpen}
      onClose={() => setInterestOpen(false)}
    />
  )

  /* ── Bayut-style horizontal list row ─────────────────────── */
  if (layout === 'row') {
    return (
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }}>
        <Link href={`/projects/${project.slug}`}>
          <div className="prop-card group flex flex-col sm:flex-row">

            {/* Fixed width, full height — stretches to match whatever
                height the body content ends up needing (flex default
                align-items: stretch), instead of a fixed px height that
                can leave it shorter than a body with more detail rows. */}
            <div className="relative overflow-hidden flex-shrink-0 h-56 sm:h-auto sm:w-[340px] sm:self-stretch">
              <ImageSlider images={images} alt={project.title} sizes="(max-width:768px)100vw,340px" />
              <span className={cn('badge absolute top-3 left-3 z-10 text-[10px] capitalize', STATUS_BADGE[project.status])}>
                {project.status.replace('_', ' ')}
              </span>
              <DeveloperBadge project={project} />
            </div>

            <div className="flex flex-col flex-1 p-5 min-w-0">
              <h3 className="font-semibold text-[1.3rem] line-clamp-1 mb-1.5 leading-snug transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
                {project.title}
              </h3>

              <DetailsRow project={project} />

              <div className="max-w-sm">
                <StatBar items={statItems} />
              </div>

              <div className="flex items-center gap-2 mt-auto pt-3.5" style={{ borderTop: '1px solid var(--border-soft)' }}>
                <button onClick={openInterest} className="btn-primary btn-sm gap-1.5">
                  <MessageCircleHeart size={13} /> Interested
                </button>
                <button onClick={openDetails} className="btn-outline btn-sm gap-1.5">
                  More Details <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </Link>
        {interestModal}
      </motion.div>
    )
  }

  /* ── Grid card ────────────────────────────────────────────── */
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }}>
      <Link href={`/projects/${project.slug}`}>
        <div className="prop-card group h-full overflow-hidden">
          {/* Fixed-size image — never stretches or reflows with content. */}
          <div className="h-52 relative flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
            <ImageSlider images={images} alt={project.title} sizes="(max-width:768px)100vw,400px" />

            <span className={cn('badge absolute top-3 left-3 z-10 text-[10px] capitalize', STATUS_BADGE[project.status])}>
              {project.status.replace('_', ' ')}
            </span>

            <DeveloperBadge project={project} />
          </div>

          <div className="flex flex-col flex-1 p-5">
            <h3 className="font-semibold text-[1.3rem] mb-2 leading-snug line-clamp-2 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
              {project.title}
            </h3>

            <DetailsRow project={project} />

            <StatBar items={statItems} />

            <div className="flex items-center gap-2 mt-auto">
              <button onClick={openInterest} className="btn-primary btn-sm flex-1 justify-center gap-1.5">
                <MessageCircleHeart size={13} /> Interested
              </button>
              <button onClick={openDetails} className="btn-outline btn-sm flex-1 justify-center gap-1.5">
                More Details
              </button>
            </div>
          </div>
        </div>
      </Link>
      {interestModal}
    </motion.div>
  )
}
