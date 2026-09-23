'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, Users, ArrowLeft } from 'lucide-react'
import { chatAPI } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { previewOf } from '@/lib/chat'
import { usePresence, useChatThread } from '@/components/chat/useChat'
import ChatComposer from '@/components/chat/ChatComposer'
import { DayDivider, MessageBubble, OnlineDot, PresenceLine, StatusTicks, TypingBubble } from '@/components/chat/ChatParts'
import type { ChatRoom, ChatMessage, User as UserT } from '@/types'
import toast from 'react-hot-toast'

// A property's chat room isn't strictly one seller + one agent — a different
// agent (handling a buyer's lead on this same listing) can join the same
// thread as the listing's own agent. So "who am I talking to" has to be
// computed from everyone who has actually participated, not a single
// hardcoded `property.agent`.
function agentParticipants(room: ChatRoom, sellerId?: string) {
  const seen = new Map<string, UserT>()
  if (room.property?.agent) seen.set(room.property.agent._id, room.property.agent)
  room.participants.filter(p => p._id !== sellerId && p.role !== 'seller').forEach(p => seen.set(p._id, p))
  return Array.from(seen.values())
}

// Distinguishes the listing's primary agent from anyone else who has joined
// the thread about a different buyer lead, so a multi-agent conversation
// stays legible to the seller reading it.
function roleLabel(room: ChatRoom, person?: UserT): string {
  if (!person) return ''
  if (room.property?.seller?._id === person._id) return 'You'
  if (room.property?.agent?._id === person._id) return 'Listing Agent'
  if (person.role === 'admin' || person.role === 'super_admin') return 'Admin'
  if (person.role === 'agent') return 'Agent'
  return ''
}

function RoomListItem({ room, active, onClick, currentUserId, isOnline }: { room: ChatRoom; active: boolean; onClick: () => void; currentUserId?: string; isOnline: (id?: string) => boolean }) {
  const agents = agentParticipants(room, currentUserId)
  const primary = agents[0]
  const anyOnline = agents.some(a => isOnline(a._id))
  const last = room.lastMessage
  const lastMine = last?.sender?._id === currentUserId

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
      style={{ background: active ? 'rgba(203,1,1,0.08)' : 'transparent', border: active ? '1px solid rgba(203,1,1,0.25)' : '1px solid transparent' }}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white overflow-hidden" style={{ background: 'var(--grad)' }}>
          {room.property?.images?.[0]?.url ? (
            <img src={room.property.images[0].url} alt="" className="w-full h-full object-cover" />
          ) : (primary?.name?.[0] || 'A')}
        </div>
        {agents.length > 0 && <OnlineDot online={anyOnline} className="absolute -bottom-0.5 -right-0.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {/* Listing name is the primary label — a seller can have multiple listings,
              each with its own chat room, so the property is what tells them apart. */}
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
            {room.property?.title || primary?.name || 'Agent'}
          </p>
          {room.unreadCount > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
              {room.unreadCount}
            </span>
          )}
        </div>
        <p className="text-xs truncate mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          {last ? (
            <>
              {lastMine && <StatusTicks message={last} className="flex-shrink-0" />}
              <span className="truncate">{lastMine ? '' : last.sender?.name ? `${last.sender.name}: ` : ''}{previewOf(last)}</span>
            </>
          ) : agents.length > 0 ? `${agents.map(a => a.name).join(', ')} · No messages yet` : 'No messages yet'}
        </p>
        {agents.length > 1 && (
          <p className="text-[10px] flex items-center gap-1 mt-1" style={{ color: 'var(--text-muted)' }}>
            <Users size={9} /> {agents.length} agents in this chat
          </p>
        )}
      </div>
    </button>
  )
}

// Messages with a "Today / Yesterday / date" divider wherever the day changes.
function withDayDividers(messages: ChatMessage[]) {
  const out: ({ kind: 'day'; iso: string; key: string } | { kind: 'msg'; m: ChatMessage; key: string })[] = []
  let lastDay = ''
  for (const m of messages) {
    const day = new Date(m.createdAt).toDateString()
    if (day !== lastDay) { out.push({ kind: 'day', iso: m.createdAt, key: `d-${m._id}` }); lastDay = day }
    out.push({ kind: 'msg', m, key: m._id })
  }
  return out
}

