// The one number buyers call or WhatsApp — every public "Call" / "WhatsApp" button uses this, so it only ever changes
// here (the mobile app mirrors it in mobile/constants/contact.ts).
export const COMPANY_PHONE = '+971554854710'
export const COMPANY_PHONE_DISPLAY = '+971 55 485 4710'

export const telHref = `tel:${COMPANY_PHONE}`

export function whatsappHref(message?: string): string {
  const base = `https://wa.me/${COMPANY_PHONE.replace(/\D/g, '')}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
