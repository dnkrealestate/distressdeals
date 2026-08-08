'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Calendar, Clock, Search,
  TrendingUp, Building2, FileText, Newspaper, BookOpen,
} from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { blogAPI } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import type { BlogPost } from '@/types'

const CATEGORY_ICONS: Record<string, any> = {
  'Market Insights': TrendingUp,
  'Buying Guides': FileText,
  'Investment': TrendingUp,
  'News': Newspaper,
  'Area Guides': Building2,
}
const DEFAULT_ICON = BookOpen
const CATEGORIES = ['All', 'Market Insights', 'Buying Guides', 'Investment', 'Area Guides', 'News']

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

function BlogCard({ post, delay }: { post: BlogPost; delay: number }) {
  const Icon = CATEGORY_ICONS[post.category] || DEFAULT_ICON
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }}>
      <Link href={`/blog/${post.slug}`}>
        <div className="card-hover group h-full flex flex-col">
          <div className="h-44 relative flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
            {post.coverImage ? (
              <Image src={post.coverImage} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px)100vw,400px" />
            ) : (
              <>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(49,178,222,0.10), transparent 60%)' }} />
                <Icon size={36} style={{ color: 'var(--teal)', opacity: 0.35 }} />
              </>
            )}
            <span className="absolute top-3 left-3 badge badge-teal text-[10px]">{post.category}</span>
          </div>
          <div className="flex flex-col flex-1 p-5">
            <h3 className="font-semibold text-base mb-2.5 leading-snug line-clamp-2 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
              {post.title}
            </h3>
            <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: 'var(--text-muted)' }}>{post.excerpt}</p>
            <div className="flex items-center gap-4 text-xs mt-auto pt-3" style={{ borderTop: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5"><Calendar size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />{formatDate(post.publishedAt || post.createdAt)}</span>
              <span className="flex items-center gap-1.5"><Clock size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />{post.readTime} min read</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function BlogListClient() {
  const [activeCat, setActiveCat] = useState('All')
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 12

  const load = useCallback(() => {
    setLoading(true)
    blogAPI.getAll({ category: activeCat === 'All' ? undefined : activeCat, q: query || undefined, page, limit })
      .then(r => { if (r.data.success) { setPosts(r.data.data.data || []); setTotal(r.data.data.total || 0) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeCat, query, page])

  useEffect(() => {
    const t = setTimeout(load, query ? 350 : 0) // debounce free-text search only
    return () => clearTimeout(t)
  }, [load, query])

  useEffect(() => { setPage(1) }, [activeCat, query])

  const featured = page === 1 && !query && activeCat === 'All' ? posts[0] : null
  const gridPosts = featured ? posts.slice(1) : posts
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="page overflow-x-hidden">
      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }} />
        <div className="absolute pointer-events-none" style={{ top: '10%', right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(49,178,222,0.10) 0%, transparent 70%)' }} />

        <div className="wrap relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6"
            style={{ background: 'rgba(49,178,222,0.08)', border: '1px solid rgba(49,178,222,0.25)', borderRadius: 24, padding: '6px 16px' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--teal)', animation: 'pulseRing 2s infinite' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--teal)' }}>Blog & News</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="heading-xl mb-6 max-w-2xl mx-auto">
            Insights for the <span className="grad-text">Modern</span> Investor
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
            Market trends, buying guides, and the latest regulatory news — curated by our Dubai real estate specialists.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-md mx-auto">
            <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
              <Search size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
              <input
                type="text" placeholder="Search articles…" value={query} onChange={e => setQuery(e.target.value)}
                className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CATEGORY FILTERS ──────────────────────────────── */}
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
            {Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-72 rounded-2xl" />)}
          </div>
        </section>
      ) : (
        <>
          {/* ─── FEATURED POST ─────────────────────────────────── */}
          {featured && (
            <section className="py-12">
              <div className="wrap">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <Link href={`/blog/${featured.slug}`}>
                    <div className="card-hover grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                      <div className="h-64 lg:h-auto relative flex items-center justify-center overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                        {featured.coverImage ? (
                          <Image src={featured.coverImage} alt={featured.title} fill className="object-cover" sizes="(max-width:1024px)100vw,600px" />
                        ) : (
                          <>
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(49,178,222,0.12), rgba(97,187,77,0.08))' }} />
                            <TrendingUp size={64} style={{ color: 'var(--teal)', opacity: 0.3 }} className="relative z-10" />
                          </>
                        )}
                      </div>
                      <div className="p-8 lg:p-10 flex flex-col justify-center">
                        <span className="badge badge-teal text-[10px] mb-4 self-start">{featured.category}</span>
                        <h2 className="heading-md mb-4 leading-snug">{featured.title}</h2>
                        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>{featured.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                          <span>By {featured.author?.name || 'Distress Deals Team'}</span>
                          <span className="flex items-center gap-1.5"><Calendar size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />{formatDate(featured.publishedAt || featured.createdAt)}</span>
                          <span className="flex items-center gap-1.5"><Clock size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />{featured.readTime} min read</span>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--teal)' }}>
                          Read Article <ArrowRight size={15} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </div>
            </section>
          )}

          {/* ─── POST GRID ─────────────────────────────────────── */}
          <section className="section pt-0">
            <div className="wrap">
              {gridPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridPosts.map((post, i) => <BlogCard key={post._id} post={post} delay={i * 0.07} />)}
                </div>
              ) : !featured ? (
                <div className="text-center py-20">
                  <p className="text-base" style={{ color: 'var(--text-muted)' }}>No articles found matching your search.</p>
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

      {/* ─── NEWSLETTER CTA ────────────────────────────────── */}
      <section className="section pt-0">
        <div className="wrap">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="relative rounded-3xl p-10 md:p-16 text-center overflow-hidden" style={{ background: 'var(--grad)' }}>
            <div className="absolute pointer-events-none" style={{ top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div className="absolute pointer-events-none" style={{ bottom: -40, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <h2 className="heading-md mb-3 relative z-10 text-white">Never Miss a Market Update</h2>
            <p className="mb-8 max-w-md mx-auto relative z-10 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
              Get weekly insights on Dubai real estate trends, straight to your inbox.
            </p>
            <div className="flex flex-wrap justify-center gap-3 relative z-10 max-w-md mx-auto">
              <input type="email" placeholder="Enter your email" className="flex-1 min-w-[200px] px-5 py-3.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.30)', color: '#fff' }} />
              <button className="px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-200" style={{ background: '#fff', color: 'var(--teal)' }}>
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
