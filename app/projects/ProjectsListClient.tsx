'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ProjectCard from '@/components/buyer/ProjectCard'
import { projectAPI } from '@/lib/api'
import type { Project } from '@/types'

const STATUS_TABS = [
  { value: '',                    label: 'All' },
  { value: 'upcoming',            label: 'Upcoming' },
  { value: 'under_construction',  label: 'Under Construction' },
  { value: 'ready',               label: 'Ready' },
  { value: 'sold_out',            label: 'Sold Out' },
]

function StatusPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border"
      style={{
        background:  active ? 'var(--grad)' : 'transparent',
        color:       active ? '#fff' : 'var(--text-muted)',
        borderColor: active ? 'transparent' : 'var(--border)',
        cursor: 'pointer',
        boxShadow: active ? '0 4px 14px rgba(49,178,222,0.30)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

export default function ProjectsListClient() {
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 12

  const load = useCallback(() => {
    setLoading(true)
    projectAPI.getAll({ status: status || undefined, q: query || undefined, page, limit })
      .then(r => { if (r.data.success) { setProjects(r.data.data.data || []); setTotal(r.data.data.total || 0) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status, query, page])

  useEffect(() => {
    const t = setTimeout(load, query ? 350 : 0)
    return () => clearTimeout(t)
  }, [load, query])

  useEffect(() => { setPage(1) }, [status, query])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="page overflow-x-hidden">
      <Navbar />

      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }} />
        <div className="absolute pointer-events-none" style={{ top: '10%', right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(49,178,222,0.10) 0%, transparent 70%)' }} />

        <div className="wrap relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6"
            style={{ background: 'rgba(49,178,222,0.08)', border: '1px solid rgba(49,178,222,0.25)', borderRadius: 24, padding: '6px 16px' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--teal)', animation: 'pulseRing 2s infinite' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--teal)' }}>Off-Plan Projects</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="heading-xl mb-6 max-w-2xl mx-auto">
            Invest in Dubai's <span className="grad-text">Next Chapter</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
            New developments from Dubai's leading developers — flexible payment plans, prime locations, verified handover dates.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-md mx-auto">
            <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
              <Search size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
              <input
                type="text" placeholder="Search by name, developer, or area…" value={query} onChange={e => setQuery(e.target.value)}
                className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-4">
        <div className="wrap">
          <div className="flex flex-wrap gap-2.5 justify-center">
            {STATUS_TABS.map(s => (
              <StatusPill key={s.value} active={status === s.value} onClick={() => setStatus(s.value)}>{s.label}</StatusPill>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section className="section pt-8">
          <div className="wrap grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-80 rounded-2xl" />)}
          </div>
        </section>
      ) : (
        <section className="section pt-8">
          <div className="wrap">
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, i) => <ProjectCard key={project._id} project={project} delay={i * 0.07} />)}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-base" style={{ color: 'var(--text-muted)' }}>No projects found.</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost btn-sm disabled:opacity-40">Previous</button>
                <span className="text-xs px-3" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
