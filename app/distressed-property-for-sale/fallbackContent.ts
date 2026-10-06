import type { ContentPageData } from '@/types'
import type { Faq } from '@/components/shared/FaqSection'

export const PAGE_KEY = 'distressed-property-for-sale'

// Also the starting content of the admin editor for this page and the fallback if the saved version can't be loaded.
export const FALLBACK_CONTENT: ContentPageData = {
  pageKey: PAGE_KEY,
  heroEyebrow: 'Below-Market Property',
  heroTitle: 'Distressed Property for Sale in Dubai & the UAE',
  heroIntro: 'Distressed property is property for sale below its normal market value because the owner needs a quick sale. In Dubai and the other emirates that covers apartments, villas, townhouses, penthouses, off-plan units and plots, in established communities and new ones. This page brings together every kind of below-market property we list, explains what “distressed” really means here, and shows how to tell a genuine opportunity from a listing that only uses the word.',
  sections: [
    {
      heading: 'What “Distressed Property” Means in Dubai',
      body: 'In the UAE the term is about the seller’s circumstances, not the building. A distressed property is usually in normal condition; what makes it distressed is that the owner has a deadline. That could be a relocation date, a mortgage that has become hard to carry, an off-plan payment due at handover, a business that needs cash, or an estate being settled. Because the owner values speed and certainty over the last few percent of price, the property is offered below what a patient seller would ask.',
    },
    {
      heading: 'Types of Distressed Property We List',
      cards: [
        { icon: 'Building2', title: 'Apartments', body: 'Studios to four-bedroom flats in high-rise and mid-rise buildings — the largest share of distress sales, especially in investor-heavy communities.' },
        { icon: 'Home', title: 'Villas', body: 'Family homes where higher running costs and a smaller pool of buyers push time-pressured owners to price for a faster sale.' },
        { icon: 'Home', title: 'Townhouses', body: 'A middle ground between apartments and villas, popular with families and investors alike, in communities across Dubai.' },
        { icon: 'Clock', title: 'Off-plan resales', body: 'Units bought from a developer before completion, resold by owners who would rather sell than make the next instalment or handover payment.' },
        { icon: 'Ruler', title: 'Plots and land', body: 'Residential and commercial plots sold below market by owners who no longer plan to build.' },
        { icon: 'Award', title: 'Penthouses and luxury homes', body: 'High-value homes where even a small percentage discount is a large amount, and owners with portfolio or relocation reasons sell quietly.' },
      ],
    },
    {
      heading: 'Genuine Distress Sale or Just a Label?',
      body: 'Plenty of listings use the word “distress” without the price to match. A genuine distress sale has three things in common: a price clearly below recent sales of comparable properties in the same building or community, a clear reason for the seller’s timeline, and clean paperwork — a valid title deed, a known mortgage position, and service charges that are up to date or settled at transfer. If any of the three is missing, treat the label with caution. We check all three before a listing goes live, and show you the comparison so you can judge the discount yourself.',
    },
    {
      heading: 'Buying Distressed Property: The Steps',
      cards: [
        { icon: 'Banknote', meta: 'Step 1', title: 'Have your finance ready', body: 'Cash or a mortgage pre-approval. Distressed sellers choose the buyer who can complete quickly.' },
        { icon: 'FileSearch', meta: 'Step 2', title: 'Check the price and papers', body: 'Compare recent sales, confirm the title deed, the mortgage position and any service charges owed.' },
        { icon: 'Handshake', meta: 'Step 3', title: 'Agree terms and sign Form F', body: 'Agree price and dates, sign the Memorandum of Understanding and pay the agreed deposit.' },
        { icon: 'FileCheck', meta: 'Step 4', title: 'Clearances and transfer', body: 'The developer’s no-objection certificate, the bank release if there is a mortgage, and the transfer at a Land Department trustee office.' },
      ],
    },
  ],
  ctaTitle: 'See Every Verified Below-Market Property',
  ctaBody: 'Apartments, villas, townhouses and off-plan units — all checked before they go live.',
  ctaButtonLabel: 'Browse Property for Sale',
  ctaButtonHref: '/for-sale',
}

export const FAQS: Faq[] = [
  { q: 'Is distressed property in Dubai in bad condition?', a: 'Usually not. In Dubai “distressed” describes the seller’s situation — a deadline or financial pressure — rather than the state of the property. Still, always view the property and, for villas, consider an independent inspection.' },
  { q: 'Why would an owner sell below market value?', a: 'Common reasons are relocation, mortgage or cash-flow pressure, an off-plan handover payment, a business needing cash, or an estate being settled. In each case the owner values a quick, certain sale over the highest possible price.' },
  { q: 'How do I know the discount is real?', a: 'Compare the asking price with recent sales of similar properties in the same building or community. We show this comparison with each verified listing so you can see the difference yourself.' },
  { q: 'Do I pay extra fees for a distressed property?', a: 'The buying costs are the same as for any resale: the Dubai Land Department transfer fee, the trustee office fee, and bank charges if you use a mortgage. Buyers do not pay us a fee to enquire.' },
  { q: 'Can I sell my property as a distress sale?', a: 'Yes. List it with us, and our team verifies the details, prices it against recent sales and presents it to buyers who are looking for fast, fair deals. You can also start with a free valuation.' },
]
