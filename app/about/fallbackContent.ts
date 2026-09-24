import type { ContentPageData } from '@/types'

export const PAGE_KEY = 'about'

export const FALLBACK_CONTENT: ContentPageData = {
  pageKey: PAGE_KEY,
  heroEyebrow: 'About Distress Deals',
  heroTitle: 'About Distress Deals UAE',
  heroIntro: "We're Dubai's most transparent real estate platform — connecting buyers, sellers, and investors with verified properties, managed deals, and zero hidden surprises.",
  stats: [
    { value: '12,000+', label: 'Happy Clients' },
    { value: '2,400+', label: 'Active Listings' },
    { value: '850+', label: 'Deals Closed' },
    { value: '7', label: 'Emirates Covered' },
  ],
  sections: [
    {
      heading: 'Our Mission &amp; Vision',
      cards: [
        { icon: 'Target', title: 'Our Mission', body: 'To make Dubai real estate radically transparent — giving every buyer, seller, and investor the verified information and expert support they need to make confident decisions.' },
        { icon: 'Eye', title: 'Our Vision', body: 'To become the most trusted name in UAE real estate, where every transaction is fair, every listing is genuine, and every client feels truly represented.' },
      ],
    },
    {
      heading: 'Our Core Values',
      cards: [
        { icon: 'ShieldCheck', title: 'Transparency', body: 'Every listing verified, every fee disclosed. No hidden surprises, ever.' },
        { icon: 'Heart', title: 'Client First', body: 'Your goals drive every recommendation we make — not commissions.' },
        { icon: 'TrendingUp', title: 'Market Insight', body: 'Real-time data and on-ground expertise across all seven Emirates.' },
        { icon: 'Award', title: 'Excellence', body: 'RERA-licensed specialists held to the highest professional standards.' },
      ],
    },
    {
      heading: 'Milestones That Define Us',
      cards: [
        { meta: '2018', title: 'Founded in Dubai', body: 'Started as a small team of three with one mission — make Dubai real estate transparent.' },
        { meta: '2020', title: 'Digital Platform Launch', body: 'Launched our online platform, bringing verified listings to thousands of buyers.' },
        { meta: '2022', title: 'Pan-UAE Expansion', body: 'Extended coverage to all seven Emirates with dedicated local specialists.' },
        { meta: '2025', title: '12,000+ Clients Served', body: "Became one of Dubai's most trusted names in managed real estate transactions." },
      ],
    },
    {
      heading: 'Meet Our Leadership',
      body: 'A team of licensed specialists, market analysts, and client advocates working for you.',
      cards: [
        { meta: 'Founder & CEO', title: 'Ahmed Al Mansoori', body: '' },
        { meta: 'Head of Sales', title: 'Sarah Whitfield', body: '' },
        { meta: 'Head of Operations', title: 'Rohan Mehta', body: '' },
        { meta: 'Lead Property Advisor', title: 'Layla Hassan', body: '' },
      ],
    },
  ],
  ctaTitle: 'Ready to Work With Us?',
  ctaBody: "Whether you're buying, selling, or investing — our specialists are ready to help.",
  ctaButtonLabel: 'Browse Properties',
  ctaButtonHref: '/buyer/properties',
}
