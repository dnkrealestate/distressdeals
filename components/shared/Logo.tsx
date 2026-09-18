import Link from 'next/link'
import { LOGO_FULL_SVG, LOGO_ICON_SVG } from './logoMarkup'

// The one place the actual brand mark is rendered — every header, sidebar,
// and auth screen pulls from here instead of each recreating its own icon.
// The embedded SVG markup (see logoMarkup.ts) has its black fills swapped
// for `currentColor` — inlining the raw markup (instead of an <img src>,
// which is an opaque, uncolorable sub-document) lets the wrapping element's
// `color` drive those fills, so the wordmark follows dark mode automatically
// while the brand red stays fixed. Plain string constants rather than a
// runtime `fs` read, so this stays safe to import from Client Components.
const FULL_ASPECT = 1440 / 295
const ICON_ASPECT = 452 / 441

export function Logo({
  href = '/', variant = 'full', height = 32, className, boxed = false,
}: {
  href?: string | null
  variant?: 'full' | 'icon'
  height?: number
  className?: string
  // Wraps the icon in a translucent white pill — for sitting on top of a
  // colored gradient panel (auth screens) where the icon's own dark mark
  // would otherwise blend into the background.
  boxed?: boolean
}) {
  const aspect = variant === 'icon' ? ICON_ASPECT : FULL_ASPECT
  const svg = variant === 'icon' ? LOGO_ICON_SVG : LOGO_FULL_SVG
  const width = Math.round(height * aspect)

  const img = (
    <span
      role="img" aria-label="Distress Deals UAE"
      className={className}
      style={{ width, height, color: 'var(--text)', flexShrink: 0, display: 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )

  const content = boxed ? (
    <div
      className="rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.92)', padding: Math.round(height * 0.18), color: '#0A0A0A' }}
    >
      {img}
    </div>
  ) : img

  if (href === null) return content

  return (
    <Link href={href} className="flex items-center flex-shrink-0 no-select">
      {content}
    </Link>
  )
}
