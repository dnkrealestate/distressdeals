import type { ContentPageData } from '@/types'

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
