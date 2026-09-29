'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import PhoneVerifyCard from '@/components/auth/PhoneVerifyCard'
import { useAuthStore, useAuthHydrated } from '@/store/authStore'

// Where every "List Property" / "Sell" button lands. It sends each visitor to the right place:
//  • not signed in            → seller registration
//  • verified seller          → seller dashboard
//  • staff                    → admin dashboard
//  • seller, number unverified → "verify your number" (SMS code) → seller dashboard
//  • buyer                    → verify the number, which also switches the account to selling → seller dashboard
export default function SellGatePage() {
  const router = useRouter()
  const hydrated = useAuthHydrated()
  const { user, isAuthenticated } = useAuthStore()

  const role = user?.role
  const isStaff = role === 'admin' || role === 'super_admin' || role === 'agent' || role === 'editor'
  const ready = hydrated && isAuthenticated && !!user && (role === 'buyer' || (role === 'seller' && !user.isPhoneVerified))

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || !user) router.replace('/seller/register')
    else if (isStaff) router.replace('/admin/dashboard')
    else if (role === 'seller' && user.isPhoneVerified) router.replace('/seller/listings')
  }, [hydrated, isAuthenticated, user, isStaff, role, router])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 wrap py-10 md:py-16">
        {!ready ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--teal)' }} /></div>
        ) : (
          <div className="max-w-xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>List your property</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {role === 'buyer'
                ? 'Verify your mobile number to switch to a seller account. Your saved properties and interests stay with you.'
                : 'One quick step before your seller dashboard opens.'}
            </p>
            <PhoneVerifyCard
              becomeSeller={role === 'buyer'}
              title={role === 'buyer' ? 'Verify your number to start selling' : undefined}
              onVerified={() => router.replace('/seller/listings')}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
