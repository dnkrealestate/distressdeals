import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  dark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      dark: false,
      toggle: () => set({ dark: !get().dark }),
    }),
    { name: 'theme' }
  )
)