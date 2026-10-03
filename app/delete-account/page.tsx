import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import DeleteAccountForm from './DeleteAccountForm'

// Public "delete your account" page — the web address Google Play and the App Store ask for. It explains, without
// signing in, how to delete an account and exactly what is removed; signed-in visitors can delete right here.
export const metadata: Metadata = {
  title: 'Delete Your Account',
  description: 'How to delete your Distress Deals UAE account and the personal data linked to it — in the app, on the website, or by email.',
  alternates: { canonical: '/delete-account' },
}

export default function DeleteAccountPage() {
  return (
    <div className="page">
      <Navbar />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <p className="eyebrow mb-3">Your data</p>
          <h1 className="heading-xl mb-3">Delete your account</h1>
          <p className="muted mb-8">Distress Deals UAE — website and mobile app</p>

          <div className="rich-content" style={{ color: 'var(--text-mid)' }}>
            <p>You can delete your Distress Deals UAE account, and the personal data linked to it, at any time. It is free and takes effect immediately.</p>

            <h2>How to delete your account</h2>
            <ol>
              <li><strong>In the mobile app:</strong> open <em>Profile</em>, scroll to the bottom and tap <em>Delete my account</em>.</li>
              <li><strong>On this website:</strong> sign in and use the form below.</li>
              <li><strong>By email:</strong> write to <a href="mailto:distressdealsuae2026@gmail.com?subject=Delete%20my%20account">distressdealsuae2026@gmail.com</a> from the email address on your account. We delete it within 7 days.</li>
            </ol>

            <h2>What is deleted</h2>
            <ul>
              <li>Your name, email address, phone number and profile photo</li>
              <li>Your password and any Google or Facebook sign-in link</li>
              <li>Saved properties, saved searches and comparisons</li>
              <li>Notifications, reviews you wrote, and your devices’ push-notification registration</li>
              <li>Your contact details on enquiries you made</li>
            </ul>

            <h2>What happens to the rest</h2>
            <ul>
              <li>Your property listings are taken off the site.</li>
              <li>Bare enquiry, listing and meeting records — with no personal details — are kept where UAE law or our accounting duties require it, for up to 5 years, and then removed.</li>
            </ul>

            <p>Deleting an account cannot be undone. You are welcome to register again later with the same email or phone number.</p>
          </div>

          <DeleteAccountForm />

          <p className="text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
            See also our <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  )
}
