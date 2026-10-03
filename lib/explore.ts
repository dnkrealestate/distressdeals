import type { LucideIcon } from 'lucide-react'
import { Landmark, UtensilsCrossed, ShoppingBag, Store, BedDouble, FerrisWheel } from 'lucide-react'
import type { PlaceCategory } from '@/types'

// "UAE Explore" sections — one definition used by the hub, the list pages, the detail pages, the sitemap and the admin.
// `path` is the URL segment (/explore/<path>), `key` is what the API stores.
export interface ExploreSection {
  key: PlaceCategory
  path: string
  label: string          // "Tourist Places"
  singular: string       // "tourist place"
  icon: LucideIcon
  blurb: string
  seoTitle: string
  seoDescription: string
  schemaType: string     // schema.org type for a place in this section
}

export const EXPLORE_SECTIONS: ExploreSection[] = [
  {
    key: 'attraction', path: 'attractions', label: 'Tourist Places', singular: 'tourist place', icon: Landmark,
    blurb: 'Landmarks, museums, heritage sites and viewpoints across the seven emirates.',
    seoTitle: 'Tourist Places in the UAE — Attractions, Landmarks & Museums',
    seoDescription: 'A guide to the best tourist places in the UAE — landmarks, museums, heritage sites and viewpoints in Dubai, Abu Dhabi, Sharjah and beyond, with locations, tips and visitor reviews.',
    schemaType: 'TouristAttraction',
  },
  {
    key: 'food', path: 'food', label: 'Food & Dining', singular: 'place to eat', icon: UtensilsCrossed,
    blurb: 'Restaurants, cafés and food spots worth the trip — by cuisine and by area.',
    seoTitle: 'Best Places to Eat in the UAE — Restaurants & Cafés by Area',
    seoDescription: 'Restaurants, cafés and food spots across the UAE — cuisines, locations, opening hours and reviews from people who have eaten there.',
    schemaType: 'Restaurant',
  },
  {
    key: 'mall', path: 'malls', label: 'Shopping Malls', singular: 'shopping mall', icon: ShoppingBag,
    blurb: 'Every major mall in the UAE — where it is, what is inside and when to go.',
    seoTitle: 'Shopping Malls in the UAE — Locations, Hours & What’s Inside',
    seoDescription: 'A guide to shopping malls in Dubai, Abu Dhabi, Sharjah and the rest of the UAE — exact locations, opening hours, what each mall is known for and shopper reviews.',
    schemaType: 'ShoppingCenter',
  },
  {
    key: 'market', path: 'markets', label: 'Markets & Souks', singular: 'market', icon: Store,
    blurb: 'Traditional souks, fish and vegetable markets, and weekend markets.',
    seoTitle: 'Markets & Souks in the UAE — Gold, Spice, Fish and Local Markets',
    seoDescription: 'Traditional souks and local markets across the UAE — gold, spices, textiles, fish and fresh produce — with locations, the best time to visit and bargaining tips.',
    schemaType: 'Store',
  },
  {
    key: 'hotel', path: 'hotels', label: 'Hotels & Resorts', singular: 'hotel', icon: BedDouble,
    blurb: 'City hotels, beach resorts and desert retreats, with locations and guest reviews.',
    seoTitle: 'Hotels & Resorts in the UAE — Where to Stay by Area',
    seoDescription: 'Hotels and resorts across the UAE — city hotels, beach resorts and desert retreats — with exact locations, star ratings, what is nearby and guest reviews.',
    schemaType: 'Hotel',
  },
  {
    key: 'activity', path: 'activities', label: 'Activities', singular: 'activity', icon: FerrisWheel,
    blurb: 'Theme parks, water parks, beaches, parks, golf and outdoor adventures.',
    seoTitle: 'Things to Do in the UAE — Theme Parks, Beaches, Parks & Adventures',
    seoDescription: 'Things to do in the UAE — theme parks, water parks, beaches, public parks, golf courses and outdoor adventures, with locations, tips and reviews.',
    schemaType: 'TouristAttraction',
  },
]

export const sectionByKey = (key: string) => EXPLORE_SECTIONS.find(s => s.key === key)
export const sectionByPath = (path: string) => EXPLORE_SECTIONS.find(s => s.path === path)
export const placeHref = (p: { category: string; slug: string }) => `/explore/${sectionByKey(p.category)?.path || 'attractions'}/${p.slug}`

export const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Umm Al Quwain', 'Fujairah']
export const emirateSlug = (e: string) => e.toLowerCase().replace(/\s+/g, '-')
export const emirateFromSlug = (s?: string) => EMIRATES.find(e => emirateSlug(e) === s)
// /explore/malls or /explore/malls/dubai — each emirate has its own page under the section.
export const sectionHref = (s: Pick<ExploreSection, 'path'>, emirate?: string) => `/explore/${s.path}${emirate ? `/${emirateSlug(emirate)}` : ''}`
