'use client'
import { motion } from 'framer-motion'
import { Bookmark, GitCompare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useProjectCompareStore } from '@/store/projectCompareStore'
import type { Project } from '@/types'

// Save + Compare for a project's detail page (same stores as the project cards, so both stay in sync).
export function ProjectSaveCompare({ project }: { project: Project }) {
  const { isAuthenticated } = useAuthStore()
  const saved = useFavoritesStore(s => s.projectFavorites.includes(project._id))
  const toggleSave = useFavoritesStore(s => s.toggleProjectFavorite)
  const inCmp = useProjectCompareStore(s => s.projects.some(p => p._id === project._id))
  const toggleCmp = useProjectCompareStore(s => s.toggle)
  return (
    <SaveCompareRow
      saved={saved} inCompare={inCmp}
      onSave={() => { if (!isAuthenticated) { window.location.href = '/auth/login'; return } toggleSave(project._id) }}
      onCompare={() => toggleCmp(project)}
    />
  )
}

export function SaveCompareRow({ saved, inCompare, onSave, onCompare }: { saved: boolean; inCompare: boolean; onSave: () => void; onCompare: () => void }) {
  const btn = 'inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition-all'
  return (
    <div className="flex items-center gap-2">
      <motion.button whileTap={{ scale: 0.94 }} type="button" onClick={onSave} className={btn}
        aria-pressed={saved} title={saved ? 'Remove from saved' : 'Save'}
        style={saved
          ? { background: 'rgba(203,1,1,0.08)', color: 'var(--teal)', border: '1px solid rgba(203,1,1,0.35)' }
          : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
        <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
      </motion.button>
      <motion.button whileTap={{ scale: 0.94 }} type="button" onClick={onCompare} className={btn}
        aria-pressed={inCompare} title={inCompare ? 'Remove from compare' : 'Add to compare'}
        style={inCompare
          ? { background: 'rgba(203,1,1,0.08)', color: 'var(--teal)', border: '1px solid rgba(203,1,1,0.35)' }
          : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
        <GitCompare size={16} /> {inCompare ? 'In compare' : 'Compare'}
      </motion.button>
    </div>
  )
}
