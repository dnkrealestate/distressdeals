import type { ContentPageData } from '@/types'

export const PAGE_KEY = 'free-property-valuation-dubai'

export const FALLBACK_CONTENT: ContentPageData = {
  pageKey: PAGE_KEY,
  heroEyebrow: 'For Sellers',
  heroTitle: 'Get a Free Property Valuation',
  heroIntro: "Whether you're planning to sell now, considering it for later, or just want to know where you stand, an accurate valuation is the first real decision point. Pricing too high leaves a property sitting unsold for months; pricing too low leaves money on the table. Our team reviews your property against real, recent comparable sales — not just other sellers' asking prices — and gives you an honest range, free of charge and with no obligation to list.",
  sections: [
    {
      heading: 'What Goes Into Your Valuation',
      cards: [
        { icon: 'MapPin', title: 'Location & community', body: 'Building, community, and proximity to metro, schools, and key amenities all move price — even within the same development, view and position matter.' },
        { icon: 'Ruler', title: 'Size, layout & condition', body: 'Floor area, bedroom/bathroom count, layout efficiency, and how well-maintained the unit is compared to similar listings nearby.' },
        { icon: 'TrendingUp', title: 'Recent comparable sales', body: "What similar units have actually sold for in the last few months — not just what's currently listed, which tends to run higher than what actually closes." },
        { icon: 'ClipboardCheck', title: 'Current demand for your unit type', body: 'Some bedroom counts and layouts are moving faster than others right now in your specific building or community — this affects both price and expected time to sell.' },
      ],
    },
    {
      heading: 'How It Works',
      body: "Submit your property details below. Our team reviews comparable transactions in your building or community, and your assigned agent gets back to you with a realistic value range — including how that range shifts depending on how quickly you'd want to sell. If you decide to list, that same agent manages the process end to end; if you don't, there's no cost and no further obligation.",
      cards: [],
    },
  ],
}
