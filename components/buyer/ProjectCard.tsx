'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MapPin, BedDouble, Bath, Home, Maximize2, Wallet, CalendarClock, MessageCircleHeart, ArrowRight, Heart, GitCompare } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import ImageSlider from '@/components/buyer/ImageSlider'
import { SpecPill } from '@/components/buyer/SpecPill'
import ProjectInterestModal from '@/components/buyer/ProjectInterestModal'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useProjectCompareStore } from '@/store/projectCompareStore'
import type { Project } from '@/types'

// Payment plan + handover — plain icon + value + label, like the detail copy above it (no boxed stat bar).
function PlanRow({ items }: { items: { icon: any; label: string; value: string }[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-4 text-[0.82rem] sm:text-[0.88rem]">
      {items.map(({ icon: Icon, label, value }) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <Icon size={14} style={{ color: 'var(--teal)', opacity: 0.85, flexShrink: 0 }} />
          <span className="font-bold" style={{ color: 'var(--text)' }}>{value}</span>
          <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        </span>
      ))}
    </div>
  )
}

// "3" → "3 Bed", "1-3" → "1-3 Bed"; words like "Studio" or an existing "Bed" are left as they are.
export const withUnit = (v: string | undefined, unit: string) => {
  const t = (v || '').trim()
  if (!t) return ''
  return /^[\d\s,.+\-–&]+$/.test(t) || /^\d+\s*to\s*\d+$/i.test(t) ? `${t} ${unit}` : t
}
// Size range as entered ("2,437sqft", "400", "750 - 1,200 sq ft") → "2,437 sqft".
export const withSqft = (v?: string) => {
  const t = (v || '').replace(/\s*(sq\.?\s*ft|sqft|square\s*feet)\.?/gi, '').trim()
  return t ? `${t} sqft` : ''
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
    <div className="text-[0.78rem] sm:text-[0.9rem] mb-4">
      {/* Row 1 — location, full width */}
      <div className="mb-1.5">
        <DetailItem icon={MapPin}>{project.area}{project.community ? `, ${project.community}` : ''}</DetailItem>
      </div>
      {/* Row 2 — type / bedrooms / bathrooms, highlighted as tinted chips */}
      <div className="flex flex-wrap gap-2">
        {project.type && (
          <SpecPill icon={Home} size={13} bold>{project.type.charAt(0).toUpperCase() + project.type.slice(1)}</SpecPill>
        )}
        {project.bedrooms && <SpecPill icon={BedDouble} size={13} bold>{withUnit(project.bedrooms, 'Bed')}</SpecPill>}
        {project.bathrooms && <SpecPill icon={Bath} size={13} bold>{withUnit(project.bathrooms, 'Bath')}</SpecPill>}
        {withSqft(project.sizeRange) && <SpecPill icon={Maximize2} size={13} bold>{withSqft(project.sizeRange)}</SpecPill>}
      </div>
    </div>
  )
}

// Developer logo — bottom-right of the image, sized to show the WHOLE logo (object-contain), since developer logos
// are usually wide lockups. The colour logo sits on a light chip; only a white-only logo needs the dark one.
function DeveloperBadge({ project }: { project: Project }) {
  const logo = project.developerLogo || project.developerLogoWhite
  if (!logo) return null
  const light = !!project.developerLogo
  return (
    <div
      className="absolute bottom-3 right-3 z-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ width: 76, height: 34, background: light ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.75)', boxShadow: '0 2px 10px rgba(0,0,0,0.18)', padding: '5px 8px' }}
    >
      <Image src={logo} alt={project.developer} width={64} height={28} className="object-contain w-full h-full" />
    </div>
  )
}

