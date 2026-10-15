'use client'
import { Fragment, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { currencyAPI } from '@/lib/api'
import { loadSaved, saveChoice, setActiveCurrency, useCurrencyStore } from '@/lib/currency'

// Picks the visitor's currency (their saved choice, else their country) and today's rates, then re-renders the page
// with prices converted. The first render is always AED so it matches the server's HTML. Staff and seller dashboards,
// sign-in and account forms keep AED.
const AED_ONLY = /^\/(admin|seller|auth)(\/|$)/
const RATES_KEY = 'dd_rates_v1'

export default function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'
  const { code, rates, set } = useCurrencyStore()
  const [renderKey, setRenderKey] = useState('AED')

  // Once: rates (cached for the day on this device) and the currency to use.
  useEffect(() => {
    let cached: any = null
    try { cached = JSON.parse(localStorage.getItem(RATES_KEY) || 'null') } catch { /* ignore */ }
    const fresh = cached?.at && Date.now() - cached.at < 6 * 60 * 60 * 1000
    if (cached?.rates) set({ rates: cached.rates, ratesDate: cached.ratesDate, source: cached.source })
    if (!fresh) {
      currencyAPI.rates().then(r => {
        const d = r.data?.data
        if (!d?.rates) return
        set({ rates: d.rates, ratesDate: d.ratesDate, source: d.source })
        try { localStorage.setItem(RATES_KEY, JSON.stringify({ at: Date.now(), rates: d.rates, ratesDate: d.ratesDate, source: d.source })) } catch { /* ignore */ }
      }).catch(() => {})
    }
    const saved = loadSaved()
    if (saved?.manual) { set({ code: saved.code, ready: true }); return }
    // First visit (or never chosen): from the visitor's country.
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return '' } })()
    currencyAPI.detect(tz, navigator.language).then(r => {
      const c = r.data?.data?.currency || 'AED'
      saveChoice({ code: c, manual: false })
      set({ code: c, ready: true })
    }).catch(() => set({ code: saved?.code || 'AED', ready: true }))
  }, [set])

  // The currency this page shows; when it changes, prices everywhere re-render.
  const allowed = !AED_ONLY.test(pathname)
  const rate = code !== 'AED' && rates?.[code] ? rates[code] : null
  const show = allowed && rate ? code : 'AED'
  useEffect(() => {
    setActiveCurrency(show === 'AED' ? { code: 'AED', rate: 1 } : { code: show, rate: rate! })
    setRenderKey(show)
  }, [show, rate])

  return <Fragment key={renderKey}>{children}</Fragment>
}
