import type { ContentPageData } from '@/types'
import type { Faq } from '@/components/shared/FaqSection'

export const PAGE_KEY = 'distressed-apartments-dubai'

// Also the starting content of the admin editor for this page (Settings → page content) and the fallback if the saved
// version can't be loaded.
export const FALLBACK_CONTENT: ContentPageData = {
  pageKey: PAGE_KEY,
  heroEyebrow: 'Apartments',
  heroTitle: 'Distressed Apartments in Dubai: Below-Market Flats for Sale',
  heroIntro: 'Apartments are the most common kind of distress sale in Dubai. There are far more of them than villas, they change hands more often, and many are owned by investors who bought for rental income or a quick resale — so when an owner’s plans change, a well-priced apartment is usually the fastest way to raise cash. This guide explains why apartment owners sell below market, where these listings tend to appear, how to judge whether a discount is real, and how we check every unit before it goes live.',
  sections: [
    {
      heading: 'Why Apartment Owners Sell Below Market',
      body: 'A distressed apartment is not a damaged one. In almost every case the discount comes from the owner’s situation, not the property. These are the reasons we see most often:',
      cards: [
        { icon: 'Plane', title: 'Relocation', body: 'An owner moving abroad for work or family usually has a fixed date. Holding an empty unit from overseas means service charges, maintenance and tenant management at a distance, so many prefer a quick, clean sale.' },
        { icon: 'Banknote', title: 'Mortgage or cash-flow pressure', body: 'A rate change, a lost job or a vacancy that runs longer than planned can make monthly payments hard to carry. Selling below market is often cheaper than falling behind on the loan.' },
        { icon: 'Clock', title: 'Off-plan handover payments', body: 'Buyers of off-plan units sometimes face a large payment due at handover. Owners who cannot or do not want to pay it may sell their position or the finished unit at a discount.' },
        { icon: 'TrendingDown', title: 'Investors rebalancing', body: 'Portfolio investors sell one unit to fund another, to exit a building they no longer favour, or to take profit before a service-charge increase — and price for speed rather than the top of the market.' },
      ],
    },
    {
      heading: 'Where Distressed Apartments Appear',
      body: 'Below-market apartments turn up across the city, but they are most frequent in the communities with the largest stock of investor-owned units — places such as Jumeirah Village Circle, Dubai Marina, Business Bay, Jumeirah Lake Towers, Downtown Dubai, Dubai Sports City, Arjan and International City. More units means more owners, and more owners means more people whose plans change in any given month. Check the community guides linked below for what is listed in each one right now.',
    },
    {
      heading: 'How to Judge an Apartment Discount',
      cards: [
        { icon: 'FileSearch', title: 'Compare like with like', body: 'Compare the asking price with recent sales in the same building, on a similar floor, with the same view and layout. A “discount” against a different tower or a bigger unit means very little.' },
        { icon: 'Banknote', title: 'Count the yearly costs', body: 'Service charges differ widely between buildings. A cheaper unit with high annual charges can cost more over five years than a fairly priced one in a better-run building.' },
        { icon: 'FileCheck', title: 'Check the paperwork', body: 'Confirm the title deed, any mortgage that must be cleared before transfer, outstanding service charges, and whether a tenant has a lease that runs past the sale date.' },
        { icon: 'Eye', title: 'Ask why the price is low', body: 'A clear reason — relocation, a handover payment, a loan — is reassuring. A vague answer is a reason to look more closely at the unit and the building.' },
      ],
    },
    {
      heading: 'How We Check Every Apartment',
      body: 'Before an apartment goes live on Distress Deals UAE our team confirms the owner’s right to sell, checks the details against the title deed, and compares the price with recent sales so you can see the discount for yourself. When you enquire, one dedicated agent from our team handles everything — viewings, the offer, the Form F (MOU), clearances and the transfer at the Land Department trustee. There are no third-party brokers and no bidding war between agents.',
    },
  ],
  ctaTitle: 'Browse Verified Apartments for Sale',
  ctaBody: 'Every apartment is checked against its title deed and recent sales before it goes live.',
  ctaButtonLabel: 'View Apartments for Sale',
  ctaButtonHref: '/for-sale?type=apartment',
}

export const FAQS: Faq[] = [
  { q: 'What is a distressed apartment in Dubai?', a: 'An apartment offered below its usual market value because the owner needs to sell quickly — for example after a relocation, a change in their finances, or a large off-plan handover payment. The flat itself is usually in normal condition.' },
  { q: 'How big are discounts on distressed apartments?', a: 'It depends on the building, the unit and how urgent the sale is, so there is no fixed figure. The only reliable test is to compare the asking price with recent sales of similar units in the same building, which we show you before you make an offer.' },
  { q: 'Can foreigners buy distressed apartments in Dubai?', a: 'Yes. Buyers of any nationality can own property outright in Dubai’s designated freehold areas, which include most of the communities where distressed apartments are listed.' },
  { q: 'Can I buy a distressed apartment with a mortgage?', a: 'Yes, if the unit qualifies with your bank. Get a mortgage pre-approval first — a seller who needs a fast sale will favour a buyer who can show that financing is already in place.' },
  { q: 'What if the apartment has a tenant?', a: 'An existing lease stays valid after a sale. Check the lease end date and the rent before you buy, especially if you plan to live in the apartment yourself.' },
  { q: 'Are there extra costs when buying?', a: 'Yes — the Dubai Land Department transfer fee, the trustee office fee and, with a mortgage, bank and registration charges. Our guide to the cost of buying property in Dubai lists them all.' },
]
