'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Trash2, GitCompare, Search } from 'lucide-react'
import Link from 'next/link'
import PropertyCard from '@/components/buyer/PropertyCard'
import { favAPI } from '@/lib/api'
import { useFavoritesStore } from '@/store/favoritesStore'
import type { Property } from '@/types'

export default function FavoritesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading]       = useState(true)
  const { favorites, toggleFavorite } = useFavoritesStore()

  useEffect(() => {
    favAPI.getAll()
      .then(r => { if (r.data.success) setProperties(r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const removeAll = async () => {
    for (const id of favorites) await toggleFavorite(id)
    setProperties([])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="heading-md mb-1">
            My <span className="grad-text">Favorites</span>
          </h1>
          <p className="muted">{loading ? 'Loading…' : `${properties.length} saved properties`}</p>
        </div>
        {properties.length > 0 && (
          <div className="flex gap-2">
            <Link href="/buyer/compare" className="btn-ghost btn-sm gap-2">
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
      ) : properties.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center card">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.20)' }}>
            <Heart size={28} style={{ color: '#FB7185' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>No favorites yet</h3>
          <p className="muted mb-7 max-w-xs">Start saving properties you love by clicking the heart icon on any listing.</p>
          <Link href="/buyer/properties" className="btn-primary">
            <Search size={15} /> Browse Properties
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {properties.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <PropertyCard property={p} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
