'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Percent } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

function SliderField({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>{label}</label>
        <span className="text-sm font-bold" style={{ color: 'var(--teal)' }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: 'var(--teal)' }}
      />
    </div>
  )
}

// ROI for a rental property, expressed as gross and net rental yield — the
// standard way Dubai investors compare one property against another.
export default function RentalYieldSection() {
  const [propertyPrice, setPropertyPrice] = useState(1_500_000)
  const [annualRent, setAnnualRent] = useState(105_000)
  const [serviceChargePct, setServiceChargePct] = useState(12)

  const { grossYield, netYield, netAnnualIncome, annualCosts } = useMemo(() => {
    const costs = annualRent * (serviceChargePct / 100)
    const netIncome = annualRent - costs
    return {
      grossYield: propertyPrice > 0 ? (annualRent / propertyPrice) * 100 : 0,
      netYield: propertyPrice > 0 ? (netIncome / propertyPrice) * 100 : 0,
      netAnnualIncome: netIncome,
      annualCosts: costs,
    }
  }, [propertyPrice, annualRent, serviceChargePct])

  return (
    <section className="section">
      <div className="wrap">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <p className="eyebrow mb-3">For Investors</p>
          <h2 className="heading-lg mb-4">
            Rental Yield <span className="grad-text">/ ROI Calculator</span>
          </h2>
          <p className="max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
            Estimate the real return on a rental property before you commit — gross and net yield, in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden max-w-4xl mx-auto"
          style={{ border: '1px solid var(--border)' }}
        >
          <div className="p-8 space-y-6" style={{ background: 'var(--surface)' }}>
            <SliderField
              label="Property Price" value={propertyPrice} onChange={setPropertyPrice}
              min={300_000} max={20_000_000} step={50_000} format={v => formatPrice(v)}
            />
            <SliderField
              label="Expected Annual Rent" value={annualRent} onChange={setAnnualRent}
              min={20_000} max={1_500_000} step={5_000} format={v => formatPrice(v)}
            />
            <SliderField
              label="Service Charges & Costs" value={serviceChargePct} onChange={setServiceChargePct}
              min={0} max={30} step={1} format={v => `${v}% of rent`}
            />
          </div>

          <div className="p-8 flex flex-col justify-center relative overflow-hidden" style={{ background: 'var(--grad)' }}>
            <div className="absolute pointer-events-none" style={{ top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} style={{ color: '#fff' }} />
                <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.85)' }}>Gross Rental Yield</span>
              </div>
              <p className="text-4xl font-extrabold text-white mb-8">{grossYield.toFixed(2)}<span className="text-base font-medium">% / yr</span></p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Net Yield (after costs)</span>
                  <span className="font-semibold text-white flex items-center gap-1"><Percent size={12} />{netYield.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Annual Costs</span>
                  <span className="font-semibold text-white">{formatPrice(Math.round(annualCosts))}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Net Annual Income</span>
                  <span className="font-semibold text-white">{formatPrice(Math.round(netAnnualIncome))}</span>
                </div>
              </div>

              <a href="#mortgage-calculator" className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                style={{ background: '#fff', color: 'var(--teal)' }}>
                <TrendingUp size={15} /> Talk to an Advisor
              </a>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Estimate only — actual returns depend on occupancy, market conditions, and property-specific costs.
        </p>
      </div>
    </section>
  )
}
