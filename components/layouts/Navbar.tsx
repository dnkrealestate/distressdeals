'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Heart, GitCompare, Menu, X,
  ChevronDown, LogOut, Settings, User,
  LayoutDashboard, Sun, Moon,
} from 'lucide-react'
import { useAuthStore }     from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useCompareStore }   from '@/store/compareStore'
import { useThemeStore }     from '@/store/themeStore'   // see note below
import { getInitials, cn }   from '@/lib/utils'
import NotificationBell      from '@/components/NotificationBell'

/*
  NOTE: create a simple themeStore with Zustand:

  import { create } from 'zustand'
  import { persist } from 'zustand/middleware'

  export const useThemeStore = create(persist(
    set => ({ dark: false, toggle: () => set(s => ({ dark: !s.dark })) }),
    { name: 'theme' }
  ))

  And in your root layout, apply:
    <html data-theme={dark ? 'dark' : 'light'}>
*/

const NAV = [
  { href: '/seller/register', label: 'List Your Property' },
  { href: '/for-sale',        label: 'Buy Property'       },
  { href: '/for-rent',        label: 'Rental Property'    },
  { href: '/projects',        label: 'New Projects'       },
  { href: '/insights',        label: 'Insights'           },
]

function ThemeToggle() {
  const { dark, toggle } = useThemeStore()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="theme-toggle"
      data-dark={String(dark)}
    >
      <div
        className="theme-toggle__thumb"
        style={{ left: dark ? 27 : 3 }}
      >
        {dark
          ? <Moon size={11} style={{ color: '#31B2DE' }} />
          : <Sun  size={11} style={{ color: '#94A3B8' }} />
        }
      </div>
    </button>
  )
}

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [menu,     setMenu]     = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  const pathname                          = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { favorites }                     = useFavoritesStore()
  const { compareList }                   = useCompareStore()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const elevated = !transparent || scrolled

  const dashHref =
    user?.role === 'admin' || user?.role === 'super_admin' ? '/admin/dashboard'
    : user?.role === 'seller'                               ? '/seller/listings'
    : user?.role === 'agent'                                ? '/admin/dashboard'
    : '/buyer/profile'

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-400',
          elevated
            ? 'border-b backdrop-blur-2xl shadow-sm'
            : 'border-b border-transparent'
        )}
        style={{
          background:   elevated ? 'var(--surface)'   : 'transparent',
          borderColor:  elevated ? 'var(--border)'    : 'transparent',
        }}
      >
        <div className="wrap flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 no-select">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
              style={{ background: 'var(--grad)' }}
            >
              D
            </div>
            <span
              className="font-bold text-lg grad-text"
              style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.02em' }}
            >
              Distress Deals
            </span>
          </Link>

          {/* ── Desktop nav ──────────────────────────── */}
          <div className="hidden md:flex items-center gap-7">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={cn('nav-link', pathname.startsWith(n.href) && 'active')}
              >
                {n.label}
              </Link>
            ))}
          </div>

          {/* ── Right cluster ─────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Theme toggle */}
            <ThemeToggle />

            {isAuthenticated && user ? (
              <>
                <NotificationBell />

                {/* Favorites */}
                <Link href="/buyer/favorites" className="relative btn-ghost btn-sm p-2.5">
                  <Heart size={16} />
                  {favorites.length > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--grad)' }}
                    >
                      {favorites.length}
                    </span>
                  )}
                </Link>

                {/* Compare */}
                {compareList.length > 0 && (
                  <Link href="/buyer/compare" className="relative btn-ghost btn-sm p-2.5">
                    <GitCompare size={16} />
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--grad)' }}
                    >
                      {compareList.length}
                    </span>
                  </Link>
                )}

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenu(o => !o)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-[rgba(49,178,222,0.06)] transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white overflow-hidden"
                      style={{ background: 'var(--grad)' }}
                    >
                      {user.avatar
                        ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                        : getInitials(user.name)
                      }
                    </div>
                    <span className="text-sm hidden lg:block" style={{ color: 'var(--text-mid)' }}>
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown
                      size={12}
                      className={cn('transition-transform', userMenu && 'rotate-180')}
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50 shadow-lg"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                      >
                        <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{user.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                        </div>

                        {[
                          { href: dashHref,        icon: LayoutDashboard, label: 'Dashboard' },
                          { href: '/buyer/profile', icon: User,            label: 'Profile'   },
                          { href: '/settings',      icon: Settings,        label: 'Settings'  },
                        ].map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(49,178,222,0.06)'; (e.currentTarget as HTMLElement).style.color = 'var(--teal)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                          >
                            <item.icon size={14} />
                            {item.label}
                          </Link>
                        ))}

                        <button
                          onClick={() => { logout(); setUserMenu(false) }}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm w-full transition-colors"
                          style={{ color: '#FB7185', borderTop: '1px solid var(--border)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.08)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login"    className="btn-ghost btn-sm">Sign In</Link>
                <Link href="/auth/register" className="btn-primary btn-sm">Get Started</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenu(o => !o)}
              className="md:hidden btn-ghost p-2 rounded-lg"
            >
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────── */}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden shadow-lg"
            style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="wrap py-5 space-y-1">
              {NAV.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenu(false)}
                  className="block py-3 text-sm transition-colors"
                  style={{
                    color: 'var(--text-mid)',
                    borderBottom: '1px solid var(--border-soft)',
                  }}
                >
                  {n.label}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="pt-4 flex flex-col gap-2">
                  <Link href="/auth/login"    onClick={() => setMenu(false)} className="btn-ghost justify-center py-3">Sign In</Link>
                  <Link href="/auth/register" onClick={() => setMenu(false)} className="btn-primary justify-center py-3">Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      {!transparent && <div className="h-16" />}
    </>
  )
}