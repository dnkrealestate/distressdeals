export type UserRole = 'buyer' | 'seller' | 'agent' | 'editor' | 'admin' | 'super_admin'
export type PropertyType = 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'studio' | 'commercial' | 'office' | 'retail' | 'warehouse' | 'plot' | 'commercial_villa' | 'other'
export type PropertyCategory = 'residential' | 'commercial' | 'plot'
export type ListingType = 'sale' | 'rent'
export type RentFrequency = 'yearly' | 'monthly'
export type SellerUrgency = 'this_month' | 'within_2_months' | 'flexible'
export type PropertyStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'published' | 'sold' | 'withdrawn' | 'draft'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'touring' | 'negotiating' | 'deal_closed' | 'deal_lost' | 'cancelled'
export type AgentPermission =
  | 'approve_listings' | 'manage_leads' | 'schedule_meetings' | 'view_analytics' | 'manage_agents' | 'export_data'
  | 'manage_content'
  | 'manage_blog' | 'manage_homepage' | 'manage_seo' | 'manage_pages' | 'manage_projects'
  | 'manage_developers' | 'manage_areas' | 'manage_communities' | 'manage_buildings' | 'manage_ads'
  | 'manage_explore' | 'manage_reviews'

export interface User {
  _id: string; name: string; email: string; phone?: string; avatar?: string
  // Chat presence: when they were last connected (only present while they are offline).
  lastSeenAt?: string
  role: UserRole; status: string; isEmailVerified: boolean; isPhoneVerified: boolean
  // How the number was proven (admin pages): SMS code, WhatsApp code, or marked by staff.
  phoneVerifiedAt?: string; phoneVerifiedVia?: 'sms' | 'whatsapp' | 'admin'; phoneVerifiedBy?: { _id: string; name: string } | string
  // Role-prefixed public ID: S-A1 (seller), B-A1 (buyer), A-A1 (agent), E-A1 (editor), AD-A1 (admin).
  displayId?: string
  favorites: string[]; createdAt: string
  permissions?: AgentPermission[]; agentRole?: string
  notifications?: {
    email: boolean; push: boolean; sms: boolean
    newProperties: boolean; leadUpdates: boolean
    messages: boolean; meetingReminders: boolean
  }
}

export interface PropertyImage { url: string; publicId: string; isPrimary: boolean; order: number; caption?: string }

// Rent listings only: can a tenant move in now, soon, or is a tenant still in place.
export type RentalStatus = 'available_now' | 'available_soon' | 'occupied'

// A limited-time offer on a listing or a project (backend models/offerSchema.ts). `thumbnail` is the offer's own card
// picture — it is not part of the gallery.
export type GiftKind = 'car' | 'golden_visa' | 'gold' | 'furniture' | 'appliances' | 'service_charges' | 'dld_waiver' | 'cashback' | 'holiday' | 'other'
export interface Offer {
  enabled: boolean
  title?: string; price?: number
  // "20% off": the offer price is worked out from the normal price. Used instead of a fixed offer price.
  discountPercent?: number
  // True when this is the developer's offer on all its projects (set by the server), not the project's own.
  fromDeveloper?: boolean
  startsAt?: string; endsAt?: string
  paymentPlan?: string          // a special payment plan for the offer period
  dldWaiver?: string            // a DLD registration-fee waiver, e.g. "100% DLD fee waived"
  gifts?: { kind: GiftKind; label: string }[]
  thumbnail?: string; note?: string
}

// A project's official record at the Dubai Land Department (status, % completed, dates) — filled by the backend's DLD
// sync when the project is linked to the register; absent otherwise.
export interface ProjectDld {
  projectId: string; projectNumber?: string; name: string; developerName?: string
  status?: 'not_started' | 'active' | 'finished' | 'pending' | 'cancelled'; statusText?: string
  percentCompleted?: number
  startDate?: string; endDate?: string; completionDate?: string
  units?: number; villas?: number; buildings?: number; escrowAgent?: string
  matchedBy?: 'auto' | 'admin'; syncedAt?: string
}

