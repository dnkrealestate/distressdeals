'use client'
import { Hash } from 'lucide-react'
import toast from 'react-hot-toast'

// Compact inline form for tables and cards: "Jane Doe  B-A1".
export function IdTag({ id }: { id?: string }) {
  if (!id) return null
  return (
    <span className="ml-1.5 px-1.5 py-px rounded font-mono text-[10px] font-semibold align-middle whitespace-nowrap" style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
      {id}
    </span>
  )
}

// A user's role-prefixed public ID (S-A1 / B-A1 / A-A1). Click to copy — it's what they quote to our team.
export default function UserIdChip({ id, label = 'Your ID', className = '' }: { id?: string; label?: string; className?: string }) {
  if (!id) return null
  const copy = () => {
    navigator.clipboard?.writeText(id).then(() => toast.success(`${id} copied`)).catch(() => {})
  }
  return (
    <button
      type="button" onClick={copy} title="Copy ID"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${className}`}
      style={{ background: 'rgba(203,1,1,0.08)', color: 'var(--teal)', border: '1px solid rgba(203,1,1,0.2)' }}
    >
      <Hash size={11} />
      {label ? `${label}: ` : ''}<span className="font-mono">{id}</span>
    </button>
  )
}
