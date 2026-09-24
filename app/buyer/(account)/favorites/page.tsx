'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Trash2, GitCompare, Search } from 'lucide-react'
import Link from 'next/link'
import PropertyCard from '@/components/buyer/PropertyCard'
import ProjectCard from '@/components/buyer/ProjectCard'
import { favAPI } from '@/lib/api'
import { useFavoritesStore } from '@/store/favoritesStore'
import type { Property, Project } from '@/types'

export default function FavoritesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [projects, setProjects]     = useState<Project[]>([])
  const [loading, setLoading]       = useState(true)
  const { favorites, projectFavorites, toggleFavorite, toggleProjectFavorite } = useFavoritesStore()

  useEffect(() => {
    Promise.allSettled([favAPI.getAll(), favAPI.getProjects()])
      .then(([props, projs]) => {
        // Also seed the store from this fetch, so the page doesn't depend on the app-wide load having finished first.
        if (props.status === 'fulfilled' && props.value.data.success) {
          setProperties(props.value.data.data)
          useFavoritesStore.setState({ favorites: props.value.data.data.map((p: Property) => p._id) })
        }
        if (projs.status === 'fulfilled' && projs.value.data.success) {
          setProjects(projs.value.data.data)
          useFavoritesStore.setState({ projectFavorites: projs.value.data.data.map((p: Project) => p._id) })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Un-hearting a card here removes it from the page straight away.
  const shownProperties = properties.filter(p => favorites.includes(p._id))
  const shownProjects   = projects.filter(p => projectFavorites.includes(p._id))
  const count = shownProperties.length + shownProjects.length

  const removeAll = async () => {
    for (const id of favorites) await toggleFavorite(id)
    for (const id of projectFavorites) await toggleProjectFavorite(id)
    setProperties([]); setProjects([])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="heading-md mb-1">
            My <span className="grad-text">Favorites</span>
          </h1>
          <p className="muted">
            {loading ? 'Loading…' : `${shownProperties.length} ${shownProperties.length === 1 ? 'property' : 'properties'} · ${shownProjects.length} ${shownProjects.length === 1 ? 'project' : 'projects'} saved`}
          </p>
        </div>
        {count > 0 && (
          <div className="flex gap-2">
            <Link href={shownProperties.length ? '/buyer/compare' : '/projects/compare'} className="btn-ghost btn-sm gap-2">
              <GitCompare size={14} /> Compare
            </Link>
            <button onClick={removeAll} className="btn-ghost btn-sm gap-2" style={{ color: '#FB7185', borderColor: 'rgba(244,63,94,0.25)' }}>
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array(4).fill(null).map((_, i) => <PropertyCard key={i} property={undefined} loading />)}
        </div>
      ) : count === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center card">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.20)' }}>
            <Heart size={28} style={{ color: '#FB7185' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>No favorites yet</h3>
          <p className="muted mb-7 max-w-xs">Save properties and new projects you love by tapping the heart icon on any listing.</p>
          <div className="flex gap-2 flex-wrap justify-center">
            <Link href="/for-sale" className="btn-primary"><Search size={15} /> Browse Properties</Link>
            <Link href="/projects" className="btn-outline">New Projects</Link>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-10">
          {shownProperties.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Properties</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {shownProperties.map((p, i) => (
                  <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <PropertyCard property={p} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}
          {shownProjects.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>New Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {shownProjects.map((p, i) => <ProjectCard key={p._id} project={p} delay={i * 0.06} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
