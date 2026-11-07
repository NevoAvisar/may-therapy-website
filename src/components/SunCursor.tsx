import { useEffect, useRef, type CSSProperties } from 'react'

/**
 * A small sun takes the place of the mouse pointer, with soft morning light trailing behind it that blooms
 * into a beacon near the booking and WhatsApp CTAs.
 *
 * The icon sits exactly on the pointer. Mark any element with `data-sun-beacon` to make it draw the light.
 * The light's position, scale and opacity are written straight to the layers from one rAF loop
 * (compositor-only, no React render per frame), and the loop sleeps once the pointer and the page have been
 * still for a moment. Mouse only: touch has no cursor to follow, and reduced-motion users keep the plain page.
 */

/** How far from a CTA's edge the light starts to answer, in px. */
const BEACON_REACH = 280
/** Follow / bloom speed: higher is snappier. Per-second, so it feels the same at any refresh rate. */
const FOLLOW_RATE = 9
const BLOOM_RATE = 4.5
/** Keep the loop running this long after the last move or scroll – a late scrub can still reveal a CTA. */
const AWAKE_MS = 2600

/** Resting light, and how far it swells at a beacon. The core dims as the halo opens around it. */
const AURA_OPACITY = 0.6
const AURA_OPACITY_AT_BEACON = 0.4
const AURA_SCALE_GAIN = 0.35
const BLOOM_SCALE_FROM = 0.7
const BLOOM_SCALE_GAIN = 0.5
/** How much the sun swells over anything clickable, which is the only sign a hidden pointer can give. */
const ICON_SCALE_GAIN = 0.4
const CLICKABLE = 'a, button, label, summary, [role="button"]'
/** On <html> while the sun stands in for the native pointer – see index.css. */
const ACTIVE_CLASS = 'sun-cursor'

/** Normal blending, not `screen`: it has to read warm over the cream page as well as the dark hero. */
const AURA_LIGHT = 'radial-gradient(circle, rgba(255,214,150,0.42) 0%, rgba(255,198,124,0.2) 34%, rgba(255,190,110,0) 70%)'
/** A halo with a calm centre: the page around a CTA lights up, the CTA itself stays crisp and legible. */
const BLOOM_LIGHT =
  'radial-gradient(circle, rgba(255,206,130,0.05) 0%, rgba(255,204,128,0.1) 16%, rgba(255,194,112,0.34) 38%, rgba(255,186,100,0.16) 56%, rgba(255,176,84,0) 74%)'

const layerStyle = (size: number, background: string): CSSProperties => ({
  position: 'absolute',
  width: size,
  height: size,
  left: -size / 2,
  top: -size / 2,
  borderRadius: '50%',
  background,
  willChange: 'transform, opacity',
})

/** 0 far from every visible beacon, 1 touching one. */
function beaconProximity(x: number, y: number) {
  let nearest = 0
  document.querySelectorAll('[data-sun-beacon]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.bottom < 0 || r.top > innerHeight || r.width === 0) return
    // The hero CTA stays in the DOM, inert, until the media has fully expanded.
    if (getComputedStyle(el).pointerEvents === 'none') return
    const dx = Math.max(r.left - x, 0, x - r.right)
    const dy = Math.max(r.top - y, 0, y - r.bottom)
    nearest = Math.max(nearest, 1 - Math.hypot(dx, dy) / BEACON_REACH)
  })
  return nearest * nearest * (3 - 2 * nearest)
}

function SunIcon() {
  return (
    <div className="h-full w-full animate-sun-breathe">
      <svg viewBox="0 0 32 32" className="h-full w-full animate-sun-spin drop-shadow-[0_0_5px_rgba(255,190,100,0.75)]">
        <circle cx={16} cy={16} r={6.2} fill="#F7B955" stroke="#E08E2B" strokeWidth={1} />
        <g stroke="#E08E2B" strokeWidth={1.6} strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line key={deg} x1={16} y1={2.5} x2={16} y2={6.5} transform={`rotate(${deg} 16 16)`} />
          ))}
        </g>
      </svg>
    </div>
  )
}

export default function SunCursor() {
  const sunRef = useRef<HTMLDivElement>(null)
  const lightRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const iconScaleRef = useRef<HTMLDivElement>(null)
  const auraRef = useRef<HTMLDivElement>(null)
  const bloomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sun = sunRef.current
    const light = lightRef.current
    const icon = iconRef.current
    const iconScale = iconScaleRef.current
    const aura = auraRef.current
    const bloom = bloomRef.current
    if (!sun || !light || !icon || !iconScale || !aura || !bloom) return
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root = document.documentElement
    let pointerX = 0
    let pointerY = 0
    let x = 0
    let y = 0
    let glow = 0
    let lift = 0
    let overClickable = false
    let hasPointer = false
    let frame = 0
    let last = 0
    let awakeUntil = 0

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50) / 1000
      last = now
      x += (pointerX - x) * (1 - Math.exp(-dt * FOLLOW_RATE))
      y += (pointerY - y) * (1 - Math.exp(-dt * FOLLOW_RATE))
      glow += (beaconProximity(pointerX, pointerY) - glow) * (1 - Math.exp(-dt * BLOOM_RATE))

      lift += ((overClickable ? 1 : glow) - lift) * (1 - Math.exp(-dt * FOLLOW_RATE))

      light.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      iconScale.style.transform = `scale(${(1 + lift * ICON_SCALE_GAIN).toFixed(3)})`
      aura.style.transform = `scale(${(1 + glow * AURA_SCALE_GAIN).toFixed(3)})`
      aura.style.opacity = (AURA_OPACITY + glow * (AURA_OPACITY_AT_BEACON - AURA_OPACITY)).toFixed(3)
      bloom.style.transform = `scale(${(BLOOM_SCALE_FROM + glow * BLOOM_SCALE_GAIN).toFixed(3)})`
      bloom.style.opacity = glow.toFixed(3)

      frame = now < awakeUntil ? requestAnimationFrame(tick) : 0
    }

    const wake = () => {
      if (!hasPointer) return
      awakeUntil = performance.now() + AWAKE_MS
      if (!frame) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointerX = e.clientX
      pointerY = e.clientY
      icon.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`
      overClickable = e.target instanceof Element && e.target.closest(CLICKABLE) != null
      if (!hasPointer) {
        // Rise where the cursor is, rather than sliding in from the corner.
        hasPointer = true
        x = pointerX
        y = pointerY
        sun.style.opacity = '1'
        root.classList.add(ACTIVE_CLASS)
      }
      wake()
    }

    const onLeave = () => {
      hasPointer = false
      sun.style.opacity = '0'
      root.classList.remove(ACTIVE_CLASS)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', wake, { passive: true })
    root.addEventListener('mouseleave', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', wake)
      root.removeEventListener('mouseleave', onLeave)
      root.classList.remove(ACTIVE_CLASS)
    }
  }, [])

  return (
    <div ref={sunRef} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[9999] opacity-0 transition-opacity duration-300">
      <div ref={lightRef} className="absolute left-0 top-0" style={{ willChange: 'transform' }}>
        <div ref={auraRef} style={{ ...layerStyle(680, AURA_LIGHT), opacity: AURA_OPACITY }} />
        <div ref={bloomRef} style={{ ...layerStyle(900, BLOOM_LIGHT), opacity: 0 }} />
      </div>
      <div ref={iconRef} className="absolute left-0 top-0" style={{ willChange: 'transform' }}>
        <div ref={iconScaleRef} className="absolute -left-4 -top-4 h-8 w-8">
          <SunIcon />
        </div>
      </div>
    </div>
  )
}
