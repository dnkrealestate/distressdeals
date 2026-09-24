'use client'
import { useEffect, useState } from 'react'
import { Check, CheckCheck, Download, File, FileSpreadsheet, FileText, Info, Presentation, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  clockTime, dayLabel, fileFlavour, formatFileSize, lastSeenLabel, messageStatus, type FileFlavour, type MessageStatus,
} from '@/lib/chat'
import type { ChatAttachment, ChatMessage } from '@/types'

/* ── ✓ sent · ✓✓ delivered · blue ✓✓ seen ─────────────────────────────── */
export function StatusTicks({ message, className }: { message: ChatMessage; className?: string }) {
  const status: MessageStatus = messageStatus(message)
  const label = status === 'seen' ? 'Seen' : status === 'delivered' ? 'Delivered' : 'Sent'
  return (
    <span className={cn('inline-flex items-center', className)} title={label} aria-label={label} data-status={status}>
      {status === 'sent'
        ? <Check size={14} style={{ color: 'var(--text-muted)' }} />
        : <CheckCheck size={14} style={{ color: status === 'seen' ? '#3B82F6' : 'var(--text-muted)' }} />}
    </span>
  )
}

/* ── the little bouncing dots ────────────────────────────────────────── */
export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-end gap-[3px]', className)} aria-hidden="true">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1 h-1 rounded-full animate-bounce" style={{ background: 'currentColor', animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }} />
      ))}
    </span>
  )
}

/* ── online dot + status line ────────────────────────────────────────── */
export function OnlineDot({ online, className }: { online: boolean; className?: string }) {
  return (
    <span
      className={cn('inline-block w-2.5 h-2.5 rounded-full flex-shrink-0', className)}
      style={{ background: online ? '#22C55E' : 'var(--text-muted)', boxShadow: '0 0 0 2px var(--surface)', opacity: online ? 1 : 0.55 }}
      title={online ? 'Online' : 'Offline'}
    />
  )
}

/** typing… › (nothing while online — the green dot on the avatar says it) › Last seen 5 min ago — for the thread header. */
export function PresenceLine({
  typingNames, onlineCount, lastSeenAt,
}: { typingNames: string[]; onlineCount: number; lastSeenAt?: string }) {
  if (typingNames.length > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--teal)' }} aria-live="polite">
        {typingNames.length === 1 ? `${typingNames[0]} is typing` : `${typingNames.length} people are typing`}
        <TypingDots />
      </span>
    )
  }
  if (onlineCount > 0) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
      <OnlineDot online={false} /> {lastSeenLabel(lastSeenAt)}
    </span>
  )
}

/** The "…" bubble shown in the thread while the other person is typing. */
export function TypingBubble() {
  return (
    <div className="flex" aria-live="polite" aria-label="Typing">
      <span className="inline-flex items-center rounded-2xl rounded-bl-sm px-3.5 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        <span className="inline-flex items-end gap-[3px]">
          {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'currentColor', animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }} />)}
        </span>
      </span>
    </div>
  )
}

/* ── day divider ─────────────────────────────────────────────────────── */
export function DayDivider({ iso }: { iso: string }) {
  return (
    <div className="flex items-center justify-center my-2">
      <span className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)', border: '1px solid var(--border-soft)' }}>
        {dayLabel(iso)}
      </span>
    </div>
  )
}

/* ── attachments ─────────────────────────────────────────────────────── */
const FLAVOUR: Record<FileFlavour, { icon: any; color: string; label: string }> = {
  pdf:    { icon: FileText,        color: '#EF4444', label: 'PDF' },
  word:   { icon: FileText,        color: '#2563EB', label: 'Word' },
  sheet:  { icon: FileSpreadsheet, color: '#16A34A', label: 'Sheet' },
  slides: { icon: Presentation,    color: '#EA580C', label: 'Slides' },
  text:   { icon: FileText,        color: '#64748B', label: 'Text' },
  other:  { icon: File,            color: '#64748B', label: 'File' },
}

