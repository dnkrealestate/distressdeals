import type { ContentPageData } from '@/types'

export const PAGE_KEY = 'distressed-villas-dubai'

export const FALLBACK_CONTENT: ContentPageData = {
  pageKey: PAGE_KEY,
  heroEyebrow: 'Villas',
  heroTitle: 'Distress Sale of Villas in Dubai',
  heroIntro: 'Villas make up some of the most sought-after distress listings in Dubai — the combination of a larger, less liquid asset and genuinely time-pressured sellers means below-market villa deals appear across nearly every major community, from established family neighbourhoods to signature waterfront addresses. This page covers what drives villa-specific distress pricing, which communities see the most activity, and what to check before you commit to a standalone home.',
  sections: [
    {
      heading: 'Why Villas Are Different From Apartments',
      cards: [
        { icon: 'Banknote', title: 'Higher carrying costs', body: 'A standalone villa carries its own maintenance, pool, garden, and often higher service charges than an apartment of similar value — an empty or underused villa is expensive to hold, which pushes some owners toward a faster sale.' },
        { icon: 'Home', title: 'Larger, less liquid asset', body: 'Villas trade less frequently than apartments and take longer to sell at full price. An owner under time pressure has to discount more to attract a buyer within a specific window.' },
        { icon: 'Users2', title: 'Family circumstances change', body: 'Villas are typically family homes — a relocation, a change in family size, or a school-year deadline can all create a genuine, time-boxed reason to sell below the top of the market.' },
      ],
    },
    {
      heading: 'Where to Look: Villa Communities With Distress Activity',
      body: "Distress villa listings turn up across all of Dubai's villa communities, but these are the ones where we see the most consistent volume of genuine below-market activity:",
      cards: [
        { title: 'Arabian Ranches', body: 'Established, family-oriented villa community with mature landscaping and consistently strong resale demand.' },
        { title: 'Dubai Hills Estate', body: 'A large, still-developing master community — some early-phase villa owners sell to reposition into newer phases.' },
        { title: 'Emirates Hills', body: "Dubai's most prestigious villa address — even here, relocation and portfolio moves create occasional below-market opportunities." },
        { title: 'Jumeirah Golf Estates', body: 'Golf-course villas where course-facing plots carry a premium; non-facing units are where distress pricing shows up most.' },
        { title: 'Palm Jumeirah', body: 'Signature villas and beachfront homes — high carrying costs mean motivated sellers do appear, despite the address.' },
        { title: 'Jumeirah Park', body: 'Popular with families for its size and layout options; a steady source of resale and distress listings as tenancies turn over.' },
      ],
    },
    {
      heading: 'What to Check Before Buying a Distress Villa',
      cards: [
        { title: 'Structural and maintenance condition', body: 'An empty or under-maintained villa can have deferred issues an apartment simply doesn’t — roofing, pool equipment, landscaping, and AC systems all age and cost real money to bring back up to standard. Always get an independent inspection before you commit, even on a well-priced villa.' },
        { title: 'Community service charges', body: 'Villa communities vary widely in annual service charges per square foot. A villa priced below market can still carry an above-market service charge — factor the full annual cost, not just the purchase price, into your comparison.' },
        { title: 'Plot vs. built-up area, and any extensions', body: 'Unpermitted extensions or modifications can complicate a resale later. We confirm what’s actually registered with the developer/DLD against what’s been built before a villa listing goes live.' },
      ],
    },
  ],
  ctaTitle: 'Browse Verified Villas Below Market',
  ctaBody: 'Every villa listed is checked against title deeds and comparable sales before it goes live.',
  ctaButtonLabel: 'View Villas for Sale',
  ctaButtonHref: '/buyer/properties?type=villa',
}
