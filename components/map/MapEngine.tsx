'use client'
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Check, X } from 'lucide-react'
import { DUBAI_CENTER, PIN_URL, baseMapOptions, useGoogleMapsStatus, useMapTheme, type MapBounds } from '@/lib/googleMaps'
import { MAP_STYLES } from '@/lib/mapStyles'
import MapStatusOverlay from '@/components/shared/MapStatusOverlay'
import {
  areaKey, buildHeatScale, compactPrice,
  type ColorMode, type DrawMode, type MapPin, type MapType, type SearchArea, type ViewState,
} from '@/lib/mapPins'

export interface MapEngineHandle {
  fitToPins: () => void
  panTo: (lat: number, lng: number, minZoom?: number) => void
  openStreetView: (lat: number, lng: number) => Promise<boolean>
  closeStreetView: () => void
  // Searched-for place: drop a pin there and frame it (its bounds when it has them, else a street-level zoom).
  showPlace: (lat: number, lng: number, label: string, viewport?: MapBounds) => void
  clearPlace: () => void
}

interface Props {
  // The page's handle onto the map (fit / pan / Street View). A plain prop rather than a
  // forwarded ref because this component is loaded through next/dynamic, which can't pass refs.
  engineRef: Ref<MapEngineHandle>
  pins: MapPin[]
  selectedId: string | null
  hoverId: string | null
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onViewportChange: (v: ViewState) => void
  drawMode: DrawMode
  onDrawModeChange: (m: DrawMode) => void
  area: SearchArea
  onAreaChange: (a: SearchArea) => void
  // Radius for a newly drawn circle (km).
  radiusKm: number
  mapType: MapType
  traffic: boolean
  transit: boolean
  colorMode: ColorMode
  clustering: boolean
  userLocation: { lat: number; lng: number } | null
  // The places of a drive-time search, drawn as lettered dots (A / B).
  commutePlaces?: { tag: string; label: string; lat: number; lng: number }[]
  // Road routes to draw (one line per start point) — the directions to the selected property.
  routes?: { tag: string; path: [number, number][] }[]
  // Fired when Street View opens/closes, so the page can hide its own overlays while it is up.
  onStreetViewChange?: (open: boolean) => void
  initialView?: { lat: number; lng: number; zoom: number }
  // Bump to make the map re-frame the drawn area (or, with none, the pins).
  fitSignal: number
}

const CLUSTER_CELL_PX = 64
const CLUSTER_MAX_ZOOM = 16
const BRAND = '#CB0101'

type RenderItem =
  | { key: string; kind: 'pin'; lat: number; lng: number; pin: MapPin; color?: string }
  | { key: string; kind: 'cluster'; lat: number; lng: number; pins: MapPin[] }

