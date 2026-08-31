import Image from 'next/image'
import Link from 'next/link'

// Real intrinsic pixel size of each source file (frontend/public/) — used to
// keep next/image's width/height (and therefore layout) at the correct
// aspect ratio no matter what display height a call site asks for.
const FULL_ASPECT = 261 / 86
const ICON_ASPECT = 1

// The one place the actual brand mark (frontend/public/logo.webp /
// logo-icon.webp) is rendered — every header, sidebar, and auth screen
// pulls from here instead of each recreating its own "D" gradient box.
export function Logo({
  href = '/', variant = 'full', height = 32, className, boxed = false,
}: {
  href?: string | null
  variant?: 'full' | 'icon'
  height?: number
  className?: string
  // Wraps the icon in a translucent white pill — for sitting on top of a
  // colored gradient panel (auth screens) where the icon's own gradient
  // square would otherwise blend into the background.
  boxed?: boolean
}) {
  const img = variant === 'icon' ? (
    <Image
      src="/logo-icon.webp" alt="Distress Deals UAE"
      width={Math.round(height * ICON_ASPECT)} height={height}
      className={className} priority
    />
  ) : (
    <Image
      src="/logo.webp" alt="Distress Deals UAE"
      width={Math.round(height * FULL_ASPECT)} height={height}
      className={className} priority
    />
  )

  const content = boxed ? (
    <div
      className="rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.92)', padding: Math.round(height * 0.18) }}
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
