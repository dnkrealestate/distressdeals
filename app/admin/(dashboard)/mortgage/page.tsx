'use client'
import { useState, useEffect, useCallback } from 'react'
import { Wallet, Trash2, Mail, Phone, Calendar } from 'lucide-react'
import { mortgageAPI } from '@/lib/api'
import { formatDate, formatPrice, cn } from '@/lib/utils'
import type { MortgageInquiry } from '@/types'
import toast from 'react-hot-toast'

const STATUS_TABS = ['new', 'contacted', 'closed'] as const

export default function AdminMortgagePage() {
  const [status, setStatus] = useState<typeof STATUS_TABS[number]>('new')
  const [inquiries, setInquiries] = useState<MortgageInquiry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    mortgageAPI.getAll({ status })
      .then(r => { if (r.data.success) setInquiries(r.data.data.data || []) })
      .catch(() => toast.error('Failed to load inquiries'))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { load() }, [load])

  const setInquiryStatus = async (id: string, next: string) => {
    try { await mortgageAPI.update(id, { status: next }); toast.success('Updated'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to update') }
  }

  const remove = async (inquiry: MortgageInquiry) => {
    if (!confirm(`Delete inquiry from "${inquiry.name}"?`)) return
    try { await mortgageAPI.delete(inquiry._id); toast.success('Deleted'); load() }
    catch (err: any) { toast.error(err?.error || 'Failed to delete') }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Mortgage Inquiries</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Pre-approval requests from the homepage calculator</p>
        </div>
      </header>

      <div className="p-7">
        <div className="flex items-center gap-1.5 mb-5">
          {STATUS_TABS.map(s => (
            <button
              key={s} onClick={() => setStatus(s)} className="btn-ghost btn-sm capitalize"
              style={status === s ? { color: 'var(--teal)', borderColor: 'rgba(49,178,222,0.40)', background: 'rgba(49,178,222,0.06)' } : undefined}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array(4).fill(null).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-16">
            <Wallet size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No {status} inquiries</p>
          </div>
        ) : (
          <div className="space-y-2">
            {inquiries.map(inquiry => (
              <div key={inquiry._id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{inquiry.name}</p>
                    <div className="flex items-center gap-4 text-xs mt-1.5 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                      <a href={`mailto:${inquiry.email}`} className="flex items-center gap-1.5 hover:opacity-80"><Mail size={11} />{inquiry.email}</a>
                      <a href={`tel:${inquiry.phone}`} className="flex items-center gap-1.5 hover:opacity-80"><Phone size={11} />{inquiry.phone}</a>
                      <span className="flex items-center gap-1.5"><Calendar size={11} />{formatDate(inquiry.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {STATUS_TABS.filter(s => s !== inquiry.status).map(s => (
                      <button key={s} onClick={() => setInquiryStatus(inquiry._id, s)} className="btn-ghost btn-sm capitalize" style={{ fontSize: 11 }}>
                        Mark {s}
                      </button>
                    ))}
                    <button onClick={() => remove(inquiry)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Property Price</p><p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{formatPrice(inquiry.propertyPrice)}</p></div>
                  <div><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Down Payment</p><p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{formatPrice(inquiry.downPayment)}</p></div>
                  <div><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Rate / Tenure</p><p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{inquiry.interestRate}% · {inquiry.tenureYears}y</p></div>
                  <div><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Est. Monthly</p><p className="text-sm font-bold grad-text">{formatPrice(Math.round(inquiry.monthlyPayment))}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
