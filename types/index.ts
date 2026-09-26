export type UserRole = 'buyer' | 'seller' | 'agent' | 'editor' | 'admin' | 'super_admin'
export type PropertyType = 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'studio' | 'office' | 'retail' | 'warehouse' | 'plot' | 'commercial_villa' | 'other'
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

export interface User {
  _id: string; name: string; email: string; phone?: string; avatar?: string
  // Chat presence: when they were last connected (only present while they are offline).
  lastSeenAt?: string
  role: UserRole; status: string; isEmailVerified: boolean; isPhoneVerified: boolean
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
  createdAt: string; updatedAt: string
}

export interface Lead {
  _id: string; property?: Property; project?: Project; leadType: 'property' | 'project'
  buyer?: User; assignedAgent?: User
  status: LeadStatus; source: string; budget?: { min: number; max: number }
  name?: string; email?: string; phone?: string
  requirements?: string; priority: 'low' | 'medium' | 'high'
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

export interface ContentCard { icon?: string; title: string; body: string; meta?: string }
export interface ContentSection { heading: string; body?: string; cards?: ContentCard[] }
export interface ContentPageData {
  _id?: string
  pageKey: string
  heroEyebrow?: string
  heroTitle: string
  heroIntro: string
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
  developerLogo?: string
  // Admin list only (GET /projects/manage/all).
  createdBy?: { _id: string; name: string; displayId?: string; role?: string } | null
  updatedBy?: { _id: string; name: string; displayId?: string; role?: string } | null
  updatedAt?: string
  // White version for the dark developer badge on project cards.
  developerLogoWhite?: string
  coordinates?: { lat: number; lng: number }
  amenities?: Record<string, boolean>
  floorPlans?: { label: string; image: string; bedrooms?: string; size?: string; price?: number }[]
  masterPlan?: { image: string; description?: string }
  landmarks?: { name: string; category: 'metro' | 'school' | 'mall' | 'landmark' | 'airport' | 'hospital'; lat: number; lng: number }[]
  videos?: { platform: 'youtube' | 'vimeo' | 'dailymotion' | '3d_view'; url: string; title?: string }[]
}

export interface Developer {
  _id: string; name: string; slug: string; logo?: string; description?: string
  // All-white version of the logo (transparent background) for dark backgrounds.
  logoWhite?: string
  website?: string; establishedYear?: number; headquarters?: string; isFeatured: boolean
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
}

export interface AreaContent {
  _id: string; area: string; slug: string; heroImage?: string; overview?: string
  highlights: { label: string }[]; amenities: { icon: string; label: string }[]
  isFeatured: boolean; createdAt: string
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
}

export interface PaginatedResponse<T> {
  data: T[]; total: number; page: number; limit: number; totalPages: number
}

export interface ApiResponse<T> { success: boolean; data: T; message?: string; error?: string }