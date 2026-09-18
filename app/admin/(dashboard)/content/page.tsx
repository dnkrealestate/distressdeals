'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Plus, X, Trash2, Pencil, FileText, Eye, UploadCloud, Loader2,
  LayoutList, KanbanSquare, CalendarClock, GripVertical,
} from 'lucide-react'
import { blogAPI, newsAPI, uploadAPI } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import BlockEditor, { Block, htmlToBlocks, blocksToHtml, blocksHaveContent } from '@/components/shared/BlockEditor'
import toast from 'react-hot-toast'

type ContentType = 'blog' | 'news'
type EditorialStage = 'idea' | 'writing' | 'review' | 'scheduled' | 'published'
const STATUS_TABS = ['published', 'draft', 'archived'] as const
// Seed suggestions so a fresh install still offers sensible options before any
// posts exist — matches the category pills shown on the public /blog and /news pages.
const BASE_CATEGORIES: Record<ContentType, string[]> = {
  blog: ['Market Insights', 'Buying Guides', 'Investment', 'Area Guides', 'News'],
  news: ['Regulatory', 'Market Update', 'Announcement', 'Industry'],
}
const STAGES: { key: EditorialStage; label: string }[] = [
  { key: 'idea',      label: 'Idea' },
  { key: 'writing',   label: 'Writing' },
  { key: 'review',    label: 'Review' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'published', label: 'Published' },
]

interface Item {
  _id: string; title: string; slug: string
  excerpt?: string; summary?: string; content: string
  coverImage?: string; category: string; tags?: string[]
  status: string; publishedAt?: string; views?: number; readTime?: number
  editorialStage?: EditorialStage; scheduledFor?: string
  createdAt: string
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>{label}</label>
      {children}
    </div>
  )
}

// ══════════════════════════ Big block-editor form ══════════════════════════

