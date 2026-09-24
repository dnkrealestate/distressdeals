'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Building2, User as UserIcon,
  ShieldCheck, Star, MessageCircle,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/authStore'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import FacebookSignInButton from '@/components/auth/FacebookSignInButton'
import { Logo } from '@/components/shared/Logo'
import toast from 'react-hot-toast'

/* ─── PAGE ──────────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter()
  const registerUser = useAuthStore(s => s.register)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const goToRoleHome = () => {
    const role = useAuthStore.getState().user?.role
    router.push(
      role === 'editor' ? '/admin/settings'
      : role === 'admin' || role === 'super_admin' || role === 'agent' ? '/admin/dashboard'
      : role === 'seller' ? '/seller/listings'
      : '/buyer/properties'
    )
  }

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password, phone: data.phone || undefined })
      toast.success('Account created successfully!')
      goToRoleHome()
    } catch (err: any) {
      toast.error(err?.error || 'Failed to create account')
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
          <Logo href={null} variant="icon" boxed height={30} />
          <span className="font-bold text-lg text-white">Distress Deals</span>
        </div>

        <div className="relative z-10">
          <h2 className="heading-lg mb-5 text-white">Join Dubai's Smartest Property Platform</h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Create your free account to save properties, track leads, and get personalized recommendations.
          </p>
          <div className="space-y-4">
            {[
              { icon: Building2,   text: '2,400+ verified listings updated daily'  },
              { icon: ShieldCheck, text: 'Bank-grade security on every account'    },
              { icon: Star,        text: 'Personalized matches based on your taste' },
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

        <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.55)' }}>© 2025 Distress Deals UAE. RERA Licensed.</p>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">

          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Create Account</h1>
          <p className="muted mb-7">Join Distress Deals UAE in seconds</p>

          {/* Social login */}
          <div className="grid grid-cols-1 gap-2.5 mb-6">
            <GoogleSignInButton onAuthenticated={goToRoleHome} />
            <FacebookSignInButton onAuthenticated={goToRoleHome} />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or sign up with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Full Name</label>
              <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                <UserIcon size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                <input {...register('name', { required: 'Name is required' })}
                  type="text" className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                  placeholder="Your full name" />
              </div>
              {errors.name && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.name.message as string}</p>}
            </div>

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
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Phone (optional)</label>
              <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                <MessageCircle size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                <input {...register('phone')}
                  type="tel" className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                  placeholder="+971 5X XXX XXXX" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Password</label>
              <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                <Lock size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                <input {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                  type={showPw ? 'text' : 'password'}
                  className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                  placeholder="Create a password" />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.password.message as string}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Confirm Password</label>
              <div className="input-glass flex items-center gap-2 h-12 px-4 rounded-xl">
                <Lock size={15} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                <input {...register('confirmPassword', { required: 'Please confirm your password', validate: (v: string) => v === password || 'Passwords do not match' })}
                  type={showPw ? 'text' : 'password'}
                  className="bg-transparent flex-1 text-sm outline-none" style={{ color: 'var(--text)' }}
                  placeholder="Re-enter your password" />
              </div>
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>{errors.confirmPassword.message as string}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2 disabled:opacity-60">
              {loading
                ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Creating account…</span>
                : <><ArrowRight size={15} /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--teal)' }}>Sign in</Link>
          </p>
          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Want to sell properties?{' '}
            <Link href="/seller/register" className="font-semibold" style={{ color: 'var(--teal)' }}>Register as a Seller</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}