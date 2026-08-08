// First-touch attribution — captured once per browser session (sessionStorage,
// not localStorage) the moment a visitor lands via a tagged link, then
// attached to whatever lead they eventually submit. Doesn't overwrite an
// existing capture, so a mid-session internal link click doesn't erase the
// campaign that actually brought them in.

const STORAGE_KEY = 'dd_utm'

export interface UtmData {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

export function captureUtmParams() {
  if (typeof window === 'undefined') return
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return // already captured this session

    const params = new URLSearchParams(window.location.search)
    const data: UtmData = {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
    }
    if (data.utmSource || data.utmMedium || data.utmCampaign) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  } catch {
    // sessionStorage can throw in private-browsing contexts — not worth surfacing
  }
}

export function getStoredUtm(): UtmData {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