function MessagesInner() {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const presence = usePresence()

  const loadRooms = useCallback((preferId?: string | null) => {
    chatAPI.getRooms().then(r => {
      if (!r.data.success) return
      const list: ChatRoom[] = r.data.data
      setRooms(list)
      // Only ever auto-open a thread from an explicit deep link (a notification,
      // "Message Seller", etc.) — otherwise land on the room list first, same as
      // WhatsApp/any messaging app, instead of guessing which chat to jump into.
      const wanted = preferId || searchParams.get('room')
      if (wanted && list.some(rm => rm._id === wanted)) setActiveRoom(wanted)
    }).catch(() => toast.error('Failed to load conversations')).finally(() => setLoadingRooms(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadRooms() }, [loadRooms])

  // If a room id arrives via query param after rooms already loaded (e.g. freshly created)
  useEffect(() => {
    const wanted = searchParams.get('room')
    if (wanted && !rooms.some(r => r._id === wanted)) {
      chatAPI.getRoom(wanted).then(r => {
        if (r.data.success) { setRooms(prev => [r.data.data, ...prev]); setActiveRoom(wanted) }
      }).catch(() => {})
    } else if (wanted) {
      setActiveRoom(wanted)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, rooms.length])

  // The open conversation: history, live messages, ✓✓ marks, typing.
  const thread = useChatThread(activeRoom, user?._id, { markRead: true })

  // Opening a room clears its unread badge.
  useEffect(() => {
    if (activeRoom) setRooms(prev => prev.map(r => r._id === activeRoom ? { ...r, unreadCount: 0 } : r))
  }, [activeRoom])

  // Every message for any of my rooms (the server also delivers to my own channel): keep the list fresh —
  // last message, unread count, most recent on top.
  useEffect(() => {
    const socket = getSocket()
    const onMessage = (msg: ChatMessage) => {
      setRooms(prev => {
        const idx = prev.findIndex(r => r._id === msg.room)
        if (idx < 0) return prev
        const isActive = msg.room === activeRoom
        const fromMe = msg.sender._id === user?._id
        const updated = { ...prev[idx], lastMessage: msg, unreadCount: isActive || fromMe ? 0 : (prev[idx].unreadCount || 0) + 1 }
        return [updated, ...prev.filter((_, i) => i !== idx)]
      })
    }
    socket.on('new_message', onMessage)
    return () => { socket.off('new_message', onMessage) }
  }, [activeRoom, user?._id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.messages.length, thread.typers.length])

  const activeRoomData = rooms.find(r => r._id === activeRoom)
  const activeAgents = activeRoomData ? agentParticipants(activeRoomData, user?._id) : []
  const primaryAgent = activeAgents[0]
  const onlineAgents = activeAgents.filter(a => presence.isOnline(a._id))
  const agentLastSeen = activeAgents.map(a => presence.lastSeen[a._id] || a.lastSeenAt).filter(Boolean).sort().pop()

  return (
    <div className="flex h-full">
      {/* Room list — full-screen on mobile until a chat is opened, permanent
          side panel from md up (WhatsApp/Messenger-style master-detail). */}
      <div className={cn('w-full md:w-72 flex-shrink-0 flex-col', activeRoom ? 'hidden md:flex' : 'flex')} style={{ borderRight: '1px solid var(--border)' }}>
        <header className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Messages</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingRooms ? (
            Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-xl" />)
          ) : rooms.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare size={24} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No conversations yet. Start one from a lead on your Leads page.
              </p>
            </div>
          ) : (
            rooms.map(room => (
              <RoomListItem key={room._id} room={room} active={room._id === activeRoom} onClick={() => setActiveRoom(room._id)} currentUserId={user?._id} isOnline={presence.isOnline} />
            ))
          )}
        </div>
      </div>

      {/* Thread — hidden on mobile until a room is picked, always visible from md up */}
      <div className={cn('flex-1 flex-col min-w-0', activeRoom ? 'flex' : 'hidden md:flex')}>
        {!activeRoom ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a conversation</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 px-4 sm:px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => setActiveRoom(null)} className="md:hidden btn-ghost btn-sm p-2 -ml-1 flex-shrink-0" aria-label="Back to conversations">
                <ArrowLeft size={16} />
              </button>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--grad)' }}>
                  {primaryAgent?.name?.[0] || 'A'}
                </div>
                <OnlineDot online={onlineAgents.length > 0} className="absolute -bottom-0.5 -right-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {activeRoomData?.property?.title || primaryAgent?.name || 'Agent'}
                </p>
                <div className="flex items-center gap-2 min-w-0">
                  <PresenceLine typingNames={thread.typers.map(t => t.name)} onlineCount={onlineAgents.length} lastSeenAt={agentLastSeen} />
                  {activeAgents.length > 0 && (
                    <span className="text-xs truncate flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Users size={10} className="flex-shrink-0" /> {activeAgents.map(a => a.name).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
              {thread.loading ? (
                Array(4).fill(null).map((_, i) => <div key={i} className={cn('shimmer h-10 rounded-2xl w-1/2', i % 2 ? 'ml-auto' : '')} />)
              ) : thread.messages.length === 0 ? (
                <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>No messages yet — say hello!</p>
              ) : (
                withDayDividers(thread.messages).map(item => item.kind === 'day'
                  ? <DayDivider key={item.key} iso={item.iso} />
                  : (() => {
                      const mine = item.m.sender._id === user?._id
                      const label = activeRoomData ? roleLabel(activeRoomData, item.m.sender) : ''
                      return <MessageBubble key={item.key} message={item.m} mine={mine} senderLabel={`${item.m.sender.name}${label ? ` · ${label}` : ''}`} />
                    })())
              )}
              {thread.typers.length > 0 && <TypingBubble />}
              <div ref={bottomRef} />
            </div>

            <ChatComposer onSend={thread.send} onTyping={thread.notifyTyping} onBlur={thread.stopTyping} sending={thread.sending} />
          </>
        )}
      </div>
    </div>
  )
}

export default function SellerMessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesInner />
    </Suspense>
  )
}
