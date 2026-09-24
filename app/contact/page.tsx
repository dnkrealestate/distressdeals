import type { Metadata } from 'next'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import { COMPANY_PHONE_DISPLAY, telHref, whatsappHref } from '@/lib/contact'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ContactForm from '@/components/ContactForm'
import { resolveSeo } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('contact', {
    title: 'Contact Us | Distress Deals UAE',
    description: 'Get in touch with Distress Deals UAE — questions about buying, selling, or a specific listing, answered by our team.',
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <a href={telHref} className="card p-4 flex items-center gap-3 hover:opacity-90">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                <Phone size={18} style={{ color: 'var(--teal)' }} />
              </span>
              <span>
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Call us</span>
                <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>{COMPANY_PHONE_DISPLAY}</span>
              </span>
            </a>
            <a href={whatsappHref('Hi, I have a question about a property on Distress Deals UAE.')} target="_blank" rel="noopener noreferrer" className="card p-4 flex items-center gap-3 hover:opacity-90">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(22,163,74,0.10)' }}>
                <MessageCircle size={18} style={{ color: 'var(--green)' }} />
              </span>
              <span>
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>WhatsApp</span>
                <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>{COMPANY_PHONE_DISPLAY}</span>
              </span>
            </a>
          </div>

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
