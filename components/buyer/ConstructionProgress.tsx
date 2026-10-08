import { HardHat } from 'lucide-react'
import type { Project } from '@/types'

// Official construction progress of a project, as registered by the Dubai Land Department (copied onto the project by
// the backend's DLD sync — never typed in). Shown only when the project is linked to a DLD record that carries a
// status or a percentage; otherwise nothing renders and the page looks as it always did.

const STATUS: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not started', color: '#B45309' },
  active:      { label: 'Under construction', color: '#0369A1' },
  pending:     { label: 'On hold', color: '#B45309' },
  finished:    { label: 'Completed', color: '#047857' },
}
const monthYear = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '')
const day = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '')

export function progressOf(project: Pick<Project, 'dld'>) {
  const d = project.dld
  if (!d || d.status === 'cancelled') return null
  const finished = d.status === 'finished'
  const pct = finished ? 100 : typeof d.percentCompleted === 'number' && d.percentCompleted >= 0 && d.percentCompleted <= 100 ? d.percentCompleted : null
  const status = d.status ? STATUS[d.status] : null
  if (pct == null && !status) return null
  return { d, pct, status, finished }
}

// One slim line for a card: "Construction 62%" with a thin bar.
export function ConstructionProgressLine({ project, className = '' }: { project: Pick<Project, 'dld'>; className?: string }) {
  const p = progressOf(project)
  if (!p || p.pct == null) return null
  return (
    <div className={`flex items-center gap-2 ${className}`} title={`Construction progress registered by the Dubai Land Department${p.d.syncedAt ? ` · updated ${day(p.d.syncedAt)}` : ''}`}>
      <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{p.finished ? 'Completed' : `Construction ${Math.round(p.pct)}%`}</span>
      <span className="flex-1 h-1 rounded-full overflow-hidden max-w-[120px]" style={{ background: 'var(--border)' }}>
        <span className="block h-full rounded-full" style={{ width: `${p.pct}%`, background: p.finished ? '#047857' : 'var(--teal)' }} />
      </span>
    </div>
  )
}

// The block on the project page.
export default function ConstructionProgress({ project, className = '' }: { project: Pick<Project, 'dld'>; className?: string }) {
  const p = progressOf(project)
  if (!p) return null
  const { d, pct, status, finished } = p
  const expected = finished ? d.completionDate || d.endDate : d.endDate
  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}><HardHat size={16} style={{ color: 'var(--teal)' }} /> Construction Progress</h3>
        {status && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ color: status.color, background: `${status.color}1A`, border: `1px solid ${status.color}33` }}>{status.label}</span>}
      </div>
      {pct != null && (
        <>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-2xl font-bold grad-text leading-none">{pct % 1 ? pct.toFixed(1) : pct}%</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>completed</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}
            role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Construction progress">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: finished ? '#047857' : 'linear-gradient(90deg, #CB0101, #FD7147)' }} />
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs" style={{ color: 'var(--text-mid)' }}>
        {d.startDate && <span>Started <b style={{ color: 'var(--text)' }}>{monthYear(d.startDate)}</b></span>}
        {expected && <span>{finished ? 'Completed' : 'Registered completion'} <b style={{ color: 'var(--text)' }}>{monthYear(expected)}</b></span>}
        {d.units ? <span>Units <b style={{ color: 'var(--text)' }}>{d.units.toLocaleString('en-US')}</b></span> : null}
      </div>
      <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
        Source: Dubai Land Department project register{d.syncedAt ? ` · updated ${day(d.syncedAt)}` : ''}. Shown for information; dates can change.
      </p>
    </div>
  )
}