// ── Overlay layer that owns every price pill and cluster bubble ─────────────
// One OverlayView (not one per marker) so 1000 pins is a single DOM subtree
// that Google repositions in one draw() pass.
function createPinLayer(g: any) {
  return class PinLayer extends g.maps.OverlayView {
    root: HTMLDivElement | null = null
    els = new Map<string, HTMLElement>()
    items: RenderItem[] = []
    selectedId: string | null = null
    hoverId: string | null = null
    handlers: { onPin: (p: MapPin) => void; onCluster: (pins: MapPin[]) => void; onHover: (id: string | null) => void }

    constructor(handlers: PinLayer['handlers']) {
      super()
      this.handlers = handlers
    }

    onAdd() {
      this.root = document.createElement('div')
      this.root.style.position = 'absolute'
      this.getPanes().overlayMouseTarget.appendChild(this.root)
      this.sync()
    }

    onRemove() {
      this.root?.remove()
      this.root = null
      this.els.clear()
    }

    setItems(items: RenderItem[]) {
      this.items = items
      this.sync()
    }

    setState(selectedId: string | null, hoverId: string | null) {
      this.selectedId = selectedId
      this.hoverId = hoverId
      this.applyState()
    }

    private create(item: RenderItem): HTMLElement {
      const anchor = document.createElement('div')
      anchor.className = 'map-anchor'
      const inner = document.createElement('div')
      anchor.appendChild(inner)
      // The transform that centres the node on its coordinate lives on the anchor.
      anchor.style.transform = 'translate(-50%, -50%)'
      anchor.addEventListener('click', e => {
        e.stopPropagation()
        const it = (anchor as any).__item as RenderItem
        if (it.kind === 'pin') this.handlers.onPin(it.pin)
        else this.handlers.onCluster(it.pins)
      })
      anchor.addEventListener('mouseenter', () => {
        const it = (anchor as any).__item as RenderItem
        if (it.kind === 'pin') this.handlers.onHover(it.pin.id)
      })
      anchor.addEventListener('mouseleave', () => this.handlers.onHover(null))
      // Stop the map treating a press on a pin as the start of a drag / dblclick zoom.
      anchor.addEventListener('dblclick', e => e.stopPropagation())
      ;(anchor as any).__item = item
      this.paint(anchor, item)
      return anchor
    }

    private paint(anchor: HTMLElement, item: RenderItem) {
      const inner = anchor.firstChild as HTMLElement
      ;(anchor as any).__item = item
      if (item.kind === 'cluster') {
        const n = item.pins.length
        const size = Math.round(Math.min(64, 34 + Math.log2(n) * 7))
        inner.className = 'map-cluster'
        inner.style.width = inner.style.height = `${size}px`
        inner.style.fontSize = size > 46 ? '15px' : '13px'
        inner.style.background = ''
        inner.textContent = n > 999 ? '999+' : String(n)
        inner.title = `${n} properties — click to zoom in`
      } else {
        const p = item.pin
        inner.className = `map-pin${p.offPlan ? ' is-offplan' : ''}`
        inner.style.background = item.color ?? ''
        inner.textContent = `${p.featured ? '★ ' : ''}${compactPrice(p)}`
        inner.title = `${p.title}${p.area ? ` · ${p.area}` : ''}`
      }
    }

    private sync() {
      if (!this.root) return
      const keep = new Set(this.items.map(i => i.key))
      this.els.forEach((el, k) => { if (!keep.has(k)) { el.remove(); this.els.delete(k) } })
      for (const item of this.items) {
        let el = this.els.get(item.key)
        if (!el) {
          el = this.create(item)
          this.els.set(item.key, el)
          this.root.appendChild(el)
        } else {
          this.paint(el, item)
        }
      }
      this.applyState()
      this.draw()
    }

    private applyState() {
      this.els.forEach(el => {
        const it = (el as any).__item as RenderItem
        const inner = el.firstChild as HTMLElement
        if (it.kind !== 'pin') { el.style.zIndex = '1'; return }
        const selected = it.pin.id === this.selectedId
        const hover = it.pin.id === this.hoverId
        inner.classList.toggle('is-selected', selected)
        inner.classList.toggle('is-hover', hover && !selected)
        el.style.zIndex = selected ? '1000' : hover ? '500' : it.pin.featured ? '10' : '2'
      })
    }

    draw() {
      const proj = this.getProjection()
      if (!proj || !this.root) return
      this.els.forEach(el => {
        const it = (el as any).__item as RenderItem
        const pt = proj.fromLatLngToDivPixel(new g.maps.LatLng(it.lat, it.lng))
        if (!pt) return
        el.style.left = `${pt.x}px`
        el.style.top = `${pt.y}px`
      })
    }
  }
}

// Grid clustering in world-pixel space: cells are a fixed pixel size at the
// current zoom, anchored to the world (not the viewport), so panning never
// reshuffles clusters — only zooming does.
function buildItems(
  g: any, map: any, pins: MapPin[], selectedId: string | null,
  heat: ((p: MapPin) => string) | null, clustering: boolean,
): RenderItem[] {
  const single = (p: MapPin): RenderItem => ({ key: p.id, kind: 'pin', lat: p.lat, lng: p.lng, pin: p, color: heat ? heat(p) : undefined })
  const zoom = map.getZoom() ?? 11
  const proj = map.getProjection()
  if (!clustering || !proj || zoom >= CLUSTER_MAX_ZOOM || pins.length < 2) return pins.map(single)

  const scale = 2 ** zoom
  const cells = new Map<string, MapPin[]>()
  const items: RenderItem[] = []
  for (const p of pins) {
    // The selected pin always stays visible on its own.
    if (p.id === selectedId) { items.push(single(p)); continue }
    const pt = proj.fromLatLngToPoint(new g.maps.LatLng(p.lat, p.lng))
    const key = `${Math.floor((pt.x * scale) / CLUSTER_CELL_PX)}:${Math.floor((pt.y * scale) / CLUSTER_CELL_PX)}`
    const bucket = cells.get(key)
    if (bucket) bucket.push(p); else cells.set(key, [p])
  }
  cells.forEach((group, key) => {
    if (group.length === 1) { items.push(single(group[0])); return }
    const lat = group.reduce((s, p) => s + p.lat, 0) / group.length
    const lng = group.reduce((s, p) => s + p.lng, 0) / group.length
    items.push({ key: `c:${key}:${group.length}`, kind: 'cluster', lat, lng, pins: group })
  })
  return items
}

