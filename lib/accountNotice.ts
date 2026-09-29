// A suspended account is signed out on the spot (see Providers + lib/api.ts). The page reloads to the login screen,
// so the reason is parked in sessionStorage and shown once there by Providers.
const KEY = 'account_notice'

export function forceSignOut(message: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('luxestate_token')
    localStorage.removeItem('luxestate-auth')
    sessionStorage.setItem(KEY, message)
  } catch { /* storage blocked — still leave the page */ }
  window.location.href = '/auth/login'
}

export function takeAccountNotice(): string | null {
  try {
    const msg = sessionStorage.getItem(KEY)
    if (msg) sessionStorage.removeItem(KEY)
    return msg
  } catch { return null }
}
