'use client'
import { useRouter } from 'next/navigation'
import SellerListingForm from '@/components/shared/SellerListingForm'

export default function NewListingPage() {
  const router = useRouter()

  return (
    <div>
      <header className="px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Add New Listing</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Submit a property for our team to review and publish</p>
      </header>

      <div className="p-7">
        <SellerListingForm onSuccess={id => router.push(`/seller/listings/${id}`)} />
      </div>
    </div>
  )
}