export default function MapEngine(props: Props) {
  const propsRef = useRef(props)
  propsRef.current = props

  const containerRef = useRef<HTMLDivElement>(null)
  const gRef = useRef<any>(null)
  const mapRef = useRef<any>(null)
  const layerRef = useRef<any>(null)
  const trafficRef = useRef<any>(null)
  const transitRef = useRef<any>(null)
  const userDotRef = useRef<any>(null)
  const placeMarkerRef = useRef<any>(null)
  const commuteMarkersRef = useRef<any[]>([])
  const routeLinesRef = useRef<any[]>([])
  const areaOverlayRef = useRef<any>(null)
  const lastAreaKeyRef = useRef('')
  const drawRef = useRef<{ cleanup: () => void; finish: () => void } | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const [drawCount, setDrawCount] = useState(0)
  const theme = useMapTheme()

  // ── Rebuild pills/clusters from current props ────────────────────────────
  const rebuild = useCallback(() => {
    const map = mapRef.current, layer = layerRef.current, g = gRef.current
    if (!map || !layer || !g) return
    const { pins, selectedId, colorMode, clustering, hoverId } = propsRef.current
    const heat = colorMode === 'ppsf' ? buildHeatScale(pins) : null
    layer.setItems(buildItems(g, map, pins, selectedId, heat, clustering))
    layer.setState(selectedId, hoverId)
  }, [])

  const emitViewport = useCallback(() => {
    const map = mapRef.current
    const b = map?.getBounds()
    if (!map || !b) return
    const ne = b.getNorthEast(), sw = b.getSouthWest(), c = map.getCenter()
    propsRef.current.onViewportChange({
      bounds: { swLat: sw.lat(), swLng: sw.lng(), neLat: ne.lat(), neLng: ne.lng() },
      zoom: map.getZoom() ?? 11,
      center: { lat: c.lat(), lng: c.lng() },
    })
  }, [])

  const emitArea = useCallback((a: SearchArea) => {
    lastAreaKeyRef.current = areaKey(a)
    propsRef.current.onAreaChange(a)
  }, [])

  // ── Area overlay (polygon / circle the user drew) ────────────────────────
  const setAreaOverlay = useCallback((area: SearchArea) => {
    const g = gRef.current, map = mapRef.current
    if (!g || !map) return
    const existing = areaOverlayRef.current

    // A radius/centre change from the slider updates the circle in place.
    if (area?.kind === 'circle' && existing?.__kind === 'circle') {
      existing.setCenter({ lat: area.lat, lng: area.lng })
      existing.setRadius(area.radiusKm * 1000)
      return
    }
    existing?.setMap(null)
    areaOverlayRef.current = null
    if (!area) return

    const style = { strokeColor: BRAND, strokeWeight: 2.5, fillColor: BRAND, fillOpacity: 0.12, editable: true, draggable: true, zIndex: 1 }
    let timer: any
    const debounced = (fn: () => void) => { clearTimeout(timer); timer = setTimeout(fn, 250) }

    if (area.kind === 'polygon') {
      const poly = new g.maps.Polygon({ map, ...style, paths: area.path.map(([lat, lng]) => ({ lat, lng })) })
      const path = poly.getPath()
      const emit = () => debounced(() => emitArea({ kind: 'polygon', path: path.getArray().map((ll: any) => [ll.lat(), ll.lng()] as [number, number]) }))
      ;['set_at', 'insert_at', 'remove_at'].forEach(ev => g.maps.event.addListener(path, ev, emit))
      g.maps.event.addListener(poly, 'dragend', emit)
      poly.__kind = 'polygon'
      areaOverlayRef.current = poly
    } else {
      const circle = new g.maps.Circle({ map, ...style, center: { lat: area.lat, lng: area.lng }, radius: area.radiusKm * 1000 })
      const emit = () => debounced(() => {
        const c = circle.getCenter()
        emitArea({ kind: 'circle', lat: c.lat(), lng: c.lng(), radiusKm: circle.getRadius() / 1000 })
      })
      g.maps.event.addListener(circle, 'radius_changed', emit)
      g.maps.event.addListener(circle, 'center_changed', emit)
      circle.__kind = 'circle'
      areaOverlayRef.current = circle
    }
  }, [emitArea])

  // ── Map creation ─────────────────────────────────────────────────────────
  const status = useGoogleMapsStatus(g => {
    if (!containerRef.current || mapRef.current) return
    gRef.current = g
    const iv = propsRef.current.initialView
    const map = new g.maps.Map(containerRef.current, {
      ...baseMapOptions(theme),
      center: iv ? { lat: iv.lat, lng: iv.lng } : DUBAI_CENTER,
      zoom: iv?.zoom ?? 11,
      gestureHandling: 'greedy',
      zoomControl: true,
      zoomControlOptions: { position: g.maps.ControlPosition.RIGHT_BOTTOM },
      rotateControl: false,
    })
    mapRef.current = map

    const pano = map.getStreetView()
    pano.addListener('visible_changed', () => propsRef.current.onStreetViewChange?.(!!pano.getVisible()))

    // The page can resize the map's box (collapsing the results panel) — tell Google to re-measure.
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver(() => g.maps.event.trigger(map, 'resize'))
      resizeObserverRef.current.observe(containerRef.current)
    }

    const PinLayer = createPinLayer(g)
    const layer = new PinLayer({
      onPin: (p: MapPin) => propsRef.current.onSelect(p.id),
      onCluster: (pins: MapPin[]) => {
        const b = new g.maps.LatLngBounds()
        pins.forEach(p => b.extend({ lat: p.lat, lng: p.lng }))
        const sw = b.getSouthWest(), ne = b.getNorthEast()
        // Pins sharing (almost) one coordinate can't be pulled apart by fitting bounds — just zoom in.
        if (Math.abs(ne.lat() - sw.lat()) < 1e-5 && Math.abs(ne.lng() - sw.lng()) < 1e-5) map.setZoom(Math.min(20, (map.getZoom() ?? 11) + 3))
        else map.fitBounds(b, 90)
      },
      onHover: (id: string | null) => propsRef.current.onHover(id),
    })
    layer.setMap(map)
    layerRef.current = layer

    map.addListener('idle', () => { rebuild(); emitViewport() })
    map.addListener('zoom_changed', rebuild)
    map.addListener('click', () => { if (!drawRef.current) propsRef.current.onSelect(null) })
  })

  // ── Reactions to prop changes ────────────────────────────────────────────
  useEffect(() => { if (status === 'ready') rebuild() }, [status, rebuild, props.pins, props.colorMode, props.clustering, props.selectedId])

  useEffect(() => { layerRef.current?.setState(props.selectedId, props.hoverId) }, [props.selectedId, props.hoverId])

  useEffect(() => { mapRef.current?.setOptions({ styles: MAP_STYLES[theme] }) }, [theme, status])

  useEffect(() => { mapRef.current?.setMapTypeId(props.mapType) }, [props.mapType, status])

  useEffect(() => {
    const map = mapRef.current, g = gRef.current
    if (!map || !g) return
    if (props.traffic && !trafficRef.current) { trafficRef.current = new g.maps.TrafficLayer(); trafficRef.current.setMap(map) }
    if (!props.traffic && trafficRef.current) { trafficRef.current.setMap(null); trafficRef.current = null }
  }, [props.traffic, status])

  useEffect(() => {
    const map = mapRef.current, g = gRef.current
    if (!map || !g) return
    if (props.transit && !transitRef.current) { transitRef.current = new g.maps.TransitLayer(); transitRef.current.setMap(map) }
    if (!props.transit && transitRef.current) { transitRef.current.setMap(null); transitRef.current = null }
  }, [props.transit, status])

  // "You are here" dot.
  useEffect(() => {
    const map = mapRef.current, g = gRef.current
    if (!map || !g) return
    userDotRef.current?.setMap(null)
    userDotRef.current = null
    if (props.userLocation) {
      userDotRef.current = new g.maps.Marker({
        map, position: props.userLocation, clickable: false, zIndex: 5,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#2563EB', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
      })
    }
  }, [props.userLocation, status])

  // A / B markers of the drive-time search.
  useEffect(() => {
    const map = mapRef.current, g = gRef.current
    if (!map || !g) return
    commuteMarkersRef.current.forEach(m => m.setMap(null))
    commuteMarkersRef.current = (props.commutePlaces ?? []).map(p => new g.maps.Marker({
      map, position: { lat: p.lat, lng: p.lng }, title: p.label, zIndex: 30,
      label: { text: p.tag, color: '#fff', fontSize: '12px', fontWeight: '700' },
      icon: { path: g.maps.SymbolPath.CIRCLE, scale: 14, fillColor: p.tag === 'B' ? '#7C3AED' : '#1D4ED8', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
    }))
  }, [props.commutePlaces, status])

  // Directions: each route is a white casing under a coloured line, then the map frames all of them.
  useEffect(() => {
    const map = mapRef.current, g = gRef.current
    if (!map || !g) return
    routeLinesRef.current.forEach(l => l.setMap(null))
    routeLinesRef.current = []
    const routes = props.routes ?? []
    if (routes.length === 0) return
    const bounds = new g.maps.LatLngBounds()
    routes.forEach((r, i) => {
      const path = r.path.map(([lat, lng]) => ({ lat, lng }))
      path.forEach(pt => bounds.extend(pt))
      const color = r.tag === 'B' ? '#7C3AED' : '#1D4ED8'
      routeLinesRef.current.push(
        new g.maps.Polyline({ map, path, clickable: false, strokeColor: '#FFFFFF', strokeOpacity: 1, strokeWeight: 9, zIndex: 10 + i * 2 }),
        new g.maps.Polyline({ map, path, clickable: false, strokeColor: color, strokeOpacity: 0.95, strokeWeight: 5, zIndex: 11 + i * 2 }),
      )
    })
    map.fitBounds(bounds, { top: 90, left: 70, right: 70, bottom: 250 })
    g.maps.event.addListenerOnce(map, 'idle', () => { if ((map.getZoom() ?? 0) > 16) map.setZoom(16) })
  }, [props.routes, status])

  // Keep the drawn overlay in step with the `area` prop (clear / share link / slider),
  // ignoring the echo of a change the overlay itself just reported.
  useEffect(() => {
    if (status !== 'ready') return
    const key = areaKey(props.area)
    if (key === lastAreaKeyRef.current && (props.area === null) === !areaOverlayRef.current) return
    lastAreaKeyRef.current = key
    setAreaOverlay(props.area)
  }, [props.area, status, setAreaOverlay])

  // Re-frame on demand.
  useEffect(() => {
    const map = mapRef.current, g = gRef.current
    if (!map || !g || props.fitSignal === 0) return
    const b = new g.maps.LatLngBounds()
    const overlay = areaOverlayRef.current
    if (overlay?.__kind === 'circle') { map.fitBounds(overlay.getBounds(), 40); return }
    if (overlay?.__kind === 'polygon') {
      overlay.getPath().forEach((ll: any) => b.extend(ll))
      map.fitBounds(b, 40)
      return
    }
    const pins = propsRef.current.pins
    if (pins.length === 0) return
    pins.forEach(p => b.extend({ lat: p.lat, lng: p.lng }))
    map.fitBounds(b, 70)
    if ((map.getZoom() ?? 0) > 16) map.setZoom(16)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.fitSignal])

  // ── Drawing tools ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current, g = gRef.current
    if (status !== 'ready' || !map || !g) return

    drawRef.current?.cleanup()
    drawRef.current = null
    setDrawCount(0)

    if (props.drawMode === 'none') {
      map.setOptions({ draggableCursor: null, disableDoubleClickZoom: false })
      return
    }
    map.setOptions({ draggableCursor: 'crosshair', disableDoubleClickZoom: true })
    propsRef.current.onSelect(null)

    const listeners: any[] = []
    const artifacts: any[] = []
    const cleanup = () => { listeners.forEach(l => g.maps.event.removeListener(l)); artifacts.forEach(a => a.setMap(null)) }

    if (props.drawMode === 'circle') {
      listeners.push(map.addListener('click', (e: any) => {
        const a: SearchArea = { kind: 'circle', lat: e.latLng.lat(), lng: e.latLng.lng(), radiusKm: propsRef.current.radiusKm }
        emitArea(a)
        setAreaOverlay(a)
        propsRef.current.onDrawModeChange('none')
      }))
      drawRef.current = { cleanup, finish: () => {} }
      return cleanup
    }

    // Polygon: click to add corners; click the first corner, press Enter, or hit Finish to close.
    const points: any[] = []
    const line = new g.maps.Polyline({ map, path: points, strokeColor: BRAND, strokeWeight: 3, clickable: false, zIndex: 3 })
    artifacts.push(line)
    let firstDot: any = null

    const finish = () => {
      if (points.length < 3) return
      const path = points.map(ll => [ll.lat(), ll.lng()] as [number, number])
      const a: SearchArea = { kind: 'polygon', path }
      emitArea(a)
      setAreaOverlay(a)
      propsRef.current.onDrawModeChange('none')
    }

    listeners.push(map.addListener('click', (e: any) => {
      points.push(e.latLng)
      line.setPath(points)
      setDrawCount(points.length)
      if (points.length === 1) {
        firstDot = new g.maps.Marker({
          map, position: e.latLng, zIndex: 9999,
          icon: { path: g.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#fff', fillOpacity: 1, strokeColor: BRAND, strokeWeight: 3 },
        })
        artifacts.push(firstDot)
        listeners.push(firstDot.addListener('click', () => finish()))
      }
    }))

    drawRef.current = { cleanup, finish }
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.drawMode, status])

  useEffect(() => () => resizeObserverRef.current?.disconnect(), [])

  // Esc backs out of drawing / deselects; Enter closes a polygon in progress.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && propsRef.current.drawMode === 'polygon') { drawRef.current?.finish(); return }
      if (e.key !== 'Escape') return
      if (propsRef.current.drawMode !== 'none') propsRef.current.onDrawModeChange('none')
      else propsRef.current.onSelect(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Imperative API for the page ──────────────────────────────────────────
  useImperativeHandle(props.engineRef, () => ({
    fitToPins() {
      const map = mapRef.current, g = gRef.current
      const pins = propsRef.current.pins
      if (!map || !g || pins.length === 0) return
      const b = new g.maps.LatLngBounds()
      pins.forEach(p => b.extend({ lat: p.lat, lng: p.lng }))
      map.fitBounds(b, 70)
      if ((map.getZoom() ?? 0) > 16) map.setZoom(16)
    },
    panTo(lat, lng, minZoom) {
      const map = mapRef.current
      if (!map) return
      map.panTo({ lat, lng })
      if (minZoom && (map.getZoom() ?? 0) < minZoom) map.setZoom(minZoom)
    },
    closeStreetView() {
      mapRef.current?.getStreetView().setVisible(false)
    },
    showPlace(lat, lng, label, viewport) {
      const map = mapRef.current, g = gRef.current
      if (!map || !g) return
      placeMarkerRef.current?.setMap(null)
      placeMarkerRef.current = new g.maps.Marker({
        map, position: { lat, lng }, title: label, zIndex: 20,
        icon: { url: PIN_URL, scaledSize: new g.maps.Size(30, 40), anchor: new g.maps.Point(15, 40) },
      })
      if (viewport) {
        map.fitBounds({ south: viewport.swLat, west: viewport.swLng, north: viewport.neLat, east: viewport.neLng }, 40)
        // A whole emirate or a single building both come with bounds — keep the result readable.
        g.maps.event.addListenerOnce(map, 'idle', () => {
          const z = map.getZoom() ?? 0
          if (z > 16) map.setZoom(16)
        })
      } else {
        map.panTo({ lat, lng })
        map.setZoom(15)
      }
    },
    clearPlace() {
      placeMarkerRef.current?.setMap(null)
      placeMarkerRef.current = null
    },
    openStreetView(lat, lng) {
      const map = mapRef.current, g = gRef.current
      if (!map || !g) return Promise.resolve(false)
      return new Promise(resolve => {
        new g.maps.StreetViewService().getPanorama({ location: { lat, lng }, radius: 120 }, (data: any, st: string) => {
          if (st !== 'OK' || !data?.location?.latLng) return resolve(false)
          const pano = map.getStreetView()
          pano.setPosition(data.location.latLng)
          pano.setPov({ heading: 0, pitch: 0 })
          pano.setVisible(true)
          resolve(true)
        })
      })
    },
  }), [])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" style={{ background: 'var(--bg-alt)' }} />
      <MapStatusOverlay status={status} />

      {props.drawMode !== 'none' && status === 'ready' && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg text-xs"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <span className="font-semibold">
            {props.drawMode === 'polygon'
              ? drawCount < 3 ? `Click the map to add corners (${drawCount}/3 minimum)` : `${drawCount} corners — click the first dot, press Enter, or hit Finish`
              : 'Click the map to set the centre of your search circle'}
          </span>
          {props.drawMode === 'polygon' && drawCount >= 3 && (
            <button onClick={() => drawRef.current?.finish()} className="btn-primary btn-sm gap-1" style={{ padding: '4px 10px' }}>
              <Check size={12} /> Finish
            </button>
          )}
          <button onClick={() => props.onDrawModeChange('none')} className="p-1 rounded-md hover:opacity-70" aria-label="Cancel drawing" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
