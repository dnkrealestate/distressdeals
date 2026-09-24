'use client'

import { motion } from 'framer-motion'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import MortgageSection from '@/components/MortgageSection'
import RentalYieldSection from '@/components/RentalYieldSection'

export default function MortgagePageClient() {
  return (
    <div className="page overflow-x-hidden">
      <Navbar />

      <section className="relative pt-20 pb-8 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, var(--bg) 0%, var(--bg-alt) 60%, #EFF6FF 100%)' }} />
        <div className="wrap relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6"
            style={{ background: 'rgba(203,1,1,0.08)', border: '1px solid rgba(203,1,1,0.25)', borderRadius: 24, padding: '6px 16px' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--teal)', animation: 'pulseRing 2s infinite' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--teal)' }}>Financial Tools</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="heading-xl mb-6 max-w-2xl mx-auto">
            Dubai Mortgage &amp; <span className="grad-text">Rental Yield Calculator</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Estimate your mortgage payments and rental returns, then talk to our in-house team — not a third-party call center.
          </motion.p>
        </div>
      </section>

      <MortgageSection />
      <RentalYieldSection />

      <Footer />
    </div>
  )
}
