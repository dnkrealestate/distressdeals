'use client'

import Link from 'next/link'
import {
  Mail, Phone, MapPin,
  Instagram, Twitter, Linkedin, Youtube,
  Building2, Shield, CheckCircle,
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
  // Company: [
  //   // { label: 'About Us',       href: '/about'         },
  //   // { label: 'Careers',        href: '/careers'        },
  //   // { label: 'Contact',        href: '/contact'        },
  //   // { label: 'Privacy Policy', href: '/privacy-policy' },
  // ],
}

const SOCIALS = [
  { Icon: Instagram, href: '#', label: 'Instagram' },
  { Icon: Twitter,   href: '#', label: 'Twitter'   },
  { Icon: Linkedin,  href: '#', label: 'LinkedIn'   },
  { Icon: Youtube,   href: '#', label: 'YouTube'    },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
      <div className="wrap py-16">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand column */}
          <div>
            {/* Logo */}
            <div className="mb-5">
              <Logo height={34} />
            </div>

            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
              Dubai's premier real estate platform — connecting buyers, sellers, and investors with
              verified properties across the UAE.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2.5">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(49,178,222,.1)'
                    e.currentTarget.style.borderColor = 'rgba(49,178,222,.35)'
                    e.currentTarget.style.color = '#31B2DE'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--surface-2)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4
                className="text-sm font-semibold mb-5"
                style={{ color: 'var(--text)' }}
              >
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm transition-colors duration-200"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#31B2DE'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          <div>
            <h4 className="text-sm font-semibold mb-5" style={{ color: 'var(--text)' }}>
              Contact
            </h4>

            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <MapPin size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#31B2DE' }} />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Suite No: 303, Sama Building<br />Al Barsha 1, Dubai, United Arab Emirates.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={14} style={{ color: '#31B2DE' }} />
                <a
                  href="tel:+97144000000"
                  className="text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#31B2DE'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  +971 4 400 0000
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={14} style={{ color: '#31B2DE' }} />
                <a
                  href="mailto:hello@distressdeals.ae"
                  className="text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#31B2DE'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  info@distressdeals.com
                </a>
              </li>
            </ul>

            {/* RERA badge */}
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(49,178,222,.06)',
                border: '1px solid rgba(49,178,222,.18)',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Shield size={13} style={{ color: '#31B2DE' }} />
                <span className="text-xs font-semibold" style={{ color: '#31B2DE' }}>
                  RERA Registered
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Broker No: 12345 · DLD Licensed
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {year} Distress Deals Dubai. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Cookies', 'Sitemap'].map(l => (
              <Link
                key={l}
                href={`/${l.toLowerCase()}`}
                className="text-xs transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#31B2DE'}
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