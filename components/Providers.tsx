'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { captureUtmParams } from '@/lib/utm'
import { useCompareStore } from '@/store/compareStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useProjectCompareStore } from '@/store/projectCompareStore'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } })

export function Providers({ children }: { children: React.ReactNode }) {
  const { token, fetchMe } = useAuthStore()
  const { dark } = useThemeStore()

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

  useEffect(() => { useProjectCompareStore.persist.rehydrate() }, [])

  // Signed in: bring the saved compare list and favourites back (so hearts show filled on every page).
  useEffect(() => {
    if (!token) return
    useCompareStore.getState().loadFromServer()
    useFavoritesStore.getState().fetchFavorites()
  }, [token])

  // Apply the persisted theme to <html data-theme="..."> so the CSS variables switch.
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