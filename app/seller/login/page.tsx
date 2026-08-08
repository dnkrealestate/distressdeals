'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Building2,
  ShieldCheck, TrendingUp, AlertTriangle,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

/* ─── PAGE ──────────────────────────────────────────────────── */
// Deliberately separate from /auth/login (the buyer/general login) — the
// same backend credentials work for any role, so this page's job is purely
// to look/feel like a seller-specific portal and to refuse entry (with a
// clear explanation, not a silent redirect) if the account that just
// authenticated isn't actually a seller.
export default function SellerLoginPage() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const logout = useAuthStore(s => s.logout)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [wrongAccount, setWrongAccount] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    setWrongAccount(false)
    try {
      await login(data.email, data.password)
      const role = useAuthStore.getState().user?.role
      if (role !== 'seller') {
        logout()
        setWrongAccount(true)
        return
      }
      toast.success('Welcome back!')
      router.push('/seller/listings')
    } catch (err: any) {
      toast.error(err?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'var(--grad)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: '#fff' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: '#fff' }} />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(255,255,255,0.20)', color: '#fff' }}>D</div>
          <span className="font-bold text-lg text-white">Distress Deals</span>
        </div>

        <div className="relative z-10">
          <div
            className="mb-6 text-xs tracking-widest uppercase inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
          >
            Seller Portal
          </div>
          <h2 className="heading-lg mb-5 text-white">Manage Your Listings with Confidence</h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Sign in to track leads, manage your properties, and see how buyers are responding — all in one place.
          </p>

          <div className="space-y-4">
            {[
              { icon: Building2,  text: 'Manage every listing from one dashboard' },
              { icon: TrendingUp, text: 'Track leads and buyer interest in real time' },
              { icon: ShieldCheck,text: 'Your account, verified and protected'      },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
                  <Icon size={14} />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.55)' }}>© 2025 Distress Deals Dubai. RERA Licensed.</p>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">

          {wrongAccount ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.25)' }}>
                <AlertTriangle size={24} style={{ color: '#FB7185' }} />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>This Isn't a Seller Account</h1>
              <p className="text-sm leading-relaxed mb-7" style={{ color: 'var(--text-muted)' }}>
                Those credentials are valid, but that account isn't registered to sell properties. Use the buyer sign-in instead, or register as a seller.
              </p>
              <div className="space-y-2.5">
                <Link href="/auth/login" className="btn-primary w-full justify-center">Go to Buyer Sign In</Link>
                <Link href="/seller/register" className="btn-outline w-full justify-center">Register as a Seller</Link>
              </div>
              <button onClick={() => setWrongAccount(false)} className="text-xs mt-6 font-semibold" style={{ color: 'var(--teal)' }}>
                Try a different account
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Seller Sign In</h1>
              <p className="muted mb-7">Access your seller dashboard</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Email Address</label>
                  <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                    <Mail size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                    <input {...register('email', { required: 'Email is required' })}
                      type="email" className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                      placeholder="your@email.com" />
                  </div>
                  {errors.email && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.email.message as string}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>Password</label>
                    <Link href="/auth/forgot-password" className="text-xs font-medium" style={{ color: 'var(--teal)' }}>Forgot password?</Link>
                  </div>
                  <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                    <Lock size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                    <input {...register('password', { required: 'Password is required' })}
                      type={showPw ? 'text' : 'password'}
                      className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                      placeholder="Enter your password" />
                    <button type="button" onClick={() => setShowPw(s => !s)} style={{ color: 'var(--text-muted)' }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.password.message as string}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2 disabled:opacity-60">
                  {loading
                    ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Signing in…</span>
                    : <><ArrowRight size={15} /> Sign In to Seller Portal</>}
                </button>
              </form>

              <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                Don't have a seller account?{' '}
                <Link href="/seller/register" className="font-semibold" style={{ color: 'var(--teal)' }}>Register as a Seller</Link>
              </p>
              <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Looking to buy instead?{' '}
                <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--teal)' }}>Buyer Sign In</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
