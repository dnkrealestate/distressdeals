'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  GripVertical, Trash2, Plus, ImageIcon, Table as TableIcon,
  Heading2, List as ListIcon, Quote as QuoteIcon, Type, Bold, Italic,
  UploadCloud, Loader2, X, Columns, Rows,
} from 'lucide-react'
import { uploadAPI } from '@/lib/api'
import toast from 'react-hot-toast'

// A Notion/Gutenberg-style block editor for blog & news content. Blocks are
// stored only in editor state — on save, serializeBlocks() flattens them to
// the plain HTML string the `content` field has always held (same shape the
// old single contentEditable RichTextEditor produced), so the backend
// sanitizer, public rendering, and every pre-existing post keep working
// unchanged. htmlToBlocks() is the inverse, used to load existing content
// (including posts written before this editor existed) back into blocks.

export type BlockType = 'paragraph' | 'heading' | 'image' | 'table' | 'list' | 'quote'

export interface Block {
  id: string
  type: BlockType
  html?: string
  level?: 2 | 3 | 4
  items?: string[]
  src?: string
  alt?: string
  rows?: string[][]
}

const uid = () => Math.random().toString(36).slice(2, 10)

function emptyBlock(type: BlockType): Block {
  switch (type) {
    case 'heading': return { id: uid(), type, html: '', level: 2 }
    case 'image':   return { id: uid(), type, src: '', alt: '' }
    case 'table':   return { id: uid(), type, rows: [['', ''], ['', '']] }
    case 'list':    return { id: uid(), type, items: [''] }
    default:        return { id: uid(), type, html: '' }
  }
}

// ── HTML ↔ Blocks ────────────────────────────────────────

export function htmlToBlocks(html: string): Block[] {
  if (!html || !html.trim()) return [emptyBlock('paragraph')]
  if (typeof window === 'undefined') return [emptyBlock('paragraph')]

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return [emptyBlock('paragraph')]

  const blocks: Block[] = []
  root.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) blocks.push({ id: uid(), type: 'paragraph', html: node.textContent })
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
      blocks.push({ id: uid(), type: 'heading', html: el.innerHTML, level: Number(tag[1]) as 2 | 3 | 4 })
    } else if (tag === 'blockquote') {
      blocks.push({ id: uid(), type: 'quote', html: el.innerHTML })
    } else if (tag === 'ul' || tag === 'ol') {
      blocks.push({ id: uid(), type: 'list', items: Array.from(el.children).map(li => li.innerHTML) })
    } else if (tag === 'img') {
      blocks.push({ id: uid(), type: 'image', src: el.getAttribute('src') || '', alt: el.getAttribute('alt') || '' })
    } else if (tag === 'table') {
      const rows = Array.from(el.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(td => td.textContent || ''))
      blocks.push({ id: uid(), type: 'table', rows: rows.length ? rows : [['', '']] })
    } else if (tag === 'p' || tag === 'div') {
      blocks.push({ id: uid(), type: 'paragraph', html: el.innerHTML })
    } else {
      // Unknown tag from legacy content — keep it as an opaque paragraph so
      // nothing silently disappears; it'll still pass through the sanitizer on save.
      blocks.push({ id: uid(), type: 'paragraph', html: el.outerHTML })
    }
  })

  return blocks.length ? blocks : [emptyBlock('paragraph')]
}

