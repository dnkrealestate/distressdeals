'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, MessageCircle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// A buyer who wants to list a property switches to a seller account here. Selling needs a number we have actually
// reached, so it is gated on a code sent to that number on WhatsApp.
export default function BecomeSeller() {
  const { user, setUser } = useAuthStore()
  const router = useRouter()
  const [step, setStep] = useState<'intro' | 'phone' | 'code'>('intro')
  const [phone, setPhone] = useState(user?.phone || '')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user || user.role !== 'buyer') return null

  const sendCode = async () => {
    if (!phone.trim()) { toast.error('Enter your WhatsApp number'); return }
    setBusy(true)
    try {
      const res = await authAPI.sendSellerOtp(phone.trim())
      setPhone(res.data.data?.phone || phone)
      setStep('code')
      toast.success('Code sent — check WhatsApp')
    } catch (err: any) {
      toast.error(err?.error || err?.response?.data?.error || 'Could not send the code')
    } finally { setBusy(false) }
  }

  const verify = async () => {
    if (otp.trim().length < 6) { toast.error('Enter the 6-digit code'); return }
    setBusy(true)
    try {
      const res = await authAPI.verifySellerOtp(otp.trim())
      if (res.data.success) {
        setUser(res.data.data.user)
        toast.success('Your seller account is ready')
        router.push('/seller/listings')
      }
    } catch (err: any) {
      toast.error(err?.error || err?.response?.data?.error || 'That code is not right')
    } finally { setBusy(false) }
  }

  return (
    <div className="card p-6" style={{ background: 'linear-gradient(135deg, rgba(203,1,1,0.06), transparent)' }}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
          <Home size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Want to sell or rent out a property?</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Switch to a seller account with your WhatsApp number. Your saved properties and interests stay with you.
          </p>

          {step === 'intro' && (
            <button onClick={() => setStep('phone')} className="btn-primary btn-sm mt-4">Become a seller <ArrowRight size={13} /></button>
          )}

          {step === 'phone' && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2 max-w-md">
              <div className="input-glass flex items-center gap-2 flex-1">
                <MessageCircle size={14} style={{ color: '#25D366' }} />
                <input
                  className="bg-transparent outline-none flex-1 text-sm min-w-0"
                  placeholder="WhatsApp number, e.g. +971 50 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendCode()}
                  aria-label="WhatsApp number"
                />
              </div>
              <button onClick={sendCode} disabled={busy} className="btn-primary btn-sm justify-center">
                {busy ? <Loader2 size={13} className="animate-spin" /> : 'Send code'}
              </button>
            </div>
          )}

          {step === 'code' && (
            <div className="mt-4 max-w-md">
              <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-mid)' }}>
                <ShieldCheck size={13} style={{ color: '#16A34A' }} /> Enter the 6-digit code we sent to <strong>{phone}</strong> on WhatsApp
              </p>
              <div className="flex gap-2">
                <input
                  className="input flex-1 tracking-[0.4em] text-center font-semibold"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && verify()}
                  aria-label="Verification code"
                />
                <button onClick={verify} disabled={busy || otp.length < 6} className="btn-primary btn-sm">
                  {busy ? <Loader2 size={13} className="animate-spin" /> : 'Verify & switch'}
                </button>
              </div>
              <button onClick={() => { setStep('phone'); setOtp('') }} className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Use a different number or resend</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
