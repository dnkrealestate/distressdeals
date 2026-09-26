// Vercel Analytics custom events for every lead the site captures. Format (one event per submission):
//   track(`Contact form submitted /contact`, { track: `name: …, phone: …, email: …, Page :/contact` })
// Called only after the backend accepted the lead, so failed/invalid submits aren't counted.
import { track } from '@vercel/analytics'

export function trackLead(
  event: string,
  lead: { name?: string; phone?: string; email?: string; extra?: Record<string, string | number | undefined> },
) {
  try {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    const extra = Object.entries(lead.extra || {})
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `,\n          ${k}: ${v}`)
      .join('')
    // Vercel caps event names and property values at 255 characters.
    track(`${event} ${pathname}`.slice(0, 255), {
      track: `name: ${lead.name || ''},
          phone: ${lead.phone || ''},
          email: ${lead.email || ''}${extra},
          Page :${pathname}`.slice(0, 255),
    })
  } catch {
    // Analytics must never break a form.
  }
}
