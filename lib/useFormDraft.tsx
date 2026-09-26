'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { FileClock } from 'lucide-react'

// Drafts for long admin forms (Developer, Community): what's typed is kept in this browser as you go, comes back when
// the form is opened again, and leaving with unsaved changes — closing the form or clicking to another page —
// asks whether to keep it as a draft or discard it. Refreshing/closing the tab keeps the draft silently.

const PREFIX = 'dd-draft:'
interface Stored<T> { values: T; savedAt: number }

const read = <T,>(key: string): Stored<T> | null => {
  try { const raw = localStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null } catch { return null }
}
const write = (key: string, values: unknown) => {
  try { localStorage.setItem(PREFIX + key, JSON.stringify({ values, savedAt: Date.now() })) } catch { /* storage full/blocked */ }
}
const remove = (key: string) => { try { localStorage.removeItem(PREFIX + key) } catch { /* ignore */ } }

/** Every saved draft whose key starts with `prefix` (e.g. "project:"), newest first — for "Drafts" lists. */
export function listDrafts<T = any>(prefix: string): { key: string; values: T; savedAt: number }[] {
  if (typeof window === 'undefined') return []
  const out: { key: string; values: T; savedAt: number }[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(PREFIX + prefix)) continue
      const d = read<T>(k.slice(PREFIX.length))
      if (d) out.push({ key: k.slice(PREFIX.length), values: d.values, savedAt: d.savedAt })
    }
  } catch { /* storage unavailable */ }
  return out.sort((a, b) => b.savedAt - a.savedAt)
}
export const removeDraft = (key: string) => remove(key)

export function timeAgoShort(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`
}

export function useFormDraft<T extends object>({ key, values, onRestore }: {
  key: string                 // e.g. 'developer:new' or `community:${id}`
  values: T                   // everything the form holds right now (form fields + images/lists kept in state)
  onRestore: (draft: T) => void
}) {
  const router = useRouter()
  const initial = useRef<string | null>(null)
  if (initial.current === null) initial.current = JSON.stringify(values)
  const current = JSON.stringify(values)
  const currentRef = useRef(current)
  currentRef.current = current
  // Only the person's own edits count. Fields that tidy their value up right after the form opens (the description
  // editor, a list that loads, a remembered choice) would otherwise look like changes and trigger "save as draft?"
  // on a form nobody touched. So: snapshot the form at their first keypress / click / paste / drop inside it
  // (touchProps, spread on the <form>), and compare against that.
  const baseline = useRef<string | null>(null)
  const [touched, setTouched] = useState(false)
  const restored = useRef(false)
  const dirty = restored.current ? current !== initial.current : touched && current !== baseline.current
  const touch = useCallback(() => {
    if (baseline.current !== null) return
    baseline.current = currentRef.current
    setTouched(true)
  }, [])
  // Input/change too (autofill, pasted values): the capture phase runs before the field's own handler, so the
  // snapshot is still the value from before this edit.
  const touchProps = {
    onKeyDownCapture: touch, onPointerDownCapture: touch, onPasteCapture: touch, onDropCapture: touch,
    onInputCapture: touch, onChangeCapture: touch,
  }

  const [restoredAt, setRestoredAt] = useState<number | null>(null)
  const [pending, setPending] = useState<(() => void) | null>(null)
  const finished = useRef(false) // saved or discarded — stop autosaving
  const dirtyRef = useRef(dirty)
  // Lets the form reset itself when a restored draft is discarded.
  const onDiscardRef = useRef<(() => void) | null>(null)
  const onDiscard = (fn: () => void) => { onDiscardRef.current = fn }
  dirtyRef.current = dirty

  // Bring back an earlier draft once, on open.
  useEffect(() => {
    const d = read<T>(key)
    if (d && JSON.stringify(d.values) !== initial.current) { restored.current = true; onRestore(d.values); setRestoredAt(d.savedAt) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Autosave (debounced) while there are changes.
  useEffect(() => {
    if (!dirty || finished.current) return
    const t = setTimeout(() => write(key, values), 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, key, dirty])

  // Clicking a link elsewhere on the page (sidebar, header) with unsaved changes → ask first.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || finished.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
      const a = (e.target as HTMLElement)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname + url.search === window.location.pathname + window.location.search) return
      e.preventDefault(); e.stopPropagation()
      setPending(() => () => router.push(url.pathname + url.search + url.hash))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [router])

  // Tab close / refresh: keep the latest text (no prompt needed — it's already a draft).
  useEffect(() => {
    const save = () => { if (dirtyRef.current && !finished.current) write(key, JSON.parse(current)) }
    window.addEventListener('beforeunload', save)
    return () => window.removeEventListener('beforeunload', save)
  }, [key, current])

  /** Call after a successful save — the draft is no longer needed. */
  const clear = useCallback(() => { finished.current = true; remove(key) }, [key])
  /** Wrap the form's close: asks "save as draft?" when there are unsaved changes. */
  const guard = useCallback((leave: () => void) => {
    if (dirtyRef.current && !finished.current) setPending(() => leave)
    else leave()
  }, [])
  const discardDraft = useCallback(() => {
    remove(key); setRestoredAt(null); restored.current = false; baseline.current = null; setTouched(false)
  }, [key])
  /** Save the draft right now (the "Save draft" button) — autosave does this too, this is just explicit. */
  const saveNow = useCallback(() => { write(key, JSON.parse(current)); return Date.now() }, [key, current])

  const choose = (keep: boolean) => {
    const go = pending
    if (keep) write(key, values)
    else remove(key)
    finished.current = true
    setPending(null)
    go?.()
  }

  const dialog = pending && typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setPending(null)}>
      <div className="w-full max-w-sm rounded-2xl p-5 shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(203,1,1,0.08)' }}>
          <FileClock size={18} style={{ color: 'var(--teal)' }} />
        </div>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Save your changes as a draft?</h3>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          You have unsaved changes. Keep them as a draft and they&apos;ll be here next time you open this form.
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <button type="button" onClick={() => choose(true)} className="btn-primary btn-sm w-full justify-center">Save as draft</button>
          <button type="button" onClick={() => choose(false)} className="btn-outline btn-sm w-full justify-center" style={{ color: '#E11D48' }}>Discard changes</button>
          <button type="button" onClick={() => setPending(null)} className="btn-ghost btn-sm w-full justify-center">Keep editing</button>
        </div>
      </div>
    </div>,
    document.body,
  ) : null

  const banner = restoredAt ? (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs" style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.35)', color: 'var(--text-mid)' }}>
      <span className="flex items-center gap-1.5"><FileClock size={13} style={{ color: '#D97706' }} /> Draft restored · saved {timeAgoShort(restoredAt)}</span>
      <button type="button" onClick={() => { discardDraft(); onDiscardRef.current?.() }} className="font-semibold hover:underline" style={{ color: '#E11D48' }}>Discard draft</button>
    </div>
  ) : null

  return { dirty, clear, guard, dialog, banner, onDiscard, saveNow, touchProps }
}
