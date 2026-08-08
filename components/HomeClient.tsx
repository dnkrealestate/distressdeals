'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Building2, Anchor, TreePalm, Briefcase, Waves, Home, Trees,
  MapPin, Layers,
} from 'lucide-react'

import Navbar       from '@/components/layouts/Navbar'
import Footer       from '@/components/layouts/Footer'
import SearchBar    from '@/components/buyer/SearchBar'
import PropertyCard from '@/components/buyer/PropertyCard'
import BlogSection  from '@/components/BlogSection'
import MarketWatchSection from '@/components/MarketWatchSection'
import FeaturedProjectsSection from '@/components/FeaturedProjectsSection'
import MortgageSection from '@/components/MortgageSection'
import { propertyAPI, homepageAPI, communityContentAPI } from '@/lib/api'
import { HOME_ICON_MAP, DEFAULT_HOME_ICON } from '@/lib/homeIcons'
import { useThemeStore } from '@/store/themeStore'
import type { Property, HomepageContent, CommunityContentWithStats } from '@/types'

/* ─── DATA ──────────────────────────────────────────────────── */
// Icons are purely cosmetic and keyed by area name — the actual listing
// counts come from the backend (see AreaStat / getAreaStats), never hardcoded.
const AREA_ICONS: Record<string, any> = {
  'Downtown Dubai':  Building2,
  'Dubai Marina':    Anchor,
  'Palm Jumeirah':   TreePalm,
  'Business Bay':    Briefcase,
  'JBR':             Waves,
  'Arabian Ranches': Home,
  'Dubai Hills':     Trees,
}
const DEFAULT_AREA_ICON = MapPin

interface AreaStat { area: string; count: number }

/* ─── ANIMATED HEADLINE ─────────────────────────────────────── */
const ACCENT_WORDS = ['Dream', "Dubai's", 'Luxury']

function HeadlineText({ text }: { text: string }) {
  return (
    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] md:leading-none tracking-tight text-center">
      {text.split(' ').map((word, i) => (
        <span key={i}>
          {ACCENT_WORDS.includes(word)
            ? <span className="grad-text">{word}</span>
            : word
          }
          {' '}
        </span>
      ))}
    </h1>
  )
}

/* ─── AREA CARD ─────────────────────────────────────────────── */
function AreaCard({ area }: { area: AreaStat }) {
  const Icon = AREA_ICONS[area.area] || DEFAULT_AREA_ICON
  return (
    <Link href={`/buyer/properties?area=${encodeURIComponent(area.area)}`}>
      <motion.div
        whileHover={{ y: -3 }}
        className="card-hover flex items-center gap-4 p-5 group"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
          style={{
            background: 'rgba(49,178,222,0.08)',
            border:     '1px solid rgba(49,178,222,0.18)',
          }}
        >
          <Icon size={22} style={{ color: 'var(--teal)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sm transition-colors group-hover:text-[var(--teal)]"
            style={{ color: 'var(--text)', marginBottom: 3 }}
          >
            {area.area}
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {area.count}+ listing{area.count === 1 ? '' : 's'}
          </p>
        </div>
        <ArrowRight
          size={15}
          className="flex-shrink-0 transition-all duration-200 group-hover:translate-x-1"
          style={{ color: 'var(--teal)', opacity: 0.5 }}
        />
      </motion.div>
    </Link>
  )
}

/* ─── WHY CARD ──────────────────────────────────────────────── */
function WhyCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  const Icon = HOME_ICON_MAP[icon] || DEFAULT_HOME_ICON
  return (
    <div className="group relative card p-7 overflow-hidden hover:border-[rgba(49,178,222,0.40)] transition-all duration-300">
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(49,178,222,0.06), transparent 55%)' }}
      />

      {/* Icon */}
      <div className="relative mb-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
          style={{
            background: 'rgba(49,178,222,0.07)',
            border:     '1px solid rgba(49,178,222,0.15)',
          }}
        >
          <Icon
            size={24}
            className="transition-transform duration-300 group-hover:scale-110"
            style={{ color: 'var(--teal)' }}
          />
        </div>
        {/* Hover ring */}
        <div
          className="absolute inset-0 rounded-2xl border border-[rgba(49,178,222,0.20)] scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-[1.3] transition-all duration-500"
        />
      </div>

      <h3
        className="font-semibold text-base mb-2.5 transition-colors group-hover:text-[var(--teal)]"
        style={{ color: 'var(--text)' }}
      >
        {title}
      </h3>

      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
        style={{ background: 'var(--grad)' }}
      />
    </div>
  )
}

