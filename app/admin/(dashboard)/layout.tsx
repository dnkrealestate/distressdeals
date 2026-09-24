'use client'
import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Home, TrendingUp, Users, CalendarDays,
  UserCog, LogOut, Sun, Moon, ShieldCheck, MessageSquare, Wallet,
  MoreHorizontal, X, Settings as SettingsIcon,
} from 'lucide-react'
import { useAuthStore, useAuthHydrated } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import NotificationBell from '@/components/NotificationBell'
import { Logo } from '@/components/shared/Logo'
import { chatAPI } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { cn } from '@/lib/utils'
import type { AgentPermission } from '@/types'
import { can, canAnyContent, isFullAccess as fullAccess, PATH_MODULE, ROLE_LABEL, STAFF_ROLES, staffHome } from '@/lib/modules'

// `permission`: a module key; `'OPS'` = admins and agents (not editors — Overview and Messages are agent tools);
// `'ANY_CONTENT'` = anyone holding at least one website-content module; `'ADMIN_ONLY'` = admin/super_admin only
// (matches backend routes restricted with restrictTo, not requirePermission).
type NavPermission = AgentPermission | 'OPS' | 'ANY_CONTENT' | 'ADMIN_ONLY'
const NAV: { href: string; icon: any; label: string; permission: NavPermission }[] = [
  { href: '/admin/dashboard',  icon: LayoutDashboard, label: 'Overview',  permission: 'OPS'                },
  { href: '/admin/properties', icon: Home,             label: 'Listings', permission: 'approve_listings'   },
  { href: '/admin/leads',      icon: TrendingUp,       label: 'Leads',    permission: 'manage_leads'       },
  { href: '/admin/mortgage',   icon: Wallet,            label: 'Mortgage', permission: 'manage_leads'       },
  { href: '/admin/messages',   icon: MessageSquare,     label: 'Messages', permission: 'OPS'                },
  { href: '/admin/agents',     icon: Users,             label: 'Agents',   permission: 'manage_agents'      },
  { href: '/admin/meetings',   icon: CalendarDays,     label: 'Meetings', permission: 'schedule_meetings'  },
  { href: '/admin/settings',   icon: SettingsIcon,      label: 'Settings', permission: 'ANY_CONTENT'        },
  { href: '/admin/users',      icon: UserCog,           label: 'Users',    permission: 'ADMIN_ONLY'         },
]

// The 4 sections that fit comfortably in a mobile bottom tab bar — everything
// else (plus theme/sign out, which the sidebar footer normally carries) lives
// behind the "More" sheet on mobile.
const MOBILE_PRIMARY_HREFS = ['/admin/dashboard', '/admin/properties', '/admin/leads', '/admin/messages']

// Sub-sections consolidated under the "Settings" hub — visiting any of these
// keeps the Settings nav item highlighted even though they're no longer top-level links.
const SETTINGS_SUB_PATHS = ['/admin/settings', '/admin/content', '/admin/homepage', '/admin/seo', '/admin/projects', '/admin/developers', '/admin/areas', '/admin/communities', '/admin/buildings']

