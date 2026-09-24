import type { Metadata } from 'next'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { resolveSeo } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('terms', {
    title: 'Terms of Service | Distress Deals Dubai',
    description: 'The terms that govern your use of the Distress Deals Dubai website and mobile app.',
    path: '/terms',
  })
}

const UPDATED = '23 September 2026'

export default function TermsPage() {
  return (
    <div className="page">
      <Navbar />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <p className="eyebrow mb-3">Legal</p>
          <h1 className="heading-xl mb-3">Terms of Service</h1>
          <p className="muted mb-10">Last updated: {UPDATED}</p>

          <div className="rich-content" style={{ color: 'var(--text-mid)' }}>
            <p>
              These Terms of Service ("Terms") govern your access to and use of distressdealsuae.com and the
              Distress Deals mobile app (together, the "Platform"), operated by Distress Deals Dubai ("we",
              "us"). By creating an account or otherwise using the Platform, you agree to these Terms.
            </p>

            <h2 className="heading-md mt-10 mb-4">1. What We Do</h2>
            <p>
              Distress Deals Dubai is a centralized real estate platform. When you express interest in a
              property or project, your enquiry is routed to one dedicated in-house agent who manages it from
              first message through to handover. We are not an open marketplace where multiple agents compete
              for the same buyer — every enquiry has a single point of contact on our side.
            </p>

            <h2 className="heading-md mt-10 mb-4">2. Accounts</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You must provide accurate, current information when creating an account and keep it up to date.</li>
              <li>You are responsible for safeguarding your password and for all activity under your account.</li>
              <li>An account may be created automatically on your behalf when you submit an enquiry using an email or phone number that isn't already registered — you'll be prompted to set a password to take ownership of it.</li>
              <li>Seller accounts require phone number verification via a one-time WhatsApp code before the account can list a property.</li>
              <li>We may suspend or terminate an account that provides false information, violates these Terms, or is used fraudulently.</li>
            </ul>

            <h2 className="heading-md mt-10 mb-4">3. Buyers</h2>
            <p>
              Submitting an enquiry connects you with your assigned agent, who will contact you to discuss the
              property or project. We do not charge buyers a fee to browse listings or submit enquiries. Prices,
              availability, and specifications shown on the Platform are supplied by sellers or developers and,
              while we review listings before publishing, are not guaranteed and should be independently
              verified before you commit to a transaction.
            </p>

            <h2 className="heading-md mt-10 mb-4">4. Sellers</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You confirm that you are the legal owner of the property, or are authorized to list it, and that all information and documents you provide are accurate and current.</li>
              <li>All listings are reviewed by our team before going live, and we may request changes or decline a listing that does not meet our guidelines.</li>
              <li>Buyer contact details are not shared with sellers directly — our team manages buyer communication and interest on your behalf, consistent with our centralized model.</li>
              <li>You may withdraw a listing at any time by contacting your assigned agent or through your seller dashboard.</li>
            </ul>

            <h2 className="heading-md mt-10 mb-4">5. Prohibited Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Post false, misleading, or duplicate listings, or misrepresent your identity or authority to sell.</li>
              <li>Use the Platform to harass, spam, or solicit users outside its intended purpose.</li>
              <li>Attempt to bypass our centralized-lead model by soliciting direct contact information from another user's assigned agent conversation for a purpose unrelated to that enquiry.</li>
              <li>Scrape, reverse-engineer, or interfere with the Platform's normal operation.</li>
            </ul>

            <h2 className="heading-md mt-10 mb-4">6. Intermediary Role &amp; Disclaimer</h2>
            <p>
              Distress Deals Dubai facilitates introductions between buyers, sellers, and our agents; we are not
              a party to any resulting sale, purchase, or lease agreement unless expressly stated in a separate
              written agreement. Any calculators, market estimates, or valuation tools on the Platform (including
              the mortgage and rental yield calculator) are provided for general guidance only and are not
              financial, legal, or professional advice. Always seek independent advice before making a property
              decision.
            </p>

            <h2 className="heading-md mt-10 mb-4">7. Intellectual Property</h2>
            <p>
              All content on the Platform — branding, design, text, and software — is owned by or licensed to
              Distress Deals Dubai and may not be copied or reused without permission, other than the property
              photos and details you submit as a seller, which you retain ownership of and grant us a license to
              display on the Platform for the purpose of marketing your listing.
            </p>

            <h2 className="heading-md mt-10 mb-4">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Distress Deals Dubai is not liable for indirect,
              incidental, or consequential damages arising from your use of the Platform, or from any
              transaction between users, beyond the extent of our own direct involvement.
            </p>

            <h2 className="heading-md mt-10 mb-4">9. Termination</h2>
            <p>
              We may suspend or terminate your access to the Platform at any time for conduct that violates
              these Terms or is otherwise harmful to other users or to us. You may close your account at any
              time by contacting us.
            </p>

            <h2 className="heading-md mt-10 mb-4">10. Governing Law</h2>
            <p>These Terms are governed by the laws of the United Arab Emirates, and any dispute arising from them falls under the jurisdiction of the courts of Dubai.</p>

            <h2 className="heading-md mt-10 mb-4">11. Changes to These Terms</h2>
            <p>We may update these Terms from time to time. The "Last updated" date above reflects the most recent revision; continued use of the Platform after a change constitutes acceptance of the revised Terms.</p>

            <h2 className="heading-md mt-10 mb-4">12. Contact Us</h2>
            <p>
              Questions about these Terms can be sent through our{' '}
              <a href="/contact" style={{ color: 'var(--teal)' }}>Contact page</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
