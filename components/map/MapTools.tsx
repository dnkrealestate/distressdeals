'use client'
import { useState } from 'react'
import {
  Car, Circle as CircleIcon, Crosshair, Layers, Link2, LocateFixed, Maximize, PenTool, Trash2, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HEAT_GRADIENT, type ColorMode, type DrawMode, type MapType, type SearchArea } from '@/lib/mapPins'

const panel = 'rounded-xl shadow-lg'
const panelStyle = { background: 'var(--surface)', border: '1px solid var(--border)' } as const

function ToolButton({
  icon: Icon, label, active, disabled, onClick, danger, first,
}: {
  icon: any; label: string; active?: boolean; disabled?: boolean; onClick: () => void; danger?: boolean; first?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className="flex items-center gap-2 px-3 h-9 text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50"
      style={{
        color: active ? '#fff' : danger ? '#F43F5E' : 'var(--text-mid)',
        background: active ? 'var(--grad)' : 'transparent',
        borderTop: first ? undefined : '1px solid var(--border)',
      }}
    >
      <Icon size={14} className={disabled ? 'animate-spin' : undefined} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// Top-left tool strip: the "find by geography" tools.
export function MapToolbar({
  drawMode, onDrawMode, area, locating, onNearMe, onClearArea, onFit, onShare, onCommute, commuteActive,
}: {
  drawMode: DrawMode
  onDrawMode: (m: DrawMode) => void
  area: SearchArea
  locating: boolean
  onNearMe: () => void
  onClearArea: () => void
  onFit: () => void
  onShare: () => void
  onCommute?: () => void
  commuteActive?: boolean
}) {
  return (
    <div className={cn(panel, 'absolute top-3 left-3 z-10 flex flex-col overflow-hidden')} style={panelStyle}>
      <ToolButton first icon={PenTool} label="Draw area" active={drawMode === 'polygon'} onClick={() => onDrawMode(drawMode === 'polygon' ? 'none' : 'polygon')} />
      <ToolButton icon={CircleIcon} label="Radius" active={drawMode === 'circle'} onClick={() => onDrawMode(drawMode === 'circle' ? 'none' : 'circle')} />
      <ToolButton icon={locating ? Loader2 : LocateFixed} label="Near me" disabled={locating} onClick={onNearMe} />
      {onCommute && <ToolButton icon={Car} label="Drive time" active={commuteActive} onClick={onCommute} />}
      <ToolButton icon={Maximize} label="Fit results" onClick={onFit} />
      <ToolButton icon={Link2} label="Share view" onClick={onShare} />
      {area && <ToolButton icon={Trash2} label="Clear area" danger onClick={onClearArea} />}
    </div>
  )
}

// Slider for the circle's radius, shown while a circle is the active search area.
export function RadiusControl({
  area, count, onRadius,
}: {
  area: Extract<SearchArea, { kind: 'circle' }>
  count: number
  onRadius: (km: number) => void
}) {
  return (
    <div className={cn(panel, 'absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2.5 flex items-center gap-3')} style={panelStyle}>
      <Crosshair size={14} style={{ color: 'var(--teal)' }} />
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--text)' }}>
          Within {area.radiusKm < 1 ? `${Math.round(area.radiusKm * 1000)} m` : `${area.radiusKm.toFixed(1)} km`}
          <span style={{ color: 'var(--text-muted)' }}> · {count} {count === 1 ? 'property' : 'properties'}</span>
        </span>
        <input
          type="range" min={0.5} max={15} step={0.5} value={Math.min(15, Math.max(0.5, area.radiusKm))}
          onChange={e => onRadius(Number(e.target.value))}
          className="w-44 accent-[#CB0101]"
          aria-label="Search radius in kilometres"
        />
      </div>
    </div>
  )
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className="flex-1 px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
          style={{ background: value === o.v ? 'var(--grad)' : 'transparent', color: value === o.v ? '#fff' : 'var(--text-mid)' }}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs cursor-pointer" style={{ color: 'var(--text-mid)' }}>
      {label}
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="accent-[#CB0101] w-4 h-4" />
    </label>
  )
}

// Top-right layers panel.
export function LayersControl({
  mapType, onMapType, traffic, onTraffic, transit, onTransit, colorMode, onColorMode, clustering, onClustering,
}: {
  mapType: MapType; onMapType: (t: MapType) => void
  traffic: boolean; onTraffic: (v: boolean) => void
  transit: boolean; onTransit: (v: boolean) => void
  colorMode: ColorMode; onColorMode: (m: ColorMode) => void
  clustering: boolean; onClustering: (v: boolean) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(panel, 'flex items-center gap-2 px-3 h-9 text-xs font-semibold')}
        style={{ ...panelStyle, color: open ? 'var(--teal)' : 'var(--text-mid)' }}
        aria-expanded={open}
      >
        <Layers size={14} /> Layers
      </button>

      {open && (
        <div className={cn(panel, 'w-64 p-3.5 space-y-3.5')} style={panelStyle}>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Map</p>
            <Seg value={mapType} onChange={onMapType} options={[{ v: 'roadmap', l: 'Map' }, { v: 'satellite', l: 'Satellite' }, { v: 'hybrid', l: 'Hybrid' }]} />
          </div>
          <div className="space-y-2">
            <Toggle label="Live traffic" value={traffic} onChange={onTraffic} />
            <Toggle label="Public transit lines" value={transit} onChange={onTransit} />
            <Toggle label="Group nearby pins" value={clustering} onChange={onClustering} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Colour pins by</p>
            <Seg value={colorMode} onChange={onColorMode} options={[{ v: 'brand', l: 'Standard' }, { v: 'ppsf', l: 'AED / sqft' }]} />
          </div>
        </div>
      )}
    </div>
  )
}

export function HeatLegend() {
  return (
    <div className={cn(panel, 'absolute bottom-3 right-16 z-10 px-3 py-2')} style={panelStyle}>
      <div className="h-2 w-40 rounded-full" style={{ background: HEAT_GRADIENT }} />
      <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
        <span>Lower AED/sqft</span><span>Higher</span>
      </div>
    </div>
  )
}
