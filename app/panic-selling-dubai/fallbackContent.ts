import type { ContentPageData } from '@/types'
import type { Faq } from '@/components/shared/FaqSection'

export const PAGE_KEY = 'panic-selling-dubai'

// Also the starting content of the admin editor for this page and the fallback if the saved version can't be loaded.
export const FALLBACK_CONTENT: ContentPageData = {
  pageKey: PAGE_KEY,
  heroEyebrow: 'Market Guide',
  heroTitle: 'Panic Selling in Dubai: What It Means for Buyers and Sellers',
  heroIntro: 'Panic selling is when property owners rush to sell because they fear prices are about to fall, or because bad news makes holding on feel risky — not because their own situation has changed. In any property market it creates two kinds of listings: genuine below-market opportunities, and properties priced too low by owners who would have done better to wait. This guide explains what drives panic selling in Dubai, how buyers can tell a real bargain from noise, and what owners should consider before they cut their price.',
  sections: [
    {
      heading: 'What Triggers Panic Selling',
      body: 'Panic selling is driven by expectations rather than need. The usual triggers are:',
      cards: [
        { icon: 'TrendingDown', title: 'Headlines about falling prices', body: 'Reports of a slowdown — or simply of prices rising more slowly — can persuade owners to sell before “it gets worse”, even when their own building is holding its value.' },
        { icon: 'Banknote', title: 'Interest rate changes', body: 'A rise in mortgage rates makes monthly payments heavier and worries owners on variable-rate loans, who may sell rather than wait to see where rates settle.' },
        { icon: 'Building2', title: 'New supply nearby', body: 'Large off-plan launches close to an existing building can make owners fear for resale demand and rental income, prompting early, discounted sales.' },
        { icon: 'Users', title: 'Herd behaviour', body: 'When several units in the same tower are listed at once, the owners who see them often cut their own price to stay ahead — and the discount spreads.' },
      ],
    },
    {
      heading: 'Panic Selling vs. a Distress Sale',
      body: 'The two are often confused, but they are different. A distress sale is driven by the owner’s own deadline — a relocation, a loan, a handover payment — and the discount reflects that need for speed. Panic selling is driven by fear of the market as a whole. For a buyer, both can produce below-market prices. The difference matters when negotiating: a distressed seller needs certainty and a quick completion; a panic seller mostly needs reassurance that the price is fair, and may withdraw the listing if the mood changes.',
    },
    {
      heading: 'For Buyers: Finding Real Value',
      cards: [
        { icon: 'FileSearch', title: 'Look at sold prices, not asking prices', body: 'When many owners cut prices at once, asking prices fall faster than what properties actually sell for. Compare with recent completed sales in the same building.' },
        { icon: 'ShieldCheck', title: 'Buy quality, not just a discount', body: 'Well-located, well-managed buildings tend to recover first. A large discount on a weak building can stay a weak investment.' },
        { icon: 'Banknote', title: 'Be ready to move', body: 'Panic-driven discounts can disappear quickly. Have your mortgage pre-approval or funds ready so you can make a firm offer.' },
      ],
    },
    {
      heading: 'For Owners: Before You Cut Your Price',
      body: 'If your own circumstances have not changed, ask whether you need to sell now. Compare your property with recent sales rather than with the cheapest listings in your building, and consider your rental income against your costs before deciding. If you do need to sell — for a real deadline — price it clearly and realistically from the start: a property listed at a fair, well-supported price usually sells faster, and for more, than one that is cut again and again. A free valuation from our team, based on recent comparable sales, is a good place to start.',
    },
  ],
  ctaTitle: 'Get a Free, Data-Based Valuation',
  ctaBody: 'Know what your property is really worth before you decide to sell.',
  ctaButtonLabel: 'Request a Free Valuation',
  ctaButtonHref: '/free-property-valuation-dubai',
}

export const FAQS: Faq[] = [
  { q: 'What is panic selling in real estate?', a: 'Selling a property in a hurry because of fear about where the market is heading — falling prices, rising interest rates, or new supply — rather than because the owner’s own situation requires it.' },
  { q: 'Is panic selling good for buyers?', a: 'It can be. Panic selling can bring properties to the market below their real value. The key is to compare asking prices with recent completed sales and to focus on good buildings in good locations.' },
  { q: 'How is panic selling different from a distress sale?', a: 'A distress sale is driven by the owner’s own deadline, such as a relocation or a mortgage problem. Panic selling is driven by fear of the wider market. Both can produce discounts, but distressed sellers usually need a fast, certain completion.' },
  { q: 'Should I sell my Dubai property if prices are falling?', a: 'Only if your circumstances require it or the numbers no longer work for you. Compare your property with recent sales, weigh rental income against costs, and get an independent valuation before deciding.' },
  { q: 'How can I sell quickly without underpricing?', a: 'Price clearly against recent comparable sales from the start, prepare your title deed and service-charge statement in advance, and list with a team that can verify the property and present it to ready buyers.' },
]
