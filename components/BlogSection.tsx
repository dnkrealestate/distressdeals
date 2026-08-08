'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Calendar, Clock,
  TrendingUp, FileText, Newspaper, Building2, BookOpen,
} from 'lucide-react'
import { blogAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { BlogPost } from '@/types'

const CATEGORY_ICONS: Record<string, any> = {
  'Market Insights': TrendingUp,
  'Buying Guides': FileText,
  'Investment': TrendingUp,
  'News': Newspaper,
  'Area Guides': Building2,
}
const DEFAULT_ICON = BookOpen

/* ─── BLOG CARD ─────────────────────────────────────────────── */
function BlogCard({ post, delay }: { post: BlogPost; delay: number }) {
  const Icon = CATEGORY_ICONS[post.category] || DEFAULT_ICON
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <Link href={`/blog/${post.slug}`}>
        <div className="card-hover group h-full flex flex-col">
          <div className="h-44 relative flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
            {post.coverImage ? (
              <Image src={post.coverImage} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px)100vw,400px" />
            ) : (
              <>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(135deg, rgba(49,178,222,0.10), transparent 60%)' }}
                />
                <Icon size={36} style={{ color: 'var(--teal)', opacity: 0.35 }} />
              </>
            )}
            <span className="absolute top-3 left-3 badge badge-teal text-[10px]">
              {post.category}
            </span>
          </div>

          <div className="flex flex-col flex-1 p-5">
            <h3
              className="font-semibold text-base mb-2.5 leading-snug line-clamp-2 transition-colors group-hover:text-[var(--teal)]"
              style={{ color: 'var(--text)' }}
            >
              {post.title}
            </h3>
            <p
              className="text-sm leading-relaxed line-clamp-2 mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              {post.excerpt}
            </p>
            <div
              className="flex items-center gap-4 text-xs mt-auto pt-3"
              style={{ borderTop: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}
            >
              <span className="flex items-center gap-1.5">
                <Calendar size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />
                {formatDate(post.publishedAt || post.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={11} style={{ color: 'var(--teal)', opacity: 0.6 }} />
                {post.readTime} min read
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/* ─── SECTION ───────────────────────────────────────────────── */
export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    blogAPI.getAll({ limit: 3 })
      .then(r => { if (r.data.success) setPosts(r.data.data.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && posts.length === 0) return null

  return (
    <section className="section">
      <div className="wrap">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12 flex-wrap gap-4"
        >
          <div>
            <p className="eyebrow mb-3">From the Blog</p>
            <h2 className="heading-lg mb-3">
              Latest <span className="grad-text">Insights & News</span>
            </h2>
            <p className="muted">Market trends, buying guides, and regulatory updates</p>
          </div>
          <Link href="/blog" className="btn-ghost btn-sm hidden md:flex">
            View All <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array(3).fill(null).map((_, i) => <div key={i} className="shimmer h-72 rounded-2xl" />)
            : posts.map((post, i) => <BlogCard key={post._id} post={post} delay={i * 0.08} />)
          }
        </div>

        {/* Mobile view all */}
        <div className="flex justify-center mt-8 md:hidden">
          <Link href="/blog" className="btn-ghost btn-sm">
            View All Articles <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
