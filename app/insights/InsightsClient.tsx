'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  Radio, MapPin, Layers, Building2, ArrowRight, Sparkles,
} from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import {
  blogAPI, newsAPI, areaContentAPI, communityContentAPI, buildingContentAPI,
} from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { BlogPost, NewsItem, AreaContentWithStats, CommunityContentWithStats, BuildingContent } from '@/types'

function SectionHeader({ icon: Icon, title, subtitle, href }: { icon: any; title: string; subtitle: string; href: string }) {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Icon size={18} style={{ color: 'var(--teal)' }} /> {title}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      <Link href={href} className="text-xs font-semibold flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--teal)' }}>
        View all <ArrowRight size={12} />
      </Link>
    </div>
  )
}

function MediaCard({ href, image, eyebrow, title, meta }: { href: string; image?: string; eyebrow: string; title: string; meta: string }) {
  return (
    <Link href={href}>
      <div className="card-hover group h-full flex flex-col overflow-hidden">
        <div className="h-36 relative flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
          {image ? (
            <Image src={image} alt={title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px)100vw,360px" />
          ) : (
            <Sparkles size={26} style={{ color: 'var(--teal)', opacity: 0.35 }} />
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--teal)' }}>{eyebrow}</p>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{title}</h3>
          <p className="text-[11px] mt-auto" style={{ color: 'var(--text-muted)' }}>{meta}</p>
        </div>
      </div>
    </Link>
  )
}

function ChipRow({ items }: { items: { href: string; label: string; sub?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}
        >
          <MapPin size={12} style={{ color: 'var(--teal)', opacity: 0.7 }} />
          {item.label}
          {item.sub && <span style={{ color: 'var(--text-muted)' }}>· {item.sub}</span>}
        </Link>
      ))}
    </div>
  )
}

export default function InsightsClient() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [areas, setAreas] = useState<AreaContentWithStats[]>([])
  const [communities, setCommunities] = useState<CommunityContentWithStats[]>([])
  const [buildings, setBuildings] = useState<BuildingContent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      blogAPI.getAll({ status: 'published', limit: 3 }).catch(() => null),
      newsAPI.getAll({ status: 'published', limit: 3 }).catch(() => null),
      areaContentAPI.getAll().catch(() => null),
      communityContentAPI.getAll().catch(() => null),
      buildingContentAPI.getAll().catch(() => null),
    ]).then(([blogRes, newsRes, areaRes, communityRes, buildingRes]) => {
      if (blogRes?.data?.success) setPosts(blogRes.data.data.data || blogRes.data.data || [])
      if (newsRes?.data?.success) setNews(newsRes.data.data.data || newsRes.data.data || [])
      if (areaRes?.data?.success) setAreas((areaRes.data.data || []).slice(0, 6))
      if (communityRes?.data?.success) setCommunities((communityRes.data.data || []).slice(0, 6))
      if (buildingRes?.data?.success) setBuildings((buildingRes.data.data || []).slice(0, 6))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page overflow-x-hidden">
      <Navbar />

      <section className="relative pt-20 pb-14 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }} />
        <div className="wrap relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6"
            style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.25)', borderRadius: 24, padding: '6px 16px' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--teal)', animation: 'pulseRing 2s infinite' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--teal)' }}>Insights</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="heading-xl mb-6 max-w-2xl mx-auto">
            Dubai Property Market <span className="grad-text">Insights &amp; Price Data</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Market analysis, news, and location guides — areas, communities, and buildings — all backed by our own verified listing data.
          </motion.p>
        </div>
      </section>

      {loading ? (
        <div className="wrap py-16 space-y-4">
          {Array(3).fill(null).map((_, i) => <div key={i} className="shimmer h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="wrap pb-20 space-y-16 pt-4">
          {posts.length > 0 && (
            <section>
              <SectionHeader icon={Sparkles} title="Blog" subtitle="Market analysis and buying guides" href="/blog" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {posts.map(p => (
                  <MediaCard key={p._id} href={`/blog/${p.slug}`} image={p.coverImage} eyebrow={p.category} title={p.title} meta={`${p.readTime} min read`} />
                ))}
              </div>
            </section>
          )}

          {news.length > 0 && (
            <section>
              <SectionHeader icon={Radio} title="News" subtitle="Regulatory updates and market announcements" href="/news" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {news.map(n => (
                  <MediaCard key={n._id} href={`/news/${n.slug}`} image={n.coverImage} eyebrow={n.category} title={n.title} meta={n.publishedAt ? formatDate(n.publishedAt) : ''} />
                ))}
              </div>
            </section>
          )}

          {areas.length > 0 && (
            <section>
              <SectionHeader icon={MapPin} title="Area Guides" subtitle="Live stats and narrative guides for Dubai's districts" href="/areas" />
              <ChipRow items={areas.map(a => ({ href: `/areas/${a.slug}`, label: a.area }))} />
            </section>
          )}

          {communities.length > 0 && (
            <section>
              <SectionHeader icon={Layers} title="Communities" subtitle="Sub-neighbourhoods and standalone communities" href="/communities" />
              <ChipRow items={communities.map(c => ({ href: `/communities/${c.slug}`, label: c.name, sub: c.area }))} />
            </section>
          )}

          {buildings.length > 0 && (
            <section>
              <SectionHeader icon={Building2} title="Building Guides" subtitle="Individual towers and developments" href="/buildings" />
              <ChipRow items={buildings.map(b => ({ href: `/buildings/${b.slug}`, label: b.name, sub: b.area }))} />
            </section>
          )}
        </div>
      )}

      <Footer />
    </div>
  )
}
