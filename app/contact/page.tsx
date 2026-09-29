import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, Clock, Handshake, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { COMPANY_PHONE_DISPLAY, telHref, whatsappHref } from '@/lib/contact'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import ContactForm from '@/components/ContactForm'
import { resolveSeo } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return resolveSeo('contact', {
    title: 'Contact Us | Distress Deals UAE',
    description: 'Talk to the Distress Deals UAE team — questions about buying, selling, renting or a specific listing. Call, WhatsApp or send us a message.',
    path: '/contact',
  })
}

export default function ContactPage() {
  const channels = [
    { href: telHref, icon: Phone, label: 'Call us', value: COMPANY_PHONE_DISPLAY, hint: 'Speak to our team directly', tint: 'rgba(203,1,1,0.10)', color: 'var(--teal)', external: false },
    { href: whatsappHref('Hi, I have a question about a property on Distress Deals UAE.'), icon: MessageCircle, label: 'WhatsApp', value: COMPANY_PHONE_DISPLAY, hint: 'Quick answers, photos & viewings', tint: 'rgba(37,211,102,0.12)', color: '#16A34A', external: true },
  ]
  return (
    <div className="page">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden style={{ background: 'radial-gradient(ellipse at 10% 0%, rgba(203,1,1,0.12), transparent 55%), radial-gradient(ellipse at 95% 30%, rgba(253,113,71,0.12), transparent 50%), var(--bg)' }} />
        <div className="wrap relative pt-12 pb-10 md:pt-16 md:pb-12 text-center">
          <p className="eyebrow mb-3">Get in touch</p>
          <h1 className="heading-xl mb-4">How can we help?</h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-mid)' }}>
            Buying, selling, renting or asking about a listing — our in-house team answers every message itself.
            No third-party agents, no call centres.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
          {/* Ways to reach us */}
          <div className="space-y-4 lg:sticky lg:top-24">
            {channels.map(c => (
              <a key={c.label} href={c.href} {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="group flex items-center gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: c.tint }}>
                  <c.icon size={21} style={{ color: c.color }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{c.label}</span>
                  <span className="block text-base font-bold" style={{ color: 'var(--text)' }}>{c.value}</span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.hint}</span>
                </span>
                <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: 'var(--text-muted)' }} />
              </a>
            ))}

            <div className="rounded-2xl p-5 space-y-3.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {[
                { icon: Clock, t: 'Quick replies', d: 'Messages are answered by email, usually within one business day.' },
                { icon: MapPin, t: 'Based in Dubai', d: 'Covering verified listings and new projects across the UAE.' },
                { icon: Handshake, t: 'Direct, no middlemen', d: 'Listings come straight from owners and developers.' },
                { icon: ShieldCheck, t: 'Your details stay private', d: 'We only use them to answer your enquiry.' },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
                    <Icon size={16} style={{ color: 'var(--teal)' }} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'var(--grad)' }}>
              <BadgeCheck size={28} color="#fff" className="flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Want to sell your property?</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>List it directly and reach serious buyers.</p>
              </div>
              <Link href="/sell" className="text-xs font-bold px-3.5 py-2 rounded-xl flex-shrink-0" style={{ background: '#fff', color: 'var(--teal)' }}>List now</Link>
            </div>
          </div>

          {/* Message form */}
          <div className="rounded-3xl p-6 md:p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 20px 50px -30px rgba(15,23,42,0.35)' }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Send us a message</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Tell us what you&apos;re looking for and our team will get back to you.</p>
            <ContactForm source="contact_form" />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
