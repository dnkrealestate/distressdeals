'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered,
  Indent, Outdent, Link2, Unlink, Table2, Image as ImageIcon, Undo2, Redo2, RemoveFormatting, Palette, Highlighter,
  ChevronDown, Loader2, Trash2, Rows3, Columns3,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadAPI } from '@/lib/api'

// Word-style rich text editor for listing descriptions. What you see here is what the website shows (the editable
// area uses the same `rich-content` styles as the public pages). Output is plain HTML that the backend's allowlist
// sanitizer keeps: p/h2–h4/blockquote, b/i/u/s, colour + highlight spans, text-align, list-style-type,
// links, tables and images.

const COLORS = [
  '#0F172A', '#334155', '#64748B', '#94A3B8', '#CB0101', '#E11D48', '#EA580C', '#D97706',
  '#CA8A04', '#16A34A', '#059669', '#0891B2', '#2563EB', '#4F46E5', '#7C3AED', '#C026D3',
]
const HIGHLIGHTS = ['#FEF08A', '#FDE68A', '#FED7AA', '#FECACA', '#FBCFE8', '#DDD6FE', '#BFDBFE', '#A7F3D0']
const BLOCKS = [
  { tag: 'p', label: 'Paragraph' },
  { tag: 'h2', label: 'Heading 1' },
  { tag: 'h3', label: 'Heading 2' },
  { tag: 'h4', label: 'Heading 3' },
  { tag: 'blockquote', label: 'Quote' },
]
const BULLETS = [
  { type: 'disc', label: '● Disc', ordered: false },
  { type: 'circle', label: '○ Circle', ordered: false },
  { type: 'square', label: '■ Square', ordered: false },
]
const NUMBERS = [
  { type: 'decimal', label: '1. 2. 3.', ordered: true },
  { type: 'lower-alpha', label: 'a. b. c.', ordered: true },
  { type: 'upper-alpha', label: 'A. B. C.', ordered: true },
  { type: 'lower-roman', label: 'i. ii. iii.', ordered: true },
  { type: 'upper-roman', label: 'I. II. III.', ordered: true },
]

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Pasted text → clean paragraphs (blank line = new paragraph, single line break kept). Keeps Word/web junk out.
function textToHtml(text: string) {
  return text.replace(/\r\n?/g, '\n').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')
}

