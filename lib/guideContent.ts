import type { ContentPageData } from '@/types'

// Default guides shown under the Buy / Rent / New Projects lists. Editable in Admin → Settings → Page content
// (page keys guide-buying, guide-renting, guide-new-projects); these defaults show until someone saves an edit,
// and the editor starts from them. A section whose heading mentions "questions" renders as an FAQ (with FAQPage
// structured data). Section bodies: blank line = new paragraph.

const PLATFORM = [
  { icon: 'Handshake', title: 'No third-party agents or brokers', body: 'Every listing comes straight from its owner or developer. There is no chain of outside agents between you and the property — just our own in-house team.' },
  { icon: 'ShieldCheck', title: 'Verified before it goes live', body: 'Our quality control team checks the developer, location, price and details of each listing before it is published.' },
  { icon: 'Users', title: 'One dedicated team, start to finish', body: 'The same Distress Deals UAE specialist handles your enquiry from the first message to the keys — viewings, offers, paperwork and transfer.' },
  { icon: 'TrendingDown', title: 'Distress and below-market deals', body: 'We focus on motivated sellers and genuine price drops, so you see real opportunities rather than inflated asking prices.' },
]

export const GUIDE_BUYING: ContentPageData = {
  pageKey: 'guide-buying',
  heroEyebrow: 'Buyer’s guide',
  heroTitle: 'Guide to Buying a Property in the UAE',
  heroIntro: 'Buying property in the UAE is straightforward once you know the steps, the costs and the paperwork. This guide walks you through the process in Dubai and the other emirates — from setting a budget to collecting your title deed — and shows how Distress Deals UAE lets you buy directly, without third-party agents or brokers.',
  stats: [
    { value: '4%', label: 'Dubai Land Department transfer fee' },
    { value: '20%', label: 'Typical minimum down payment for expats' },
    { value: 'AED 2M', label: 'Property value that can qualify for a Golden Visa' },
    { value: '0', label: 'Third-party agents between you and the seller' },
  ],
  sections: [
    {
      heading: 'Why buy with Distress Deals UAE',
      body: 'Most property portals are marketplaces of competing agents. Distress Deals UAE works differently: owners and developers list with us directly, and our own team manages every deal. You get one point of contact, verified information and no outside brokers adding layers between you and the property.',
      cards: PLATFORM,
    },
    {
      heading: 'Who can buy property in the UAE?',
      body: 'Foreign nationals can buy freehold property in designated freehold areas — in Dubai these include Downtown Dubai, Dubai Marina, Palm Jumeirah, Jumeirah Village Circle, Business Bay, Dubai Hills Estate and many more. You do not need UAE residency to buy, and ownership gives you the full right to sell, lease or pass on the property.\n\nIn Abu Dhabi, foreigners can own freehold in investment zones such as Saadiyat Island, Yas Island and Al Reem Island. Sharjah, Ajman and Ras Al Khaimah also offer freehold or long-lease options in selected communities.',
    },
    {
      heading: 'Step-by-step: how to buy a property',
      cards: [
        { icon: 'Banknote', meta: 'Step 1', title: 'Set your budget and financing', body: 'Decide whether you will pay cash or use a mortgage. If you need finance, get a mortgage pre-approval first so you know exactly what you can spend.' },
        { icon: 'FileSearch', meta: 'Step 2', title: 'Shortlist and view', body: 'Filter by area, type, price and features, save favourites and compare. Our team arranges viewings in person or by video call.' },
        { icon: 'Handshake', meta: 'Step 3', title: 'Agree the price', body: 'Make an offer through our team. Once agreed, buyer and seller sign a Memorandum of Understanding (in Dubai, Form F), and the buyer typically gives a 10% security deposit cheque.' },
        { icon: 'FileCheck', meta: 'Step 4', title: 'Clearances and NOC', body: 'The seller obtains a No Objection Certificate from the developer confirming there are no outstanding service charges. If the seller has a mortgage, it is settled at transfer.' },
        { icon: 'Gavel', meta: 'Step 5', title: 'Transfer at the Land Department', body: 'Both parties (or their representatives) complete the transfer at a registration trustee office, the fees are paid and the new title deed is issued in your name.' },
        { icon: 'Home', meta: 'Step 6', title: 'Move in or rent it out', body: 'Collect the keys, register utilities, and either move in or let the property — our rent section can help you find a tenant.' },
      ],
    },
    {
      heading: 'Costs to budget for',
      body: 'On top of the purchase price, budget roughly 6–8% for fees in Dubai. The main items are the Dubai Land Department transfer fee of 4% of the price, the registration trustee fee (around AED 2,000–4,000 plus VAT), and the title deed fee.\n\nIf you use a mortgage, add the mortgage registration fee (0.25% of the loan plus an admin fee), the bank’s arrangement fee and a valuation fee. After purchase, owners pay annual service charges to maintain the building or community — always check these before you buy.',
    },
    {
      heading: 'Mortgages for residents and non-residents',
      body: 'Under UAE Central Bank rules at the time of writing, expatriates buying their first home worth up to AED 5 million can typically borrow up to 80% of the value, so the minimum down payment is 20%. For homes above AED 5 million the limit is usually lower, and UAE nationals can borrow a higher share. Non-residents can also get mortgages from several UAE banks, usually with a larger deposit.\n\nMortgage terms run up to 25 years. Get pre-approval early — it speeds up the purchase and strengthens your offer.',
    },
    {
      heading: 'Buying a distress sale property',
      body: 'A distress sale is a property the owner needs to sell quickly — because of relocation, financial pressure or a change in plans — often below market value. They can be excellent value, but move fast and check the details: whether there is an outstanding mortgage, unpaid service charges, and whether the property is tenanted. Our team verifies these points before a listing goes live and handles the settlement at transfer.',
    },
    {
      heading: 'Frequently asked questions about buying property in the UAE',
      cards: [
        { title: 'Can foreigners buy property in Dubai?', body: 'Yes. Foreign nationals can buy freehold property in Dubai’s designated freehold areas, with full rights to sell, lease or inherit it. Residency is not required to buy.' },
        { title: 'What fees do I pay when buying property in Dubai?', body: 'Budget roughly 6–8% on top of the price: mainly the 4% Dubai Land Department transfer fee, the trustee office fee and title deed fee, plus mortgage-related fees if you borrow.' },
        { title: 'Does buying property give me a UAE residence visa?', body: 'Property worth AED 2 million or more can qualify the owner for a 10-year Golden Visa, subject to the current conditions. Smaller investments may qualify for other residence options.' },
        { title: 'Do I deal with agents on Distress Deals UAE?', body: 'No third-party agents or brokers are involved. Listings come directly from owners and developers, and our own in-house team handles your enquiry from the first message to the transfer.' },
        { title: 'How long does a property purchase take?', body: 'A cash purchase can complete in two to four weeks once the price is agreed. With a mortgage, allow four to eight weeks for approval, valuation and transfer.' },
      ],
    },
  ],
}

