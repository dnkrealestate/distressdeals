'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Layers, Search, MapPin } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { communityContentAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { CommunityContentWithStats } from '@/types'

function CommunityCard({ community, delay }: { community: CommunityContentWithStats; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }}>
      <Link href={`/communities/${community.slug}`}>
        <div className="card-hover group h-full flex flex-col">
          <div className="h-40 relative flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
            {community.heroImage ? (
              <Image src={community.heroImage} alt={community.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px)100vw,400px" />
            ) : (
              <Layers size={32} style={{ color: 'var(--teal)', opacity: 0.35 }} />
            )}
            {community.isFeatured && (
              <span className="badge absolute top-3 right-3 text-[10px]" style={{ background: 'rgba(203,1,1,0.85)', color: '#fff', border: 'none' }}>
                Featured
              </span>
            )}
          </div>
          <div className="flex flex-col flex-1 p-5">
            <h3 className="font-semibold text-base mb-1.5 leading-snug transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
              {community.name}
            </h3>
            {community.area && (
              <p className="text-xs flex items-center gap-1.5 mb-4" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />in {community.area}
              </p>
            )}
            <div className="mt-auto pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{community.count} listing{community.count === 1 ? '' : 's'}</span>
              {community.avgPrice > 0 && <span className="text-sm font-bold grad-text">{formatPrice(Math.round(community.avgPrice))}</span>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function CommunitiesListClient() {
  const [communities, setCommunities] = useState<CommunityContentWithStats[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    communityContentAPI.getAll()
      .then(r => { if (r.data.success) setCommunities(r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = query
    ? communities.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : communities

  return (
    <div className="page overflow-x-hidden">
      <Navbar />

      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }} />
        <div className="absolute pointer-events-none" style={{ top: '10%', right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(203,1,1,0.10) 0%, transparent 70%)' }} />

        <div className="wrap relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6"
            style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.25)', borderRadius: 24, padding: '6px 16px' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--teal)', animation: 'pulseRing 2s infinite' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--teal)' }}>Communities</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="heading-xl mb-6 max-w-2xl mx-auto">
            Dubai <span className="grad-text">Communities Guide</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
            Sub-communities and standalone neighbourhoods — real listing counts and prices from our own verified inventory.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-md mx-auto">
            <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
              <Search size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
              <input
                type="text" placeholder="Search a community…" value={query} onChange={e => setQuery(e.target.value)}
                className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {loading ? (
        <section className="section pt-8">
          <div className="wrap grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-72 rounded-2xl" />)}
          </div>
        </section>
      ) : (
        <section className="section pt-8 pb-20">
          <div className="wrap">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((community, i) => <CommunityCard key={community._id} community={community} delay={i * 0.05} />)}
              </div>
            ) : (
              <div className="text-center py-20">
                <Layers size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
                <p className="text-base" style={{ color: 'var(--text-muted)' }}>No communities match "{query}".</p>
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
