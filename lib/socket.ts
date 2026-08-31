import { io, Socket } from 'socket.io-client'

// Same reasoning as lib/api.ts — fall back by build environment, not
// unconditionally to localhost, so a production build without the Vercel
// env var set still reaches the real backend instead of every browser
// trying (and failing) to open a socket to its own localhost.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL
  || (process.env.NODE_ENV === 'production' ? 'https://data.distressdealsuae.com' : 'http://localhost:5000')

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) return socket
  const token = typeof window !== 'undefined' ? localStorage.getItem('luxestate_token') : null
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })
  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
