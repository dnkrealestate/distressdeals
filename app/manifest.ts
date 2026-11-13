import type { MetadataRoute } from 'next'
import { ANDROID_PACKAGE } from '@/lib/appBanner'

// Web app manifest (/manifest.webmanifest). `related_applications` names our Android app, so Chrome on Android can
// tell the site whether it is installed (navigator.getInstalledRelatedApps — components/AppBanner.tsx hides the
// "Get the app" bar then). The app links back to this site in its own manifest (mobile/app.config.js asset_statements).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Distress Deals UAE',
    short_name: 'Distress Deals',
    description: 'Distress deals, new projects and rentals across the UAE.',
    start_url: '/',
    display: 'browser',
    background_color: '#F8FAFC',
    theme_color: '#CB0101',
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }],
    related_applications: [{ platform: 'play', id: ANDROID_PACKAGE, url: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}` }],
    prefer_related_applications: false,
  }
}
