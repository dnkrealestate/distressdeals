'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Heart, GitCompare, Menu, X,
  ChevronDown, LogOut, Settings, User,
  LayoutDashboard, Sun, Moon, ArrowRight, ArrowLeft,
} from 'lucide-react'
import { useAuthStore }     from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useCompareStore }   from '@/store/compareStore'
import { useThemeStore }     from '@/store/themeStore'   // see note below
import { getInitials, cn }   from '@/lib/utils'
import NotificationBell      from '@/components/NotificationBell'
import { Logo }              from '@/components/shared/Logo'

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

interface MegaColumn { heading: string; links: { label: string; href: string }[] }
interface MegaBanner { title: string; subtitle: string; cta: string; href: string }
interface NavItem {
  href: string
  label: string
  mega?: { columns: MegaColumn[]; banner: MegaBanner }
  // Rendered as a distinct pill button instead of a plain text link — for
  // the one seller-acquisition CTA that should stand out from the rest.
  highlight?: boolean
}

// PropertyFinder-style mega menus — every link here points at a route that
// actually exists in this app (no placeholder/fabricated pages).
const NAV: NavItem[] = [
  {
    href: '/for-sale', label: 'Buy Property',
    mega: {
      columns: [
        { heading: 'Property Types', links: [
          { label: 'Apartments',  href: '/for-sale?type=apartment' },
          { label: 'Villas',      href: '/for-sale?type=villa' },
          { label: 'Townhouses',  href: '/for-sale?type=townhouse' },
          { label: 'Penthouses',  href: '/for-sale?type=penthouse' },
        ] },
        { heading: 'Explore Dubai', links: [
          { label: 'Area Insights', href: '/areas' },
          { label: 'Communities',   href: '/communities' },
          { label: 'Buildings',     href: '/buildings' },
        ] },
        { heading: 'Guides & Tools', links: [
          { label: 'Developers',        href: '/developers' },
          { label: 'Mortgage Calculator', href: '/mortgage' },
          { label: 'Insights Hub',      href: '/insights' },
        ] },
      ],
      banner: { title: 'Off-Plan Projects', subtitle: 'Explore the latest developments from top UAE developers', cta: 'View Projects', href: '/projects' },
    },
  },
  {
    href: '/for-rent', label: 'Rental Property',
    mega: {
      columns: [
        { heading: 'Property Types', links: [
          { label: 'Apartments',  href: '/for-rent?type=apartment' },
          { label: 'Studios',     href: '/for-rent?type=studio' },
          { label: 'Villas',      href: '/for-rent?type=villa' },
          { label: 'Townhouses',  href: '/for-rent?type=townhouse' },
        ] },
        { heading: 'Explore Dubai', links: [
          { label: 'Area Insights', href: '/areas' },
          { label: 'Communities',   href: '/communities' },
          { label: 'Buildings',     href: '/buildings' },
        ] },
        { heading: 'Guides & Tools', links: [
          { label: 'Insights Hub', href: '/insights' },
          { label: 'Blog',         href: '/blog' },
          { label: 'News',         href: '/news' },
        ] },
      ],
      banner: { title: 'Find Verified Rentals', subtitle: 'Browse thousands of listings across Dubai', cta: 'Browse Rentals', href: '/for-rent' },
    },
  },
  {
    href: '/projects', label: 'New Projects',
    mega: {
      columns: [
        { heading: 'Browse', links: [
          { label: 'All New Projects', href: '/projects' },
          { label: 'Buy Property',     href: '/for-sale' },
        ] },
        { heading: 'Developers', links: [
          { label: 'All Developers', href: '/developers' },
        ] },
        { heading: 'Insights', links: [
          { label: 'Insights Hub', href: '/insights' },
          { label: 'Blog',         href: '/blog' },
        ] },
      ],
      banner: { title: 'Discover New Projects', subtitle: 'Off-plan developments from the UAE’s top developers', cta: 'Explore Projects', href: '/projects' },
    },
  },
  {
    href: '/insights', label: 'Insights',
    mega: {
      columns: [
        { heading: 'Read', links: [
          { label: 'Insights Hub', href: '/insights' },
          { label: 'Blog',         href: '/blog' },
          { label: 'News',         href: '/news' },
        ] },
        { heading: 'Explore Dubai', links: [
          { label: 'Area Guides',      href: '/areas' },
          { label: 'Community Guides', href: '/communities' },
          { label: 'Building Guides',  href: '/buildings' },
        ] },
        { heading: 'Tools', links: [
          { label: 'Mortgage Calculator', href: '/mortgage' },
          { label: 'Developers',          href: '/developers' },
        ] },
      ],
      banner: { title: 'Popular Communities', subtitle: 'See what’s trending across Dubai right now', cta: 'View Communities', href: '/communities' },
    },
  },
  { href: '/seller/register', label: 'List Your Property', highlight: true },
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
          ? <Moon size={11} style={{ color: '#CB0101' }} />
          : <Sun  size={11} style={{ color: '#94A3B8' }} />
        }
      </div>
    </button>
  )
}