// The market reference in use on a listing or a project (backend models/marketReferenceSchema.ts): our own verified
// figure (ADMIN), or one calculated from registered sales (DLD / DUBAI_PULSE / LICENSED_PROVIDER / HYBRID).
export interface MarketReference {
  price: number; pricePerSqft?: number
  source?: string; sourceType: 'ADMIN' | 'DLD' | 'DUBAI_PULSE' | 'LICENSED_PROVIDER' | 'HYBRID' | 'LISTINGS'
  comparableCount?: number; confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT' | 'VERIFIED'
  level?: string; calculatedAt?: string; periodStart?: string; periodEnd?: string
  sizeTolerance?: number; publicEligible?: boolean; notes?: string; dealPrice?: number; unit?: string
}

// Opportunity Score of a listing or a project, computed on the server (backend utils/opportunity.ts). The below-market
// fields are present only when there is a real reference value behind them.
export interface Opportunity {
  score: number
  belowMarketPct?: number; advantage?: number; referenceValue?: number
  // 'valuation' = verified by our team · 'transactions' = registered sales · 'comparables' = similar listings on our site
  basis?: 'valuation' | 'comparables' | 'transactions'; comps?: number; confidence?: string
  // Projects: the deal price the figure is calculated from, the unit it belongs to when it comes from a unit's own
  // prices, and the rental yield worked out from the expected annual rent.
  dealPrice?: number; unit?: string; rentalYield?: number
  labels?: string[]; best?: boolean
  factors?: Record<string, number>
}

export interface Property {
  _id: string; title: string; description: string; slug: string
  referenceId?: string
  category?: PropertyCategory
  type: PropertyType; listingType: ListingType; rentFrequency?: RentFrequency; rentalStatus?: RentalStatus; availableFrom?: string; status: PropertyStatus
  price: number; pricePerSqft?: number
  // How soon the seller wants to sell/rent — internal-only, never sent to
  // buyers/anonymous viewers (see backend sanitizeForPublic).
  urgency?: SellerUrgency
  location: {
    // address/additionalAddress/district are agent+admin-only — the API never
    // sends them to buyers/anonymous viewers, so treat them as absent in any
    // buyer-facing view.
    address?: string; additionalAddress?: string; district?: string; unitNo?: string
    area?: string; community?: string; city: string; emirate: string
    coordinates?: { lat: number; lng: number }
  }
  amenities: {
    bedrooms: number; bathrooms: number; parkingSpaces: number; floorArea: number; balconies: number
    floor?: number; totalFloors?: number; yearBuilt?: number; plotArea?: number
    view?: string; petPolicy?: string; otherRooms?: string; otherFacilities?: string
    nearbySchools?: string; nearbyHospitals?: string; nearbyShoppingMalls?: string
    distanceFromAirport?: number; nearbyPublicTransport?: string; otherNearbyPlaces?: string
  }
  features: Record<string, boolean>
  furnishing: 'furnished' | 'semi_furnished' | 'unfurnished'
  completion: 'ready' | 'off_plan'
  expectedCompletionDate?: string
  offPlanSaleType?: 'primary' | 'resale'
  ownershipStatus?: 'freehold' | 'leasehold'
  financingAvailable?: boolean
  financingInstitutionNames?: string
  titleAr?: string; descriptionAr?: string
  // Search-result overrides for the listing page, the keyword the copy was written around, and secondary keywords.
  metaTitle?: string; metaDescription?: string; focusKeyword?: string; seoKeywords?: string[]
  developer?: string; projectName?: string; permitNumber?: string; permitQrImage?: string
  images: PropertyImage[]
  videos?: { platform: 'youtube' | 'vimeo' | 'dailymotion' | '3d_view'; url: string; title?: string }[]
  floorPlan?: string; brochure?: string; virtualTour?: string
  seller: User; agent?: User
  // Set once the assigned agent has filled in title/description/area/photos —
  // required before the listing can be approved and published.
  detailsCompleted: boolean
  rejectionReason?: string
  deleteRequest?: { requestedBy: Partial<User>; reason?: string; requestedAt: string }
  stats: { views: number; favorites: number; leads: number; interestedCount: number }
  isFeatured: boolean; isPremium: boolean; tags: string[]
  // Estimated market value (set by our team) · the price before the last reduction · the computed opportunity.
  marketValue?: number; previousPrice?: number; opportunity?: Opportunity; marketReference?: MarketReference
  offer?: Offer | null
  createdAt: string; updatedAt: string
}

