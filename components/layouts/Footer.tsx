'use client'

import Link from 'next/link'
import {
  Instagram, Linkedin, Youtube, Facebook, Apple, Play,
  Building2, Shield,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

const FOOTER_LINKS = {
  Properties: [
    { label: 'Apartments for Sale',  href: '/buyer/properties?type=apartment'  },
    { label: 'Villas for Sale',      href: '/buyer/properties?type=villa'       },
    { label: 'Penthouses',           href: '/buyer/properties?type=penthouse'   },
    { label: 'Off-Plan Projects',    href: '/projects'                          },
    { label: 'Rent in Dubai',        href: '/for-rent'                          },
    { label: 'Commercial',           href: '/buyer/properties?type=office'      },
  ],
  Insights: [
    { label: 'Insights Hub',   href: '/insights'      },
    { label: 'Area Guides',    href: '/areas'          },
    { label: 'Communities',    href: '/communities'    },
    { label: 'Buildings',      href: '/buildings'      },
    { label: 'Blog',           href: '/blog'           },
    { label: 'News',           href: '/news'           },
  ],
}

// A minimal TikTok glyph — lucide-react has no brand icon for it, so this is
// a small inline SVG kept in the same currentColor style as the lucide icons
// around it, sized/hovered identically.
function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  )
}

// Real company profiles — not per-post share links or per-person profiles
// (those live elsewhere: blog/news share buttons, About page team cards).
const SOCIALS = [
  { Icon: Instagram,  href: 'https://www.instagram.com/distressdeals_uae/',                    label: 'Instagram' },
  { Icon: TikTokIcon, href: 'https://www.tiktok.com/@distressdeals',                            label: 'TikTok'    },
  { Icon: Linkedin,   href: 'https://www.linkedin.com/company/distress-dealsuae/',              label: 'LinkedIn'  },
  { Icon: Youtube,    href: 'https://www.youtube.com/@Distressdeals',                           label: 'YouTube'   },
  { Icon: Facebook,   href: 'https://www.facebook.com/profile.php?id=61594458870625',           label: 'Facebook'  },
]

// App Store needs a numeric App Store Connect id we don't have yet (the app
// isn't published there), so it's a disabled "coming soon" badge for now —
// swap `appStoreHref` in once the app is live and drop the `comingSoon` flag.
const appStoreHref: string | null = null
const playStoreHref = 'https://play.google.com/store/apps/details?id=com.distressdealsuae.app'

function StoreBadge({ href, Icon, eyebrow, title, comingSoon }: { href: string | null; Icon: any; eyebrow: string; title: string; comingSoon?: boolean }) {
  const content = (
    <>
      <Icon size={22} className="flex-shrink-0" />
      <div className="text-left leading-tight">
        <div className="text-[9px] uppercase tracking-wide opacity-70">{comingSoon ? 'Coming soon on' : eyebrow}</div>
        <div className="text-sm font-semibold">{title}</div>
      </div>
    </>
  )
  const className = 'flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200'
  const style = { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', opacity: comingSoon ? 0.6 : 1, cursor: comingSoon ? 'default' : 'pointer' }

  if (!href) return <div className={className} style={style}>{content}</div>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
      {content}
    </a>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border)' }}>
      <div className="wrap py-16">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div>
            <div className="mb-5">
              <Logo height={34} />
            </div>

            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
              Dubai's premier real estate platform — connecting buyers, sellers, and investors with
              verified properties across the UAE.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2.5 mb-6">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--grad)'
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--surface)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>

            {/* RERA badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-2" style={{ background: 'rgba(203,1,1,.06)', border: '1px solid rgba(203,1,1,.18)' }}>
              <Shield size={13} style={{ color: '#CB0101' }} />
              <span className="text-xs font-semibold" style={{ color: '#CB0101' }}>RERA Registered</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· Broker No: 12345</span>
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold mb-5" style={{ color: 'var(--text)' }}>
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm transition-colors duration-200"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#CB0101'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Get the App column */}
          <div>
            <h4 className="text-sm font-semibold mb-5" style={{ color: 'var(--text)' }}>
              Get the App
            </h4>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
              Search, save, and message sellers on the go — download the Distress Deals app.
            </p>
            <div className="flex flex-col gap-3">
              <StoreBadge href={appStoreHref} Icon={Apple} eyebrow="Download on the" title="App Store" comingSoon={!appStoreHref} />
              <StoreBadge href={playStoreHref} Icon={Play} eyebrow="Get it on" title="Google Play" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Building2 size={12} />
            © {year} Distress Deals Dubai. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Cookies', 'Sitemap'].map(l => (
              <Link
                key={l}
                href={`/${l.toLowerCase()}`}
                className="text-xs transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#CB0101'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {l}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}