/* ─── HOME PAGE ─────────────────────────────────────────────── */
export default function HomeClient({ content }: { content: HomepageContent }) {
  const [hlIdx,   setHlIdx]   = useState(0)
  const [featured, setFeatured] = useState<Property[]>([])
  const [areaStats, setAreaStats] = useState<AreaStat[] | null>(null)
  const [communities, setCommunities] = useState<CommunityContentWithStats[]>([])
  const heroRef = useRef<HTMLElement>(null)
  const { dark } = useThemeStore()

  const headlines = content.heroHeadlines.length > 0 ? content.heroHeadlines : ['Find Your Dream Home']

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroBgY     = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])

  useEffect(() => {
    const t = setInterval(() => setHlIdx(i => (i + 1) % headlines.length), 4200)
    return () => clearInterval(t)
  }, [headlines.length])

  useEffect(() => {
    propertyAPI.getFeatured()
      .then(r => { if (r.data.success) setFeatured(r.data.data.data || []) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    propertyAPI.getAreaStats(6)
      .then(r => { if (r.data.success) setAreaStats(r.data.data || []) })
      .catch(() => setAreaStats([]))
  }, [])

  useEffect(() => {
    communityContentAPI.getAll()
      .then(r => { if (r.data.success) setCommunities((r.data.data || []).slice(0, 6)) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    homepageAPI.trackView().catch(() => {})
  }, [])

  const trackCta = (cta: string) => { homepageAPI.trackCta(cta).catch(() => {}) }

  return (
    <div className="page overflow-x-hidden">
      <Navbar transparent />

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative h-screen min-h-[780px] flex items-center overflow-hidden"
      >
        {/* Background */}
        <motion.div className="absolute inset-0" style={{ y: heroBgY }}>
          {/* Gradient base (shows through on any transparent edges) */}
          {/* <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 50%, --text-muted 100%)',
            }}
          /> */}

          {/* Banner photo — white/dark space for text, subject on the right. Day/night swaps with theme, desktop/mobile swaps with viewport. Admin-editable via the Homepage CMS; falls back to the bundled defaults when unset. */}
          <Image
            src={(dark ? content.heroBannerDesktopNight : content.heroBannerDesktopDay) || (dark ? '/banners/home_banner_night.webp' : '/banners/home_banner_day.webp')}
            alt=""
            fill
            priority
            quality={100}
            sizes="100vw"
            className="object-cover object-right hidden md:block opacity-50"
          />
          <Image
            src={(dark ? content.heroBannerMobileNight : content.heroBannerMobileDay) || (dark ? '/banners/home_banner_night_mobile.webp' : '/banners/home_banner_day_mobile.webp')}
            alt=""
            fill
            priority
            quality={100}
            sizes="100vw"
            className="object-cover object-center md:hidden opacity-50"
          />

          {/* Soft left-to-right fade so text always sits on a clean surface (theme-aware) */}
          {/* <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, var(--bg) 0%, var(--bg) 30%, transparent 68%)',
            }}
          /> */}

          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:  'linear-gradient(rgba(49,178,222,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(49,178,222,0.7) 1px, transparent 1px)',
              backgroundSize:   '64px 64px',
            }}
          />

          {/* Orb — kept clear of the photo subject on the right */}
          <div
            className="absolute"
            style={{
              bottom: '8%', left: '3%',
              width: 760, height: 760,
              borderRadius: '100%',
              background: 'radial-gradient(circle, rgba(97,187,77,0.5) 0%, transparent 60%)',
            }}
          />

          {/* Orb — kept clear of the photo subject on the right */}
          <div
            className="absolute"
            style={{
              bottom: '-18%', right: '0%',
              width: 960, height: 960,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(149,228,255,0.5) 0%, transparent 60%)',
            }}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          className="relative z-10 wrap w-full"
          style={{ opacity: heroOpacity }}
        >
          {/* Eyebrow */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-8"
            style={{
              background:  'rgba(49,178,222,0.08)',
              border:      '1px solid rgba(49,178,222,0.25)',
              borderRadius: 24,
              padding:     '6px 16px',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--teal)', animation: 'pulseRing 2s infinite' }}
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--teal)' }}
            >
              Dubai's Premier Real Estate Platform
            </span>
          </motion.div> */}

          {/* Headline carousel */}
          <div className="overflow-hidden mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={hlIdx}
                initial={{ y: 70, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -70, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <HeadlineText text={headlines[hlIdx % headlines.length]} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ─── SEARCH ────────────────────────────────────────── */}
          <div className="relative z-20 pb-8">
            <SearchBar />
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base md:text-lg  mb-10 leading-relaxed text-center"
            style={{ color: 'var(--text)' }}
          >
            {content.heroSubtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap gap-4 mb-14 w-full justify-center"
          >
            <Link href="/buyer/properties" className="btn-primary btn-lg" onClick={() => trackCta('hero_explore_properties')}>
              Explore Properties <ArrowRight size={16} />
            </Link>
            <Link href="/seller/register" className="btn-outline btn-lg backdrop-blur-sm" onClick={() => trackCta('hero_list_property')}>
              List Your Property
            </Link>
          </motion.div>

          {/* Mini stats */}
          {/* <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-0"
          >
            {content.heroMiniStats.map((s, i) => (
              <div key={s.label} className="flex items-center">
                {i > 0 && (
                  <div
                    className="w-px h-9 mx-8"
                    style={{ background: 'var(--border)' }}
                  />
                )}
                <div>
                  <div
                    className="text-2xl font-extrabold tracking-tight grad-text"
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </motion.div> */}
        </motion.div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 flex flex-col items-center gap-2"
          style={{ animation: 'floatDown 2.5s ease-in-out infinite' }}
        >
          <span
            className="text-[9px] tracking-[0.25em] uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Scroll
          </span>
          <div
            className="w-px h-9"
            style={{ background: 'linear-gradient(to bottom, var(--teal), transparent)' }}
          />
        </div>
      </section>

      {/* ─── STATS STRIP ───────────────────────────────────── */}
      <section
        className="py-10"
        style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)' }}
      >
        <div className="wrap">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {content.statsStrip.map((s, i) => {
              const Icon = HOME_ICON_MAP[s.icon] || DEFAULT_HOME_ICON
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(49,178,222,0.08)',
                      border:     '1px solid rgba(49,178,222,0.18)',
                    }}
                  >
                    <Icon size={18} style={{ color: 'var(--teal)' }} />
                  </div>
                  <div>
                    <div className="text-xl font-bold grad-text">{s.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── BROWSE AREAS ──────────────────────────────────── */}
      {areaStats === null || areaStats.length > 0 ? (
        <section className="section">
          <div className="wrap">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <p className="eyebrow mb-3">Discover Communities</p>
              <h2 className="heading-lg mb-4">
                Explore <span className="grad-text">Prime Areas</span>
              </h2>
              <p className="max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
                Find luxury villas, waterfront apartments and investment opportunities in Dubai's most desirable locations.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {areaStats === null
                ? Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-[76px] rounded-2xl" />)
                : areaStats.map((area, i) => (
                    <motion.div
                      key={area.area}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <AreaCard area={area} />
                    </motion.div>
                  ))
              }
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── COMMUNITIES (compact — full guides live at /communities) ── */}
      {communities.length > 0 && (
        <section className="pb-16">
          <div className="wrap">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Layers size={15} style={{ color: 'var(--teal)' }} /> Popular Communities
              </h3>
              <Link href="/communities" className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--teal)' }}>
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {communities.map(c => (
                <Link
                  key={c._id}
                  href={`/communities/${c.slug}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}
                >
                  <MapPin size={12} style={{ color: 'var(--teal)', opacity: 0.7 }} />
                  {c.name}
                  {c.area && <span style={{ color: 'var(--text-muted)' }}>· {c.area}</span>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURED PROPERTIES ───────────────────────────── */}
      <section className="section section-alt">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12 flex-wrap gap-4"
          >
            <div>
              <p className="eyebrow mb-3">Handpicked</p>
              <h2 className="heading-lg mb-3">
                Featured <span className="grad-text">Properties</span>
              </h2>
              <p className="muted">Exceptional listings selected by our property specialists</p>
            </div>
            <Link href="/buyer/properties?featured=true" className="btn-ghost btn-sm hidden md:flex">
              View All <ArrowRight size={14} />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featured.length > 0 ? featured : Array(6).fill(null)).map((p, i) => (
              <motion.div
                key={p?._id || i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <PropertyCard property={p} loading={!p} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PROJECTS (off-plan) ──────────────────── */}
      <FeaturedProjectsSection />

      {/* ─── WHY DISTRESS DEALS ────────────────────────────── */}
      <section className="section relative overflow-hidden">
        {/* Background glows */}
        <div
          className="absolute pointer-events-none"
          style={{ top: '-8%', right: '-4%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(49,178,222,0.06) 0%, transparent 70%)' }}
        />
        <div
          className="absolute pointer-events-none"
          style={{ bottom: '-5%', left: '-4%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(97,187,77,0.06) 0%, transparent 70%)' }}
        />

        <div className="wrap relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="eyebrow mb-3">Why Choose Us</p>
            <h2 className="heading-lg mb-4">
              Why <span className="grad-text">Distress Deals?</span>
            </h2>
            <p className="max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
              Dubai's most transparent, secure, and professionally managed real estate experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {content.whyCards.map((w, i) => (
              <motion.div
                key={w.title}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <WhyCard icon={w.icon} title={w.title} description={w.description} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────── */}
      <section className="section section-alt">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="eyebrow mb-3">Simple Process</p>
            <h2 className="heading-lg">
              How It <span className="grad-text">Works</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {[
              {
                label: 'For Buyers',
                steps: [
                  ['Search',         'Browse verified properties with advanced filters and real-time market data.'],
                  ['Express Interest','Submit a lead on your preferred property instantly.'],
                  ['We Arrange',     'Our team schedules viewings and manages the process end-to-end.'],
                  ['Close the Deal', 'Sign, transfer, and celebrate your new Dubai home.'],
                ],
              },
              {
                label: 'For Sellers',
                steps: [
                  ['Register & Verify',  'Create your account and verify identity via WhatsApp OTP.'],
                  ['List Your Property', 'Submit photos, details, and pricing for expert review.'],
                  ['Get Approved',       'Our team reviews and publishes your listing within 24 hours.'],
                  ['Track & Close',      'Monitor leads from your dashboard and close deals confidently.'],
                ],
              },
            ].map(({ label, steps }) => (
              <div key={label}>
                <div
                  className="badge badge-teal mb-8 text-xs tracking-wider uppercase"
                >
                  {label}
                </div>
                {steps.map(([t, d], i) => (
                  <motion.div
                    key={t}
                    initial={{ opacity: 0, x: label === 'For Buyers' ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-5 mb-7 last:mb-0"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'var(--grad)' }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div
                        className="font-semibold text-sm mb-1"
                        style={{ color: 'var(--text)' }}
                      >
                        {t}
                      </div>
                      <div
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {d}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MORTGAGE CALCULATOR ────────────────────────────── */}
      <MortgageSection />

      {/* ─── MARKET WATCH (news) ───────────────────────────── */}
      <MarketWatchSection />

      {/* ─── BLOG ───────────────────────────────────────────── */}
      <BlogSection />

      {/* ─── CTA BANNER ────────────────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl p-12 md:p-20 text-center overflow-hidden"
            style={{ background: 'var(--grad)' }}
          >
            {/* Decorative circles */}
            <div
              className="absolute pointer-events-none"
              style={{ top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}
            />
            <div
              className="absolute pointer-events-none"
              style={{ bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}
            />

            <h2
              className="heading-lg mb-5 relative z-10 text-white"
            >
              Ready to Find Your Perfect Property?
            </h2>
            <p
              className="mb-10 max-w-md mx-auto relative z-10 text-base leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.82)' }}
            >
              Join over 12,000 satisfied clients who found their dream home through Distress Deals Dubai.
            </p>
            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <Link
                href="/auth/register"
                onClick={() => trackCta('cta_get_started')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all duration-200"
                style={{
                  background:  '#fff',
                  color:       'var(--teal)',
                  boxShadow:   '0 4px 20px rgba(0,0,0,0.15)',
                }}
              >
                Get Started Free
              </Link>
              <Link
                href="/contact"
                onClick={() => trackCta('cta_talk_to_expert')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-medium transition-all duration-200"
                style={{
                  background:  'rgba(255,255,255,0.15)',
                  color:       '#fff',
                  border:      '1px solid rgba(255,255,255,0.30)',
                }}
              >
                Talk to an Expert
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