function ContentForm({ type, item, categories, onClose, onSaved }: { type: ContentType; item: Item | null; categories: string[]; onClose: () => void; onSaved: () => void }) {
  const api = type === 'blog' ? blogAPI : newsAPI
  const [coverImage, setCoverImage] = useState(item?.coverImage || '')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [blocks, setBlocks] = useState<Block[]>(() => htmlToBlocks(item?.content || ''))
  const [contentError, setContentError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title:          item?.title || '',
      excerpt:        item?.excerpt || item?.summary || '',
      category:       item?.category || '',
      tags:           item?.tags?.join(', ') || '',
      status:         item?.status || 'draft',
      readTime:       item?.readTime || 5,
      editorialStage: item?.editorialStage || 'idea',
      scheduledFor:   item?.scheduledFor ? item.scheduledFor.slice(0, 10) : '',
    },
  })
  const editorialStage = watch('editorialStage')

  const onDropCover = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadAPI.image(fd)
      if (res.data.success) setCoverImage(res.data.data.url)
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload image')
    } finally {
      setUploadingCover(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCover,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [], 'image/avif': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  const onSubmit = async (data: any) => {
    if (!blocksHaveContent(blocks)) { setContentError(true); return }
    setContentError(false)
    setSubmitting(true)

    const payload: any = {
      title: data.title, content: blocksToHtml(blocks), coverImage,
      category: data.category, status: data.status,
      editorialStage: data.editorialStage,
      scheduledFor: data.editorialStage === 'scheduled' && data.scheduledFor ? data.scheduledFor : undefined,
    }
    if (type === 'blog') {
      payload.excerpt = data.excerpt
      payload.tags = data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
      payload.readTime = Number(data.readTime) || 5
    } else {
      payload.summary = data.excerpt
    }

    try {
      if (item) await api.update(item._id, payload)
      else await api.create(payload)
      toast.success(item ? 'Updated' : 'Created')
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="w-full h-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{item ? 'Edit' : 'New'} {type === 'blog' ? 'Post' : 'News Item'}</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Main column: title + block editor */}
          <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-4">
            <div>
              <input
                className="input text-lg font-bold"
                style={{ padding: '12px 14px' }}
                placeholder="e.g. 5 Things to Know Before Buying Off-Plan in Dubai"
                {...register('title', { required: true })}
              />
              {errors.title && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Title is required</p>}
            </div>

            <div>
              <BlockEditor blocks={blocks} onChange={setBlocks} />
              {contentError && <p className="text-xs mt-2" style={{ color: '#FB7185' }}>Content is required</p>}
            </div>
          </div>

          {/* Sidebar: publish settings */}
          <div className="w-full md:w-80 flex-shrink-0 overflow-y-auto p-5 space-y-4" style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>
            <button type="submit" disabled={submitting || uploadingCover} className="btn-primary w-full justify-center">
              {submitting ? 'Saving…' : item ? 'Save Changes' : 'Create'}
            </button>

            <div className="card p-4 space-y-3">
              <Field label={type === 'blog' ? 'Excerpt *' : 'Summary *'}>
                <textarea className="input" rows={3} placeholder={type === 'blog' ? 'Short excerpt shown in listings' : 'Short summary shown in listings'} {...register('excerpt', { required: true })} />
                {errors.excerpt && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{type === 'blog' ? 'Excerpt' : 'Summary'} is required</p>}
              </Field>

              <Field label="Cover Image">
                {coverImage ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                    <img src={coverImage} alt="" className="w-full h-32 object-cover" />
                    <button
                      type="button" onClick={() => setCoverImage('')}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
                      style={{ background: 'rgba(0,0,0,0.6)' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className="rounded-xl p-5 text-center cursor-pointer transition-colors"
                    style={{
                      border: `2px dashed ${isDragActive ? 'var(--teal)' : 'var(--border)'}`,
                      background: isDragActive ? 'rgba(203,1,1,0.05)' : 'var(--bg-alt)',
                    }}
                  >
                    <input {...getInputProps()} />
                    {uploadingCover ? (
                      <Loader2 size={18} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} />
                    ) : (
                      <>
                        <UploadCloud size={18} style={{ color: 'var(--teal)', margin: '0 auto 6px' }} />
                        <p className="text-xs" style={{ color: 'var(--text)' }}>Drag & drop, or click</p>
                      </>
                    )}
                  </div>
                )}
              </Field>

              <Field label="Category *">
                <input
                  className="input" list="category-suggestions" autoComplete="off"
                  placeholder="e.g. Market Insights"
                  {...register('category', { required: true })}
                />
                <datalist id="category-suggestions">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Pick an existing category or type a new one.</p>
              </Field>

              <Field label="Status">
                <select className="select-field" {...register('status')}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>

              {type === 'blog' && (
                <>
                  <Field label="Tags (comma separated)">
                    <input className="input" placeholder="e.g. Downtown, Investment" {...register('tags')} />
                  </Field>
                  <Field label="Read Time (min)">
                    <input className="input" type="number" {...register('readTime')} />
                  </Field>
                </>
              )}
            </div>

            <div className="card p-4 space-y-3">
              <Field label="Editorial Stage">
                <select className="select-field" {...register('editorialStage')}>
                  {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </Field>
              {editorialStage === 'scheduled' && (
                <Field label="Scheduled For">
                  <input className="input" type="date" {...register('scheduledFor')} />
                </Field>
              )}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                The editorial stage tracks production progress on the content calendar. Setting it to Published also publishes the post.
              </p>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ══════════════════════════ Kanban / editorial calendar ══════════════════════════

function QuickAddCard({ onAdd }: { onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!title.trim()) { setOpen(false); return }
    onAdd(title.trim())
    setTitle(''); setOpen(false)
  }

  if (!open) {
    return (
      <button type="button" onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0) }}
        className="w-full flex items-center gap-1.5 justify-center py-2 rounded-xl text-xs" style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
        <Plus size={12} /> Add card
      </button>
    )
  }
  return (
    <div className="p-2 rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <input
        ref={inputRef}
        className="input" style={{ padding: '6px 10px', fontSize: 12 }}
        placeholder="Title…" value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
        onBlur={submit}
      />
    </div>
  )
}

function KanbanCard({ item, onOpen, onDragStart }: { item: Item; onOpen: () => void; onDragStart: () => void }) {
  return (
    <div
      draggable onDragStart={onDragStart} onClick={onOpen}
      className="p-3 rounded-xl cursor-pointer group transition-shadow hover:shadow-md"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={13} className="flex-shrink-0 mt-0.5 opacity-30 group-hover:opacity-70" style={{ color: 'var(--text-muted)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold line-clamp-2" style={{ color: 'var(--text)' }}>{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="badge badge-gray" style={{ fontSize: 10, padding: '1px 6px' }}>{item.category}</span>
            <span className={cn('badge', item.status === 'published' ? 'badge-green' : item.status === 'draft' ? 'badge-blue' : 'badge-gray')} style={{ fontSize: 10, padding: '1px 6px' }}>
              {item.status}
            </span>
          </div>
          {item.editorialStage === 'scheduled' && item.scheduledFor && (
            <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <CalendarClock size={10} /> {formatDate(item.scheduledFor)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function EditorialCalendar({ items, onEdit, onStageChange, onQuickAdd }: {
  items: Item[]; onEdit: (item: Item) => void; onStageChange: (item: Item, stage: EditorialStage) => void; onQuickAdd: (title: string, stage: EditorialStage) => void
}) {
  const dragItem = useRef<Item | null>(null)

  const byStage = useMemo(() => {
    const grouped: Record<EditorialStage, Item[]> = { idea: [], writing: [], review: [], scheduled: [], published: [] }
    items.forEach(item => grouped[item.editorialStage || 'idea'].push(item))
    return grouped
  }, [items])

  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {STAGES.map(stage => (
        <div
          key={stage.key}
          className="flex-shrink-0 w-64 rounded-2xl p-3"
          style={{ background: 'var(--bg-alt)' }}
          onDragOver={e => e.preventDefault()}
          onDrop={() => { if (dragItem.current) onStageChange(dragItem.current, stage.key) }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>{stage.label}</h3>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{byStage[stage.key].length}</span>
          </div>
          <div className="space-y-2">
            {byStage[stage.key].map(item => (
              <KanbanCard key={item._id} item={item} onOpen={() => onEdit(item)} onDragStart={() => { dragItem.current = item }} />
            ))}
            <QuickAddCard onAdd={title => onQuickAdd(title, stage.key)} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════ Page ══════════════════════════

export default function AdminContentPage() {
  const [type, setType] = useState<ContentType>('blog')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [status, setStatus] = useState<typeof STATUS_TABS[number]>('published')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Item | null | 'new'>(null)

  const api = type === 'blog' ? blogAPI : newsAPI

  const load = useCallback(() => {
    setLoading(true)
    const activeApi = type === 'blog' ? blogAPI : newsAPI
    activeApi.getAllAdmin({})
      .then(r => { if (r.data.success) setItems(r.data.data.data || []) })
      .catch(() => toast.error('Failed to load content'))
      .finally(() => setLoading(false))
  }, [type])

  useEffect(() => { load() }, [load])

  const remove = async (item: Item) => {
    if (!confirm(`Delete "${item.title}"?`)) return
    try { await api.delete(item._id); toast.success('Deleted'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

  const changeStage = async (item: Item, stage: EditorialStage) => {
    if (item.editorialStage === stage) return
    try {
      await api.update(item._id, { editorialStage: stage })
      load()
    } catch (err: any) { toast.error(err?.error || 'Failed to move card') }
  }

  const quickAdd = async (title: string, stage: EditorialStage) => {
    try {
      await api.create({ title, editorialStage: stage, status: 'draft' })
      toast.success('Card added')
      load()
    } catch (err: any) { toast.error(err?.error || 'Failed to add card') }
  }

  const listItems = items.filter(i => i.status === status)
  const categoryOptions = useMemo(
    () => Array.from(new Set([...BASE_CATEGORIES[type], ...items.map(i => i.category)])).filter(Boolean).sort(),
    [type, items]
  )

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Content</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Blog posts, news articles, and the editorial calendar</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-2">
          <Plus size={13} /> New {type === 'blog' ? 'Post' : 'News'}
        </button>
      </header>

      <div className="p-7">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            {(['blog', 'news'] as ContentType[]).map(t => (
              <button
                key={t} onClick={() => setType(t)} className="btn-ghost btn-sm capitalize"
                style={type === t ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={() => setView('list')} className="btn-ghost btn-sm gap-1.5"
              style={view === 'list' ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}>
              <LayoutList size={13} /> List
            </button>
            <button onClick={() => setView('calendar')} className="btn-ghost btn-sm gap-1.5"
              style={view === 'calendar' ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}>
              <KanbanSquare size={13} /> Calendar
            </button>
          </div>

          {view === 'list' && (
            <div className="flex items-center gap-1.5">
              {STATUS_TABS.map(s => (
                <button
                  key={s} onClick={() => setStatus(s)} className="btn-ghost btn-sm capitalize"
                  style={status === s ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-2xl" />)}</div>
        ) : view === 'calendar' ? (
          <EditorialCalendar items={items} onEdit={setEditing} onStageChange={changeStage} onQuickAdd={quickAdd} />
        ) : listItems.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nothing here yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {listItems.map(item => (
              <div key={item._id} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                  {item.coverImage && <img src={item.coverImage} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{item.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {item.category} · {formatDate(item.createdAt)}
                    {typeof item.views === 'number' && <> · <Eye size={10} className="inline" /> {item.views}</>}
                  </p>
                </div>
                <span className={cn('badge', item.status === 'published' ? 'badge-green' : item.status === 'draft' ? 'badge-blue' : 'badge-gray')}>
                  {item.status}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditing(item)} className="btn-ghost btn-sm p-2"><Pencil size={13} /></button>
                  <button onClick={() => remove(item)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <ContentForm
            type={type}
            item={editing === 'new' ? null : editing}
            categories={categoryOptions}
            onClose={() => setEditing(null)}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