// Heart + compare, same behaviour as on property cards.
function CardActions({ project, onImage }: { project: Project; onImage?: boolean }) {
  const { isAuthenticated } = useAuthStore()
  const fav = useFavoritesStore(s => s.projectFavorites.includes(project._id))
  const toggleFav = useFavoritesStore(s => s.toggleProjectFavorite)
  const inCmp = useProjectCompareStore(s => s.projects.some(p => p._id === project._id))
  const toggleCmp = useProjectCompareStore(s => s.toggle)

  const onFav = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) { window.location.href = '/auth/login'; return }
    toggleFav(project._id)
  }
  const onCmp = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); toggleCmp(project) }

  const base = 'w-8 h-8 rounded-full flex items-center justify-center transition-colors'
  const style = (active: boolean, color: string) => onImage
    ? { background: active ? color : 'rgba(255,255,255,0.92)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
    : { background: active ? `${color}1A` : 'var(--bg-alt)', border: '1px solid var(--border)' }
  const iconColor = (active: boolean, color: string) => onImage ? (active ? '#fff' : '#334155') : (active ? color : 'var(--text-muted)')

  return (
    <div className={onImage ? 'absolute top-3 right-3 z-10 flex gap-1.5' : 'flex items-center gap-1.5 flex-shrink-0'}>
      <motion.button whileTap={{ scale: 0.82 }} onClick={onFav} className={base} style={style(fav, '#F43F5E')}
        aria-label={fav ? 'Remove from favorites' : 'Add to favorites'} title={fav ? 'Saved' : 'Save'}>
        <Heart size={14} fill={fav ? (onImage ? '#fff' : '#F43F5E') : 'none'} style={{ color: iconColor(fav, '#F43F5E') }} />
      </motion.button>
      <motion.button whileTap={{ scale: 0.82 }} onClick={onCmp} className={base} style={style(inCmp, '#CB0101')}
        aria-label={inCmp ? 'Remove from compare' : 'Add to compare'} title={inCmp ? 'In compare' : 'Compare'}>
        <GitCompare size={14} style={{ color: iconColor(inCmp, '#CB0101') }} />
      </motion.button>
    </div>
  )
}

function StartingPrice({ project, size }: { project: Project; size: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Starting Price</p>
      <p className={`${size} font-bold grad-text leading-tight`}>{formatPrice(project.priceFrom)}</p>
    </div>
  )
}

// "by DAMAC" under the project name.
function ByDeveloper({ project }: { project: Project }) {
  if (!project.developer) return null
  return (
    <p className="text-xs mb-2.5 truncate" style={{ color: 'var(--text-muted)' }}>
      by <span className="font-semibold" style={{ color: 'var(--teal)' }}>{project.developer}</span>
    </p>
  )
}

// Top-left image badges. In a list that mixes projects with resale listings (the Buy page), `markAsProject` adds a
// "New Project" label so the two are easy to tell apart.
function Badges({ project, markAsProject }: { project: Project; markAsProject?: boolean }) {
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
      {markAsProject && (
        <span className="badge text-[10px] font-semibold" style={{ background: 'rgba(168,85,247,0.92)', color: '#fff', border: 'none' }}>
          New Project
        </span>
      )}
      {/* Solid white so it stays readable on any photo (the tinted status styles vanish on busy images). */}
      <span
        className="badge text-[10px] capitalize"
        style={{ background: 'rgba(255,255,255,0.94)', color: '#0F172A', border: 'none' }}
      >
        {project.status.replace('_', ' ')}
      </span>
    </div>
  )
}

export default function ProjectCard({
  project, delay = 0, layout = 'grid', markAsProject = false,
}: {
  project: Project
  delay?: number
  layout?: 'grid' | 'row'
  markAsProject?: boolean
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

  // The price leads the card ("Starting Price"); this line carries the plan and handover.
  const planItems = [
    project.paymentPlan && { icon: Wallet, label: 'Payment Plan', value: project.paymentPlan },
    handover && { icon: CalendarClock, label: 'Handover', value: handover },
  ].filter(Boolean) as { icon: any; label: string; value: string }[]

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
              <Badges project={project} markAsProject={markAsProject} />
              <DeveloperBadge project={project} />
            </div>

            <div className="flex flex-col flex-1 p-5 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <StartingPrice project={project} size="text-2xl" />
                <CardActions project={project} />
              </div>
              <h3 className="font-semibold text-base sm:text-[1.1rem] line-clamp-1 mb-0.5 leading-snug transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
                {project.title}
              </h3>
              <ByDeveloper project={project} />

              <DetailsRow project={project} />

              <PlanRow items={planItems} />

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

            <Badges project={project} markAsProject={markAsProject} />
            <CardActions project={project} onImage />
            <DeveloperBadge project={project} />
          </div>

          <div className="flex flex-col flex-1 p-5">
            <div className="mb-1.5"><StartingPrice project={project} size="text-xl" /></div>
            <h3 className="font-semibold text-[0.95rem] mb-0.5 leading-snug line-clamp-2 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
              {project.title}
            </h3>
            <ByDeveloper project={project} />

            <DetailsRow project={project} />

            <PlanRow items={planItems} />

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
