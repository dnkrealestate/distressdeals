'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const ALLOWED_ROLES = ['admin', 'super_admin', 'agent']

interface FormValues { email: string; password: string }

export default function AdminLoginPage() {
  const router = useRouter()
  const { login, logout } = useAuthStore()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>()

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      const role = useAuthStore.getState().user?.role
      if (!role || !ALLOWED_ROLES.includes(role)) {
        logout()
        toast.error('This login is for staff accounts only.')
        return
      }
      toast.success('Welcome back!')
      router.push('/admin/dashboard')
    } catch (err: any) {
      toast.error(err?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--grad)' }}
          >
            <ShieldCheck size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Centralized Control</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Staff &amp; agent sign-in</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Email</label>
            <div className="input-glass">
              <Mail size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="bg-transparent outline-none flex-1 text-sm"
                placeholder="you@distressdeals.ae"
                {...register('email', { required: true })}
              />
            </div>
            {errors.email && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Email is required</p>}
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Password</label>
            <div className="input-glass">
              <Lock size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPw ? 'text' : 'password'}
                className="bg-transparent outline-none flex-1 text-sm"
                placeholder="••••••••"
                {...register('password', { required: true })}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ color: 'var(--text-muted)' }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Password is required</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2 disabled:opacity-60">
            {loading ? 'Signing in…' : <>Sign In <ArrowRight size={14} /></>}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Buyer or seller? <Link href="/auth/login" className="font-medium" style={{ color: 'var(--teal)' }}>Sign in here</Link>
        </p>
      </div>
    </div>
  )
}
