'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Calendar, Clock, Share2, Facebook, Twitter, Linkedin, Link2, Tag, List,
} from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { blogAPI } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import type { BlogPost } from '@/types'
import toast from 'react-hot-toast'

interface TocItem { id: string; text: string; level: number }

export default function BlogDetailClient({ post }: { post: BlogPost }) {
  const [related, setRelated] = useState<BlogPost[]>([])
  const [toc, setToc] = useState<TocItem[]>([])
  const contentRef = useRef<HTMLDivElement>(null)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://www.distressdealsuae.com/blog/${post.slug}`

  // Counted once per visitor by the backend.
  useEffect(() => { blogAPI.trackView(post._id).catch(() => {}) }, [post._id])

  useEffect(() => {
    blogAPI.getAll({ category: post.category, limit: 4 })
      .then(r => { if (r.data.success) setRelated((r.data.data.data || []).filter((p: BlogPost) => p._id !== post._id).slice(0, 3)) })
      .catch(() => {})
  }, [post.category, post._id])

  // The stored content HTML has no heading ids — assign them after mount so
  // the table of contents can deep-link into the article via #anchors.
  useEffect(() => {
    const headings = contentRef.current?.querySelectorAll('h2, h3, h4')
    if (!headings || headings.length === 0) { setToc([]); return }
    const items: TocItem[] = Array.from(headings).map((h, i) => {
      const text = h.textContent || ''
      const id = `heading-${i}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)}`
      h.id = id
      return { id, text, level: Number(h.tagName[1]) }
    })
    setToc(items)
  }, [post.content])

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied')
  }

  return (
    <div className="page overflow-x-hidden">
      <Navbar />

      <div className="wrap py-4">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:opacity-80 transition-opacity">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:opacity-80 transition-opacity">Blog</Link>
          <span>/</span>
          <span style={{ color: 'var(--teal)' }} className="truncate max-w-xs">{post.title}</span>
        </div>
      </div>

      <div className="wrap pb-20 grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_240px] gap-12">
        <article className="min-w-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="badge badge-teal text-xs mb-4">{post.category}</span>
            <h1 className="heading-lg mb-5 leading-tight">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-5 text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
                  {post.author?.name?.[0] || 'D'}
                </span>
                {post.author?.name || 'Distress Deals Team'}
              </span>
              <span className="flex items-center gap-1.5"><Calendar size={13} style={{ color: 'var(--teal)' }} />{formatDate(post.publishedAt || post.createdAt)}</span>
              <span className="flex items-center gap-1.5"><Clock size={13} style={{ color: 'var(--teal)' }} />{post.readTime} min read</span>
            </div>
          </motion.div>

          {post.coverImage && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="relative w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-10" style={{ background: 'var(--bg-alt)' }}>
              <Image src={post.coverImage} alt={post.title} fill priority className="object-cover" sizes="(max-width:1024px)100vw,768px" />
            </motion.div>
          )}

          {/* Mobile-only TOC — the sticky sidebar version is desktop-only (lg+) */}
          {toc.length > 0 && (
            <div className="lg:hidden mb-8 p-4 rounded-2xl" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold flex items-center gap-2 mb-2.5" style={{ color: 'var(--text)' }}><List size={13} /> In this article</p>
              <div className="space-y-1.5">
                {toc.map(item => (
                  <a key={item.id} href={`#${item.id}`} className="block text-xs hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--text-muted)', paddingLeft: (item.level - 2) * 12 }}>
                    {item.text}
                  </a>
                ))}
              </div>
            </div>
          )}

          <motion.div ref={contentRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rich-content text-base leading-relaxed" style={{ color: 'var(--text-mid)' }}
            dangerouslySetInnerHTML={{ __html: post.content }} />

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
              <Tag size={14} style={{ color: 'var(--text-muted)' }} />
              {post.tags.map(tag => (
                <span key={tag} className="badge badge-gray text-xs">{tag}</span>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="flex items-center gap-3 mt-8 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Share2 size={14} /> Share this article
            </span>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2.5">
              <Facebook size={15} />
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2.5">
              <Twitter size={15} />
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2.5">
              <Linkedin size={15} />
            </a>
            <button onClick={copyLink} className="btn-ghost p-2.5"><Link2 size={15} /></button>
          </div>

          <Link href="/blog" className="btn-ghost btn-sm gap-2 mt-10">
            <ArrowLeft size={14} /> Back to Blog
          </Link>
        </article>

        {/* Desktop sticky sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky space-y-6" style={{ top: 96 }}>
            {toc.length > 0 && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold flex items-center gap-2 mb-2.5" style={{ color: 'var(--text)' }}><List size={13} /> In this article</p>
                <div className="space-y-1.5">
                  {toc.map(item => (
                    <a key={item.id} href={`#${item.id}`} className="block text-xs hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--text-muted)', paddingLeft: (item.level - 2) * 12 }}>
                      {item.text}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {related.slice(0, 3).length > 0 && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold mb-3" style={{ color: 'var(--text)' }}>Recent Posts</p>
                <div className="space-y-3">
                  {related.slice(0, 3).map(r => (
                    <Link key={r._id} href={`/blog/${r.slug}`} className="flex items-center gap-2.5 group">
                      <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden relative" style={{ background: 'var(--surface)' }}>
                        {r.coverImage && <Image src={r.coverImage} alt={r.title} fill className="object-cover" sizes="48px" />}
                      </div>
                      <p className="text-xs leading-snug line-clamp-2 transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text-mid)' }}>{r.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="section pt-0">
          <div className="wrap">
            <h2 className="heading-md mb-8">Related <span className="grad-text">Articles</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((r, i) => (
                <motion.div key={r._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Link href={`/blog/${r.slug}`}>
                    <div className="card-hover h-full flex flex-col p-5">
                      <span className="badge badge-teal text-[10px] mb-3 self-start">{r.category}</span>
                      <h3 className="font-semibold text-sm mb-2 leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>{r.title}</h3>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{r.excerpt}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
