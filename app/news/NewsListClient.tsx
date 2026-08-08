'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar, Newspaper, Landmark, Megaphone, TrendingUp } from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { newsAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { NewsItem } from '@/types'

const CATEGORY_ICONS: Record<string, any> = {
  'Regulatory': Landmark,
  'Market Update': TrendingUp,
  'Announcement': Megaphone,
}
const DEFAULT_ICON = Newspaper
const CATEGORIES = ['All', 'Regulatory', 'Market Update', 'Announcement', 'Industry']

function CategoryPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function NewsCard({ item, delay }: { item: NewsItem; delay: number }) {
  const Icon = CATEGORY_ICONS[item.category] || DEFAULT_ICON
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }}>
      <Link href={`/news/${item.slug}`}>
        <div className="card-hover group h-full flex flex-col">
          <div className="h-40 relative flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
            {item.coverImage ? (
              <Image src={item.coverImage} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px)100vw,400px" />
            ) : (
              <>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(49,178,222,0.10), transparent 60%)' }} />
                <Icon size={32} style={{ color: 'var(--teal)', opacity: 0.35 }} />
              </>
            )}
            <span className="absolute top-3 left-3 badge badge-teal text-[10px]">{item.category}</span>
          </div>
          <div className="flex flex-col flex-1 p-5">
            <h3 className="font-semibold text-base mb-2.5 leading-snug line-clamp-2 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
              {item.title}
            </h3>
            <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: 'var(--text-muted)' }}>{item.summary}</p>
            <div className="flex items-center gap-1.5 text-xs mt-auto pt-3" style={{ borderTop: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}>
              <Calendar size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />{formatDate(item.publishedAt || item.createdAt)}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function NewsListClient() {
  const [activeCat, setActiveCat] = useState('All')
  const [items, setItems] = useState<NewsItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 12

  const load = useCallback(() => {
    setLoading(true)
    newsAPI.getAll({ category: activeCat === 'All' ? undefined : activeCat, page, limit })
      .then(r => { if (r.data.success) { setItems(r.data.data.data || []); setTotal(r.data.data.total || 0) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeCat, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [activeCat])

  const featured = page === 1 && activeCat === 'All' ? items[0] : null
  const gridItems = featured ? items.slice(1) : items
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
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--teal)' }}>News</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="heading-xl mb-6 max-w-2xl mx-auto">
            Stay Ahead of the <span className="grad-text">Market</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Regulatory updates, market announcements, and industry news from across Dubai real estate.
          </motion.p>
        </div>
      </section>

      <section className="pb-4">
        <div className="wrap">
          <div className="flex flex-wrap gap-2.5 justify-center">
            {CATEGORIES.map(c => (
              <CategoryPill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</CategoryPill>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section className="section pt-8">
          <div className="wrap grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-64 rounded-2xl" />)}
          </div>
        </section>
      ) : (
        <>
          {featured && (
            <section className="py-12">
              <div className="wrap">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <Link href={`/news/${featured.slug}`}>
                    <div className="card-hover grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                      <div className="h-64 lg:h-auto relative flex items-center justify-center overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                        {featured.coverImage ? (
                          <Image src={featured.coverImage} alt={featured.title} fill className="object-cover" sizes="(max-width:1024px)100vw,600px" />
                        ) : (
                          <>
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(49,178,222,0.12), rgba(97,187,77,0.08))' }} />
                            <Newspaper size={64} style={{ color: 'var(--teal)', opacity: 0.3 }} className="relative z-10" />
                          </>
                        )}
                      </div>
                      <div className="p-8 lg:p-10 flex flex-col justify-center">
                        <span className="badge badge-teal text-[10px] mb-4 self-start">{featured.category}</span>
                        <h2 className="heading-md mb-4 leading-snug">{featured.title}</h2>
                        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>{featured.summary}</p>
                        <div className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                          <Calendar size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />{formatDate(featured.publishedAt || featured.createdAt)}
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--teal)' }}>
                          Read More <ArrowRight size={15} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </div>
            </section>
          )}

          <section className="section pt-0">
            <div className="wrap">
              {gridItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridItems.map((item, i) => <NewsCard key={item._id} item={item} delay={i * 0.07} />)}
                </div>
              ) : !featured ? (
                <div className="text-center py-20">
                  <p className="text-base" style={{ color: 'var(--text-muted)' }}>No news items in this category yet.</p>
                </div>
              ) : null}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost btn-sm disabled:opacity-40">Previous</button>
                  <span className="text-xs px-3" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm disabled:opacity-40">Next</button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  )
}
