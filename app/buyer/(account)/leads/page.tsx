'use client'
import MyInterests from '@/components/buyer/MyInterests'

export default function BuyerLeadsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-md mb-1">My <span className="grad-text">Interests</span></h1>
        <p className="muted">Every property and project you’ve asked about, and where each one stands.</p>
      </div>
      <MyInterests />
    </div>
  )
}
