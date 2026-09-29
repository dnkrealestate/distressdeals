'use client'
import Link from 'next/link'
import { Home, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

// A buyer who wants to list a property switches to a seller account through /sell: an SMS code to their mobile
// number proves it, and the same step turns the account into a seller account.
export default function BecomeSeller() {
  const { user } = useAuthStore()
  if (!user || user.role !== 'buyer') return null

  return (
    <div className="card p-6" style={{ background: 'linear-gradient(135deg, rgba(203,1,1,0.06), transparent)' }}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
          <Home size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Want to sell or rent out a property?</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Verify your mobile number to switch to a seller account. Your saved properties and interests stay with you.
          </p>
          <Link href="/sell" className="btn-primary btn-sm mt-4 inline-flex">Become a seller <ArrowRight size={13} /></Link>
        </div>
      </div>
    </div>
  )
}
