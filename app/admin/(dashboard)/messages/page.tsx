'use client'
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, Eye, Search, ArrowLeft, Home, Users, AlertCircle } from 'lucide-react'
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

// The listing's CURRENT seller/agent are the authoritative "primary" parties
// for a seller_agent room — used for labeling, NOT for access. A room can
// have more agents in it than just the listing's primary agent (e.g. an
// agent handling a buyer lead on this same listing), so anything that needs
// "is this person actually in the thread" must check `participants`, not
// just seller/agent.
function getParties(room: ChatRoom) {
  if (room.property?.seller || room.property?.agent) {
    return { seller: room.property.seller, agent: room.property.agent }
  }
  return {
    seller: room.participants.find(p => p.role === 'seller'),
    agent: room.participants.find(p => p.role === 'agent'),
  }
}

// Every agent who has actually joined the thread — the listing's primary
// agent plus anyone else (e.g. a different lead's agent) who has messaged.
function agentParticipants(room: ChatRoom) {
  const { agent } = getParties(room)
  const seen = new Map<string, UserT>()
  if (agent) seen.set(agent._id, agent)
  room.participants.filter(p => p.role === 'agent').forEach(p => seen.set(p._id, p))
  return Array.from(seen.values())
}

// Authoritative "am I in this conversation" check — the participants list is
// what the backend actually gates access on, so it comes first. Falling back
// to seller/listing-agent covers the moment right after a reassignment,
// before the new agent has sent their first message.
function isParticipantOf(room: ChatRoom, userId?: string): boolean {
  if (!userId) return false
  if (room.participants.some(p => p._id === userId)) return true
  const { seller, agent } = getParties(room)
  return seller?._id === userId || agent?._id === userId
}

// A person's role WITHIN this specific room — distinguishes "the listing's
// primary agent" from any other agent who has joined about a different lead,
// so a multi-agent thread stays legible to whoever's reading it.
// A seller_agent room "needs a reply" whenever the seller sent the last
// message and no agent has answered since — the whole point of this room is
// that the seller gets a response, so this is what an agent is actually on
// the hook for.
function needsAgentReply(room: ChatRoom): boolean {
  return room.type === 'seller_agent' && room.lastMessage?.sender?.role === 'seller'
}

function roleLabel(room: ChatRoom | undefined, person?: UserT): string {
  if (!person || !room) return ''
  const { seller, agent } = getParties(room)
  if (seller?._id === person._id) return 'Seller'
  if (agent?._id === person._id) return 'Listing Agent'
  if (person.role === 'admin' || person.role === 'super_admin') return 'Admin'
  if (person.role === 'agent') return 'Agent'
  return ''
}

interface SellerGroup { sellerId: string; seller?: UserT; rooms: ChatRoom[]; unreadCount: number; lastActivity: string }

function SellerListItem({ group, active, onClick, isOnline }: { group: SellerGroup; active: boolean; onClick: () => void; isOnline: (id?: string) => boolean }) {
  const mostRecent = group.rooms[0]
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
      style={{ background: active ? 'rgba(203,1,1,0.08)' : 'transparent', border: active ? '1px solid rgba(203,1,1,0.25)' : '1px solid transparent' }}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--grad)' }}>
          {group.seller?.name?.[0] || 'S'}
        </div>
        <OnlineDot online={isOnline(group.seller?._id)} className="absolute -bottom-0.5 -right-0.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{group.seller?.name || 'Seller'}</p>
          {group.unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
              {group.unreadCount}
            </span>
          )}
        </div>
        <p className="text-xs truncate mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <Home size={10} /> {group.rooms.length} listing{group.rooms.length > 1 ? 's' : ''}
          {mostRecent?.property?.title ? ` · ${mostRecent.property.title}` : ''}
        </p>
      </div>
    </button>
  )
}

