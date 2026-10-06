import type { ContentPageData } from '@/types'
import type { Faq } from '@/components/shared/FaqSection'

export const PAGE_KEY = 'dubai-property-auctions'

export const FALLBACK_CONTENT: ContentPageData = {
  pageKey: PAGE_KEY,
  heroEyebrow: 'Auctions',
  heroTitle: 'Dubai Property Auctions: How They Work',
  heroIntro: "Property auctions are one route to buying below market in Dubai, alongside negotiated distress sales. They aren't the same thing, and they don't carry the same level of buyer protection. This page explains how auctions actually work, the real risks involved, and why most of our buyers end up choosing a verified, negotiated distress sale instead.",
  sections: [
    {
      heading: 'Types of Property Auctions in Dubai',
      cards: [
        { title: 'Bank / mortgagee auctions', body: "When a mortgaged owner defaults, the lender can apply to the Dubai courts to auction the property to recover the outstanding loan. These are run through the Dubai Land Department's official auction platform." },
        { title: 'Court-ordered auctions', body: 'Properties tied up in a legal dispute — an inheritance case, a commercial judgment, or a partnership dissolution — can be sold by court order through the same official process.' },
        { title: 'Developer inventory auctions', body: 'Developers occasionally auction unsold inventory in a completed project to clear stock, sometimes at a meaningful discount to the original launch price.' },
      ],
    },
    {
      heading: 'The Real Risks of Buying at Auction',
      cards: [
        { icon: 'Clock', title: 'Limited due-diligence time', body: "Auction properties are typically viewable for a short, fixed window before the sale. There often isn't time for a full independent inspection or to resolve open questions before you're expected to bid." },
        { icon: 'AlertTriangle', title: 'Undisclosed liens or arrears', body: "A property going to auction because of default can carry unpaid service charges or other claims that transfer with the property. These aren't always fully disclosed upfront, and unwinding them after the fact is your problem, not the seller's." },
        { icon: 'Gavel', title: 'Full payment, tight timelines', body: 'Most auctions require a deposit at the time of bidding and full settlement within a short, fixed period — financing (mortgage approval) rarely fits that timeline, which is why most auction buyers are cash buyers.' },
        { icon: 'ShieldCheck', title: '"As-is" condition, no recourse', body: "Auction sales are final and sold as-is. If the property needs work you didn't know about, there's generally no negotiating room or recourse after the hammer falls." },
      ],
    },
    {
      heading: 'Auction vs. a Negotiated Distress Sale',
      body: "A negotiated distress sale — the kind we specialize in — gives you most of the same pricing upside as an auction, with none of the compressed timeline or as-is risk. You get a proper viewing period, an independent inspection if you want one, verified title and service-charge status before you commit, and a single dedicated agent managing the negotiation and paperwork on your behalf. The trade-off is that a negotiated sale can take a little longer to close than an auction's fixed timeline — for most buyers, that extra time is a fair price for the reduced risk.",
      cards: [],
    },
  ],
  ctaTitle: 'Skip the Auction Risk',
  ctaBody: 'Browse verified below-market listings with full title and service-charge checks already done.',
  ctaButtonLabel: 'Read the Distress Sale Guide',
  ctaButtonHref: '/distress-sale-dubai',
}

// Shown under the page with FAQPage markup.
export const FAQS: Faq[] = [
  { q: 'How do property auctions work in Dubai?', a: 'Registered bidders compete for a property at a set time, and the highest bid above the reserve price wins. The winning bidder usually has to pay a deposit straight away and complete the purchase within a fixed period.' },
  { q: 'Is an auction better than a negotiated distress sale?', a: 'Not always. An auction can be fast, but you often have little time to inspect the property or check its history, and competition can push the price up. A negotiated distress sale gives you time to compare prices and check the paperwork.' },
  { q: 'Can I view a property before an auction?', a: 'Sometimes, but viewing windows are often short and some properties are sold without a viewing. Read the auction terms carefully before you register to bid.' },
  { q: 'What costs come with buying at auction?', a: 'Expect the usual Land Department transfer and registration costs, plus any fees set by the auction organiser. Check the full cost before you bid.' },
  { q: 'Where can I find below-market property without bidding?', a: 'On our distress sale listings — verified properties priced below market by owners who need a quick sale, where you negotiate directly through one dedicated agent.' },
]
