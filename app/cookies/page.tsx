import type { Metadata } from 'next'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { resolveSeo } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('cookies', {
    title: 'Cookie Policy | Distress Deals UAE',
    description: 'How Distress Deals UAE uses cookies, local storage, and analytics tools on our website.',
    path: '/cookies',
  })
}

const UPDATED = '23 September 2026'

export default function CookiesPage() {
  return (
    <div className="page">
      <Navbar />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <p className="eyebrow mb-3">Legal</p>
          <h1 className="heading-xl mb-3">Cookie Policy</h1>
          <p className="muted mb-10">Last updated: {UPDATED}</p>

          <div className="rich-content" style={{ color: 'var(--text-mid)' }}>
            <p>
              This policy explains how distressdealsuae.com uses cookies and similar browser storage
              technologies, and the choices available to you.
            </p>

            <h2 className="heading-md mt-10 mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files a website can store in your browser. Websites also commonly use
              similar technologies — such as <code>localStorage</code> — that work the same way but aren't
              technically cookies. We refer to both together in this policy.
            </p>

            <h2 className="heading-md mt-10 mb-4">2. What We Use</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Essential storage.</strong> We use your browser's local storage to keep you signed in
                and to remember your light/dark theme preference. This is strictly necessary for the site to
                function and cannot be disabled without logging you out.
              </li>
              <li>
                <strong>Analytics.</strong> Where enabled, we use Google Tag Manager to load analytics tools
                such as Google Analytics, which set cookies to help us understand aggregate traffic patterns —
                which pages are visited, how people arrive at the site, and general usage trends. These do not
                identify you by name.
              </li>
              <li>
                <strong>Marketing attribution.</strong> When you arrive via a marketing link, we may briefly
                store the campaign source (UTM parameters) so we can understand which channels bring visitors to
                the site. This is not used to identify you personally.
              </li>
            </ul>
            <p>We do not use cookies for third-party behavioral advertising or resell cookie data to advertisers.</p>

            <h2 className="heading-md mt-10 mb-4">3. Managing Cookies</h2>
            <p>
              Most browsers let you block or delete cookies through their settings. Because we rely on browser
              storage to keep you signed in, blocking it will sign you out and may prevent parts of the site
              (favourites, saved searches, chat) from working correctly. Blocking analytics cookies specifically
              does not affect core site functionality.
            </p>

            <h2 className="heading-md mt-10 mb-4">4. Changes to This Policy</h2>
            <p>We may update this policy as the tools we use change. The "Last updated" date above reflects the most recent revision.</p>

            <h2 className="heading-md mt-10 mb-4">5. Contact Us</h2>
            <p>
              Questions about this policy can be sent through our{' '}
              <a href="/contact" style={{ color: 'var(--teal)' }}>Contact page</a>. See also our{' '}
              <a href="/privacy" style={{ color: 'var(--teal)' }}>Privacy Policy</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
