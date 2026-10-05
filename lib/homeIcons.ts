import {
  CheckCircle2, ShieldCheck, Lock, BarChart3, Link2, Globe2,
  Users, Building2, Shield, TrendingUp, Award, Star, Home,
  TrainFront, Bus, GraduationCap, ShoppingBag, HeartPulse, TreePine, Plane, Waves, MapPin,
  FileSearch, TrendingDown, Gavel, AlertTriangle, Clock, Banknote, Handshake, FileCheck,
  Ruler, ClipboardCheck, Users2, Wrench, Heart, Target, Eye,
} from 'lucide-react'
import DirhamIcon from '@/components/shared/DirhamIcon'

// CMS content (homepage why-cards/stats, and the generic content-page sections used by the distress-sale
// landing pages + About page) stores icons as string keys rather than component references — this registry is
// the single source of truth mapping those keys to actual icons, shared by every public render and every admin
// editor's icon picker.
export const HOME_ICON_MAP: Record<string, any> = {
  CheckCircle2, ShieldCheck, Lock, BarChart3, Link2, Globe2,
  Users, Building2, Shield, TrendingUp, Award, Star, Home,
  TrainFront, Bus, GraduationCap, ShoppingBag, HeartPulse, TreePine, Plane, Waves, MapPin,
  FileSearch, TrendingDown, Gavel, AlertTriangle, Clock, Banknote, Handshake, FileCheck,
  Ruler, ClipboardCheck, Users2, Wrench, Heart, Target, Eye,
  // The UAE dirham symbol. "DollarSign" is kept as a name so content saved with it shows the dirham symbol too.
  Dirham: DirhamIcon, DollarSign: DirhamIcon,
}

export const HOME_ICON_OPTIONS = Object.keys(HOME_ICON_MAP)
export const DEFAULT_HOME_ICON = CheckCircle2