function RoomListItem({ room, active, onClick, currentUserId }: { room: ChatRoom; active: boolean; onClick: () => void; currentUserId?: string }) {
  const { agent } = getParties(room)
  const agents = agentParticipants(room)
  const extraAgents = agents.length - (agent ? 1 : 0)
  const lastSenderName = room.lastMessage?.type === 'system' ? undefined : room.lastMessage?.sender?.name

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
      style={{ background: active ? 'rgba(203,1,1,0.08)' : 'transparent', border: active ? '1px solid rgba(203,1,1,0.25)' : '1px solid transparent' }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.18)' }}>
        {room.property?.images?.[0]?.url ? (
          <img src={room.property.images[0].url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Home size={15} style={{ color: 'var(--teal)' }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
            {room.property?.title || 'Listing'}
          </p>
          {room.unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
              {room.unreadCount}
            </span>
          )}
        </div>
        <p className="text-xs truncate mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          {room.lastMessage ? (
            <>
              {room.lastMessage.sender?._id === currentUserId && <StatusTicks message={room.lastMessage} className="flex-shrink-0" />}
              <span className="truncate">{lastSenderName ? `${lastSenderName}: ` : ''}{previewOf(room.lastMessage)}</span>
            </>
          ) : `Listing agent: ${agent?.name || '—'}`}
        </p>
        {(needsAgentReply(room) || extraAgents > 0) && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {needsAgentReply(room) && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0" style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.12)' }}>
                <AlertCircle size={9} /> Needs reply
              </span>
            )}
            {extraAgents > 0 && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Users size={9} /> +{extraAgents} other agent{extraAgents > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

function AdminMessagesView() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const roomParam = searchParams.get('room')
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [loadingRooms, setLoadingRooms] = useState(true)
  const presence = usePresence()
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadRooms = useCallback(() => {
    chatAPI.getRooms().then(r => {
      if (!r.data.success) return
      setRooms(r.data.data)
    }).catch(() => toast.error('Failed to load conversations')).finally(() => setLoadingRooms(false))
  }, [])

  useEffect(() => { loadRooms() }, [loadRooms])

  // Deep-link from elsewhere (e.g. the Listings page "go to chat" action) —
  // once rooms are in, jump straight to the requested conversation.
  useEffect(() => {
    if (!roomParam || rooms.length === 0) return
    const room = rooms.find(r => r._id === roomParam)
    if (room) {
      const { seller } = getParties(room)
      setSelectedSeller(seller?._id || null)
      setActiveRoom(room._id)
    }
  }, [roomParam, rooms])

  // Group every conversation by seller — rooms already arrive sorted by most
  // recently updated, so the first room per seller doubles as "most recent".
  const sellerGroups = useMemo<SellerGroup[]>(() => {
    const groups = new Map<string, SellerGroup>()
    for (const room of rooms) {
      const { seller } = getParties(room)
      const sellerId = seller?._id || 'unknown'
      if (!groups.has(sellerId)) {
        groups.set(sellerId, { sellerId, seller, rooms: [], unreadCount: 0, lastActivity: room.updatedAt })
      }
      const g = groups.get(sellerId)!
      g.rooms.push(room)
      g.unreadCount += room.unreadCount || 0
    }
    return Array.from(groups.values())
  }, [rooms])

  const activeRoomData = rooms.find(r => r._id === activeRoom)
  const isParticipant = activeRoomData ? isParticipantOf(activeRoomData, user?._id) : false

  // The open conversation: history, live messages, ✓✓ marks, typing. Don't mark another agent's conversation as read
  // on their behalf — that would hide the unread state from the person it actually belongs to.
  const thread = useChatThread(activeRoom, user?._id, { markRead: isParticipant })

  useEffect(() => {
    if (activeRoom && isParticipant) setRooms(prev => prev.map(r => r._id === activeRoom ? { ...r, unreadCount: 0 } : r))
  }, [activeRoom, isParticipant])

  // Every message for any room I can see: keep the list fresh — last message, unread count, most recent on top.
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

  const openSeller = (group: SellerGroup) => {
    setSelectedSeller(group.sellerId)
    // Don't auto-open a room — a seller with multiple listings needs to pick
    // which one first; on mobile this level would otherwise be unreachable
    // since opening a thread immediately hides this list.
    setActiveRoom(group.rooms.length === 1 ? group.rooms[0]._id : null)
    setQ('')
  }

  const backToSellers = () => {
    setSelectedSeller(null)
    setActiveRoom(null)
    setQ('')
  }

  const { seller } = activeRoomData ? getParties(activeRoomData) : { seller: undefined }
  const activeAgents = activeRoomData ? agentParticipants(activeRoomData) : []
  const activeSellerGroup = sellerGroups.find(g => g.sellerId === selectedSeller)
  const sellerOnline = presence.isOnline(seller?._id)
  const sellerLastSeen = (seller?._id && presence.lastSeen[seller._id]) || seller?.lastSeenAt

  const needle = q.trim().toLowerCase()
  const filteredSellerGroups = needle
    ? sellerGroups.filter(g => g.seller?.name?.toLowerCase().includes(needle))
    : sellerGroups
  const filteredSellerRooms = activeSellerGroup
    ? (needle ? activeSellerGroup.rooms.filter(r => r.property?.title?.toLowerCase().includes(needle)) : activeSellerGroup.rooms)
    : []

  return (
    <div className="flex h-full">
      {/* Left pane — sellers, or a seller's listings once one is picked.
          Full-screen on mobile until a thread is opened, permanent side panel
          from md up (same master-detail pattern as WhatsApp/Messenger). */}
      <div className={cn('w-full md:w-72 flex-shrink-0 flex-col', activeRoom ? 'hidden md:flex' : 'flex')} style={{ borderRight: '1px solid var(--border)' }}>
        <header className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          {selectedSeller ? (
            <div className="flex items-center gap-2 mb-3">
              <button onClick={backToSellers} className="btn-ghost btn-sm p-1.5 -ml-1" aria-label="Back to sellers">
                <ArrowLeft size={15} />
              </button>
              <h1 className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{activeSellerGroup?.seller?.name || 'Seller'}</h1>
            </div>
          ) : (
            <h1 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>Messages</h1>
          )}
          <div className="input-glass">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              className="bg-transparent outline-none flex-1 text-sm"
              placeholder={selectedSeller ? 'Search listing…' : 'Search seller…'}
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingRooms ? (
            Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-16 rounded-xl" />)
          ) : rooms.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare size={24} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No conversations yet. Sellers will appear here once they reach out about a lead.
              </p>
            </div>
          ) : !selectedSeller ? (
            filteredSellerGroups.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Search size={24} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No sellers match "{q}"</p>
              </div>
            ) : (
              filteredSellerGroups.map(g => (
                <SellerListItem key={g.sellerId} group={g} active={g.sellerId === selectedSeller} onClick={() => openSeller(g)} isOnline={presence.isOnline} />
              ))
            )
          ) : filteredSellerRooms.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Search size={24} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No listings match "{q}"</p>
            </div>
          ) : (
            filteredSellerRooms.map(room => (
              <RoomListItem key={room._id} room={room} active={room._id === activeRoom} onClick={() => setActiveRoom(room._id)} currentUserId={user?._id} />
            ))
          )}
        </div>
      </div>

      {/* Thread — hidden on mobile until a room is picked, always visible from md up */}
      <div className={cn('flex-1 flex-col min-w-0', activeRoom ? 'flex' : 'hidden md:flex')}>
        {!activeRoom ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {selectedSeller ? 'Select a listing' : 'Select a seller to view their listings'}
            </p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => setActiveRoom(null)} className="md:hidden btn-ghost btn-sm p-2 -ml-1 flex-shrink-0" aria-label="Back to conversations">
                <ArrowLeft size={16} />
              </button>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--grad)' }}>
                  {seller?.name?.[0] || 'S'}
                </div>
                <OnlineDot online={sellerOnline} className="absolute -bottom-0.5 -right-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {activeRoomData?.property?.title || seller?.name || 'Seller'}
                </p>
                <div className="flex items-center gap-2 min-w-0">
                  <PresenceLine typingNames={thread.typers.map(t => t.name)} onlineCount={sellerOnline ? 1 : 0} lastSeenAt={sellerLastSeen} />
                  <span className="text-xs truncate flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Users size={10} className="flex-shrink-0" />
                    {seller?.name || 'Seller'}
                    {activeAgents.length > 0 && ` · ${activeAgents.map(a => a.name).join(', ')}`}
                  </span>
                </div>
              </div>
              {!isParticipant && (
                <span className="badge badge-gray text-[10px] flex-shrink-0 gap-1">
                  <Eye size={10} /> Observing
                </span>
              )}
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
              {thread.loading ? (
                Array(4).fill(null).map((_, i) => <div key={i} className={cn('shimmer h-10 rounded-2xl w-1/2', i % 2 ? 'ml-auto' : '')} />)
              ) : thread.messages.length === 0 ? (
                <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>No messages yet — say hello!</p>
              ) : (
                (() => {
                  let lastDay = ''
                  return thread.messages.map(m => {
                    const day = new Date(m.createdAt).toDateString()
                    const divider = day !== lastDay ? <DayDivider key={`d-${m._id}`} iso={m.createdAt} /> : null
                    lastDay = day
                    const mine = m.sender._id === user?._id
                    const label = roleLabel(activeRoomData, m.sender)
                    return (
                      <div key={m._id} className="space-y-2.5">
                        {divider}
                        <MessageBubble message={m} mine={mine} senderLabel={`${m.sender.name}${m.sender.displayId ? ` (${m.sender.displayId})` : ''}${label ? ` · ${label}` : ''}`} />
                      </div>
                    )
                  })
                })()
              )}
              {thread.typers.length > 0 && <TypingBubble />}
              <div ref={bottomRef} />
            </div>

            {isParticipant ? (
              <div className="flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                {activeRoomData && needsAgentReply(activeRoomData) && (
                  <div className="flex items-center gap-2 px-4 pt-3 text-xs" style={{ color: '#F59E0B' }}>
                    <AlertCircle size={13} className="flex-shrink-0" /> The seller is waiting on a reply
                  </div>
                )}
                <ChatComposer onSend={thread.send} onTyping={thread.notifyTyping} onBlur={thread.stopTyping} sending={thread.sending} />
              </div>
            ) : (
              <div className="p-4 flex items-center justify-center gap-2 flex-shrink-0 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <Eye size={13} /> You're viewing this conversation as an observer
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={null}>
      <AdminMessagesView />
    </Suspense>
  )
}
