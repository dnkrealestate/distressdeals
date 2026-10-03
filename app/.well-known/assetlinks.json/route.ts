import { NextResponse } from 'next/server'

// Android App Links: proves to Android that the Distress Deals app (com.distressdealsuae.app) may open
// distressdealsuae.com property links directly. The fingerprints are the app's signing certificates —
// Play Console → Test and release → App integrity → App signing → "SHA-256 certificate fingerprint" (add the upload
// key's too). Set them, comma-separated, in ANDROID_SHA256_FINGERPRINTS on the website host. Until then the file is
// an empty list and links simply open in the browser as before.
export const dynamic = 'force-dynamic'

export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS || '').split(',').map(s => s.trim().toUpperCase()).filter(s => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s))
  const body = fingerprints.length
    ? [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'com.distressdealsuae.app', sha256_cert_fingerprints: fingerprints } }]
    : []
  return NextResponse.json(body, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