export function FileIcon({ name, mime, size = 20 }: { name: string; mime?: string; size?: number }) {
  const f = FLAVOUR[fileFlavour(name, mime)]
  const Icon = f.icon
  return (
    <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${f.color}1A`, color: f.color }}>
      <Icon size={size} />
    </span>
  )
}

function Lightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose} role="dialog" aria-label={name}>
      <div className="absolute top-4 right-4 flex gap-2">
        <a href={src} download={name} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.15)' }} aria-label="Download">
          <Download size={18} />
        </a>
        <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.15)' }} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name} className="max-w-full max-h-full rounded-lg" onClick={e => e.stopPropagation()} />
    </div>
  )
}

export function AttachmentView({ a, mine }: { a: ChatAttachment; mine: boolean }) {
  const [open, setOpen] = useState(false)
  if (a.kind === 'image') {
    return (
      <>
        <button onClick={() => setOpen(true)} className="block rounded-xl overflow-hidden" style={{ maxWidth: 240 }} aria-label={`Open ${a.name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.url} alt={a.name} loading="lazy" className="block w-full h-auto object-cover" style={{ maxHeight: 260 }} />
        </button>
        {open && <Lightbox src={a.url} name={a.name} onClose={() => setOpen(false)} />}
      </>
    )
  }
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      download={a.name}
      className="flex items-center gap-3 rounded-xl p-2.5 min-w-[220px]"
      style={{ background: mine ? 'rgba(255,255,255,0.16)' : 'var(--bg-alt)', color: mine ? '#fff' : 'var(--text)', border: mine ? 'none' : '1px solid var(--border-soft)' }}
    >
      <FileIcon name={a.name} mime={a.mimeType} />
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium truncate">{a.name}</span>
        <span className="block text-[11px]" style={{ opacity: 0.75 }}>{FLAVOUR[fileFlavour(a.name, a.mimeType)].label}{a.size ? ` · ${formatFileSize(a.size)}` : ''}</span>
      </span>
      <Download size={16} style={{ opacity: 0.8, flexShrink: 0 }} />
    </a>
  )
}

/* ── one message ─────────────────────────────────────────────────────── */
export function MessageBubble({ message, mine, senderLabel }: { message: ChatMessage; mine: boolean; senderLabel?: string }) {
  const attachments = message.attachments ?? []
  const hasText = !!message.content?.trim()
  const imageOnly = attachments.length > 0 && !hasText && attachments.every(a => a.kind === 'image')

  // Platform notes (e.g. "New enquiry from Buyer B-A1") — centred, not attributed to a side of the conversation.
  if (message.type === 'system') {
    return (
      <div className="flex flex-col items-center my-1">
        <div className="flex items-start gap-1.5 max-w-[92%] sm:max-w-lg px-3 py-2 rounded-xl text-xs text-center" style={{ background: 'var(--bg-alt)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          <Info size={13} className="flex-shrink-0 mt-px" style={{ color: 'var(--teal)' }} />
          <span>{message.content}</span>
        </div>
        <span className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{clockTime(message.createdAt)}</span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      {!mine && senderLabel && (
        <span className="text-[11px] font-medium mb-0.5 px-1" style={{ color: 'var(--text-muted)' }}>{senderLabel}</span>
      )}
      <div
        className={cn('rounded-2xl max-w-[82%] sm:max-w-md text-sm break-words', mine ? 'rounded-br-sm' : 'rounded-bl-sm', imageOnly ? 'p-1' : 'px-3.5 py-2.5')}
        style={mine
          ? { background: 'var(--grad)', color: '#fff' }
          : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
      >
        {attachments.length > 0 && (
          <div className={cn('flex flex-col gap-1.5', hasText && 'mb-2')}>
            {attachments.map((a, i) => <AttachmentView key={`${a.url}-${i}`} a={a} mine={mine} />)}
          </div>
        )}
        {hasText && <p className="whitespace-pre-wrap">{message.content}</p>}
      </div>
      <div className="flex items-center gap-1 mt-1 px-1 text-[10px]" style={{ color: 'var(--text-muted)' }} title={new Date(message.createdAt).toLocaleString()}>
        <span>{clockTime(message.createdAt)}</span>
        {mine && <StatusTicks message={message} />}
      </div>
    </div>
  )
}