export const GUIDE_RENTING: ContentPageData = {
  pageKey: 'guide-renting',
  heroEyebrow: 'Tenant’s guide',
  heroTitle: 'Guide to Renting a Property in the UAE',
  heroIntro: 'Everything you need to know to rent an apartment or villa in the UAE — the documents, the costs, how rent is paid, your rights as a tenant and how Distress Deals UAE lets you rent directly from owners, without third-party agents.',
  stats: [
    { value: '5–10%', label: 'Typical security deposit' },
    { value: '1–4', label: 'Cheques a year, most often' },
    { value: '90 days', label: 'Notice before any change at renewal' },
    { value: '0', label: 'Third-party agents between you and the owner' },
  ],
  sections: [
    {
      heading: 'Why rent with Distress Deals UAE',
      body: 'Every rental on Distress Deals UAE comes directly from the property owner. There are no competing agents re-posting the same flat at different prices — one verified listing, one in-house team, and a clear path from viewing to moving in.',
      cards: PLATFORM.slice(0, 3),
    },
    {
      heading: 'Documents you will need',
      body: 'To rent in the UAE you will usually need a copy of your passport, your UAE residence visa and your Emirates ID. Companies renting for staff provide a trade licence instead. Some owners also ask for a salary certificate or recent bank statements.',
    },
    {
      heading: 'How renting works, step by step',
      cards: [
        { icon: 'FileSearch', meta: 'Step 1', title: 'Search and shortlist', body: 'Filter by area, budget, bedrooms, furnishing and availability, and save the homes you like.' },
        { icon: 'Eye', meta: 'Step 2', title: 'View the property', body: 'Our team arranges the viewing and answers questions about the building, parking, and what is included.' },
        { icon: 'Handshake', meta: 'Step 3', title: 'Agree terms', body: 'Agree the annual rent, number of cheques and start date. You pay the security deposit to reserve the home.' },
        { icon: 'FileCheck', meta: 'Step 4', title: 'Sign and register', body: 'Sign the tenancy contract and register it with Ejari in Dubai (or the equivalent in other emirates). Registration is required for utilities and visas.' },
        { icon: 'Home', meta: 'Step 5', title: 'Connect utilities and move in', body: 'Open your electricity and water account (DEWA in Dubai), set up internet and collect the keys.' },
      ],
    },
    {
      heading: 'Costs when you rent',
      body: 'Beyond the rent itself, plan for a refundable security deposit — typically around 5% of the annual rent for unfurnished homes and 10% for furnished ones — the Ejari registration fee, and a refundable utility connection deposit (in Dubai, usually AED 2,000 for apartments and AED 4,000 for villas).\n\nRent is usually paid by post-dated cheques: one to four a year is most common, and some owners accept monthly payments. Fewer cheques often get you a better price.',
    },
    {
      heading: 'Your rights as a tenant',
      body: 'In Dubai, rent increases at renewal are governed by the RERA rental index, so a landlord can only raise the rent if it is below the market average for the area. Any change to the terms must be notified at least 90 days before the contract ends. A landlord can only ask a tenant to leave for specific reasons — such as selling the property or using it themselves — with 12 months’ notarised notice.',
    },
    {
      heading: 'Frequently asked questions about renting in the UAE',
      cards: [
        { title: 'What is Ejari?', body: 'Ejari is Dubai’s official tenancy registration system. Every tenancy contract must be registered with it; you need the Ejari certificate to connect utilities and for many visa processes.' },
        { title: 'How much is the security deposit?', body: 'Typically about 5% of the annual rent for an unfurnished home and 10% for a furnished one. It is refunded at the end of the tenancy, minus any damage beyond normal wear.' },
        { title: 'Can I pay rent monthly in Dubai?', body: 'Most leases are paid in one to four cheques a year, but a growing number of owners accept monthly payments — use the filters to find them.' },
        { title: 'Are there agent fees when renting on Distress Deals UAE?', body: 'Rentals are listed directly by owners, with no third-party agents or brokers involved; our in-house team manages the process for you.' },
      ],
    },
  ],
}

