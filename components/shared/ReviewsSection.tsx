'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { Star, MessageSquareText, Loader2, CornerDownRight, Trash2 } from 'lucide-react'
import { reviewAPI } from '@/lib/api'
import { useAuthStore, useAuthHydrated } from '@/store/authStore'
import { formatDate } from '@/lib/utils'
import type { Review, ReviewSummary, ReviewTargetType } from '@/types'

// Reviews & ratings for any guide page (a place, area, community, building, article). Everyone sees the approved
// reviews and the rating breakdown; a signed-in visitor can leave one review (or edit theirs), which appears after the
// team has checked it.
function Stars({ value, size = 14, onPick }: { value: number; size?: number; onPick?: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <span className="inline-flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => {
        const on = (hover || value) >= n - 0.25
        const star = <Star size={size} fill={on ? '#F59E0B' : 'transparent'} stroke={on ? '#F59E0B' : 'var(--border)'} />
        return onPick
          ? <button key={n} type="button" aria-label={`${n} star${n === 1 ? '' : 's'}`} onMouseEnter={() => setHover(n)} onClick={() => onPick(n)} className="p-0.5">{star}</button>
          : <span key={n}>{star}</span>
      })}
    </span>
  )
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

export default function ReviewsSection({ type, slug, name }: { type: ReviewTargetType; slug: string; name: string }) {
  const { isAuthenticated } = useAuthStore()
  const hydrated = useAuthHydrated()
  const pathname = usePathname()
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewSummary>({ avg: 0, count: 0, dist: [0, 0, 0, 0, 0] })
  const [mine, setMine] = useState<Review | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const load = (p = 1) => reviewAPI.get(type, slug, p).then(r => {
    const d = r.data.data
    setReviews(prev => (p === 1 ? d.reviews : [...prev, ...d.reviews]))
    setSummary(d.summary); setMine(d.mine || null); setPage(d.page); setTotalPages(d.totalPages || 1)
  }).catch(() => {}).finally(() => setLoading(false))

  // Reload once the saved session is known, so a signed-in visitor sees their own review's status.
  useEffect(() => { if (hydrated) load(1) }, [type, slug, hydrated, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const startWriting = () => {
    if (mine) { setRating(mine.rating); setTitle(mine.title || ''); setComment(mine.comment) }
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) return toast.error('Choose a star rating')
    if (comment.trim().length < 10) return toast.error('Tell us a little more — at least 10 characters')
    setSaving(true)
    try {
      const r = await reviewAPI.submit({ type, slug, rating, title: title.trim(), comment: comment.trim() })
      toast.success(r.data.message || 'Thanks for your review')
      setOpen(false)
      await load(1)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not send your review — please try again')
    } finally { setSaving(false) }
  }

  const removeMine = async () => {
    if (!confirm('Delete your review?')) return
    await reviewAPI.deleteMine(type, slug).catch(() => {})
    setRating(0); setTitle(''); setComment(''); setOpen(false)
    load(1)
  }

  return (
    <section id="reviews" className="pb-16 scroll-mt-24">
      <div className="wrap max-w-5xl">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <MessageSquareText size={17} style={{ color: 'var(--teal)' }} /> Reviews of {name}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-6">
          {/* Rating breakdown */}
          <div className="card p-5 h-fit">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold leading-none" style={{ color: 'var(--text)' }}>{summary.count ? summary.avg.toFixed(1) : '—'}</span>
              <div className="pb-0.5">
                <Stars value={summary.avg} />
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{summary.count ? `${summary.count} review${summary.count === 1 ? '' : 's'}` : 'No reviews yet'}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map(n => {
                const c = summary.dist[n - 1] || 0
                return (
                  <div key={n} className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span className="w-3">{n}</span>
                    <span className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                      <span className="block h-full rounded-full" style={{ width: `${summary.count ? (c / summary.count) * 100 : 0}%`, background: '#F59E0B' }} />
                    </span>
                    <span className="w-5 text-right">{c}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-5">
              {!hydrated ? null : isAuthenticated ? (
                <button onClick={startWriting} className="btn-primary w-full justify-center h-10 text-sm">{mine ? 'Edit your review' : 'Write a review'}</button>
              ) : (
                <>
                  <Link href={`/auth/login?next=${encodeURIComponent(`${pathname}#reviews`)}`} className="btn-primary w-full justify-center h-10 text-sm">Sign in to review</Link>
                  <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--text-muted)' }}>A free account keeps reviews genuine.</p>
                </>
              )}
            </div>
          </div>

          <div className="min-w-0">
            {mine && !open && mine.status !== 'approved' && (
              <div className="card p-4 mb-4 text-xs" style={{ borderColor: 'rgba(245,158,11,0.4)', color: 'var(--text-mid)' }}>
                <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  {mine.status === 'pending' ? 'Your review is waiting to be checked' : 'Your review was not published'}
                </p>
                <Stars value={mine.rating} size={12} /> <span className="ml-1">{mine.comment}</span>
                {mine.status === 'rejected' && <p className="mt-1.5">You can edit and send it again.</p>}
              </div>
            )}

            {open && (
              <form onSubmit={submit} className="card p-5 mb-5 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Your rating</span>
                  <Stars value={rating} size={24} onPick={setRating} />
                  {rating > 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{LABELS[rating]}</span>}
                </div>
                <input className="input" placeholder="Title (optional)" maxLength={100} value={title} onChange={e => setTitle(e.target.value)} />
                <textarea className="input min-h-[110px]" placeholder={`What was ${name} like? What should others know before they go?`} maxLength={2000}
                  value={comment} onChange={e => setComment(e.target.value)} />
                <div className="flex items-center gap-2 flex-wrap">
                  <button type="submit" disabled={saving} className="btn-primary h-10 px-5 text-sm">{saving ? <Loader2 size={15} className="animate-spin" /> : mine ? 'Update review' : 'Post review'}</button>
                  <button type="button" onClick={() => setOpen(false)} className="btn-outline h-10 px-4 text-sm">Cancel</button>
                  {mine && <button type="button" onClick={removeMine} className="ml-auto inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}><Trash2 size={13} /> Delete my review</button>}
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Reviews are checked before they appear. Please keep it honest, first-hand and respectful.</p>
              </form>
            )}

            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--teal)' }} /></div>
            ) : reviews.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>No reviews yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Been to {name}? Share what it was like — it helps the next visitor.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {reviews.map(r => (
                  <li key={r._id} className="card p-5">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'rgba(203,1,1,0.1)', color: 'var(--teal)' }}>
                        {r.authorName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{r.authorName}</p>
                        <p className="text-[11px] flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><Stars value={r.rating} size={11} /> {formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    {r.title && <p className="text-sm font-semibold mt-3" style={{ color: 'var(--text)' }}>{r.title}</p>}
                    <p className="text-sm leading-relaxed mt-2 whitespace-pre-line" style={{ color: 'var(--text-mid)', overflowWrap: 'anywhere' }}>{r.comment}</p>
                    {r.reply && (
                      <div className="mt-3 pl-3 text-xs flex gap-2" style={{ borderLeft: '2px solid var(--teal)', color: 'var(--text-mid)' }}>
                        <CornerDownRight size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--teal)' }} />
                        <p><span className="font-semibold" style={{ color: 'var(--text)' }}>Distress Deals UAE: </span>{r.reply}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {page < totalPages && (
              <button onClick={() => load(page + 1)} className="btn-outline h-10 px-5 text-sm mt-4">Show more reviews</button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