export interface Lead {
  _id: string; property?: Property; project?: Project; leadType: 'property' | 'project'
  buyer?: User; assignedAgent?: User
  status: LeadStatus; source: string; budget?: { min: number; max: number }
  name?: string; email?: string; phone?: string
  requirements?: string; priority: 'low' | 'medium' | 'high'
  // The limited-time offer that was running when the enquiry came in (a snapshot — it stays even after the offer ends).
  offer?: { title?: string; discountPercent?: number; fromDeveloper?: boolean; price?: number; normalPrice?: number; endsAt?: string; paymentPlan?: string; dldWaiver?: string; gifts?: string[]; note?: string }
  notes: { content: string; createdBy: User; createdAt: string }[]
  meetings: Meeting[]; timeline: { action: string; description: string; createdAt: string }[]
  deleteRequest?: { requestedBy: Partial<User>; reason?: string; requestedAt: string }
  createdAt: string; updatedAt: string
}

export interface Meeting {
  _id: string; lead: string; property: Property; buyer: User; agent: User
  type: 'property_tour' | 'office_meeting' | 'virtual' | 'phone_call'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  scheduledAt: string; duration: number; location?: string; notes?: string
  createdAt: string
}

export interface Agent {
  _id: string; user: User; agentId: string
  agentRole: 'agent' | 'senior_agent' | 'team_leader' | 'manager'
  permissions: AgentPermission[]; isAvailable: boolean; isOnline?: boolean
  activeLeadsCount: number; closedDealsCount: number; languages: string[]
  specializations: PropertyType[]
}

export interface ChatAttachment { url: string; name: string; size: number; mimeType: string; kind: 'image' | 'document' }

export interface ChatMessage {
  _id: string; room: string; sender: User; content: string
  type: 'text' | 'image' | 'document' | 'system'
  attachments?: ChatAttachment[]
  isRead: boolean; createdAt: string
  // Receipts: who it reached / who opened it (drives the ✓ ✓✓ marks).
  deliveredTo?: { user: string; at: string }[]
  readBy?: { user: string; readAt: string }[]
}

export interface ChatRoom {
  _id: string; type: 'buyer_agent' | 'seller_agent' | 'agent_admin'
  participants: User[]; property?: Partial<Property>
  lastMessage?: ChatMessage; unreadCount: number
  isActive: boolean; createdAt: string; updatedAt: string
}

export interface Notification {
  _id: string; type: string; title: string; body: string; isRead: boolean; createdAt: string
}

export interface BlogPost {
  _id: string; title: string; slug: string; excerpt: string; content: string
  coverImage: string; author: User; category: string; tags: string[]
  status: string; publishedAt?: string; views: number; readTime: number; createdAt: string
  editorialStage?: 'idea' | 'writing' | 'review' | 'scheduled' | 'published'; scheduledFor?: string
}

export interface NewsItem {
  _id: string; title: string; slug: string; summary: string; content: string
  coverImage: string; category: string
  status: string; publishedAt?: string; createdAt: string
  editorialStage?: 'idea' | 'writing' | 'review' | 'scheduled' | 'published'; scheduledFor?: string
}

export interface WhyCard { icon: string; title: string; description: string }
export interface StatItem { icon: string; value: string; label: string }
export interface MiniStat { value: string; label: string }

export interface HomepageContent {
  _id: string
  heroHeadlines: string[]
  heroSubtitle: string
  heroMiniStats: MiniStat[]
  whyCards: WhyCard[]
  statsStrip: StatItem[]
  heroBannerDesktopDay?: string
  heroBannerDesktopNight?: string
  heroBannerMobileDay?: string
  heroBannerMobileNight?: string
  heroShadeColor1?: string
  heroShadeColor2?: string
}

