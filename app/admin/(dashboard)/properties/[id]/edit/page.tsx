'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2 } from 'lucide-react'
import { propertyAPI } from '@/lib/api'
import PropertyForm from '@/components/shared/PropertyForm'
import type { Property } from '@/types'
import toast from 'react-hot-toast'

export default function AdminPropertyEditPage() {
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
      <header className="flex items-center gap-3 px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} className="btn-ghost btn-sm gap-2">
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Complete Listing</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Fill in the remaining details from the seller's submission before it can be approved
          </p>
        </div>
      </header>

      <div className="p-7">
        <PropertyForm property={property} onSuccess={() => router.push('/admin/properties')} />
      </div>
    </div>
  )
}
