'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Heart, TrendingUp, CalendarClock, LogOut, Bell } from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { useAuthStore, useAuthHydrated } from '@/store/authStore'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/buyer/profile',   icon: User,          label: 'Profile'   },
  { href: '/buyer/favorites', icon: Heart,          label: 'Favorites' },
  { href: '/buyer/leads',     icon: TrendingUp,     label: 'My Leads'  },
  { href: '/buyer/tours',     icon: CalendarClock,  label: 'My Tours'  },
  { href: '/buyer/searches',  icon: Bell,           label: 'Alerts'    },
]

// Gated the same way /seller/(dashboard) is — these are account pages, not
// public browsing (that's /buyer/properties, deliberately outside this
// group so it stays reachable by guests).
export default function BuyerAccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()

  const hydrated = useAuthHydrated()

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || !user || user.role !== 'buyer') {
      router.replace('/auth/login')
    }
  }, [hydrated, isAuthenticated, user, router])

  if (!hydrated || !isAuthenticated || !user || user.role !== 'buyer') return null

  return (
    <div className="page">
      <Navbar />
      <div className="wrap py-6 lg:py-10 pb-24 lg:pb-20 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop sidebar — hidden on mobile in favour of the bottom tab bar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="card p-2 space-y-1">
              {NAV.map(n => {
                const active = pathname === n.href
                return (
                  <Link key={n.href} href={n.href} className={cn('sidebar-link', active && 'active')}>
                    <n.icon size={15} />
                    {n.label}
                  </Link>
                )
              })}
              <button onClick={() => logout()} className="sidebar-link w-full" style={{ color: '#FB7185' }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
      <Footer />

      {/* Mobile bottom tab bar — same "always one tap away" pattern as the
          seller app shell, sized for the 4 account destinations only. */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV.map(n => {
          const active = pathname === n.href
          return (
            <Link key={n.href} href={n.href} className="flex flex-col items-center gap-1 py-2.5" style={{ color: active ? 'var(--teal)' : 'var(--text-muted)' }}>
              <n.icon size={19} />
              <span className="text-[10px] font-medium">{n.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
