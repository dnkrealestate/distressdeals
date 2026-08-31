'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, KeyRound, Construction, Newspaper, Plus } from 'lucide-react'

const NAV_LEFT = [
  { href: '/for-sale', label: 'Buy',  icon: Building2 },
  { href: '/for-rent', label: 'Rent', icon: KeyRound },
]
const NAV_RIGHT = [
  { href: '/projects', label: 'Projects', icon: Construction },
  { href: '/insights', label: 'Insights', icon: Newspaper },
]

// Hidden on: property/project DETAIL pages, which already have their own
// dedicated sticky "Interested" contact bar (see PropertyDetailClient.tsx /
// ProjectDetailClient.tsx) — showing this generic nav there too would stack
// two bottom bars on top of each other; and the admin/seller dashboards,
// which are staff-only areas with their own separate navigation.
function shouldHide(pathname: string): boolean {
  if (pathname.startsWith('/admin') || pathname.startsWith('/seller')) return true
  if (/^\/buyer\/properties\/[^/]+$/.test(pathname)) return true
  if (/^\/projects\/[^/]+$/.test(pathname)) return true
  return false
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: any; active: boolean }) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
      style={{ color: active ? 'var(--teal)' : 'var(--text-muted)' }}
    >
      <Icon size={19} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}

export default function MobileBottomNav() {
  const pathname = usePathname()
  if (shouldHide(pathname)) return null

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV_LEFT.map(n => (
        <NavLink key={n.href} {...n} active={pathname.startsWith(n.href)} />
      ))}

      {/* Center "Add Listing" — raised above the bar line, same brand
          gradient as the site's other primary CTAs. */}
      <Link href="/seller/register" className="flex-1 flex flex-col items-center justify-end relative pb-1.5">
        <div
          className="absolute -top-5 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--grad)', boxShadow: '0 6px 16px rgba(49,178,222,0.40)', border: '3px solid var(--surface)' }}
        >
          <Plus size={24} className="text-white" />
        </div>
        <span className="text-[10px] font-medium mt-8" style={{ color: 'var(--teal)' }}>List Property</span>
      </Link>

      {NAV_RIGHT.map(n => (
        <NavLink key={n.href} {...n} active={pathname.startsWith(n.href)} />
      ))}
    </nav>
  )
}
