'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Target, Eye, Heart, Award, Users, Building2,
  ShieldCheck, TrendingUp, ArrowRight, Linkedin,
} from 'lucide-react'

import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'

/* ─── DATA ──────────────────────────────────────────────────── */
const VALUES = [
  { Icon: ShieldCheck, t: 'Transparency',  d: 'Every listing verified, every fee disclosed. No hidden surprises, ever.' },
  { Icon: Heart,       t: 'Client First',  d: 'Your goals drive every recommendation we make — not commissions.'        },
  { Icon: TrendingUp,  t: 'Market Insight',d: 'Real-time data and on-ground expertise across all seven Emirates.'       },
  { Icon: Award,       t: 'Excellence',    d: 'RERA-licensed specialists held to the highest professional standards.'   },
]

const STATS = [
  { v: '12,000+', l: 'Happy Clients'      },
  { v: '2,400+',  l: 'Active Listings'    },
  { v: '850+',    l: 'Deals Closed'       },
  { v: '7',       l: 'Emirates Covered'   },
]

const TIMELINE = [
  { year: '2018', t: 'Founded in Dubai',          d: 'Started as a small team of three with one mission — make Dubai real estate transparent.' },
  { year: '2020', t: 'Digital Platform Launch',   d: 'Launched our online platform, bringing verified listings to thousands of buyers.'        },
  { year: '2022', t: 'Pan-UAE Expansion',         d: 'Extended coverage to all seven Emirates with dedicated local specialists.'                },
  { year: '2025', t: '12,000+ Clients Served',    d: 'Became one of Dubai\'s most trusted names in managed real estate transactions.'           },
]

const TEAM = [
  { name: 'Ahmed Al Mansoori', role: 'Founder & CEO',          initials: 'AA' },
  { name: 'Sarah Whitfield',   role: 'Head of Sales',          initials: 'SW' },
  { name: 'Rohan Mehta',       role: 'Head of Operations',     initials: 'RM' },
  { name: 'Layla Hassan',      role: 'Lead Property Advisor',  initials: 'LH' },
]

/* ─── PAGE ──────────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <div className="page overflow-x-hidden">
      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }}
        />
        <div
          className="absolute pointer-events-none"
          style={{ top: '5%', right: '5%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(203,1,1,0.10) 0%, transparent 70%)' }}
        />
        <div
          className="absolute pointer-events-none"
          style={{ bottom: '0%', left: '0%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,113,71,0.08) 0%, transparent 70%)' }}
        />

        <div className="wrap relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6"
            style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.25)', borderRadius: 24, padding: '6px 16px' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--teal)', animation: 'pulseRing 2s infinite' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--teal)' }}>
              About Distress Deals
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="heading-xl mb-6 max-w-3xl mx-auto"
          >
            Building Trust, One{' '}
            <span className="grad-text">Property</span> at a Time
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            We're Dubai's most transparent real estate platform — connecting buyers, sellers, and
            investors with verified properties, managed deals, and zero hidden surprises.
          </motion.p>
        </div>
      </section>

      {/* ─── STATS STRIP ───────────────────────────────────── */}
      <section className="py-10" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
        <div className="wrap">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <div className="text-3xl font-extrabold grad-text mb-1">{s.v}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MISSION / VISION ──────────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { Icon: Target, t: 'Our Mission', d: 'To make Dubai real estate radically transparent — giving every buyer, seller, and investor the verified information and expert support they need to make confident decisions.' },
              { Icon: Eye,    t: 'Our Vision',  d: 'To become the most trusted name in UAE real estate, where every transaction is fair, every listing is genuine, and every client feels truly represented.' },
            ].map((item, i) => (
              <motion.div
                key={item.t}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-8 md:p-10"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(203,1,1,0.07)', border: '1px solid rgba(203,1,1,0.15)' }}
                >
                  <item.Icon size={26} style={{ color: 'var(--teal)' }} />
                </div>
                <h3 className="heading-md mb-4">{item.t}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUES ────────────────────────────────────────── */}
      <section className="section section-alt">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="eyebrow mb-3">What Drives Us</p>
            <h2 className="heading-lg mb-4">
              Our Core <span className="grad-text">Values</span>
            </h2>
            <p className="max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
              The principles that guide every interaction, every listing, and every deal we manage.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.t}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-7 group hover:border-[rgba(203,1,1,0.40)] transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: 'rgba(203,1,1,0.07)', border: '1px solid rgba(203,1,1,0.15)' }}
                >
                  <v.Icon size={20} style={{ color: 'var(--teal)' }} />
                </div>
                <h3 className="font-semibold text-sm mb-2.5" style={{ color: 'var(--text)' }}>{v.t}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{v.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TIMELINE ──────────────────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="eyebrow mb-3">Our Journey</p>
            <h2 className="heading-lg">
              Milestones That <span className="grad-text">Define Us</span>
            </h2>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            {TIMELINE.map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 pb-10 last:pb-0 relative"
              >
                {/* Connector line */}
                {i < TIMELINE.length - 1 && (
                  <div
                    className="absolute left-[27px] top-14 bottom-0 w-px"
                    style={{ background: 'var(--border)' }}
                  />
                )}

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-xs text-white"
                  style={{ background: 'var(--grad)' }}
                >
                  {item.year}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text)' }}>{item.t}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TEAM ──────────────────────────────────────────── */}
      <section className="section section-alt">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="eyebrow mb-3">The People Behind It</p>
            <h2 className="heading-lg mb-4">
              Meet Our <span className="grad-text">Leadership</span>
            </h2>
            <p className="max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
              A team of licensed specialists, market analysts, and client advocates working for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-6 text-center group hover:border-[rgba(203,1,1,0.40)] transition-all duration-300"
              >
                <div
                  className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-xl font-bold text-white transition-transform duration-300 group-hover:scale-105"
                  style={{ background: 'var(--grad)' }}
                >
                  {m.initials}
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{m.name}</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{m.role}</p>
                <a
                  href="#"
                  className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all duration-200"
                  style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--teal)'; el.style.borderColor = 'rgba(203,1,1,0.40)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--text-muted)'; el.style.borderColor = 'var(--border)' }}
                >
                  <Linkedin size={14} />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────── */}
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
            <div className="absolute pointer-events-none" style={{ top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div className="absolute pointer-events-none" style={{ bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

            <h2 className="heading-lg mb-5 relative z-10 text-white">
              Ready to Work With Us?
            </h2>
            <p className="mb-10 max-w-md mx-auto relative z-10 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
              Whether you're buying, selling, or investing — our specialists are ready to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <Link
                href="/buyer/properties"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all duration-200"
                style={{ background: '#fff', color: 'var(--teal)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              >
                Browse Properties <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-medium transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.30)' }}
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}