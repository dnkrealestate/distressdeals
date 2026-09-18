import {
  Waves, Dumbbell, ConciergeBell, ShieldCheck, Smartphone, Snowflake, DoorClosed,
  Car, BedDouble, BookOpen, Bath, Flame, PawPrint, Baby, Sailboat, Flag,
  Building2, Thermometer, Wifi, Shirt, Stethoscope, Accessibility, Utensils,
  DoorOpen, ArrowUpDown, HandHeart as PrayerIcon, Armchair, Briefcase, Users,
  Camera, Landmark, Wallet, Signal, Tv, Phone, Layers, Warehouse, Package,
  Trash2, Wrench, SprayCan,
} from 'lucide-react'

// Same amenity vocabulary Property already uses (see the shared AMENITY_META
// lookup in PropertyDetailClient.tsx / AMENITY_GROUPS in PropertyForm.tsx) —
// kept here as a single shared source so Project's amenities checkboxes and
// icon display stay in lockstep instead of drifting from a second hand-
// copied list.
export const AMENITIES: { key: string; label: string; icon: any }[] = [
  { key: 'pool',             label: 'Swimming Pool',      icon: Waves },
  { key: 'gym',              label: 'Gym or Health Club', icon: Dumbbell },
  { key: 'concierge',        label: '24 Hours Concierge', icon: ConciergeBell },
  { key: 'security24h',      label: 'Security Staff',     icon: ShieldCheck },
  { key: 'smartHome',        label: 'Smart Home',         icon: Smartphone },
  { key: 'centralAC',        label: 'Centrally Air-Conditioned', icon: Snowflake },
  { key: 'builtInWardrobes', label: 'Built-in Wardrobes', icon: DoorClosed },
  { key: 'coveredParking',   label: 'Covered Parking',    icon: Car },
  { key: 'maidRoom',         label: 'Maids Room',         icon: BedDouble },
  { key: 'studyRoom',        label: 'Study Room',         icon: BookOpen },
  { key: 'jacuzzi',          label: 'Jacuzzi',            icon: Bath },
  { key: 'bbqArea',          label: 'Barbeque Area',      icon: Flame },
  { key: 'petsAllowed',      label: 'Pets Allowed',       icon: PawPrint },
  { key: 'childrenPlay',     label: 'Kids Play Area',     icon: Baby },
  { key: 'viewSea',          label: 'Sea View',           icon: Sailboat },
  { key: 'viewGolf',         label: 'Golf View',          icon: Flag },
  { key: 'viewBurjKhalifa',  label: 'Burj Khalifa View',  icon: Building2 },
  { key: 'sauna',            label: 'Sauna',              icon: Thermometer },
  { key: 'internetReady',    label: 'Internet Ready',     icon: Wifi },
  { key: 'laundryRoom',      label: 'Laundry Room',       icon: Shirt },
  { key: 'dayCareCenter',        label: 'Day Care Center',           icon: Baby },
  { key: 'lawnOrGarden',         label: 'Lawn or Garden',            icon: Flag },
  { key: 'cafeteriaCanteen',     label: 'Cafeteria or Canteen',      icon: Utensils },
  { key: 'firstAidMedical',      label: 'First Aid Medical Center',  icon: Stethoscope },
  { key: 'steamRoom',            label: 'Steam Room',                icon: Thermometer },
  { key: 'facilitiesForDisabled',label: 'Facilities for Disabled',   icon: Accessibility },
  { key: 'laundryFacility',      label: 'Laundry Facility',          icon: Shirt },
  { key: 'sharedKitchen',        label: 'Shared Kitchen',            icon: Utensils },
  { key: 'balconyOrTerrace',     label: 'Balcony or Terrace',        icon: DoorOpen },
  { key: 'lobbyInBuilding',      label: 'Lobby in Building',         icon: Building2 },
  { key: 'serviceElevators',     label: 'Service Elevators',         icon: ArrowUpDown },
  { key: 'prayerRoom',           label: 'Prayer Room',               icon: PrayerIcon },
  { key: 'receptionRoom',        label: 'Reception/Waiting Room',    icon: Armchair },
  { key: 'elevatorsInBuilding',  label: 'Elevators in Building',     icon: ArrowUpDown },
  { key: 'businessCenter',       label: 'Business Center',           icon: Briefcase },
  { key: 'conferenceRoom',       label: 'Conference Room',           icon: Users },
  { key: 'cctvSecurity',         label: 'CCTV Security',             icon: Camera },
  { key: 'freehold',             label: 'Freehold',                  icon: Landmark },
  { key: 'atmFacility',          label: 'ATM Facility',              icon: Wallet },
  { key: 'broadbandInternet',    label: 'Broadband Internet',        icon: Signal },
  { key: 'satelliteTV',          label: 'Satellite/Cable TV',        icon: Tv },
  { key: 'intercom',             label: 'Intercom',                  icon: Phone },
  { key: 'doubleGlazedWindows',  label: 'Double Glazed Windows',     icon: Layers },
  { key: 'centralHeating',       label: 'Central Heating',           icon: Thermometer },
  { key: 'electricityBackup',    label: 'Electricity Backup',        icon: Warehouse },
  { key: 'storageAreas',         label: 'Storage Areas',             icon: Package },
  { key: 'wasteDisposal',        label: 'Waste Disposal',            icon: Trash2 },
  { key: 'maintenanceStaff',     label: 'Maintenance Staff',         icon: Wrench },
  { key: 'cleaningServices',     label: 'Cleaning Services',         icon: SprayCan },
]

export const AMENITY_META: Record<string, { label: string; icon: any }> =
  Object.fromEntries(AMENITIES.map(a => [a.key, { label: a.label, icon: a.icon }]))

// Categorized view for display/checkbox UIs that want the Bayut-style
// grouped layout (e.g. the property detail page's Amenities & Features
// section) instead of one flat grid.
export const AMENITY_GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Recreation and Family', keys: ['bbqArea', 'dayCareCenter', 'childrenPlay', 'lawnOrGarden', 'cafeteriaCanteen'] },
  { title: 'Health and Fitness', keys: ['firstAidMedical', 'gym', 'jacuzzi', 'sauna', 'steamRoom', 'pool', 'facilitiesForDisabled'] },
  { title: 'Laundry and Kitchen', keys: ['laundryRoom', 'laundryFacility', 'sharedKitchen'] },
  { title: 'Building', keys: ['balconyOrTerrace', 'lobbyInBuilding', 'serviceElevators', 'prayerRoom', 'receptionRoom', 'elevatorsInBuilding', 'coveredParking'] },
  { title: 'Business and Security', keys: ['businessCenter', 'conferenceRoom', 'security24h', 'cctvSecurity'] },
  { title: 'Miscellaneous', keys: ['freehold', 'atmFacility', 'maidRoom', 'concierge', 'viewSea', 'viewGolf', 'viewBurjKhalifa'] },
  { title: 'Technology', keys: ['broadbandInternet', 'satelliteTV', 'intercom', 'internetReady'] },
  { title: 'Features', keys: ['doubleGlazedWindows', 'centralAC', 'centralHeating', 'electricityBackup', 'smartHome', 'storageAreas', 'studyRoom', 'builtInWardrobes', 'petsAllowed'] },
  { title: 'Cleaning and Maintenance', keys: ['wasteDisposal', 'maintenanceStaff', 'cleaningServices'] },
]
