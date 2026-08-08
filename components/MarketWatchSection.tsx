'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar, Newspaper, Landmark, Megaphone, TrendingUp } from 'lucide-react'
import { newsAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { NewsItem } from '@/types'

const CATEGORY_ICONS: Record<string, any> = {
  'Regulatory': Landmark,
  'Market Update': TrendingUp,
  'Announcement': Megaphone,
}
const DEFAULT_ICON = Newspaper

/* ─── NEWS ROW — a compact list style, deliberately distinct from the ─────
   Blog section's card grid so the two content types read differently ──── */
function NewsRow({ item, delay, isLast }: { item: NewsItem; delay: number; isLast: boolean }) {
  const Icon = CATEGORY_ICONS[item.category] || DEFAULT_ICON
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay }}>
      <Link
        href={`/news/${item.slug}`}
        className="flex items-center gap-4 p-4 group transition-colors"
        style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
      >
        <div className="w-16 h-16 rounded-xl flex-shrink-0 relative overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-alt)' }}>
          {item.coverImage ? (
            <Image src={item.coverImage} alt={item.title} fill className="object-cover" sizes="64px" />
          ) : (
            <Icon size={22} style={{ color: 'var(--teal)', opacity: 0.4 }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-teal text-[10px]">{item.category}</span>
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Calendar size={10} />{formatDate(item.publishedAt || item.createdAt)}
            </span>
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-1 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>
            {item.title}
          </h3>
          <p className="text-xs leading-relaxed line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.summary}</p>
        </div>
        <ArrowRight size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-all duration-200 group-hover:translate-x-1" style={{ color: 'var(--teal)' }} />
      </Link>
    </motion.div>
  )
}

/* ─── SECTION ───────────────────────────────────────────────── */
export default function MarketWatchSection() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    newsAPI.getAll({ limit: 4 })
      .then(r => { if (r.data.success) setItems(r.data.data.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && items.length === 0) return null

  return (
    <section className="section">
      <div className="wrap">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10 flex-wrap gap-4"
        >
          <div>
            <p className="eyebrow mb-3">Market Watch</p>
            <h2 className="heading-lg mb-3">
              Stay Ahead of <span className="grad-text">the Market</span>
            </h2>
            <p className="muted">Regulatory updates and announcements shaping Dubai real estate</p>
          </div>
          <Link href="/news" className="btn-ghost btn-sm hidden md:flex">
            View All News <ArrowRight size={14} />
          </Link>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-[88px] rounded-2xl" />)}
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {items.map((item, i) => <NewsRow key={item._id} item={item} delay={i * 0.06} isLast={i === items.length - 1} />)}
          </div>
        )}

        {/* Mobile view all */}
        <div className="flex justify-center mt-8 md:hidden">
          <Link href="/news" className="btn-ghost btn-sm">
            View All News <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