const ALLOWED_ROLES = STAFF_ROLES

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const [msgUnread, setMsgUnread] = useState(0)
  const [moreOpen, setMoreOpen] = useState(false)

  const refreshMsgUnread = useCallback(() => {
    if (!isAuthenticated) return
    chatAPI.getUnreadCount().then(r => { if (r.data.success) setMsgUnread(r.data.data.count) }).catch(() => {})
  }, [isAuthenticated])

  const hydrated = useAuthHydrated()

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || !user || !ALLOWED_ROLES.includes(user.role)) {
      router.replace('/admin/login')
    }
  }, [hydrated, isAuthenticated, user, router])

  // Sidebar badge for unread messages — refetches on any new message
  // anywhere (cheap single count call) and again whenever the user leaves
  // the messages section, so it self-corrects after they've read something.
  useEffect(() => {
    if (!isAuthenticated) return
    refreshMsgUnread()
    const socket = getSocket()
    socket.on('new_message', refreshMsgUnread)
    return () => { socket.off('new_message', refreshMsgUnread) }
  }, [isAuthenticated, refreshMsgUnread])

  useEffect(() => {
    if (!pathname?.startsWith('/admin/messages')) refreshMsgUnread()
  }, [pathname, refreshMsgUnread])

  useEffect(() => { setMoreOpen(false) }, [pathname])

  // Editors have no Overview or Messages — send them to their home (Settings) instead of an empty page.
  useEffect(() => {
    if (hydrated && user?.role === 'editor' && (pathname === '/admin/dashboard' || pathname?.startsWith('/admin/messages'))) {
      router.replace(staffHome(user))
    }
  }, [hydrated, user, pathname, router])

  if (!hydrated || !isAuthenticated || !user || !ALLOWED_ROLES.includes(user.role)) return null

  const isFullAccess = fullAccess(user)
  const visibleNav = NAV.filter(n => {
    if (isFullAccess) return true
    if (n.permission === 'ADMIN_ONLY') return false
    if (n.permission === 'OPS') return user.role === 'agent'
    if (n.permission === 'ANY_CONTENT') return canAnyContent(user)
    return can(user, n.permission)
  })
  // A page belonging to a module this person doesn't have (reached by typing the address) — the API refuses it too.
  const blockedModule = !isFullAccess && PATH_MODULE.some(([p, key]) => (pathname === p || pathname?.startsWith(p + '/')) && !can(user, key))

  const isActive = (href: string) => {
    if (pathname === href || pathname?.startsWith(href + '/')) return true
    if (href === '/admin/settings') return SETTINGS_SUB_PATHS.some(p => pathname === p || pathname?.startsWith(p + '/'))
    return false
  }
  const primaryMatches = visibleNav.filter(n => MOBILE_PRIMARY_HREFS.includes(n.href))
  // Editors have none of the usual primary tabs — give them their own sections as tabs instead.
  const mobilePrimaryNav = primaryMatches.length ? primaryMatches : visibleNav.slice(0, 4)
  const mobileMoreNav = visibleNav.filter(n => !mobilePrimaryNav.includes(n))

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Desktop sidebar (lg and up) ──────────────────────── */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link href="/" className="flex flex-col items-start gap-1.5">
            <Logo height={26} />
            <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <ShieldCheck size={10} /> Centralized Control
            </p>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNav.map(n => {
            const active = isActive(n.href)
            return (
              <Link key={n.href} href={n.href} className={cn('sidebar-link', active && 'active')}>
                <n.icon size={15} />
                {n.label}
                {n.href === '/admin/messages' && msgUnread > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-white rounded-full px-1.5 py-0.5 flex-shrink-0" style={{ background: 'var(--grad)' }}>
                    {msgUnread > 9 ? '9+' : msgUnread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          <NotificationBell variant="sidebar" />
          <div className="flex items-center justify-between px-3 mb-2 mt-1">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
              {user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
              <p className="text-xs truncate capitalize" style={{ color: 'var(--text-muted)' }}>{ROLE_LABEL[user.role] || user.role}{user.displayId ? ' · ' + user.displayId : ''}</p>
            </div>
          </div>
          <button onClick={() => logout()} className="sidebar-link w-full" style={{ color: '#FB7185' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar (below lg) ─────────────────────────── */}
      <header className="lg:hidden flex items-center justify-between px-4 flex-shrink-0" style={{ height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Logo href={null} height={24} />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell variant="navbar" />
          <button
            onClick={() => setMoreOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'var(--grad)' }}
            aria-label="Account menu"
          >
            {user?.name?.[0] || 'A'}
          </button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {blockedModule ? (
            <div className="flex flex-col items-center justify-center text-center py-24 px-6">
              <ShieldCheck size={28} style={{ color: 'var(--text-muted)', opacity: 0.5 }} className="mb-3" />
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>You don't have access to this section</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Ask an admin to add this module to your account.</p>
              <Link href={staffHome(user)} className="btn-primary btn-sm">Go to my dashboard</Link>
            </div>
          ) : children}
        </div>
      </main>

      {/* ── Mobile bottom tab bar (below lg) ───────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {mobilePrimaryNav.map(n => (
          <Link
            key={n.href} href={n.href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 relative"
            style={{ color: isActive(n.href) ? 'var(--teal)' : 'var(--text-muted)' }}
          >
            <n.icon size={19} />
            <span className="text-[10px] font-medium">{n.label}</span>
            {n.href === '/admin/messages' && msgUnread > 0 && (
              <span className="absolute top-1 right-[28%] w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style={{ background: 'var(--grad)' }}>
                {msgUnread > 9 ? '9+' : msgUnread}
              </span>
            )}
          </Link>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 py-2.5"
          style={{ color: 'var(--text-muted)' }}
        >
          <MoreHorizontal size={19} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* ── Mobile "More" sheet — remaining sections + theme + sign out ── */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMoreOpen(false)}>
          <div
            className="w-full max-h-[80vh] overflow-y-auto rounded-t-3xl p-5 pb-8"
            style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
                  {user?.name?.[0] || 'A'}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{user?.name}</p>
                  <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{ROLE_LABEL[user.role] || user.role}{user.displayId ? ' · ' + user.displayId : ''}</p>
                </div>
              </div>
              <button onClick={() => setMoreOpen(false)} className="btn-ghost btn-sm p-2"><X size={15} /></button>
            </div>

            {mobileMoreNav.length > 0 && (
              <div className="space-y-1 mb-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                {mobileMoreNav.map(n => (
                  <Link key={n.href} href={n.href} className={cn('sidebar-link', isActive(n.href) && 'active')}>
                    <n.icon size={15} />
                    {n.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between px-1 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text)' }}>Dark mode</span>
              <ThemeToggle />
            </div>
            <button onClick={() => logout()} className="sidebar-link w-full mt-3" style={{ color: '#FB7185' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
