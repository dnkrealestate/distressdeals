'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Plus } from 'lucide-react'

// The two things people come to the site to do besides browsing — open the map, list a property — as a floating
// dock at the bottom of the screen instead of crowding the header. Phones already have the bottom nav's centre
// "List Property" button, so there it is just a Map button floating above the bar.
function hidden(pathname: string): boolean {
  if (pathname.startsWith('/admin') || pathname.startsWith('/seller') || pathname.startsWith('/auth')) return true
  if (pathname.startsWith('/map-search')) return true        // already on the map
  return false
}

// Property / project detail pages already have their own dedicated sticky "Interested" contact bar (and, for
// projects, an inline location map) — no floating actions of any kind on top of that, on either breakpoint.
function detailPage(pathname: string): boolean {
  return /^\/buyer\/properties\/[^/]+$/.test(pathname) || /^\/projects\/[^/]+$/.test(pathname)
}

export default function FloatingActions() {
  const pathname = usePathname()
  if (hidden(pathname) || detailPage(pathname)) return null

  return (
    <>
      {/* Desktop / tablet: a centred pill with both actions */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.45 }}
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-1.5 p-1.5 rounded-full"
        style={{
          background: 'color-mix(in srgb, var(--surface) 88%, transparent)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid var(--border)',
          boxShadow: '0 18px 44px -14px rgba(15,23,42,0.35)',
        }}
        role="navigation"
        aria-label="Quick actions"
      >
        <Link
          href="/map-search"
          className="group inline-flex items-center gap-2 h-11 pl-4 pr-5 rounded-full text-sm font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
          style={{ background: 'var(--grad)', boxShadow: '0 8px 20px -8px rgba(203,1,1,0.65)' }}
        >
          <MapPin size={16} /> Map view
        </Link>
        <Link
          href="/seller/register"
          className="inline-flex items-center gap-2 h-11 pl-4 pr-5 rounded-full text-sm font-semibold transition-colors duration-200"
          style={{ color: 'var(--teal)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(203,1,1,0.10)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <Plus size={16} /> List your property
        </Link>
      </motion.div>

      {/* Phones: a round Map button above the bottom bar (the bar already carries "List Property") */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        className="md:hidden fixed right-4 z-40"
        style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}
      >
        <Link
          href="/map-search"
          aria-label="Map view"
          className="flex items-center gap-2 h-12 px-4 rounded-full text-sm font-bold text-white"
          style={{ background: 'var(--grad)', boxShadow: '0 10px 24px -8px rgba(203,1,1,0.7)' }}
        >
          <MapPin size={17} /> Map
        </Link>
      </motion.div>
    </>
  )
}
