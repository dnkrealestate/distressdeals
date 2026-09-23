import type { ChatMessage, User } from '@/types'

// ── Message state: the ✓ / ✓✓ marks ────────────────────────────────────
//   sent      – stored on the server                       (one grey tick)
//   delivered – reached at least one other person's device (two grey ticks)
//   seen      – at least one other person has opened it    (two blue ticks)
export type MessageStatus = 'sent' | 'delivered' | 'seen'

export function messageStatus(m: ChatMessage): MessageStatus {
  if (m.readBy?.length) return 'seen'
  if (m.deliveredTo?.length) return 'delivered'
  return 'sent'
}

// Allowed by the server too (backend/src/middleware/upload.ts) — checked here first so people get an instant answer.
export const MAX_ATTACHMENTS = 5
export const MAX_FILE_BYTES = 15 * 1024 * 1024
export const ACCEPT_ATTR = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv'
const ALLOWED = /^(image\/(jpe?g|png|webp|gif|avif|heic|heif)|application\/(pdf|msword|vnd\.ms-excel|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation))|text\/(plain|csv))$/

/** Returns an error message, or null when the file can be sent. */
export function checkAttachment(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 15 MB`
  if (!ALLOWED.test(file.type)) return `${file.name}: only photos, PDF, Word, Excel, PowerPoint and text files can be sent`
  return null
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export type FileFlavour = 'pdf' | 'word' | 'sheet' | 'slides' | 'text' | 'other'
export function fileFlavour(name: string, mime = ''): FileFlavour {
  const n = name.toLowerCase()
  if (mime === 'application/pdf' || n.endsWith('.pdf')) return 'pdf'
  if (/\.(docx?)$/.test(n) || mime.includes('word')) return 'word'
  if (/\.(xlsx?|csv)$/.test(n) || mime.includes('sheet') || mime.includes('excel') || mime === 'text/csv') return 'sheet'
  if (/\.(pptx?)$/.test(n) || mime.includes('presentation') || mime.includes('powerpoint')) return 'slides'
  if (n.endsWith('.txt') || mime === 'text/plain') return 'text'
  return 'other'
}

/** One line for chat lists / notifications: the text, or a description of what was attached. */
export function previewOf(m?: Pick<ChatMessage, 'content' | 'attachments'> | null): string {
  if (!m) return ''
  if (m.content?.trim()) return m.content
  const a = m.attachments ?? []
  if (a.length === 0) return ''
  if (a.length === 1) return a[0].kind === 'image' ? '📷 Photo' : `📎 ${a[0].name}`
  return `📎 ${a.length} attachments`
}

// ── Presence ────────────────────────────────────────────────────────────
export function lastSeenLabel(iso?: string | null): string {
  if (!iso) return 'Offline'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Offline'
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'Last seen just now'
  if (mins < 60) return `Last seen ${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Last seen ${hours} h ago`
  return `Last seen ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

/** "Today" / "Yesterday" / "12 Sep 2026" — for the day dividers inside a thread. */
export function dayLabel(iso: string): string {
  const d = new Date(iso)
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(new Date()) - start(d)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export type Person = Pick<User, '_id' | 'name'> & { lastSeenAt?: string }
