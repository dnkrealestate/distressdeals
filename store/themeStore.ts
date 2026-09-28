import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Light / dark. Until the visitor picks one with the toggle, the site follows the device setting (and keeps
// following it if it changes) — always with OUR dark theme, never the browser's auto-darkening.
interface ThemeStore {
  dark: boolean
  // true once the visitor chose light/dark themselves; from then on the device setting is ignored.
  chosen: boolean
  toggle: () => void
  // Follow the device (only while nothing has been chosen).
  syncSystem: (dark: boolean) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      dark: false,
      chosen: false,
      toggle: () => set({ dark: !get().dark, chosen: true }),
      syncSystem: (dark) => { if (!get().chosen && get().dark !== dark) set({ dark }) },
    }),
    { name: 'theme' }
  )
)

// Runs in <head> before the page paints, so there's no light flash for dark-mode visitors. Must mirror the store.
export const THEME_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem('theme')||'null');var st=s&&s.state;var d=st&&st.chosen?!!st.dark:window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`
