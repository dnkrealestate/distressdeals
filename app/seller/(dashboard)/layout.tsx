'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home, TrendingUp, MessageSquare, Plus,
  LogOut, Sun, Moon, X,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import NotificationBell from '@/components/NotificationBell'
import { Logo } from '@/components/shared/Logo'
import { cn } from '@/lib/utils'

// Just the three things a seller actually needs day to day — no dashboard,
// no analytics. Adding a listing isn't a nav destination, it's the main
// action, so it gets its own prominent button instead of living in this list.
const NAV = [
  { href: '/seller/listings', icon: Home,          label: 'My Listings' },
  { href: '/seller/leads',    icon: TrendingUp,     label: 'Leads'       },
  { href: '/seller/messages', icon: MessageSquare,  label: 'Messages'    },
]

function ThemeToggle() {
  const { dark, toggle } = useThemeStore()
  return (
    <button onClick={toggle} className="theme-toggle" data-dark={String(dark)} aria-label="Toggle theme">
      <div className="theme-toggle__thumb" style={{ left: dark ? 27 : 3 }}>
        {dark ? <Moon size={11} style={{ color: '#CB0101' }} /> : <Sun size={11} style={{ color: '#94A3B8' }} />}
      </div>
    </button>
  )
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'seller') {
      router.replace('/seller/login')
    }
  }, [isAuthenticated, user, router])

  // Close the mobile account sheet on every navigation.
  useEffect(() => { setMenuOpen(false) }, [pathname])

  if (!isAuthenticated || !user || user.role !== 'seller') return null

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Desktop sidebar (lg and up) ──────────────────────── */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Logo href="/seller/listings" height={28} />
        </div>

        <div className="p-3">
          <Link href="/seller/listings/new" className="btn-primary w-full justify-center gap-2">
            <Plus size={15} /> Add New Listing
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={cn('sidebar-link', isActive(n.href) && 'active')}>
              <n.icon size={15} />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          <NotificationBell variant="sidebar" />
          <div className="flex items-center justify-between px-3 mb-2 mt-1">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
              {user?.name?.[0] || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Seller</p>
            </div>
          </div>
          <button onClick={() => logout()} className="sidebar-link w-full" style={{ color: '#FB7185' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar (below lg) ─────────────────────────── */}
      <header className="lg:hidden flex items-center justify-between px-4 flex-shrink-0" style={{ height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Logo href="/seller/listings" height={24} />
        <div className="flex items-center gap-1">
          <NotificationBell variant="navbar" />
          <button
            onClick={() => setMenuOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'var(--grad)' }}
            aria-label="Account menu"
          >
            {user?.name?.[0] || 'S'}
          </button>
        </div>
      </header>

      {/* ── Mobile account sheet ──────────────────────────────── */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMenuOpen(false)}>
          <div
            className="w-full rounded-t-3xl p-5 pb-8"
            style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
                  {user?.name?.[0] || 'S'}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{user?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Seller</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="btn-ghost btn-sm p-2"><X size={15} /></button>
            </div>
            <div className="flex items-center justify-between px-1 py-3" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text)' }}>Dark mode</span>
              <ThemeToggle />
            </div>
            <button onClick={() => logout()} className="sidebar-link w-full mt-3" style={{ color: '#FB7185' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom tab bar (below lg) ───────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 items-end"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Link href="/seller/listings" className="flex flex-col items-center gap-1 py-2.5" style={{ color: isActive('/seller/listings') ? 'var(--teal)' : 'var(--text-muted)' }}>
          <Home size={19} />
          <span className="text-[10px] font-medium">Listings</span>
        </Link>
        <Link href="/seller/leads" className="flex flex-col items-center gap-1 py-2.5" style={{ color: isActive('/seller/leads') ? 'var(--teal)' : 'var(--text-muted)' }}>
          <TrendingUp size={19} />
          <span className="text-[10px] font-medium">Leads</span>
        </Link>
        <div className="flex justify-center">
          <Link
            href="/seller/listings/new"
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg -mt-6"
            style={{ background: 'var(--grad)', border: '4px solid var(--bg)' }}
            aria-label="Add new listing"
          >
            <Plus size={24} />
          </Link>
        </div>
        <Link href="/seller/messages" className="flex flex-col items-center gap-1 py-2.5" style={{ color: isActive('/seller/messages') ? 'var(--teal)' : 'var(--text-muted)' }}>
          <MessageSquare size={19} />
          <span className="text-[10px] font-medium">Messages</span>
        </Link>
      </nav>
    </div>
  )
}