/* ── Mega menu panel — full-width dropdown under a top-level nav item ── */
function MegaMenu({ mega, onNavigate }: { mega: NonNullable<NavItem['mega']>; onNavigate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.16 }}
      className="absolute left-0 right-0 top-full z-40 shadow-lg"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}
    >
      <div className="wrap py-7 grid gap-8" style={{ gridTemplateColumns: `repeat(${mega.columns.length}, minmax(0,1fr)) 260px` }}>
        {mega.columns.map(col => (
          <div key={col.heading}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              {col.heading}
            </p>
            <div className="flex flex-col gap-2.5">
              {col.links.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={onNavigate}
                  className="text-sm transition-colors"
                  style={{ color: 'var(--text-mid)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--teal)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)' }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Featured banner */}
        <Link
          href={mega.banner.href}
          onClick={onNavigate}
          className="relative rounded-2xl p-5 flex flex-col justify-end overflow-hidden group"
          style={{ background: 'var(--grad)', minHeight: 160 }}
        >
          <div className="absolute pointer-events-none" style={{ top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
          <p className="font-semibold text-white text-sm mb-1 relative z-10">{mega.banner.title}</p>
          <p className="text-xs mb-4 relative z-10" style={{ color: 'rgba(255,255,255,0.85)' }}>{mega.banner.subtitle}</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white relative z-10 transition-transform group-hover:translate-x-0.5">
            {mega.banner.cta} <ArrowRight size={13} />
          </span>
        </Link>
      </div>
    </motion.div>
  )
}

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [menu,     setMenu]     = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [openMega, setOpenMega] = useState<string | null>(null)
  const [openMobileMega, setOpenMobileMega] = useState<string | null>(null)

  const pathname                          = usePathname()
  const router                            = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { favorites }                     = useFavoritesStore()
  const { compareList }                   = useCompareStore()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const elevated = !transparent || scrolled

  // Phones: a back arrow before the logo on a single property / project page (there's no browser chrome to lean on
  // in an installed/home-screen view). Goes back if they came from within the site, else to the matching list.
  const detailListHref =
    /^\/projects\/[^/]+$/.test(pathname) && pathname !== '/projects/compare' ? '/projects'
    : /^\/buyer\/properties\/[^/]+$/.test(pathname) ? '/for-sale'
    : null
  const goBack = () => {
    const internal = typeof document !== 'undefined' && document.referrer.startsWith(window.location.origin)
    if (internal && window.history.length > 1) router.back()
    else router.push(detailListHref || '/')
  }

  const dashHref =
    user?.role === 'admin' || user?.role === 'super_admin' ? '/admin/dashboard'
    : user?.role === 'seller'                               ? '/seller/listings'
    : user?.role === 'agent'                                ? '/admin/dashboard'
    : user?.role === 'editor'                               ? '/admin/settings'
    : '/buyer/profile'

  // "Profile" has to point at wherever THIS role's profile page actually lives — the buyer account area
  // (`/buyer/(account)/*`) redirects straight to /auth/login for anyone who isn't role === 'buyer', so a seller
  // hitting a hardcoded /buyer/profile here saw what looked like their profile silently failing to open.
  const profileHref =
    user?.role === 'seller' ? '/seller/profile'
    : user?.role === 'buyer' ? '/buyer/profile'
    : dashHref   // staff have no separate profile page yet — their dashboard doubles as one

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
        onMouseLeave={() => setOpenMega(null)}
      >
        <div className="wrap flex items-center justify-between h-16">

          {/* ── Logo (with a back arrow on phones, on detail pages) ── */}
          <div className="flex items-center gap-1.5 min-w-0">
            {detailListHref && (
              <button onClick={goBack} aria-label="Back" className="md:hidden -ml-2 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                style={{ color: 'var(--text)' }}>
                <ArrowLeft size={20} />
              </button>
            )}
            <Logo height={34} />
          </div>

          {/* ── Desktop nav ──────────────────────────── */}
          <div className="hidden md:flex items-center gap-1.5">
            {NAV.map(n => n.highlight ? (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 ml-2"
                style={{ border: '1.5px solid var(--teal)', color: 'var(--teal)', background: 'rgba(203,1,1,0.08)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--teal)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(203,1,1,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--teal)' }}
              >
                {n.label}
              </Link>
            ) : (
              <Link
                key={n.href}
                href={n.href}
                onMouseEnter={() => n.mega && setOpenMega(n.href)}
                className={cn('nav-link flex items-center gap-1', pathname.startsWith(n.href) && 'active')}
              >
                {n.label}
                {n.mega && (
                  <ChevronDown size={12} className={cn('transition-transform', openMega === n.href && 'rotate-180')} />
                )}
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
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-[rgba(203,1,1,0.06)] transition-colors"
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
                          { href: dashHref,    icon: LayoutDashboard, label: 'Dashboard' },
                          // Staff have no separate profile page — omit the duplicate rather than link "Profile" to
                          // the same place "Dashboard" already goes.
                          ...(profileHref !== dashHref ? [{ href: profileHref, icon: User, label: 'Profile' }] : []),
                          { href: '/settings', icon: Settings,        label: 'Settings'  },
                        ].map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(203,1,1,0.06)'; (e.currentTarget as HTMLElement).style.color = 'var(--teal)'; }}
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

        {/* ── Mega menu panel — a direct child of <nav> (not the small
            per-item link) so it can span the full width and so moving the
            mouse from the link down into it never leaves the hover zone
            that keeps it open. ── */}
        <AnimatePresence>
          {openMega && (() => {
            const active = NAV.find(n => n.href === openMega)
            return active?.mega ? (
              <MegaMenu key={active.href} mega={active.mega} onNavigate={() => setOpenMega(null)} />
            ) : null
          })()}
        </AnimatePresence>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────── */}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden shadow-lg overflow-y-auto"
            style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', maxHeight: 'calc(100vh - 4rem)' }}
          >
            <div className="wrap py-5">
              {NAV.filter(n => !n.highlight).map(n => (
                <div key={n.href} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <div className="flex items-center justify-between">
                    <Link
                      href={n.href}
                      onClick={() => setMenu(false)}
                      className="block py-3 text-sm flex-1 transition-colors"
                      style={{ color: 'var(--text-mid)' }}
                    >
                      {n.label}
                    </Link>
                    {n.mega && (
                      <button
                        onClick={() => setOpenMobileMega(o => (o === n.href ? null : n.href))}
                        className="p-3"
                        aria-label={`Toggle ${n.label} submenu`}
                      >
                        <ChevronDown
                          size={14}
                          className={cn('transition-transform', openMobileMega === n.href && 'rotate-180')}
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </button>
                    )}
                  </div>

                  {n.mega && (
                    <AnimatePresence>
                      {openMobileMega === n.href && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 grid grid-cols-2 gap-x-4 gap-y-4">
                            {n.mega.columns.map(col => (
                              <div key={col.heading}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                  {col.heading}
                                </p>
                                <div className="flex flex-col gap-1.5">
                                  {col.links.map(l => (
                                    <Link
                                      key={l.href}
                                      href={l.href}
                                      onClick={() => { setMenu(false); setOpenMobileMega(null) }}
                                      className="text-xs"
                                      style={{ color: 'var(--text-mid)' }}
                                    >
                                      {l.label}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}

              {NAV.filter(n => n.highlight).map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenu(false)}
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold mt-4 py-3 rounded-full transition-colors"
                  style={{ border: '1.5px solid var(--teal)', color: 'var(--teal)', background: 'rgba(203,1,1,0.08)' }}
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