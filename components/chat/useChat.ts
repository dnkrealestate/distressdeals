'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { chatAPI } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import type { ChatMessage } from '@/types'

// ── Who is online ───────────────────────────────────────────────────────
// One shared view of presence for the whole page: the server sends a snapshot on connect, then a change per person.
export function usePresence() {
  const [online, setOnline] = useState<Set<string>>(new Set())
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({})

  useEffect(() => {
    const socket = getSocket()
    const onSnapshot = ({ onlineUserIds }: { onlineUserIds: string[] }) => setOnline(new Set(onlineUserIds))
    const onUpdate = ({ userId, online: isOn, lastSeenAt }: { userId: string; online: boolean; lastSeenAt?: string }) => {
      setOnline(prev => { const next = new Set(prev); if (isOn) next.add(userId); else next.delete(userId); return next })
      if (!isOn && lastSeenAt) setLastSeen(prev => ({ ...prev, [userId]: lastSeenAt }))
    }
    socket.on('presence_snapshot', onSnapshot)
    socket.on('presence_update', onUpdate)
    // The snapshot is sent once on connect — a page that mounts later has to ask for it.
    const ask = () => socket.emit('presence_request')
    ask()
    socket.on('connect', ask)
    return () => { socket.off('presence_snapshot', onSnapshot); socket.off('presence_update', onUpdate); socket.off('connect', ask) }
  }, [])

  return { isOnline: (id?: string) => !!id && online.has(id), lastSeen }
}

export interface Typer { _id: string; name: string }

// ── One open conversation ───────────────────────────────────────────────
// Loads the history, joins the room, and keeps it live: new messages, delivery / seen marks, who is typing.
export function useChatThread(roomId: string | null, meId: string | undefined, opts: { markRead: boolean; onActivity?: () => void } = { markRead: true }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [typers, setTypers] = useState<Typer[]>([])
  const typerTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const lastTypingSent = useRef(0)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roomRef = useRef(roomId)
  roomRef.current = roomId
  const markRead = opts.markRead
  const onActivity = useRef(opts.onActivity)
  onActivity.current = opts.onActivity

  // history + room membership
  useEffect(() => {
    setMessages([]); setTypers([])
    if (!roomId) return
    const socket = getSocket()
    let cancelled = false
    setLoading(true)
    chatAPI.getMessages(roomId)
      .then(r => { if (!cancelled && r.data.success) setMessages(r.data.data) })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => { if (!cancelled) setLoading(false) })
    if (markRead) chatAPI.markRead(roomId).catch(() => {})
    socket.emit('join_room', roomId)
    // The socket may reconnect (server restart, flaky network) — rejoin so the thread keeps updating.
    const rejoin = () => socket.emit('join_room', roomId)
    socket.on('connect', rejoin)
    return () => { cancelled = true; socket.emit('leave_room', roomId); socket.off('connect', rejoin) }
  }, [roomId, markRead])

  // live events
  useEffect(() => {
    if (!roomId) return
    const socket = getSocket()

    const onMessage = (msg: ChatMessage) => {
      if (msg.room !== roomRef.current) return
      setMessages(prev => (prev.some(m => m._id === msg._id) ? prev : [...prev, msg]))
      if (msg.sender._id !== meId) {
        // Their message arrived while this thread is open: it is read right away.
        if (markRead) chatAPI.markRead(msg.room).catch(() => {})
        setTypers(prev => prev.filter(t => t._id !== msg.sender._id))
      }
      onActivity.current?.()
    }

    // Marks everything *I* sent up to `upTo` as delivered / seen by `userId`.
    const onStatus = ({ roomId: rid, status, userId, upTo }: { roomId: string; status: 'delivered' | 'read'; userId: string; upTo: string }) => {
      if (rid !== roomRef.current) return
      const cutoff = new Date(upTo).getTime()
      setMessages(prev => prev.map(m => {
        if (m.sender._id !== meId || new Date(m.createdAt).getTime() > cutoff) return m
        const deliveredTo = m.deliveredTo?.some(d => d.user === userId) ? m.deliveredTo : [...(m.deliveredTo ?? []), { user: userId, at: upTo }]
        const readBy = status === 'read' && !m.readBy?.some(r => r.user === userId) ? [...(m.readBy ?? []), { user: userId, readAt: upTo }] : m.readBy ?? []
        return { ...m, deliveredTo, readBy }
      }))
    }

    const onTyping = ({ roomId: rid, typing, user }: { roomId: string; typing: boolean; user: Typer }) => {
      if (rid !== roomRef.current || user._id === meId) return
      clearTimeout(typerTimers.current[user._id])
      if (!typing) { setTypers(prev => prev.filter(t => t._id !== user._id)); return }
      setTypers(prev => (prev.some(t => t._id === user._id) ? prev : [...prev, user]))
      // If their "stopped typing" never arrives (closed the tab…), don't leave the dots up forever.
      typerTimers.current[user._id] = setTimeout(() => setTypers(prev => prev.filter(t => t._id !== user._id)), 6000)
    }

    socket.on('new_message', onMessage)
    socket.on('message_status', onStatus)
    socket.on('typing', onTyping)
    return () => {
      socket.off('new_message', onMessage); socket.off('message_status', onStatus); socket.off('typing', onTyping)
      Object.values(typerTimers.current).forEach(clearTimeout)
    }
  }, [roomId, meId, markRead])

  // ── typing I emit: at most every 2.5 s while typing, and "stopped" after 2.5 s of quiet ──
  const stopTyping = useCallback(() => {
    if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = null }
    if (roomRef.current && lastTypingSent.current) { getSocket().emit('typing', { roomId: roomRef.current, typing: false }); lastTypingSent.current = 0 }
  }, [])

  const notifyTyping = useCallback(() => {
    const rid = roomRef.current
    if (!rid) return
    const now = Date.now()
    if (now - lastTypingSent.current > 2500) { getSocket().emit('typing', { roomId: rid, typing: true }); lastTypingSent.current = now }
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(stopTyping, 2500)
  }, [stopTyping])

  useEffect(() => () => stopTyping(), [roomId, stopTyping])

  const send = useCallback(async (text: string, files: File[] = []): Promise<boolean> => {
    const rid = roomRef.current
    if (!rid || (!text.trim() && files.length === 0)) return false
    stopTyping()
    setSending(true)
    try {
      const res = await chatAPI.sendMessage(rid, text.trim(), files)
      const msg: ChatMessage | undefined = res.data?.data
      // The realtime event normally delivers it; adding it here too (deduped) covers a dropped socket.
      if (msg) setMessages(prev => (prev.some(m => m._id === msg._id) ? prev : [...prev, msg]))
      return true
    } catch (err: any) {
      toast.error(err?.error || err?.response?.data?.error || 'Failed to send message')
      return false
    } finally {
      setSending(false)
    }
  }, [stopTyping])

  return { messages, loading, sending, typers, send, notifyTyping, stopTyping }
}
