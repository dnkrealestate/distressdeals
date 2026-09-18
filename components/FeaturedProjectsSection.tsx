'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Building2 } from 'lucide-react'
import { projectAPI } from '@/lib/api'
import { UAE_EMIRATES } from '@/lib/constants'
import ProjectCard from '@/components/buyer/ProjectCard'
import type { Project } from '@/types'

const SLIDE_LIMIT = 10

/* ─── EMIRATE PILL — segmented tab, same visual language as the /projects
   list page's status pills ────────────────────────────────────────── */
function EmiratePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
      style={{
        background: active ? 'var(--grad)' : 'transparent',
        color:      active ? '#fff' : 'var(--text-mid)',
        border:     active ? 'none' : '1px solid var(--border)',
        boxShadow:  active ? '0 6px 16px rgba(203,1,1,0.30)' : 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function ArrowButton({ direction, disabled, onClick }: { direction: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  const Icon = direction === 'left' ? ArrowLeft : ArrowRight
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Previous projects' : 'Next projects'}
      className="hidden md:flex w-10 h-10 rounded-full items-center justify-center flex-shrink-0 transition-all duration-200"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: disabled ? 'var(--text-muted)' : 'var(--teal)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: '0 6px 16px -6px rgba(15,23,42,0.25)',
      }}
    >
      <Icon size={16} />
    </button>
  )
}

export default function FeaturedProjectsSection() {
  const [emirate, setEmirate] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  // Whether ANY project exists site-wide — decides whether the whole
  // section shows at all (an emirate-specific empty result should just
  // show an inline message, not hide the tabs).
  const [hasAnyProjects, setHasAnyProjects] = useState<boolean | null>(null)

  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    setLoading(true)
    projectAPI.getAll({ ...(emirate && { emirate }), limit: SLIDE_LIMIT })
      .then(r => {
        if (!r.data.success) return
        setProjects(r.data.data.data || [])
        if (hasAnyProjects === null) setHasAnyProjects((r.data.data.total || 0) > 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emirate])

  const updateScrollState = () => {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  // Re-measure once the slides are actually in the DOM (switching emirate
  // resets scrollLeft to 0, and slide count changes what's scrollable).
  useEffect(() => {
    const t = setTimeout(updateScrollState, 50)
    if (trackRef.current) trackRef.current.scrollTo({ left: 0 })
    return () => clearTimeout(t)
  }, [projects])

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  if (hasAnyProjects === false) return null

  return (
    <section className="section">
      <div className="wrap">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <p className="eyebrow mb-3">New Developments</p>
          <h2 className="heading-lg mb-3">
            Explore UAE <span className="grad-text">New Projects</span>
          </h2>
          <p className="muted">Flexible payment plans from the UAE's leading developers</p>
        </motion.div>

        {/* Emirate tabs — filter the slider below without leaving the page */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 pb-1">
          <EmiratePill active={!emirate} onClick={() => setEmirate('')}>All Emirates</EmiratePill>
          {UAE_EMIRATES.map(e => (
            <EmiratePill key={e} active={emirate === e} onClick={() => setEmirate(emirate === e ? '' : e)}>
              {e}
            </EmiratePill>
          ))}
        </div>

        {loading ? (
          <div className="flex gap-4 sm:gap-6 overflow-hidden">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="shimmer h-80 rounded-2xl flex-shrink-0 w-[78vw] max-w-[280px] sm:w-[340px] sm:max-w-none lg:w-[380px]" />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="flex items-center gap-3">
            <ArrowButton direction="left" disabled={!canScrollLeft} onClick={() => scrollByPage(-1)} />

            <div
              ref={trackRef}
              onScroll={updateScrollState}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth flex-1 pb-2"
            >
              {projects.map((project, i) => (
                <div key={project._id} className="flex-shrink-0 snap-start w-[78vw] max-w-[280px] sm:w-[340px] sm:max-w-none lg:w-[380px]">
                  <ProjectCard project={project} layout="grid" delay={i * 0.06} />
                </div>
              ))}
            </div>

            <ArrowButton direction="right" disabled={!canScrollRight} onClick={() => scrollByPage(1)} />
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No new projects in {emirate} yet — check back soon.
            </p>
          </div>
        )}

        <div className="flex justify-center mt-10">
          <Link href={emirate ? `/projects?emirate=${encodeURIComponent(emirate)}` : '/projects'} className="btn-outline gap-1.5">
            View All {emirate ? `${emirate} ` : ''}Projects <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
