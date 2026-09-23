// Distress Deals custom Google Maps look — muted neutral base so listing pins
// are the loudest thing on the map, brand red/orange only on major roads,
// and clutter (POI icons, transit) switched off. Uses classic JSON styling,
// which works with a plain API key (no Cloud Map ID needed). Keep in sync
// with mobile/constants/mapStyles.ts — same JSON, same look on both apps.
export type MapTheme = 'light' | 'dark'

type StyleRule = { featureType?: string; elementType?: string; stylers: Record<string, string>[] }

const LIGHT: StyleRule[] = [
  { elementType: 'geometry', stylers: [{ color: '#f4f6f9' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5b6675' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#dde2ea' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#e2eee6' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ visibility: 'on' }, { color: '#6f8f7a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e7eaf0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fde2d9' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#f7c4b4' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b23a1c' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfe0ee' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7c95aa' }] },
]

const DARK: StyleRule[] = [
  { elementType: 'geometry', stylers: [{ color: '#161b22' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1117' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#30363d' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#15251c' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ visibility: 'on' }, { color: '#5f8a70' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#242b34' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a2027' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4a2219' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2a130e' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#fd7147' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1a2a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a6a85' }] },
]

export const MAP_STYLES: Record<MapTheme, StyleRule[]> = { light: LIGHT, dark: DARK }
