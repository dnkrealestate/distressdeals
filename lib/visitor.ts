// An anonymous id for this browser, so a guest's repeat visits count as one view (see backend utils/uniqueView).
// Random, not personal data; signed-in users are counted by their account instead.
const KEY = 'dd_vid'

export function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(KEY)
    if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return ''
  }
}
