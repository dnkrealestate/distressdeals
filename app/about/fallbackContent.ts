import type { ContentPageData } from '@/types'

export const PAGE_KEY = 'about'

// Default About content — editable in Admin → Settings → About Page (the editor starts from what's saved there).
// Built around what makes the portal different: owners and developers list directly, buyers deal directly, and our
// own in-house team handles every deal — no chain of third-party agents or brokers.
export const FALLBACK_CONTENT: ContentPageData = {
  pageKey: PAGE_KEY,
  heroEyebrow: 'About Distress Deals UAE',
  heroTitle: 'Buy direct. Sell direct. No third-party agents.',
  heroIntro: 'Distress Deals UAE is a property platform where owners and developers list directly and buyers deal directly — with our own in-house team handling every step, instead of a chain of outside agents and brokers. Every listing is checked before it goes live, so you see genuine properties at real prices across the UAE.',
  stats: [],
  sections: [
    {
      heading: 'Why buy and sell with us',
      body: 'Most property portals are marketplaces of competing agents re-posting the same homes. We work differently.',
      cards: [
        { icon: 'Home', title: 'Buy direct', body: 'Deal on properties listed by their owners and on new projects straight from the developers — at the real asking price, without middlemen adding their margin.' },
        { icon: 'Handshake', title: 'Sell direct', body: 'List your property yourself and reach serious, verified buyers. Our team handles viewings, offers and paperwork for you.' },
        { icon: 'Users2', title: 'No third-party agents', body: 'There is no chain of outside brokers between you and the property — just one in-house team that works for the deal, not a commission race.' },
        { icon: 'ShieldCheck', title: 'Verified listings', body: 'Our quality control team checks the owner or developer, location, price and details of every listing before it is published.' },
        { icon: 'Users', title: 'One team, start to finish', body: 'The same Distress Deals specialist handles your enquiry from the first message to the keys — no hand-offs, no repeating yourself.' },
        { icon: 'TrendingDown', title: 'Real distress deals', body: 'We focus on motivated sellers and genuine price drops, so you see real opportunities instead of inflated asking prices.' },
      ],
    },
    {
      heading: 'Conscience at heart',
      body: 'Everything at DNK revolves around, and is rooted in, conscience. It is not a slogan we use lightly — it is something we strive to live every day. It is our moral compass, and it guides us towards building a local and global community of conscientious leaders of tomorrow.\n\nConscience asks us to be honest, transparent and straightforward in everything we do, and we hold to that every single time. Our culture comes from the friendship between our founders — a friendship built on trust, confidence and commitment — and those values run through the way we work.\n\nThat same conscience is why we built Distress Deals UAE. Too much of the property market runs on fake listings, bait prices and inflated valuations — the same apartment posted by many agents at many different prices. We set out to fix that: verified listings, real prices and honest market value, direct from owners and developers, with one trustworthy team handling every deal.\n\nWe keep raising our own standards and refuse to become complacent. The best ideas often come from the simplest experiences, so our people are encouraged to speak up and bring new ideas that keep improving how we serve our clients.',
    },
    {
      heading: 'Meet the founders',
      body: 'The friendship and shared values behind Distress Deals UAE.',
      cards: [
        { title: 'Waseem Khursheed', meta: 'Founder & CEO', body: 'Waseem leads the company’s vision and strategy, with one goal: a UAE property market where buyers see real prices and deal with people they can trust.' },
        { title: 'Dann Leslie', meta: 'Co-Founder & Managing Director', body: 'Dann leads day-to-day operations and the team that handles every deal, making sure each client gets honest advice and a smooth, transparent process.' },
      ],
    },
    {
      heading: 'How buying works',
      cards: [
        { icon: 'FileSearch', meta: 'Step 1', title: 'Find the right property', body: 'Search verified homes, distress deals and new projects by area, price, bedrooms or on the map.' },
        { icon: 'Handshake', meta: 'Step 2', title: 'Send an enquiry', body: 'Tap “Interested” — no sign-up needed. Your dedicated specialist gets back to you quickly.' },
        { icon: 'Eye', meta: 'Step 3', title: 'View and agree the price', body: 'We arrange viewings in person or by video, and negotiate directly with the owner or developer.' },
        { icon: 'FileCheck', meta: 'Step 4', title: 'Transfer and move in', body: 'We manage the paperwork through to the Land Department transfer and the handover of the keys.' },
      ],
    },
    {
      heading: 'How selling works',
      cards: [
        { icon: 'Building2', meta: 'Step 1', title: 'List your property', body: 'Add your property in minutes — photos, price and details — from the website or the app.' },
        { icon: 'ClipboardCheck', meta: 'Step 2', title: 'We verify and publish', body: 'Our team checks the listing and publishes it to buyers looking for exactly what you have.' },
        { icon: 'Users', meta: 'Step 3', title: 'Meet serious buyers', body: 'We handle the enquiries and viewings, so you only spend time with genuine, qualified buyers.' },
        { icon: 'Banknote', meta: 'Step 4', title: 'Close the deal', body: 'We guide the offer, clearances and transfer until the sale is complete.' },
      ],
    },
    {
      heading: 'Our mission',
      body: 'To make buying and selling property in the UAE simple, direct and honest — verified information, real prices and one dedicated team, instead of a crowded market of agents.',
      cards: [
        { icon: 'Target', title: 'Direct deals', body: 'Owners, developers and buyers dealing directly, with our team making it smooth and safe.' },
        { icon: 'Eye', title: 'Full transparency', body: 'Every listing verified and every detail shown — permits, payment plans and handover dates included.' },
        { icon: 'Heart', title: 'People first', body: 'Your goals drive every recommendation we make — not commissions.' },
        { icon: 'Globe2', title: 'Across the UAE', body: 'Dubai first, with verified listings and new projects across all seven emirates.' },
      ],
    },
  ],
  ctaTitle: 'Ready to buy or sell directly?',
  ctaBody: 'Browse verified properties and new projects, or list your own — our team is ready to help.',
  ctaButtonLabel: 'Browse properties',
  ctaButtonHref: '/for-sale',
}
