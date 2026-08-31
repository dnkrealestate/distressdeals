import {
  Waves, Dumbbell, ConciergeBell, ShieldCheck, Smartphone, Snowflake, DoorClosed,
  Car, BedDouble, BookOpen, Bath, Flame, PawPrint, Baby, Sailboat, Flag,
  Building2, Thermometer, Wifi, Shirt,
} from 'lucide-react'

// Same amenity vocabulary Property already uses (see FEATURE_META in
// PropertyDetailClient.tsx / FEATURES in PropertyForm.tsx) — reused here as
// a single shared source so Project's amenities checkboxes and icon display
// stay in lockstep instead of drifting from a second hand-copied list.
export const AMENITIES: { key: string; label: string; icon: any }[] = [
  { key: 'pool',             label: 'Swimming Pool',      icon: Waves },
  { key: 'gym',              label: 'Gym',                icon: Dumbbell },
  { key: 'concierge',        label: 'Concierge',          icon: ConciergeBell },
  { key: 'security24h',      label: '24h Security',       icon: ShieldCheck },
  { key: 'smartHome',        label: 'Smart Home',         icon: Smartphone },
  { key: 'centralAC',        label: 'Central A/C',        icon: Snowflake },
  { key: 'builtInWardrobes', label: 'Built-in Wardrobes', icon: DoorClosed },
  { key: 'coveredParking',   label: 'Covered Parking',    icon: Car },
  { key: 'maidRoom',         label: 'Maid Room',          icon: BedDouble },
  { key: 'studyRoom',        label: 'Study Room',         icon: BookOpen },
  { key: 'jacuzzi',          label: 'Jacuzzi',            icon: Bath },
  { key: 'bbqArea',          label: 'BBQ Area',           icon: Flame },
  { key: 'petsAllowed',      label: 'Pets Allowed',       icon: PawPrint },
  { key: 'childrenPlay',     label: "Children's Play",    icon: Baby },
  { key: 'viewSea',          label: 'Sea View',           icon: Sailboat },
  { key: 'viewGolf',         label: 'Golf View',          icon: Flag },
  { key: 'viewBurjKhalifa',  label: 'Burj Khalifa View',  icon: Building2 },
  { key: 'sauna',            label: 'Sauna',              icon: Thermometer },
  { key: 'internetReady',    label: 'Internet Ready',     icon: Wifi },
  { key: 'laundryRoom',      label: 'Laundry Room',       icon: Shirt },
]

export const AMENITY_META: Record<string, { label: string; icon: any }> =
  Object.fromEntries(AMENITIES.map(a => [a.key, { label: a.label, icon: a.icon }]))
