'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ExternalLink, RotateCcw, Save, Undo2 } from 'lucide-react'
import toast from 'react-hot-toast'
import RichEditor from '@/components/shared/RichEditor'
import { contentPageAPI } from '@/lib/api'
import { LEGAL_DEFAULTS, LEGAL_PAGES } from '@/lib/legalContent'

const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

// Editor for a legal page (privacy / terms / cookies): its title, "Last updated" date and the whole text. Until a
// version is saved here the website shows the built-in text, which is also what this editor opens with.
export default function LegalPageEditor({ params }: { params: { pageKey: string } }) {
  const { pageKey } = params
  const meta = LEGAL_PAGES[pageKey]
  const fallback = LEGAL_DEFAULTS[pageKey]

  const [title, setTitle] = useState('')
  const [updated, setUpdated] = useState('')
  const [html, setHtml] = useState('')
  const [isSaved, setIsSaved] = useState(false)     // a version exists in the database (not just the built-in text)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editorKey, setEditorKey] = useState(0)     // remounts the editor when its text is replaced from outside

  const show = (t: string, u: string, h: string) => { setTitle(t); setUpdated(u); setHtml(h); setEditorKey(k => k + 1) }

  const load = () => {
    if (!fallback) return
    setLoading(true)
    contentPageAPI.get(pageKey)
      .then(r => {
        const saved = r.data.success ? r.data.data : null
        if (saved?.bodyHtml) { show(saved.heroTitle || fallback.title, saved.updatedLabel || '', saved.bodyHtml); setIsSaved(true) }
        else { show(fallback.title, fallback.updated, fallback.html); setIsSaved(false) }
      })
      .catch(() => toast.error('Failed to load the page'))
      .finally(() => setLoading(false))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [pageKey])

  const save = async () => {
    if (!title.trim()) { toast.error('Add a page title'); return }
    if (!html.replace(/<[^>]*>/g, '').trim()) { toast.error('The page text cannot be empty'); return }
    setSaving(true)
    try {
      const res = await contentPageAPI.update(pageKey, { heroTitle: title.trim(), heroIntro: '', sections: [], bodyHtml: html, updatedLabel: updated.trim() })
      if (res.data.success) {
        show(res.data.data.heroTitle, res.data.data.updatedLabel || '', res.data.data.bodyHtml || '')
        setIsSaved(true)
        toast.success('Saved — the website shows it within a minute')
      }
    } catch (err: any) {
      toast.error(err?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!meta || !fallback) {
    return <div className="p-7"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Unknown page. Go back to <Link href="/admin/settings" style={{ color: 'var(--teal)' }}>Settings</Link>.</p></div>
  }
  if (loading) {
    return <div className="p-7 space-y-4">{Array(3).fill(null).map((_, i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}</div>
  }

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3 px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <Link href="/admin/settings" className="text-xs flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <ChevronLeft size={12} /> Settings
          </Link>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{meta.label}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isSaved ? 'The website shows the version saved here.' : 'Nothing saved yet — the website shows this built-in text. Edit and save to replace it.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={meta.path} target="_blank" rel="noreferrer" className="btn-ghost btn-sm gap-2"><ExternalLink size={13} /> View Live</a>
          <button onClick={load} className="btn-ghost btn-sm gap-2"><RotateCcw size={13} /> Reload</button>
          <button onClick={save} disabled={saving} className="btn-primary btn-sm gap-2"><Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </header>

      <div className="p-7 space-y-5 max-w-3xl">
        <div className="card p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text)' }}>Page title</label>
            <input className="input w-full font-semibold" value={title} onChange={e => setTitle(e.target.value)} placeholder={fallback.title} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text)' }}>Last updated</label>
            <div className="flex gap-2">
              <input className="input flex-1" value={updated} onChange={e => setUpdated(e.target.value)} placeholder="e.g. 5 October 2026" />
              <button type="button" onClick={() => setUpdated(today())} className="btn-ghost btn-sm flex-shrink-0">Set to today</button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Shown under the title as "Last updated: …". Change it whenever you change the text. Leave empty to hide it.</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Page text</h2>
            <button type="button" className="btn-ghost btn-sm gap-1.5"
              onClick={() => { if (window.confirm('Replace the text in the editor with the original built-in text? Nothing changes on the website until you save.')) show(fallback.title, fallback.updated, fallback.html) }}>
              <Undo2 size={12} /> Load original text
            </button>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Use Heading 2 for each numbered section. Links to your own pages can be written as /contact, /privacy, /terms or /cookies.
          </p>
          <RichEditor key={editorKey} value={html} onChange={setHtml} placeholder="Write the page text…" minHeight={520} />
        </div>
      </div>
    </div>
  )
}