export function blocksToHtml(blocks: Block[]): string {
  return blocks.map(b => {
    switch (b.type) {
      case 'heading':   return `<h${b.level || 2}>${b.html || ''}</h${b.level || 2}>`
      case 'quote':      return `<blockquote>${b.html || ''}</blockquote>`
      case 'list':       return `<ul>${(b.items || []).filter(i => i.trim()).map(i => `<li>${i}</li>`).join('')}</ul>`
      case 'image':      return b.src ? `<img src="${b.src}" alt="${(b.alt || '').replace(/"/g, '&quot;')}" />` : ''
      case 'table':      return `<table><tbody>${(b.rows || []).map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      default:           return b.html?.trim() ? `<p>${b.html}</p>` : ''
    }
  }).filter(Boolean).join('')
}

export function blocksHaveContent(blocks: Block[]): boolean {
  return blocks.some(b => {
    if (b.type === 'image') return !!b.src
    if (b.type === 'table') return (b.rows || []).some(r => r.some(c => c.trim()))
    if (b.type === 'list') return (b.items || []).some(i => i.trim())
    return !!b.html?.replace(/<[^>]*>/g, '').trim()
  })
}

// ── Inline editable text (paragraph / heading / quote) ────────

function EditableText({ html, placeholder, tag: Tag, onChange }: {
  html: string; placeholder: string; tag: 'p' | 'h2' | 'h3' | 'h4' | 'blockquote'; onChange: (html: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (html || '')) ref.current.innerHTML = html || ''
  }, [html])

  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { document.execCommand('bold'); onChange(ref.current?.innerHTML || '') }}
          className="w-6 h-6 rounded flex items-center justify-center" style={{ border: '1px solid var(--border)', color: 'var(--text-mid)' }} title="Bold">
          <Bold size={11} />
        </button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { document.execCommand('italic'); onChange(ref.current?.innerHTML || '') }}
          className="w-6 h-6 rounded flex items-center justify-center" style={{ border: '1px solid var(--border)', color: 'var(--text-mid)' }} title="Italic">
          <Italic size={11} />
        </button>
      </div>
      <Tag
        ref={ref as any}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || '')}
        onBlur={() => onChange(ref.current?.innerHTML || '')}
        data-placeholder={placeholder}
        className="input rte-editor"
        style={{ minHeight: Tag === 'p' ? 70 : 44, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
      />
    </div>
  )
}

// ── Block renderer ─────────────────────────────────────────────

function BlockShell({ children, onDelete, dragHandleProps }: { children: React.ReactNode; onDelete: () => void; dragHandleProps: any }) {
  return (
    <div className="group relative flex gap-2 p-3 rounded-xl transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div {...dragHandleProps} className="flex-shrink-0 cursor-grab pt-1 opacity-0 group-hover:opacity-60 transition-opacity" title="Drag to reorder">
        <GripVertical size={15} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
      <button
        type="button" onClick={onDelete}
        className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: '#FB7185' }} title="Delete block"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function ImageBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadAPI.image(fd)
      if (res.data.success) onChange({ ...block, src: res.data.data.url })
      else toast.error('Upload failed')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }, [block, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [], 'image/avif': [] },
    maxSize: 10 * 1024 * 1024, multiple: false,
  })

  if (block.src) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-lg overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
          <img src={block.src} alt={block.alt || ''} className="w-full max-h-72 object-cover" />
          <button type="button" onClick={() => onChange({ ...block, src: '' })}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <X size={13} />
          </button>
        </div>
        <input
          className="input" placeholder="Alt text (for SEO & accessibility)"
          value={block.alt || ''} onChange={e => onChange({ ...block, alt: e.target.value })}
        />
      </div>
    )
  }

  return (
    <div {...getRootProps()} className="rounded-lg p-6 text-center cursor-pointer transition-colors"
      style={{ border: `2px dashed ${isDragActive ? 'var(--teal)' : 'var(--border)'}`, background: isDragActive ? 'rgba(203,1,1,0.05)' : 'var(--bg-alt)' }}>
      <input {...getInputProps()} />
      {uploading ? <Loader2 size={18} className="animate-spin mx-auto" style={{ color: 'var(--teal)' }} /> : (
        <>
          <UploadCloud size={18} style={{ color: 'var(--teal)', margin: '0 auto 6px' }} />
          <p className="text-xs" style={{ color: 'var(--text)' }}>Drag & drop an image, or click to browse</p>
        </>
      )}
    </div>
  )
}

function TableBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const rows = block.rows && block.rows.length ? block.rows : [['', '']]
  const cols = rows[0]?.length || 2

  const setCell = (r: number, c: number, value: string) => {
    const next = rows.map(row => [...row])
    next[r][c] = value
    onChange({ ...block, rows: next })
  }
  const addRow = () => onChange({ ...block, rows: [...rows, Array(cols).fill('')] })
  const removeRow = (r: number) => rows.length > 1 && onChange({ ...block, rows: rows.filter((_, i) => i !== r) })
  const addCol = () => onChange({ ...block, rows: rows.map(row => [...row, '']) })
  const removeCol = (c: number) => cols > 1 && onChange({ ...block, rows: rows.map(row => row.filter((_, i) => i !== c)) })

  return (
    <div className="space-y-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs" style={{ minWidth: 320 }}>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="p-0" style={{ border: '1px solid var(--border)' }}>
                  <input
                    value={cell} onChange={e => setCell(r, c, e.target.value)}
                    placeholder={r === 0 ? `Column ${c + 1}` : ''}
                    className="w-full px-2 py-1.5 bg-transparent outline-none text-xs"
                    style={{ color: 'var(--text)', fontWeight: r === 0 ? 600 : 400 }}
                  />
                </td>
              ))}
              <td className="p-0 pl-1.5">
                <button type="button" onClick={() => removeRow(r)} className="w-5 h-5 flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Remove row">
                  <X size={11} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2">
        <button type="button" onClick={addRow} className="btn-ghost btn-sm gap-1.5" style={{ fontSize: 11, padding: '4px 10px' }}>
          <Rows size={11} /> Add row
        </button>
        <button type="button" onClick={addCol} className="btn-ghost btn-sm gap-1.5" style={{ fontSize: 11, padding: '4px 10px' }}>
          <Columns size={11} /> Add column
        </button>
        {cols > 1 && (
          <button type="button" onClick={() => removeCol(cols - 1)} className="btn-ghost btn-sm gap-1.5" style={{ fontSize: 11, padding: '4px 10px' }}>
            <X size={11} /> Remove last column
          </button>
        )}
      </div>
    </div>
  )
}

function ListBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const items = block.items && block.items.length ? block.items : ['']

  const setItem = (i: number, value: string) => {
    const next = [...items]; next[i] = value
    onChange({ ...block, items: next })
  }
  const addItem = () => onChange({ ...block, items: [...items, ''] })
  const removeItem = (i: number) => items.length > 1 && onChange({ ...block, items: items.filter((_, idx) => idx !== i) })

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <input
            value={item}
            onChange={e => setItem(i, e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
            placeholder="List item"
            className="input flex-1" style={{ padding: '6px 10px' }}
          />
          <button type="button" onClick={() => removeItem(i)} className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            <X size={12} />
          </button>
        </div>
      ))}
      <button type="button" onClick={addItem} className="btn-ghost btn-sm gap-1.5" style={{ fontSize: 11, padding: '4px 10px' }}>
        <Plus size={11} /> Add item
      </button>
    </div>
  )
}

const ADD_MENU: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'paragraph', label: 'Text',    icon: <Type size={13} /> },
  { type: 'heading',   label: 'Heading', icon: <Heading2 size={13} /> },
  { type: 'image',     label: 'Image',   icon: <ImageIcon size={13} /> },
  { type: 'table',     label: 'Table',   icon: <TableIcon size={13} /> },
  { type: 'list',      label: 'List',    icon: <ListIcon size={13} /> },
  { type: 'quote',     label: 'Quote',   icon: <QuoteIcon size={13} /> },
]

function AddBlockMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className="btn-ghost btn-sm gap-1.5 w-full justify-center">
        <Plus size={13} /> Add block
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 z-10 rounded-xl shadow-xl p-1.5 grid grid-cols-2 gap-1"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {ADD_MENU.map(item => (
            <button
              key={item.type} type="button"
              onClick={() => { onAdd(item.type); setOpen(false) }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors"
              style={{ color: 'var(--text)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-alt)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BlockEditor({ blocks, onChange }: { blocks: Block[]; onChange: (blocks: Block[]) => void }) {
  const dragIndex = useRef<number | null>(null)

  const updateBlock = (id: string, next: Block) => onChange(blocks.map(b => (b.id === id ? next : b)))
  const deleteBlock = (id: string) => onChange(blocks.length > 1 ? blocks.filter(b => b.id !== id) : [emptyBlock('paragraph')])
  const insertBlock = (afterId: string | null, type: BlockType) => {
    const block = emptyBlock(type)
    if (afterId === null) { onChange([...blocks, block]); return }
    const idx = blocks.findIndex(b => b.id === afterId)
    const next = [...blocks]; next.splice(idx + 1, 0, block)
    onChange(next)
  }

  const onDrop = (targetIdx: number) => {
    if (dragIndex.current === null || dragIndex.current === targetIdx) return
    const next = [...blocks]
    const [moved] = next.splice(dragIndex.current, 1)
    next.splice(targetIdx, 0, moved)
    onChange(next)
    dragIndex.current = null
  }

  return (
    <div className="space-y-2.5">
      {blocks.map((block, idx) => (
        <div
          key={block.id}
          onDragOver={e => e.preventDefault()}
          onDrop={() => onDrop(idx)}
        >
          <BlockShell
            onDelete={() => deleteBlock(block.id)}
            dragHandleProps={{ draggable: true, onDragStart: () => { dragIndex.current = idx } }}
          >
            {block.type === 'paragraph' && (
              <EditableText tag="p" html={block.html || ''} placeholder="Write something…" onChange={html => updateBlock(block.id, { ...block, html })} />
            )}
            {block.type === 'heading' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  {[2, 3, 4].map(l => (
                    <button
                      key={l} type="button" onClick={() => updateBlock(block.id, { ...block, level: l as 2 | 3 | 4 })}
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={block.level === l
                        ? { color: 'var(--teal)', border: '1px solid rgba(203,1,1,0.4)', background: 'rgba(203,1,1,0.08)' }
                        : { color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                      H{l}
                    </button>
                  ))}
                </div>
                <EditableText
                  tag={`h${block.level || 2}` as 'h2' | 'h3' | 'h4'} html={block.html || ''} placeholder="Heading"
                  onChange={html => updateBlock(block.id, { ...block, html })}
                />
              </div>
            )}
            {block.type === 'quote' && (
              <EditableText tag="blockquote" html={block.html || ''} placeholder="Quote" onChange={html => updateBlock(block.id, { ...block, html })} />
            )}
            {block.type === 'image' && <ImageBlock block={block} onChange={b => updateBlock(block.id, b)} />}
            {block.type === 'table' && <TableBlock block={block} onChange={b => updateBlock(block.id, b)} />}
            {block.type === 'list' && <ListBlock block={block} onChange={b => updateBlock(block.id, b)} />}
          </BlockShell>
          <div className="opacity-30 hover:opacity-100 focus-within:opacity-100 transition-opacity py-1">
            <AddBlockMenu onAdd={type => insertBlock(block.id, type)} />
          </div>
        </div>
      ))}
      {blocks.length === 0 && <AddBlockMenu onAdd={type => insertBlock(null, type)} />}
    </div>
  )
}
