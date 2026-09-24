import type { Metadata } from 'next'
import { Mail, MessageCircle } from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ContactForm from '@/components/ContactForm'
import { resolveSeo } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('contact', {
    title: 'Contact Us | Distress Deals Dubai',
    description: 'Get in touch with Distress Deals Dubai — questions about buying, selling, or a specific listing, answered by our team.',
    path: '/contact',
  })
}

export default function ContactPage() {
  return (
    <div className="page">
      <Navbar />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <p className="eyebrow mb-3">Get in Touch</p>
          <h1 className="heading-xl mb-4">Contact Us</h1>
          <p className="muted mb-10">
            Have a question about a listing, your account, or how our process works? Send us a message and your
            assigned agent (or our team, if you don't have one yet) will get back to you.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-mid)' }}>
              <Mail size={16} style={{ color: 'var(--teal)' }} /> We reply by email, usually within one business day
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-mid)' }}>
              <MessageCircle size={16} style={{ color: 'var(--teal)' }} /> Already have an agent? They'll see this too
            </div>
          </div>

          <ContactForm source="contact_form" />
        </div>
      </section>
      <Footer />
    </div>
  )
}
