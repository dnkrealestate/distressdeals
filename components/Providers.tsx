'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { captureUtmParams } from '@/lib/utm'
import { forceSignOut, takeAccountNotice } from '@/lib/accountNotice'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { useCompareStore } from '@/store/compareStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useProjectCompareStore } from '@/store/projectCompareStore'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } })

export function Providers({ children }: { children: React.ReactNode }) {
  const { token, fetchMe } = useAuthStore()
  const { dark, tick } = useThemeStore()

  useEffect(() => {
    if (token) fetchMe()
    captureUtmParams()
  }, [token, fetchMe])

  // Keep a single live socket connection for as long as the user is authenticated,
  // app-wide — this is what makes "online" presence reflect being logged in,
  // not just having a specific chat/agents page open.
  useEffect(() => {
    if (token) getSocket()
    else disconnectSocket()
  }, [token])

  // Admin changes to this account arrive instantly: a verified number (seller dashboard unlocks), edited details —
  // or a suspension, which signs out on the spot. Coming back to the tab also re-checks the account, in case the
  // socket was asleep when the change happened.
  useEffect(() => {
    if (!token) return
    const socket = getSocket()
    const onUpdated = ({ user }: { user?: any }) => { if (user) useAuthStore.getState().setUser(user) }
    const onSuspended = ({ message }: { message?: string }) => forceSignOut(message || 'Your account has been suspended.')
    // Only ever updates on success — a network blip on returning to the tab must not sign anyone out (a suspension
    // comes back as 403 and is handled by lib/api.ts).
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      authAPI.getMe().then(r => { if (r.data?.data) useAuthStore.getState().setUser(r.data.data) }).catch(() => {})
    }
    socket.on('account_updated', onUpdated)
    socket.on('account_suspended', onSuspended)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      socket.off('account_updated', onUpdated)
      socket.off('account_suspended', onSuspended)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [token])

  // The reason for a forced sign-out, shown once on the page it lands on.
  useEffect(() => {
    const notice = takeAccountNotice()
    if (notice) toast.error(notice, { duration: 8000 })
  }, [])

  useEffect(() => { useProjectCompareStore.persist.rehydrate() }, [])

  // Signed in: bring the saved compare list and favourites back (so hearts show filled on every page).
  useEffect(() => {
    if (!token) return
    useCompareStore.getState().loadFromServer()
    useFavoritesStore.getState().fetchFavorites()
  }, [token])

  // Browsers change a focused number field's value on mouse-wheel — so scrolling the page after typing a year or a
  // price silently changed it. Everywhere on the site: scrolling over a focused number field just scrolls the page.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const el = e.target as HTMLElement | null
      if (el instanceof HTMLInputElement && el.type === 'number' && document.activeElement === el) el.blur()
    }
    document.addEventListener('wheel', onWheel, { capture: true, passive: true })
    return () => document.removeEventListener('wheel', onWheel, { capture: true } as any)
  }, [])

  // Auto theme: dark 9 PM – 6 AM on the visitor's clock. Re-check every minute (and when the tab comes back), so an
  // open page flips at 9 PM / 6 AM on its own.
  useEffect(() => {
    tick()
    const id = setInterval(tick, 60_000)
    const onVisible = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [tick])

  // Apply the theme to <html data-theme="..."> so the CSS variables switch.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    }
  }, [dark])

  return (
    <QueryClientProvider client={qc}>
      {children}
    </QueryClientProvider>
  )
}