// ── Toolbar pieces (module level, so they keep their identity between renders) ──
const Btn = ({ on, title, onClick, children, disabled }: { on?: boolean; title: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
  <button type="button" title={title} aria-label={title} aria-pressed={on} disabled={disabled}
    onMouseDown={e => e.preventDefault()} onClick={onClick}
    className="h-8 min-w-8 px-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-medium transition-colors disabled:opacity-35"
    style={on ? { background: 'rgba(203,1,1,0.10)', color: 'var(--teal)' } : { color: 'var(--text-mid)' }}>
    {children}
  </button>
)
const Sep = () => <span className="w-px h-5 mx-0.5 flex-shrink-0" style={{ background: 'var(--border)' }} />
const Pop = ({ children, w = 220 }: { children: React.ReactNode; w?: number }) => (
  <div className="absolute top-full left-0 mt-1.5 z-30 rounded-xl p-2 shadow-xl" style={{ width: w, background: 'var(--surface)', border: '1px solid var(--border)' }}
    onMouseDown={e => { if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault() }}>
    {children}
  </div>
)

const Swatches = ({ colors, onPick, onClear, clearLabel }: { colors: string[]; onPick: (c: string) => void; onClear: () => void; clearLabel: string }) => (
  <>
    <div className="grid grid-cols-8 gap-1.5">
      {colors.map(c => (
        <button key={c} type="button" title={c} onClick={() => onPick(c)} className="w-6 h-6 rounded-md hover:scale-110 transition-transform"
          style={{ background: c, border: '1px solid rgba(0,0,0,0.12)' }} />
      ))}
    </div>
    <div className="flex items-center justify-between gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border-soft)' }}>
      <label className="flex items-center gap-1.5 text-[11px] cursor-pointer" style={{ color: 'var(--text-mid)' }}>
        <input type="color" className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent" onChange={e => onPick(e.target.value)} /> Custom
      </label>
      <button type="button" onClick={onClear} className="text-[11px] hover:underline" style={{ color: 'var(--text-muted)' }}>{clearLabel}</button>
    </div>
  </>
)


type Active = {
  bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; ul?: boolean; ol?: boolean
  left?: boolean; center?: boolean; right?: boolean; justify?: boolean
  block?: string; inTable?: boolean; inLink?: boolean
}

export default function RichEditor({ value, onChange, placeholder = 'Start writing…', minHeight = 320 }: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const lastEmitted = useRef<string>('')
  const [active, setActive] = useState<Active>({})
  const [menu, setMenu] = useState<null | 'block' | 'color' | 'highlight' | 'list' | 'link' | 'table'>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [grid, setGrid] = useState({ r: 0, c: 0 })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Outside changes (AI draft, draft restore, opening another project) replace the content.
  useEffect(() => {
    const el = ref.current
    if (!el || value === lastEmitted.current) return
    el.innerHTML = value || ''
    // Remember it as the browser now writes it, so reading it back later isn't mistaken for an edit.
    lastEmitted.current = value
    normalized.current = el.innerHTML
  }, [value])

  const normalized = useRef<string>('')
  const emit = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (el.innerHTML === normalized.current) return // unchanged since it was loaded / last reported
    const text = el.textContent?.trim()
    const html = !text && !el.querySelector('img,table') ? '' : el.innerHTML
    lastEmitted.current = html
    normalized.current = el.innerHTML
    onChange(html)
  }, [onChange])

  // ── Selection bookkeeping ───────────────────────────────────
  const inEditor = (n: Node | null) => !!n && !!ref.current && ref.current.contains(n)
  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount && inEditor(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange()
  }
  const restoreSelection = () => {
    const el = ref.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (savedRange.current && sel) { sel.removeAllRanges(); sel.addRange(savedRange.current) }
  }
  const anchorEl = (): HTMLElement | null => {
    const sel = window.getSelection()
    const n = sel?.anchorNode
    if (!n || !inEditor(n)) return null
    return (n.nodeType === 1 ? n : n.parentElement) as HTMLElement
  }

  const refreshActive = useCallback(() => {
    const el = anchorEl()
    if (!el) return
    const q = (c: string) => { try { return document.queryCommandState(c) } catch { return false } }
    const blockEl = el.closest('h2,h3,h4,blockquote,p,li,td,th')
    setActive({
      bold: q('bold'), italic: q('italic'), underline: q('underline'), strike: q('strikeThrough'),
      ul: q('insertUnorderedList'), ol: q('insertOrderedList'),
      left: q('justifyLeft'), center: q('justifyCenter'), right: q('justifyRight'), justify: q('justifyFull'),
      block: blockEl && ['H2', 'H3', 'H4', 'BLOCKQUOTE'].includes(blockEl.tagName) ? blockEl.tagName.toLowerCase() : 'p',
      inTable: !!el.closest('td,th'),
      inLink: !!el.closest('a'),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onSel = () => { saveSelection(); refreshActive() }
    document.addEventListener('selectionchange', onSel)
    return () => document.removeEventListener('selectionchange', onSel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshActive])

  // Close popovers on outside click.
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => { if (!wrapRef.current?.querySelector('[data-toolbar]')?.contains(e.target as Node)) setMenu(null) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menu])

  // ── Commands ─────────────────────────────────────────────────
  const exec = (cmd: string, arg?: string, css = false) => {
    restoreSelection()
    try {
      document.execCommand('styleWithCSS', false, css as any)
      document.execCommand(cmd, false, arg)
    } catch { /* unsupported command in this browser — ignore */ }
    saveSelection(); refreshActive(); emit()
  }

  const setBlock = (tag: string) => { exec('formatBlock', `<${tag}>`); setMenu(null) }

  const setList = (ordered: boolean, type: string) => {
    restoreSelection()
    let list = anchorEl()?.closest('ul,ol') as HTMLElement | null
    const wantTag = ordered ? 'OL' : 'UL'
    if (!list || list.tagName !== wantTag) {
      document.execCommand('styleWithCSS', false, false as any)
      document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList')
      list = anchorEl()?.closest('ul,ol') as HTMLElement | null
    }
    if (list) list.style.listStyleType = type
    setMenu(null); saveSelection(); refreshActive(); emit()
  }

  const applyLink = () => {
    let url = linkUrl.trim()
    if (!url) { setMenu(null); return }
    if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(url)) url = `https://${url}`
    restoreSelection()
    const existing = anchorEl()?.closest('a') as HTMLAnchorElement | null
    if (existing) existing.setAttribute('href', url)
    else if (window.getSelection()?.isCollapsed) document.execCommand('insertHTML', false, `<a href="${esc(url)}">${esc(url)}</a>`)
    else document.execCommand('createLink', false, url)
    setMenu(null); setLinkUrl(''); saveSelection(); refreshActive(); emit()
  }

  const insertTable = (rows: number, cols: number) => {
    const head = `<tr>${Array.from({ length: cols }, (_, i) => `<th>Heading ${i + 1}</th>`).join('')}</tr>`
    const body = Array.from({ length: rows - 1 }, () => `<tr>${Array.from({ length: cols }, () => '<td><br></td>').join('')}</tr>`).join('')
    exec('insertHTML', `<table><tbody>${head}${body}</tbody></table><p><br></p>`)
    setMenu(null); setGrid({ r: 0, c: 0 })
  }

  // Table tools — act on the cell the caret is in.
  const tableOp = (op: 'rowAbove' | 'rowBelow' | 'colLeft' | 'colRight' | 'delRow' | 'delCol' | 'delTable' | 'header') => {
    restoreSelection()
    const cell = anchorEl()?.closest('td,th') as HTMLTableCellElement | null
    const row = cell?.parentElement as HTMLTableRowElement | null
    const table = cell?.closest('table') as HTMLTableElement | null
    if (!cell || !row || !table) return
    const idx = cell.cellIndex
    const rows = Array.from(table.rows)
    const newCell = (tag: string) => { const c = document.createElement(tag); c.innerHTML = '<br>'; return c }
    if (op === 'rowAbove' || op === 'rowBelow') {
      const r = document.createElement('tr')
      for (let i = 0; i < row.cells.length; i++) r.appendChild(newCell('td'))
      row.parentElement!.insertBefore(r, op === 'rowAbove' ? row : row.nextSibling)
    } else if (op === 'colLeft' || op === 'colRight') {
      rows.forEach((r, ri) => {
        const ref = r.cells[idx]
        const c = newCell(ri === 0 && r.cells[0]?.tagName === 'TH' ? 'th' : 'td')
        r.insertBefore(c, op === 'colLeft' ? ref : ref?.nextSibling || null)
      })
    } else if (op === 'delRow') {
      rows.length > 1 ? row.remove() : table.remove()
    } else if (op === 'delCol') {
      if (row.cells.length > 1) rows.forEach(r => r.cells[idx]?.remove()); else table.remove()
    } else if (op === 'delTable') {
      table.remove()
    } else if (op === 'header') {
      const first = rows[0]
      const toTag = first.cells[0]?.tagName === 'TH' ? 'td' : 'th'
      Array.from(first.cells).forEach(c => { const n = document.createElement(toTag); n.innerHTML = c.innerHTML; c.replaceWith(n) })
    }
    saveSelection(); refreshActive(); emit()
  }

  const onPickImage = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadAPI.image(fd)
      exec('insertHTML', `<img src="${esc(res.data.data.url)}" alt="" /><p><br></p>`)
    } catch (err: any) {
      toast.error(err?.error || 'Image upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    e.preventDefault()
    exec('insertHTML', text.includes('\n') ? textToHtml(text) : esc(text))
  }

  const toggle = (m: typeof menu) => { saveSelection(); setMenu(v => (v === m ? null : m)) }

  const blockLabel = BLOCKS.find(b => b.tag === active.block)?.label || 'Paragraph'

  return (
    <div ref={wrapRef} className="rounded-xl overflow-visible" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {/* Toolbar */}
      <div data-toolbar className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 px-2 py-1.5 rounded-t-xl"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
        <Btn title="Undo (Ctrl+Z)" onClick={() => exec('undo')}><Undo2 size={15} /></Btn>
        <Btn title="Redo (Ctrl+Y)" onClick={() => exec('redo')}><Redo2 size={15} /></Btn>
        <Sep />

        <div className="relative">
          <Btn title="Text style" onClick={() => toggle('block')}>
            <span className="w-[74px] text-left truncate">{blockLabel}</span><ChevronDown size={12} />
          </Btn>
          {menu === 'block' && (
            <Pop w={180}>
              {BLOCKS.map(b => (
                <button key={b.tag} type="button" onClick={() => setBlock(b.tag)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-alt)]"
                  style={{ color: 'var(--text)', fontWeight: b.tag.startsWith('h') ? 700 : 400, fontSize: b.tag === 'h2' ? 17 : b.tag === 'h3' ? 15 : 13, fontStyle: b.tag === 'blockquote' ? 'italic' : undefined }}>
                  {b.label}
                </button>
              ))}
            </Pop>
          )}
        </div>
        <Sep />

        <Btn title="Bold (Ctrl+B)" on={active.bold} onClick={() => exec('bold')}><Bold size={15} /></Btn>
        <Btn title="Italic (Ctrl+I)" on={active.italic} onClick={() => exec('italic')}><Italic size={15} /></Btn>
        <Btn title="Underline (Ctrl+U)" on={active.underline} onClick={() => exec('underline')}><Underline size={15} /></Btn>
        <Btn title="Strikethrough" on={active.strike} onClick={() => exec('strikeThrough')}><Strikethrough size={15} /></Btn>

        <div className="relative">
          <Btn title="Text colour" onClick={() => toggle('color')}><Palette size={15} /><ChevronDown size={11} /></Btn>
          {menu === 'color' && (
            <Pop>
              <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Text colour</p>
              <Swatches colors={COLORS} onPick={c => { exec('foreColor', c, true); setMenu(null) }}
                onClear={() => { exec('foreColor', '#334155', true); setMenu(null) }} clearLabel="Default" />
            </Pop>
          )}
        </div>
        <div className="relative">
          <Btn title="Highlight" onClick={() => toggle('highlight')}><Highlighter size={15} /><ChevronDown size={11} /></Btn>
          {menu === 'highlight' && (
            <Pop>
              <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Highlight</p>
              <Swatches colors={HIGHLIGHTS} onPick={c => { exec('hiliteColor', c, true); setMenu(null) }}
                onClear={() => { exec('hiliteColor', 'transparent', true); setMenu(null) }} clearLabel="No highlight" />
            </Pop>
          )}
        </div>
        <Sep />

        <Btn title="Align left" on={active.left} onClick={() => exec('justifyLeft', undefined, true)}><AlignLeft size={15} /></Btn>
        <Btn title="Align centre" on={active.center} onClick={() => exec('justifyCenter', undefined, true)}><AlignCenter size={15} /></Btn>
        <Btn title="Align right" on={active.right} onClick={() => exec('justifyRight', undefined, true)}><AlignRight size={15} /></Btn>
        <Btn title="Justify" on={active.justify} onClick={() => exec('justifyFull', undefined, true)}><AlignJustify size={15} /></Btn>
        <Sep />

        <div className="relative">
          <Btn title="Bullet & numbered lists" on={active.ul || active.ol} onClick={() => toggle('list')}>
            {active.ol ? <ListOrdered size={15} /> : <List size={15} />}<ChevronDown size={11} />
          </Btn>
          {menu === 'list' && (
            <Pop w={200}>
              <p className="text-[11px] font-semibold mb-1 px-1" style={{ color: 'var(--text-muted)' }}>Bullets</p>
              {BULLETS.map(b => (
                <button key={b.type} type="button" onClick={() => setList(false, b.type)} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--bg-alt)]" style={{ color: 'var(--text)' }}>{b.label}</button>
              ))}
              <p className="text-[11px] font-semibold mb-1 mt-2 px-1" style={{ color: 'var(--text-muted)' }}>Numbered</p>
              {NUMBERS.map(b => (
                <button key={b.type} type="button" onClick={() => setList(true, b.type)} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--bg-alt)]" style={{ color: 'var(--text)' }}>{b.label}</button>
              ))}
            </Pop>
          )}
        </div>
        <Btn title="Decrease indent" onClick={() => exec('outdent')}><Outdent size={15} /></Btn>
        <Btn title="Increase indent" onClick={() => exec('indent')}><Indent size={15} /></Btn>
        <Sep />

        <div className="relative">
          <Btn title={active.inLink ? 'Edit link' : 'Add link'} on={active.inLink} onClick={() => {
            const a = anchorEl()?.closest('a') as HTMLAnchorElement | null
            setLinkUrl(a?.getAttribute('href') || '')
            toggle('link')
          }}><Link2 size={15} /></Btn>
          {menu === 'link' && (
            <Pop w={290}>
              <p className="text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Link address</p>
              <div className="flex gap-1.5">
                <input autoFocus className="input h-9 text-xs flex-1" placeholder="https://… or /projects/…" value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyLink() } }} />
                <button type="button" onClick={applyLink} className="btn-primary btn-sm">Apply</button>
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Select text first to turn it into a link. Links open in a new tab.</p>
            </Pop>
          )}
        </div>
        <Btn title="Remove link" disabled={!active.inLink} onClick={() => exec('unlink')}><Unlink size={15} /></Btn>

        <div className="relative">
          <Btn title="Insert table" on={active.inTable} onClick={() => toggle('table')}><Table2 size={15} /><ChevronDown size={11} /></Btn>
          {menu === 'table' && (
            <Pop w={214}>
              <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                {grid.r ? `${grid.r} rows × ${grid.c} columns` : 'Choose table size'}
              </p>
              <div className="grid grid-cols-8 gap-1" onMouseLeave={() => setGrid({ r: 0, c: 0 })}>
                {Array.from({ length: 64 }, (_, i) => {
                  const r = Math.floor(i / 8) + 1, c = (i % 8) + 1
                  const on = r <= grid.r && c <= grid.c
                  return (
                    <button key={i} type="button" onMouseEnter={() => setGrid({ r, c })} onClick={() => insertTable(Math.max(r, 2), c)}
                      className="w-5 h-5 rounded-[4px]" aria-label={`${r} by ${c} table`}
                      style={{ background: on ? 'rgba(203,1,1,0.25)' : 'var(--bg-alt)', border: `1px solid ${on ? 'var(--teal)' : 'var(--border)'}` }} />
                  )
                })}
              </div>
            </Pop>
          )}
        </div>

        <Btn title="Insert image" onClick={() => { saveSelection(); fileRef.current?.click() }} disabled={uploading}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
        </Btn>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onPickImage(e.target.files?.[0])} />
        <Sep />
        <Btn title="Clear formatting" onClick={() => { exec('removeFormat'); exec('formatBlock', '<p>') }}><RemoveFormatting size={15} /></Btn>

        {/* Table tools appear while the caret is inside a table. */}
        {active.inTable && (
          <div className="flex flex-wrap items-center gap-0.5 w-full pt-1.5 mt-1" style={{ borderTop: '1px dashed var(--border)' }}>
            <span className="text-[11px] font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>Table:</span>
            <Btn title="Insert row above" onClick={() => tableOp('rowAbove')}><Rows3 size={14} /> Row ↑</Btn>
            <Btn title="Insert row below" onClick={() => tableOp('rowBelow')}><Rows3 size={14} /> Row ↓</Btn>
            <Btn title="Insert column left" onClick={() => tableOp('colLeft')}><Columns3 size={14} /> Col ←</Btn>
            <Btn title="Insert column right" onClick={() => tableOp('colRight')}><Columns3 size={14} /> Col →</Btn>
            <Btn title="Toggle header row" onClick={() => tableOp('header')}>Header row</Btn>
            <Btn title="Delete row" onClick={() => tableOp('delRow')}><Trash2 size={13} /> Row</Btn>
            <Btn title="Delete column" onClick={() => tableOp('delCol')}><Trash2 size={13} /> Col</Btn>
            <Btn title="Delete table" onClick={() => tableOp('delTable')}><Trash2 size={13} /> Table</Btn>
          </div>
        )}
      </div>

      {/* Editable area — same styles as the public page. */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Description"
        data-placeholder={placeholder}
        className="rich-content rich-editor text-sm leading-relaxed px-4 py-3 outline-none"
        style={{ minHeight, color: 'var(--text-mid)' }}
        onInput={emit}
        onBlur={() => { saveSelection(); emit() }}
        onKeyUp={refreshActive}
        onMouseUp={refreshActive}
        onPaste={onPaste}
        onFocus={() => { try { document.execCommand('defaultParagraphSeparator', false, 'p') } catch { /* ignore */ } }}
      />
    </div>
  )
}
