'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { propertyAPI } from '@/lib/api'
import SellerListingForm from '@/components/shared/SellerListingForm'
import type { Property } from '@/types'
import toast from 'react-hot-toast'

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    propertyAPI.getOne(id)
      .then(r => { if (r.data.success) setProperty(r.data.data) })
      .catch(() => toast.error('Failed to load listing'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="p-7 space-y-4">{Array(3).fill(null).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
  }

  if (!property) {
    return (
      <div className="p-7 text-center py-24">
        <Building2 size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Listing not found</p>
      </div>
    )
  }

  return (
    <div>
      <header className="px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Edit Listing</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{property.title}</p>
      </header>

      <div className="p-7">
        <SellerListingForm property={property} onSuccess={pid => router.push(`/seller/listings/${pid}`)} />
      </div>
    </div>
  )
}
