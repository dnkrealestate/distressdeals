import {
  CheckCircle2, ShieldCheck, Lock, BarChart3, Link2, Globe2,
  Users, Building2, DollarSign, Shield, TrendingUp, Award, Star, Home,
  TrainFront, Bus, GraduationCap, ShoppingBag, HeartPulse, TreePine, Plane, Waves, MapPin,
} from 'lucide-react'

// Homepage CMS content (why-cards, stats strip) stores icons as string keys
// rather than component references — this registry is the single source of
// truth mapping those keys to actual icons, shared by the public homepage
// render and the admin editor's icon picker.
export const HOME_ICON_MAP: Record<string, any> = {
  CheckCircle2, ShieldCheck, Lock, BarChart3, Link2, Globe2,
  Users, Building2, DollarSign, Shield, TrendingUp, Award, Star, Home,
  TrainFront, Bus, GraduationCap, ShoppingBag, HeartPulse, TreePine, Plane, Waves, MapPin,
}

export const HOME_ICON_OPTIONS = Object.keys(HOME_ICON_MAP)
export const DEFAULT_HOME_ICON = CheckCircle2
