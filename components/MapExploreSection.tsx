'use client'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Car, Eye, Layers, MapPin, Navigation, PenTool, Radius } from 'lucide-react'

const FEATURES = [
  { icon: PenTool,    label: 'Draw your own area' },
  { icon: Radius,     label: 'Radius search' },
  { icon: Car,        label: 'Drive-time search' },
  { icon: Navigation, label: 'Turn-by-turn directions' },
  { icon: Eye,        label: 'Street View' },
  { icon: Layers,     label: 'Price heat-map' },
]

// A stylised Dubai map (coast, roads, a drawn search area, a route and price pins) — the same look as the real
// map tool, so people know what they are about to open.
function MapIllustration({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 420 320" className="w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="mx-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0F1B33" /><stop offset="1" stopColor="#1C2D52" />
        </linearGradient>
        <linearGradient id="mx-brand" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#CB0101" /><stop offset="1" stopColor="#FD7147" />
        </linearGradient>
        <filter id="mx-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <rect width="420" height="320" fill="url(#mx-bg)" />

      {/* sea + coast */}
      <path d="M0 0 H165 C130 55 150 105 100 150 C62 185 28 215 0 260 Z" fill="#12335A" opacity="0.85" />
      <path d="M165 0 C130 55 150 105 100 150 C62 185 28 215 0 260" fill="none" stroke="#2C5A8F" strokeWidth="2" opacity="0.8" />

      {/* city blocks + parks */}
      {[[190, 20, 60, 34], [262, 14, 48, 40], [325, 22, 70, 30], [200, 70, 40, 44], [140, 190, 54, 40], [206, 236, 66, 44], [300, 250, 50, 40], [356, 232, 50, 56]].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill="#18294A" />
      ))}
      <rect x="248" y="206" width="54" height="34" rx="8" fill="#15413C" />
      <rect x="160" y="112" width="34" height="46" rx="8" fill="#15413C" />

      {/* streets */}
      {[[170, 62, 420, 62], [170, 118, 420, 118], [170, 178, 420, 178], [170, 226, 420, 226], [252, 0, 252, 320], [318, 0, 318, 320], [384, 0, 384, 320]].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2A3D66" strokeWidth="3" />
      ))}
      {/* main highway */}
      <path d="M110 300 C170 250 220 190 280 150 S380 60 420 40" fill="none" stroke="#3B5187" strokeWidth="9" strokeLinecap="round" />
      <path d="M110 300 C170 250 220 190 280 150 S380 60 420 40" fill="none" stroke="#6C86C4" strokeWidth="1" strokeDasharray="6 6" />

      {/* drawn search area */}
      <polygon points="232,54 340,72 366,146 300,184 226,142" fill="rgba(253,113,71,0.14)" stroke="#FD7147" strokeWidth="2" strokeDasharray="7 5" />
      {[[232, 54], [340, 72], [366, 146], [300, 184], [226, 142]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4.5" fill="#fff" stroke="#FD7147" strokeWidth="2" />
      ))}

      {/* route A → property */}
      <path d="M92 262 C140 236 168 196 226 168 S318 150 338 108" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M92 262 C140 236 168 196 226 168 S318 150 338 108" fill="none" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

      {/* start marker A */}
      <circle cx="92" cy="262" r="13" fill="#1D4ED8" stroke="#fff" strokeWidth="3" />
      <text x="92" y="266.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">A</text>

      {/* price pins */}
      {[
        { x: 268, y: 96,  t: '2.4M',   fill: 'url(#mx-brand)', c: '#fff' },
        { x: 210, y: 92,  t: '65K/yr', fill: '#fff',           c: '#CB0101' },
        { x: 320, y: 196, t: '18.5M',  fill: '#fff',           c: '#CB0101' },
        { x: 372, y: 178, t: '750K',   fill: 'url(#mx-brand)', c: '#fff' },
      ].map(p => (
        <g key={p.t} transform={`translate(${p.x} ${p.y})`} filter="url(#mx-shadow)">
          <rect x="-26" y="-12" width="52" height="24" rx="12" fill={p.fill} />
          <text x="0" y="4.5" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={p.c}>{p.t}</text>
        </g>
      ))}

      {/* the selected property, with a pulsing ring */}
      <g transform="translate(338 108)">
        <circle r="18" fill="#FD7147" opacity="0.28">
          {animate && <animate attributeName="r" values="14;30;14" dur="2.4s" repeatCount="indefinite" />}
          {animate && <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />}
        </circle>
        <g filter="url(#mx-shadow)">
          <rect x="-30" y="-14" width="60" height="28" rx="14" fill="#0B1220" stroke="#fff" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#fff">★ 4.2M</text>
        </g>
      </g>
    </svg>
  )
}

// Home page showcase for the map search tool — deliberately loud, since it is the fastest way to find a home.
export default function MapExploreSection({ onCta }: { onCta?: () => void }) {
  const reduce = useReducedMotion()

  return (
    <section className="py-12 md:py-16">
      <div className="wrap">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative grid md:grid-cols-2 rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0B1220 0%, #16223F 100%)', boxShadow: '0 24px 60px -24px rgba(203,1,1,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* brand glow */}
          <div className="absolute pointer-events-none" style={{ top: -120, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,113,71,0.30), transparent 70%)' }} />

          {/* ── Copy ── */}
          <div className="relative z-10 p-7 md:p-10 lg:p-12 flex flex-col justify-center">
            <span
              className="self-start inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-4"
              style={{ background: 'var(--grad)', color: '#fff' }}
            >
              <MapPin size={12} /> Map search
            </span>

            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-white">
              Explore UAE <span className="grad-text">on the map</span>
            </h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
              See every property as a price pin. Draw the area you want, search by how long the drive is from work or school,
              and get the road route to any home — all on one map.
            </p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <Icon size={13} style={{ color: '#FD7147' }} /> {label}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/map-search"
                onClick={onCta}
                className="group inline-flex items-center gap-2 h-12 px-6 rounded-full text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: 'var(--grad)', boxShadow: '0 10px 28px -8px rgba(203,1,1,0.65)' }}
              >
                Open Map Search
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/map-search?listingType=rent"
                onClick={onCta}
                className="inline-flex items-center gap-2 h-12 px-5 rounded-full text-sm font-semibold transition-colors"
                style={{ color: '#fff', border: '1.5px solid rgba(255,255,255,0.28)' }}
              >
                Rentals on the map
              </Link>
            </div>
          </div>

          {/* ── Map preview (clickable) ── */}
          <Link href="/map-search" onClick={onCta} aria-label="Open the map search" className="relative block min-h-[240px] md:min-h-[360px]">
            <div className="absolute inset-0"><MapIllustration animate={!reduce} /></div>
            <div className="absolute inset-y-0 left-0 w-16 pointer-events-none hidden md:block" style={{ background: 'linear-gradient(90deg, #12203D, transparent)' }} />

            {/* floating "drive time" card */}
            <motion.div
              animate={reduce ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-4 bottom-4 md:left-6 md:bottom-6 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
              style={{ background: 'rgba(255,255,255,0.96)', boxShadow: '0 12px 30px -8px rgba(0,0,0,0.5)' }}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
                <Car size={17} className="text-white" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-extrabold" style={{ color: '#0B1220' }}>16 min · 15 km</span>
                <span className="block text-[11px]" style={{ color: '#5B6478' }}>drive from Dubai Marina</span>
              </span>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