export interface ContentCard { icon?: string; title: string; body: string; meta?: string; image?: string }
// A request from a website form with no listing attached (admin "Requests" page).
export interface ContactRequest {
  _id: string; name: string; email: string; phone?: string; message: string
  source: 'contact_form' | 'valuation_request' | 'fast_sale_request'
  status?: 'new' | 'contacted' | 'closed'; note?: string; isRead?: boolean
  handledBy?: { _id: string; name: string } | null
  createdAt: string; updatedAt?: string
}

export interface ContentSection { heading: string; body?: string; cards?: ContentCard[] }
export interface ContentPageData {
  _id?: string
  pageKey: string
  heroEyebrow?: string
  heroTitle: string
  heroIntro: string
  // Legal pages only: the whole document as formatted text, and its "Last updated" date.
  bodyHtml?: string
  updatedLabel?: string
  // Landing pages: questions & answers at the bottom of the page.
  faqs?: { q: string; a: string }[]
  stats?: MiniStat[]
  sections: ContentSection[]
  ctaTitle?: string
  ctaBody?: string
  ctaButtonLabel?: string
  ctaButtonHref?: string
}

export interface Project {
  _id: string; title: string; slug: string; referenceId?: string; developer: string; description: string
  // Search-result overrides for the project page; focusKeyword is what the description was written around.
  metaTitle?: string; metaDescription?: string; focusKeyword?: string; seoKeywords?: string[]
  coverImage?: string; images: { url: string }[]
  area: string; community?: string; city: string; emirate: string
  priceFrom: number; priceTo?: number; type?: string; bedrooms: string; bathrooms?: string; sizeRange?: string
  handoverQuarter?: string; handoverYear?: number; paymentPlan?: string; permitNumber?: string; permitQrImage?: string
  status: 'upcoming' | 'under_construction' | 'ready' | 'sold_out'
  // Feature tags (automatic + admin overrides) — see backend utils/listingTags
  tags?: string[]; tagsAdded?: string[]; tagsRemoved?: string[]
  isFeatured: boolean; views: number; createdAt: string
  // `priceFrom` is OUR deal price. Comparable market price for the same unit · documented developer incentives ·
  // expected yearly rent (optional) · older typed-in yield % · the computed opportunity.
  marketValue?: number; incentives?: string[]; expectedAnnualRent?: number; rentalYield?: number; opportunity?: Opportunity; marketReference?: MarketReference
  // Where the comparable market price comes from — staff only, never present on the public site.
  marketPriceSource?: string
  dld?: ProjectDld
  offer?: Offer | null
  developerLogo?: string
  // Admin list only (GET /projects/manage/all).
  createdBy?: { _id: string; name: string; displayId?: string; role?: string } | null
  updatedBy?: { _id: string; name: string; displayId?: string; role?: string } | null
  updatedAt?: string
  // White version for the dark developer badge on project cards.
  developerLogoWhite?: string
  coordinates?: { lat: number; lng: number }
  amenities?: Record<string, boolean>
  floorPlans?: { label: string; image: string; bedrooms?: string; size?: string; price?: number; referencePrice?: number }[]
  masterPlan?: { image: string; description?: string }
  landmarks?: { name: string; category: 'metro' | 'school' | 'mall' | 'landmark' | 'airport' | 'hospital'; lat: number; lng: number }[]
  videos?: { platform: 'youtube' | 'vimeo' | 'dailymotion' | '3d_view'; url: string; title?: string }[]
}

export interface Developer {
  _id: string; name: string; slug: string; logo?: string; description?: string
  // All-white version of the logo (transparent background) for dark backgrounds.
  logoWhite?: string
  website?: string; establishedYear?: number; headquarters?: string; isFeatured: boolean
  // An offer on ALL of this developer's projects ("30% off every project").
  offer?: Offer | null
  // Staff tracking (admin lists only)
  createdBy?: { _id: string; name: string; displayId?: string } | null; updatedBy?: { _id: string; name: string; displayId?: string } | null; updatedAt?: string
  // Search appearance — written automatically when empty, editable in the admin.
  metaTitle?: string; metaDescription?: string; focusKeyword?: string; seoKeywords?: string[]
  createdAt: string
}

