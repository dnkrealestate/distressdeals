'use client'
import { useRef, useEffect, useCallback } from 'react'
import { Bold, List } from 'lucide-react'

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28]
const WEIGHTS = [
  { label: 'Thin', value: '300' },
  { label: 'Normal', value: '400' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
]

// Wraps the current selection in a <span style="..."> — used for font-weight
// and font-size, neither of which document.execCommand supports directly.
function wrapSelection(style: Record<string, string>): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
  const range = sel.getRangeAt(0)
  const span = document.createElement('span')
  Object.entries(style).forEach(([k, v]) => span.style.setProperty(k, v))
  try {
    range.surroundContents(span)
  } catch {
    // Selection spans multiple/partial nodes — surroundContents can't wrap
    // it in place, so extract + rewrap instead.
    const frag = range.extractContents()
    span.appendChild(frag)
    range.insertNode(span)
  }
  sel.removeAllRanges()
  const after = document.createRange()
  after.selectNodeContents(span)
  sel.addRange(after)
  return true
}

function ToolbarButton({ onClick, title, active, children }: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => e.preventDefault()} // don't steal focus/selection from the editor
      onClick={onClick}
      className="rounded-lg flex items-center justify-center text-xs font-medium transition-colors flex-shrink-0"
      style={{
        width: 30, height: 30,
        border: `1px solid ${active ? 'var(--teal)' : 'var(--border)'}`,
        color: active ? 'var(--teal)' : 'var(--text-mid)',
        background: active ? 'rgba(49,178,222,0.08)' : 'var(--surface)',
      }}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const sizeIdx = useRef(1) // index into FONT_SIZES, starts at 14px

  // Only push external value into the DOM when it actually differs, so we
  // don't clobber the caret position on every keystroke.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || ''
    }
  }, [value])

  const emit = useCallback(() => onChange(ref.current?.innerHTML || ''), [onChange])

  const bold = () => { document.execCommand('bold'); emit() }
  const list = () => { document.execCommand('insertUnorderedList'); emit() }
  const setWeight = (w: string) => { if (wrapSelection({ 'font-weight': w })) emit() }
  const bumpSize = (dir: 1 | -1) => {
    sizeIdx.current = Math.min(FONT_SIZES.length - 1, Math.max(0, sizeIdx.current + dir))
    if (wrapSelection({ 'font-size': `${FONT_SIZES[sizeIdx.current]}px` })) emit()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 mb-2 p-1.5 rounded-xl" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
        <ToolbarButton onClick={bold} title="Bold"><Bold size={13} /></ToolbarButton>
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => { setWeight(e.target.value); e.target.value = '' }}
          defaultValue=""
          className="select-field py-1 text-xs w-auto"
          style={{ height: 30 }}
          title="Font weight"
        >
          <option value="" disabled>Weight…</option>
          {WEIGHTS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
        </select>
        <ToolbarButton onClick={() => bumpSize(-1)} title="Decrease text size">A-</ToolbarButton>
        <ToolbarButton onClick={() => bumpSize(1)} title="Increase text size">A+</ToolbarButton>
        <ToolbarButton onClick={list} title="Bullet list"><List size={13} /></ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        className="input rte-editor"
        style={{ minHeight: 220, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
        data-placeholder={placeholder}
      />
    </div>
  )
}
