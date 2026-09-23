'use client'
import { Mail, Phone, ShieldCheck, ShieldAlert, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import MyInterests from '@/components/buyer/MyInterests'
import RecentActivity from '@/components/buyer/RecentActivity'
import SellerListingsSummary from '@/components/seller/SellerListingsSummary'
import { getInitials, formatDate } from '@/lib/utils'

// A seller's own profile — and, because a seller can also be a buyer, everything they have expressed interest in.
export default function SellerProfilePage() {
  const { user } = useAuthStore()
  return (
    <div className="p-5 sm:p-7 max-w-3xl space-y-6">
      <div className="card p-6 flex items-center gap-5 flex-wrap">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
          {getInitials(user?.name || '')}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold truncate" style={{ color: 'var(--text)' }}>{user?.name}</h1>
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><Mail size={12} /> {user?.email}</span>
            <span className="flex items-center gap-1"><Phone size={12} /> {user?.phone || 'No number'}</span>
            <span className="flex items-center gap-1" style={{ color: user?.isPhoneVerified ? '#16A34A' : undefined }}>
              {user?.isPhoneVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              {user?.isPhoneVerified ? 'WhatsApp verified' : 'Number not verified'}
            </span>
            <span className="flex items-center gap-1"><User size={12} /> Seller · since {formatDate(user?.createdAt || '')}</span>
          </div>
        </div>
      </div>

      <SellerListingsSummary />

      <div>
        <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Properties &amp; projects I’m interested in</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>What you’ve asked about as a buyer — your agent can see this too.</p>
        <MyInterests />
      </div>

      <div>
        <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Recently viewed</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Properties you’ve opened on this device, most recent first.</p>
        <RecentActivity />
      </div>
    </div>
  )
}
