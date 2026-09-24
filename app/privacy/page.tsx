import type { Metadata } from 'next'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { resolveSeo } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('privacy', {
    title: 'Privacy Policy | Distress Deals Dubai',
    description: 'How Distress Deals Dubai collects, uses, and protects your personal information across our website and mobile app.',
    path: '/privacy',
  })
}

const UPDATED = '23 September 2026'

export default function PrivacyPage() {
  return (
    <div className="page">
      <Navbar />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <p className="eyebrow mb-3">Legal</p>
          <h1 className="heading-xl mb-3">Privacy Policy</h1>
          <p className="muted mb-10">Last updated: {UPDATED}</p>

          <div className="rich-content" style={{ color: 'var(--text-mid)' }}>
            <p>
              Distress Deals Dubai ("we", "us", "our") operates distressdealsuae.com and the Distress Deals
              mobile app (together, the "Platform"). This policy explains what personal information we collect,
              why we collect it, and the choices you have. By using the Platform, you agree to the collection
              and use of information as described here.
            </p>

            <h2 className="heading-md mt-10 mb-4">1. Information We Collect</h2>
            <p><strong>Account information.</strong> When you register, sign in with Google or Facebook, or submit an enquiry on a listing, we collect your name, email address, and phone number. A phone number is verified via a one-time WhatsApp code before certain account actions (such as switching to a seller account).</p>
            <p><strong>Enquiry and activity information.</strong> Properties and projects you view, favourite, or ask about, messages you exchange with your assigned agent, and any requirements or budget details you share with us.</p>
            <p><strong>Listing information (sellers).</strong> If you list a property, we collect the property details, photos, and documents you provide, plus your contact details so our team can manage the listing on your behalf.</p>
            <p><strong>Device and usage information.</strong> IP address, browser/device type, pages viewed, and — if you enable notifications on our mobile app — a device push token used solely to deliver notifications to that device.</p>
            <p><strong>Cookies and similar technologies.</strong> See our <a href="/cookies" style={{ color: 'var(--teal)' }}>Cookie Policy</a> for details on cookies, local storage, and analytics tools we use.</p>

            <h2 className="heading-md mt-10 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To create and manage your account, and to verify your identity where required.</li>
              <li>To connect you with the dedicated agent who manages your enquiry from first message to handover — our platform is centralized, so your enquiry is routed to one assigned agent rather than shown broadly to multiple sellers or agents.</li>
              <li>To respond to enquiries, schedule viewings, and process listing submissions.</li>
              <li>To send you service messages (account, security, listing status) and, where you have opted in, marketing or property-alert notifications by email, WhatsApp, or push notification.</li>
              <li>To detect fraud, enforce our <a href="/terms" style={{ color: 'var(--teal)' }}>Terms of Service</a>, and comply with legal obligations.</li>
              <li>To improve the Platform through aggregated, non-identifying analytics.</li>
            </ul>

            <h2 className="heading-md mt-10 mb-4">3. Who We Share Information With</h2>
            <p>We do not sell your personal information. We share it only with:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Your assigned agent</strong>, who needs your enquiry and contact details to assist you. Sellers only see a masked view of buyer interest, not raw buyer contact details, consistent with our centralized-lead model.</li>
              <li><strong>Service providers</strong> who process data on our behalf under contract — including cloud hosting and database infrastructure, image and file storage, email delivery, and WhatsApp Business messaging for OTP and notifications.</li>
              <li><strong>Authentication providers</strong> (Google, Facebook) if you choose to sign in using those services — they share only the profile fields you authorize.</li>
              <li><strong>Authorities</strong>, where required by UAE law or a valid legal request.</li>
            </ul>

            <h2 className="heading-md mt-10 mb-4">4. Data Security</h2>
            <p>
              We use industry-standard measures — encrypted connections, hashed passwords, and access-controlled
              infrastructure — to protect your information. No method of transmission or storage is 100% secure,
              and we cannot guarantee absolute security.
            </p>

            <h2 className="heading-md mt-10 mb-4">5. Data Retention</h2>
            <p>
              We retain account and enquiry information for as long as your account is active or as needed to
              provide our services, resolve disputes, and meet legal, accounting, or reporting obligations. You
              may request deletion of your account at any time (see Section 6).
            </p>

            <h2 className="heading-md mt-10 mb-4">6. Your Rights</h2>
            <p>You may, at any time:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Request a copy of the personal information we hold about you.</li>
              <li>Ask us to correct inaccurate information via your account settings.</li>
              <li>Ask us to delete your account and associated personal information, subject to any legal retention requirements.</li>
              <li>Opt out of marketing emails, WhatsApp messages, or push notifications at any time from your notification settings.</li>
            </ul>
            <p>To exercise any of these rights, contact us using the details in Section 9.</p>

            <h2 className="heading-md mt-10 mb-4">7. Children's Privacy</h2>
            <p>The Platform is intended for users aged 18 and over. We do not knowingly collect personal information from anyone under 18.</p>

            <h2 className="heading-md mt-10 mb-4">8. Changes to This Policy</h2>
            <p>We may update this policy from time to time. Material changes will be reflected by updating the "Last updated" date above; continued use of the Platform after a change constitutes acceptance of the revised policy.</p>

            <h2 className="heading-md mt-10 mb-4">9. Contact Us</h2>
            <p>
              Questions about this policy or your personal information can be sent through our{' '}
              <a href="/contact" style={{ color: 'var(--teal)' }}>Contact page</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
