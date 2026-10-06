import type { ContentPageData } from '@/types'
import type { Faq } from '@/components/shared/FaqSection'

export const PAGE_KEY = 'sell-property-fast-dubai'

export const FALLBACK_CONTENT: ContentPageData = {
  pageKey: PAGE_KEY,
  heroEyebrow: 'For Sellers',
  heroTitle: 'Need to Sell Your Dubai Property Fast?',
  heroIntro: "Relocating for work, managing a divorce settlement, facing a payment plan deadline, or just need to free up cash quickly — whatever the reason, a fast sale doesn't have to mean an uninformed one. Here's exactly how our process works, what it costs, and what you'll need to have ready.",
  sections: [
    {
      heading: 'How It Works',
      cards: [
        { icon: 'FileCheck', title: '1. Tell us about your property', body: "Share the property details and your timeline through the form below. There's no cost or obligation at this stage." },
        { icon: 'Banknote', title: '2. Get a realistic price range', body: "Your assigned agent reviews recent comparable sales in your building/community and gives you an honest range — including what speed of sale each price point is likely to achieve." },
        { icon: 'Handshake', title: '3. We manage buyer interest', body: 'Once listed, every enquiry is filtered and qualified by your agent before it reaches you — no unqualified viewings, no wasted time.' },
        { icon: 'Clock', title: '4. Close on your timeline', body: "Your agent coordinates the paperwork, NOC, and transfer process end to end, working to the deadline you've told us matters." },
      ],
    },
    {
      heading: 'The Speed-vs-Price Trade-off',
      body: "Be honest with yourself about your timeline. A price that would sell in 4-6 weeks is usually different from one that sells in 3-4 months — your agent will show you both ends of that range so you can choose consciously, rather than discovering the trade-off after the listing has been live for a month with no offers.",
      cards: [],
    },
    {
      heading: "Documents You'll Need",
      body: "Your agent will confirm exactly what applies to your situation — not every document is needed for every sale.",
      cards: [
        { title: 'Original title deed', body: '' },
        { title: 'Passport and Emirates ID copies', body: '' },
        { title: 'Mortgage clearance letter, if the property is financed', body: '' },
        { title: 'Ejari (tenancy contract registration), if currently tenanted', body: '' },
        { title: 'No-objection certificate (NOC) request from the developer', body: '' },
      ],
    },
  ],
}

// Shown under the page with FAQPage markup.
export const FAQS: Faq[] = [
  { q: 'How can I sell my Dubai property quickly?', a: 'Price it realistically against recent sales from the start, have your title deed and service-charge statement ready, and list it with a team that verifies the property and presents it to ready buyers.' },
  { q: 'How long does it take to sell a property in Dubai?', a: 'It depends on the price, location and type of property. A well-priced property with clean paperwork sells much faster than one priced above recent sales.' },
  { q: 'What documents do I need to sell?', a: 'Your title deed, Emirates ID or passport, a service-charge clearance from the developer, and — if there is a mortgage — a liability letter from your bank.' },
  { q: 'Can I sell a property that still has a mortgage?', a: 'Yes. The outstanding loan is paid off from the sale proceeds at transfer, and the bank releases the mortgage at the Land Department trustee office.' },
  { q: 'Do you buy properties directly?', a: 'We do not buy properties ourselves. We verify your listing, price it with you and market it to buyers looking for fast, fair deals, with one agent handling the sale from start to finish.' },
]
