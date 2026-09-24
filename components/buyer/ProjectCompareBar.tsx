'use client'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { GitCompare, X, Building2 } from 'lucide-react'
import { useProjectCompareStore, MAX_PROJECT_COMPARE } from '@/store/projectCompareStore'

// Floating tray on the listing pages once a project is picked for comparison — shows the picks and opens the table.
export default function ProjectCompareBar() {
  const { projects, remove, clear } = useProjectCompareStore()

  return (
    <AnimatePresence>
      {projects.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-24 lg:bottom-6 left-4 z-40 rounded-2xl p-2.5 pr-3 flex items-center gap-2.5 max-w-[calc(100vw-2rem)]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 12px 32px rgba(15,23,42,0.18)' }}
        >
          <div className="flex -space-x-2">
            {projects.map(p => {
              const img = p.coverImage || p.images?.[0]?.url
              return (
                <div key={p._id} className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 group/thumb" style={{ border: '2px solid var(--surface)', background: 'var(--bg-alt)' }} title={p.title}>
                  {img ? <Image src={img} alt={p.title} fill sizes="40px" className="object-cover" />
                       : <Building2 size={16} className="m-auto mt-2.5" style={{ color: 'var(--text-muted)' }} />}
                  <button onClick={() => remove(p._id)} aria-label={`Remove ${p.title}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.55)' }}>
                    <X size={13} className="text-white" />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{projects.length} of {MAX_PROJECT_COMPARE} projects</p>
            <button onClick={clear} className="text-[11px] hover:underline" style={{ color: 'var(--text-muted)' }}>Clear</button>
          </div>
          <Link href="/projects/compare" className="btn-primary btn-sm gap-1.5 flex-shrink-0">
            <GitCompare size={13} /> Compare
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
