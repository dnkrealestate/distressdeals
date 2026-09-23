'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Paperclip, Send, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ACCEPT_ATTR, MAX_ATTACHMENTS, checkAttachment, formatFileSize } from '@/lib/chat'
import { FileIcon } from '@/components/chat/ChatParts'
import { cn } from '@/lib/utils'

// The message box: type, attach photos / documents (button, drag-and-drop or paste), and send.
export default function ChatComposer({
  onSend, onTyping, onBlur, sending,
}: {
  onSend: (text: string, files: File[]) => Promise<boolean>
  onTyping: () => void
  onBlur?: () => void
  sending: boolean
}) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)

  // Thumbnails for picked photos; revoked when they go away.
  const previews = useMemo(() => files.map(f => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null)), [files])
  useEffect(() => () => previews.forEach(u => u && URL.revokeObjectURL(u)), [previews])

  // grow with the text, up to ~5 lines
  useEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [text])

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return
    const next = [...files]
    for (const f of incoming) {
      const problem = checkAttachment(f)
      if (problem) { toast.error(problem); continue }
      if (next.length >= MAX_ATTACHMENTS) { toast.error(`You can attach up to ${MAX_ATTACHMENTS} files at a time`); break }
      next.push(f)
    }
    setFiles(next)
  }

  const canSend = (text.trim().length > 0 || files.length > 0) && !sending

  const submit = async () => {
    if (!canSend) return
    const ok = await onSend(text, files)
    if (ok) { setText(''); setFiles([]) }
  }

  return (
    <div
      className="flex-shrink-0"
      style={{ borderTop: '1px solid var(--border)', background: dragging ? 'rgba(203,1,1,0.06)' : 'transparent' }}
      onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragging(true) } }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)) }}
    >
      {files.length > 0 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="relative flex-shrink-0 rounded-xl overflow-hidden flex items-center gap-2 pr-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border-soft)', maxWidth: 220 }}>
              {previews[i]
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={previews[i]!} alt="" className="w-12 h-12 object-cover" />
                : <span className="p-1.5"><FileIcon name={f.name} mime={f.type} size={18} /></span>}
              <span className="min-w-0 py-1.5">
                <span className="block text-xs font-medium truncate" style={{ color: 'var(--text)', maxWidth: 110 }}>{f.name}</span>
                <span className="block text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatFileSize(f.size)}</span>
              </span>
              <button
                onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                aria-label={`Remove ${f.name}`}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 sm:p-4 flex items-end gap-2">
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          data-testid="chat-file-input"
          onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = '' }}
        />
        <button
          onClick={() => fileInput.current?.click()}
          className="btn-ghost p-2.5 flex-shrink-0 rounded-xl"
          aria-label="Attach photos or documents"
          title="Attach photos or documents"
          disabled={sending}
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={box}
          rows={1}
          className={cn('input flex-1 resize-none leading-snug py-2.5')}
          placeholder={dragging ? 'Drop files to attach…' : 'Type a message…'}
          value={text}
          onChange={e => { setText(e.target.value); if (e.target.value) onTyping() }}
          onBlur={onBlur}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }}
          onPaste={e => { const pasted = Array.from(e.clipboardData.files); if (pasted.length) { e.preventDefault(); addFiles(pasted) } }}
          aria-label="Message"
        />

        <button onClick={submit} className="btn-primary p-3 flex-shrink-0 rounded-xl" disabled={!canSend} aria-label="Send message">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
