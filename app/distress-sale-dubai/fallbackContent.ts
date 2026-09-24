import type { ContentPageData } from '@/types'

export const PAGE_KEY = 'distress-sale-dubai'

// Also the seed data for this page's ContentPage row (see backend/src/seeds/contentPages.ts) — and the
// resilience fallback if that row is ever missing or the fetch fails.
export const FALLBACK_CONTENT: ContentPageData = {
  pageKey: PAGE_KEY,
  heroEyebrow: 'The Distress Sale Guide',
  heroTitle: 'Distress Sale Dubai: The Complete Guide',
  heroIntro: 'A "distress sale" in Dubai’s property market means a property being sold below its normal market value because the seller needs to close the transaction quickly — not because there’s necessarily anything wrong with the property itself. This guide explains what drives a genuine distress sale, what kind of discount is realistic, how to tell a real one from an overpriced listing wearing the label, and how our process protects buyers on both counts.',
  sections: [
    {
      heading: 'Why Dubai Owners Sell Below Market',
      body: 'Dubai’s property market moves fast, and so do the lives of the people who own property in it. The reasons below account for the large majority of genuine distress listings we see:',
      cards: [
        { title: 'Relocation deadlines', body: 'An owner accepting a new job abroad, or an expat contract ending, often needs to close a sale within weeks rather than months — and will price accordingly to guarantee a fast close.' },
        { title: 'Developer payment plan pressure', body: 'Off-plan buyers who took on a payment plan and then faced a change in circumstances sometimes need to exit before the next instalment is due, creating urgency that shows up in the asking price.' },
        { title: 'Divorce or inheritance settlements', body: 'A property being divided between parties as part of a settlement is frequently sold quickly to close out the matter, rather than held out for the highest possible offer.' },
        { title: 'Investor portfolio rebalancing', body: 'Investors holding several units sometimes need to free up capital quickly — for a new purchase, a business need, or to meet a margin call — and price one property to move fast.' },
        { title: 'Vacant, non-performing units', body: 'A property sitting empty is a carrying cost (service charges, mortgage, no rental income). Owners of long-vacant units are often motivated to accept a lower offer over continuing to carry it.' },
      ],
    },
    {
      heading: 'What Discount Should You Expect?',
      body: 'There’s no fixed percentage — a genuine distress sale’s discount depends on how urgently the seller needs to close, and on how far the asking price already was from fair value. Market commentary on Dubai distress sales commonly cites discounts anywhere from the high single digits up to around 20-30% below comparable listings for the most time-pressured sellers, but treat any number you read (including this one) as a general indication, not a guarantee for a specific property. The only reliable way to know if a discount is real is to compare the asking price against actual recent transactions for similar units nearby — which is exactly what our team does before a listing goes live on the platform.',
      cards: [],
    },
    {
      heading: 'How to Verify a Distress Sale Is Genuine',
      cards: [
        { icon: 'FileSearch', title: 'Confirm the title deed', body: 'Every genuine sale traces back to a title deed registered with the Dubai Land Department. We verify ownership before a listing goes live — never take a seller’s word alone.' },
        { icon: 'TrendingDown', title: 'Compare against real transactions', body: 'A genuine distress price sits meaningfully below recent comparable sales in the same building or community, not just below the seller’s own asking-price fantasy. We check DLD transaction data, not just other listings.' },
        { icon: 'ShieldCheck', title: 'Check for liens and service charge arrears', body: 'A property can be genuinely distressed and still have unresolved debts attached to it. We confirm no-objection status and outstanding service charges before a buyer commits.' },
        { icon: 'Users2', title: 'Work through one accountable agent', body: 'A single dedicated agent manages the enquiry, the paperwork, and the negotiation — instead of you chasing multiple intermediaries with conflicting information.' },
      ],
    },
    {
      heading: 'How Our Process Works',
      cards: [
        { title: 'Verified sourcing', body: 'Our team sources and verifies distress listings against title deeds and DLD transaction data before they go live.' },
        { title: 'One dedicated agent', body: 'You submit interest on a listing and are connected with one dedicated agent — not a pool of competing agents.' },
        { title: 'Managed negotiation', body: 'Your agent manages viewings, negotiation, and paperwork on your behalf, end to end.' },
        { title: 'Transparent close', body: 'You close with full visibility into the numbers that justified the discount, not just a seller’s claim.' },
      ],
    },
  ],
  ctaTitle: "See Today's Verified Distress Listings",
  ctaBody: 'Browse below-market villas and apartments across Dubai, checked against title deeds and comparable sales.',
  ctaButtonLabel: 'Browse Distress Listings',
  ctaButtonHref: '/for-sale',
}
