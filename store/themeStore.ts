import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Light / dark. By default the site runs in "auto": dark from 9 PM to 6 AM on the visitor's own clock, light the rest
// of the day (re-checked every minute by Providers). The toggle — or the Light / Dark / Auto picker in the menu and
// on the profile page — pins a choice; picking Auto hands it back to the clock. Always OUR dark theme, never the
// browser's auto-darkening.
export type ThemeMode = 'auto' | 'light' | 'dark'

export const DARK_FROM_HOUR = 21   // 9 PM
export const DARK_UNTIL_HOUR = 6   // 6 AM
export const isNightTime = (d = new Date()) => d.getHours() >= DARK_FROM_HOUR || d.getHours() < DARK_UNTIL_HOUR

interface ThemeStore {
  mode: ThemeMode
  // What is actually showing right now (derived from mode + the clock).
  dark: boolean
  setMode: (mode: ThemeMode) => void
  // The header switch: flips what is showing and pins that choice.
  toggle: () => void
  // Auto mode: re-read the clock.
  tick: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'auto',
      dark: isNightTime(),
      setMode: (mode) => set({ mode, dark: mode === 'auto' ? isNightTime() : mode === 'dark' }),
      toggle: () => { const dark = !get().dark; set({ mode: dark ? 'dark' : 'light', dark }) },
      tick: () => { if (get().mode === 'auto' && get().dark !== isNightTime()) set({ dark: isNightTime() }) },
    }),
    {
      name: 'theme',
      version: 2,
      partialize: (s) => ({ mode: s.mode }),
      // v1 stored { dark, chosen }: a pinned choice stays pinned; "following the device" becomes Auto (clock).
      migrate: (old: any) => ({ mode: old?.chosen ? (old.dark ? 'dark' : 'light') : 'auto' }) as any,
      onRehydrateStorage: () => (state) => { state?.setMode(state.mode) },
    }
  )
)

// Runs in <head> before the page paints, so there's no light flash at night. Must mirror the store (incl. the v1 shape).
export const THEME_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem('theme')||'null');var st=(s&&s.state)||{};var m=st.mode||(st.chosen?(st.dark?'dark':'light'):'auto');var h=new Date().getHours();var d=m==='dark'||(m==='auto'&&(h>=${DARK_FROM_HOUR}||h<${DARK_UNTIL_HOUR}));document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`