// What "Auto-fill from website" returns — a draft for the form, not a saved developer.
export interface DeveloperImport {
  name: string; description: string; website: string; establishedYear?: number; headquarters?: string
  logo?: string; logoWhite?: string; isLightLogo?: boolean
  logoCandidates: string[]; logoError?: string; pagesRead: string[]
  existing: { _id: string; name: string } | null
}

export interface DeveloperWithStats extends Developer {
  projectCount: number; minPriceFrom: number; areas: string[]
}

export interface MortgageInquiry {
  _id: string; name: string; email: string; phone: string
  propertyPrice: number; downPayment: number; interestRate: number; tenureYears: number
  monthlyPayment: number; status: 'new' | 'contacted' | 'closed'; createdAt: string
}

export interface SavedSearch {
  _id: string; name: string; filters: PropertyFilters
  alertsEnabled: boolean; lastNotifiedAt?: string; createdAt: string
}

export interface Task {
  _id: string; lead: string | Lead; assignedTo: User; title: string
  dueAt: string; completed: boolean; completedAt?: string; createdBy: string; createdAt: string
}

export interface AgentPerformance {
  agentId: string; user: User; agentRole: string; isAvailable: boolean
  totalLeads: number; closedDeals: number; lostDeals: number; revenue: number
  conversionRate: number; avgResponseMinutes: number | null
}

export interface LeadSourceReport {
  source: string; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null
  total: number; closed: number; lost: number; conversionRate: number
}

export interface DeveloperStats {
  developer: string; slug: string; count: number
  minPriceFrom: number; areas: string[]; sampleImage?: string
}

export interface AreaStats {
  area: string; slug: string; count: number
  avgPrice: number; minPrice: number; maxPrice: number; avgPricePerSqft?: number
  saleCount: number; rentCount: number; sampleImage?: string
  // New projects in the area, their lowest starting price, the emirate, and whether a written guide exists.
  projectCount?: number; projectsFrom?: number; emirate?: string; hasGuide?: boolean
}

export interface AreaContent {
  _id: string; area: string; slug: string; heroImage?: string; overview?: string
  highlights: { label: string }[]; amenities: { icon: string; label: string }[]
  isFeatured: boolean; createdAt: string
  emirate?: string; heroImageCredit?: { name: string; url: string; license?: string }
  sections?: { heading: string; body: string }[]; faqs?: { q: string; a: string }[]
  metaTitle?: string; metaDescription?: string; focusKeyword?: string; seoKeywords?: string[]
}

export interface AreaContentWithStats extends AreaContent {
  count: number; avgPrice: number; avgPricePerSqft: number
  saleCount: number; rentCount: number; communities: string[]
}

// A banner ad (Ads manager). imageTall = 300×600 sidebar art, imageWide = 1200×300 banner / phone art.
export type AdPlacement = 'listings' | 'details'
export interface Ad {
  _id: string; title: string; advertiser?: string; imageTall?: string; imageWide?: string
  targetUrl: string; placements: AdPlacement[]; isActive: boolean; startsAt?: string; endsAt?: string; priority: number
  impressions: number; clicks: number; ctr?: number; status?: 'running' | 'scheduled' | 'paused' | 'ended'
  createdBy?: { _id: string; name: string; displayId?: string } | null
  createdAt: string; updatedAt: string
}
export interface PublicAd { _id: string; title: string; advertiser?: string; imageTall?: string; imageWide?: string }

export interface TrendingArea { area: string; listings: number; views: number; change: number | null; isNew: boolean }

export interface CommunityContent {
  _id: string; name: string; slug: string; area?: string; heroImage?: string; overview?: string
  highlights: { label: string }[]; amenities: { icon: string; label: string }[]
  emirate?: string; coordinates?: { lat: number; lng: number }; address?: string
  heroImageCredit?: { name: string; url: string; license?: string }
  // Staff tracking (admin lists only)
  createdBy?: { _id: string; name: string; displayId?: string } | null; updatedBy?: { _id: string; name: string; displayId?: string } | null; updatedAt?: string
  // Search appearance — written automatically when empty, editable in the admin.
  metaTitle?: string; metaDescription?: string; focusKeyword?: string; seoKeywords?: string[]
  isFeatured: boolean; createdAt: string
}