export const GUIDE_NEW_PROJECTS: ContentPageData = {
  pageKey: 'guide-new-projects',
  heroEyebrow: 'Off-plan guide',
  heroTitle: 'Guide to Buying Off-Plan and New Projects in the UAE',
  heroIntro: 'Off-plan property — buying a home before it is finished, directly from the developer — is one of the most popular ways to invest in the UAE. This guide explains how it works, how your money is protected, how payment plans work and what to check before you commit.',
  stats: [
    { value: '10–20%', label: 'Typical booking payment' },
    { value: 'Escrow', label: 'Your payments are held in a project escrow account' },
    { value: '4%', label: 'DLD fee, usually paid at Oqood registration' },
    { value: 'Direct', label: 'From the developer — no third-party agents' },
  ],
  sections: [
    {
      heading: 'Why buy new projects with Distress Deals UAE',
      body: 'We list new projects straight from the developers, verify each one, and show the real starting price, payment plan and handover date. Our in-house team handles your booking and paperwork — no outside agents or brokers.',
      cards: [
        { icon: 'Building2', title: 'Direct from the developer', body: 'Launch prices and official payment plans, without a chain of intermediaries.' },
        { icon: 'ShieldCheck', title: 'Verified projects', body: 'Developer, permit, location and pricing checked by our quality control team.' },
        { icon: 'BarChart3', title: 'Compare side by side', body: 'Compare projects on price, payment plan, handover and unit sizes before you decide.' },
        { icon: 'Users', title: 'One team from booking to keys', body: 'We handle the reservation, the sales agreement, registration and the handover inspection.' },
      ],
    },
    {
      heading: 'How buying off-plan works',
      cards: [
        { icon: 'FileSearch', meta: 'Step 1', title: 'Choose the project and unit', body: 'Compare developers, locations, layouts and payment plans, and pick your unit.' },
        { icon: 'Banknote', meta: 'Step 2', title: 'Reserve with a booking payment', body: 'Pay the booking amount — often 10–20% of the price — to reserve the unit.' },
        { icon: 'FileCheck', meta: 'Step 3', title: 'Sign the SPA', body: 'Sign the Sale and Purchase Agreement, which sets out the price, payment schedule, handover date and specifications.' },
        { icon: 'ClipboardCheck', meta: 'Step 4', title: 'Register in Oqood', body: 'The purchase is registered in the Dubai Land Department’s Oqood interim register, and the 4% DLD fee is paid (sometimes covered by developer offers).' },
        { icon: 'Clock', meta: 'Step 5', title: 'Pay as it is built', body: 'Pay the instalments as construction progresses, in line with your payment plan.' },
        { icon: 'Home', meta: 'Step 6', title: 'Handover', body: 'Inspect the finished home (snagging), pay the final amount, receive your title deed and collect the keys.' },
      ],
    },
    {
      heading: 'Payment plans explained',
      body: 'Off-plan payment plans spread the price over the construction period. A 60/40 plan means 60% is paid during construction and 40% at handover; a 70/30 plan means 70% during construction and 30% on completion. Post-handover plans let you pay part of the price in instalments after you receive the keys — useful if you want to rent the home out and let the rent cover the payments.',
    },
    {
      heading: 'How your money is protected',
      body: 'In Dubai, off-plan developers must be registered with RERA, and buyers’ payments go into a dedicated escrow account for that project. Funds are released to the developer as construction milestones are certified, so your money is used to build your home. Always check the project’s permit number and escrow details — every project on Distress Deals UAE shows its DLD permit where available.',
    },
    {
      heading: 'What to check before you buy',
      body: 'Look at the developer’s track record and past handovers, the project permit, the expected handover date and what the SPA says about delays, the service charges once the building is complete, and the resale rules — many developers allow you to resell before completion once you have paid a set share of the price. Visit the site or ask for construction updates as the project progresses.',
    },
    {
      heading: 'Frequently asked questions about off-plan property',
      cards: [
        { title: 'Is off-plan property safe to buy in Dubai?', body: 'Dubai regulates off-plan sales closely: developers must be RERA-registered and buyer payments are held in a project escrow account and released as construction progresses. Checking the developer’s track record and the project permit adds further protection.' },
        { title: 'What is a post-handover payment plan?', body: 'A plan where part of the price is paid in instalments after you receive the keys, often over two to five years.' },
        { title: 'Can I sell an off-plan property before handover?', body: 'Usually yes, once you have paid the share of the price the developer requires (often 30–40%) and received its no objection certificate.' },
        { title: 'Can I get a Golden Visa with an off-plan property?', body: 'Off-plan properties worth AED 2 million or more can qualify for a 10-year Golden Visa, subject to the current rules on the amount paid and the developer’s approval.' },
      ],
    },
  ],
}

export const GUIDE_DEFAULTS: Record<string, ContentPageData> = {
  'guide-buying': GUIDE_BUYING,
  'guide-renting': GUIDE_RENTING,
  'guide-new-projects': GUIDE_NEW_PROJECTS,
}
