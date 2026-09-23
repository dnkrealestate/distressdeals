import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '@/lib/api'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login:    (email: string, password: string) => Promise<void>
  googleLogin: (token: string, role?: string) => Promise<void>
  facebookLogin: (accessToken: string, role?: string) => Promise<void>
  register: (data: any) => Promise<void>
  // Sets a password on an account with none yet (from an "I'm interested" submission) and signs straight in.
  claimAccount: (claimToken: string, password: string) => Promise<void>
  // WhatsApp-code-verified password reset — signs straight in on success.
  resetPasswordWithOtp: (phone: string, otp: string, password: string) => Promise<void>
  logout:   () => void
  setUser:  (user: User) => void
  fetchMe:  () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        const res = await authAPI.login({ email, password })
        const { token, user } = res.data.data
        localStorage.setItem('luxestate_token', token)
        set({ user, token, isAuthenticated: true, isLoading: false })
      },

      googleLogin: async (googleToken, role) => {
        set({ isLoading: true })
        const res = await authAPI.googleAuth(googleToken, role)
        const { token, user } = res.data.data
        localStorage.setItem('luxestate_token', token)
        set({ user, token, isAuthenticated: true, isLoading: false })
      },

      facebookLogin: async (accessToken, role) => {
        set({ isLoading: true })
        const res = await authAPI.facebookAuth(accessToken, role)
        const { token, user } = res.data.data
        localStorage.setItem('luxestate_token', token)
        set({ user, token, isAuthenticated: true, isLoading: false })
      },

      register: async (data) => {
        set({ isLoading: true })
        const res = await authAPI.register(data)
        const { token, user } = res.data.data
        localStorage.setItem('luxestate_token', token)
        set({ user, token, isAuthenticated: true, isLoading: false })
      },

      claimAccount: async (claimToken, password) => {
        set({ isLoading: true })
        const res = await authAPI.claimAccount(claimToken, password)
        const { token, user } = res.data.data
        localStorage.setItem('luxestate_token', token)
        set({ user, token, isAuthenticated: true, isLoading: false })
      },

      resetPasswordWithOtp: async (phone, otp, password) => {
        set({ isLoading: true })
        const res = await authAPI.resetPasswordWithOtp(phone, otp, password)
        const { token, user } = res.data.data
        localStorage.setItem('luxestate_token', token)
        set({ user, token, isAuthenticated: true, isLoading: false })
      },

      logout: () => {
        localStorage.removeItem('luxestate_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user }),

      fetchMe: async () => {
        try {
          const res = await authAPI.getMe()
          set({ user: res.data.data, isAuthenticated: true })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'luxestate-auth',
      partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
)