export interface CommunityContentWithStats extends CommunityContent {
  count: number; avgPrice: number
}

export interface BuildingContent {
  _id: string; name: string; slug: string; area?: string; community?: string; developer?: string
  heroImage?: string; overview?: string; yearBuilt?: number; totalFloors?: number
  heroImageCredit?: { name: string; url: string; license?: string }; emirate?: string; coordinates?: { lat: number; lng: number }
  metaTitle?: string; metaDescription?: string; focusKeyword?: string; seoKeywords?: string[]
  amenities: { icon: string; label: string }[]
  // Staff tracking (admin lists only)
  createdBy?: { _id: string; name: string; displayId?: string } | null; updatedBy?: { _id: string; name: string; displayId?: string } | null; updatedAt?: string
  isFeatured: boolean; createdAt: string
}

export interface PropertyFilters {
  q?: string; type?: string; listingType?: string; priceMin?: number; priceMax?: number
  bedrooms?: string; area?: string; community?: string; furnishing?: string; completion?: string
  rentalStatus?: string; availableWithin?: number
  category?: 'residential' | 'commercial' | ''; bathrooms?: string; sizeMin?: number; sizeMax?: number
  sortBy?: string; page?: number; limit?: number
  // Feature tag from a "More searches" link — cheap, luxury, installments…
  tag?: string
  offer?: string          // 'true' = only listings with a limited-time offer running
}

export interface PaginatedResponse<T> {
  data: T[]; total: number; page: number; limit: number; totalPages: number
}

export interface ApiResponse<T> { success: boolean; data: T; message?: string; error?: string }
// ── UAE Explore ─────────────────────────────────────────
export type PlaceCategory = 'attraction' | 'food' | 'mall' | 'market' | 'hotel' | 'activity'
export interface Place {
  _id: string; name: string; slug: string; category: PlaceCategory; subcategory?: string
  emirate: string; area?: string; address?: string; coordinates?: { lat: number; lng: number }
  heroImage?: string; heroImageCredit?: { name: string; url: string; license?: string }; gallery?: string[]
  summary?: string; overview?: string; highlights?: string[]; tips?: string[]; faqs?: { q: string; a: string }[]
  openingHours?: string; phone?: string; website?: string; priceLevel?: string; bestTime?: string; duration?: string
  stars?: number; cuisine?: string
  status: 'published' | 'draft'; isFeatured: boolean; ratingAvg: number; ratingCount: number; views?: number
  metaTitle?: string; metaDescription?: string; focusKeyword?: string; seoKeywords?: string[]
  distanceKm?: number; createdAt?: string; updatedAt?: string
  createdBy?: Pick<User, '_id' | 'name' | 'displayId' | 'role'>; updatedBy?: Pick<User, '_id' | 'name' | 'displayId' | 'role'>
}
export interface PlaceDetail extends Place {
  nearby: Place[]
  reviews?: Review[]
  related?: Pick<Place, 'name' | 'slug' | 'category' | 'subcategory'>[]
  projects: { _id: string; name: string; slug: string; area?: string; emirate?: string; priceFrom?: number; coverImage?: string; images?: { url: string }[]; developer?: string; distanceKm: number }[]
}
export interface PlaceSectionSummary { category: PlaceCategory; count: number; emirates: { emirate: string; count: number }[]; top: Place[] }

export type ReviewTargetType = 'place' | 'area' | 'community' | 'building' | 'blog' | 'news'
export interface Review {
  _id: string; targetType: ReviewTargetType; targetSlug: string; targetName?: string
  authorName: string; rating: number; title?: string; comment: string
  status: 'pending' | 'approved' | 'rejected'; reply?: string; repliedAt?: string; createdAt: string
  user?: Pick<User, '_id' | 'name' | 'email' | 'displayId'>; moderatedBy?: { name: string }
}
export interface ReviewSummary { avg: number; count: number; dist: number[] }
