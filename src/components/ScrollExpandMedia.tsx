import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ChevronDown } from 'lucide-react'
import { HERO_EXPAND_EVENT } from '../config'
import { cn } from '../lib/cn'
import { scrollToTarget } from '../lib/smoothScroll'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll Expansion Hero – adapted from 21st.dev `@arunachalam/scroll-expansion-hero`
 * for Vite + React, Hebrew RTL and keyboard / reduced-motion users.
 *
 * The hero is pinned by GSAP ScrollTrigger and native page scroll scrubs `--p` from 0 → 1:
 * the framed media grows to exactly 100vw × 100dvh while the title drifts apart and fades.
 * At full bleed the pin releases and the page simply keeps scrolling –
 * no wheel hijacking, so inertia, scrollbars, keyboard and touch all behave natively.
 */
interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image'
  mediaSrc: string
  posterSrc?: string
  bgImageSrc: string
  /** The first word drifts left, the rest drifts right. */
  title: string
  eyebrow?: string
  scrollToExpand?: string
  /** Shown over the media once fully expanded. */
  expandedCaption?: ReactNode
  textBlend?: boolean
  onExpandChange?: (expanded: boolean) => void
  children?: ReactNode
}

// ==========================================
// Hero timing and masks | תזמון ומסכות של אזור הפתיחה
// ==========================================
/** Scroll distance of the pin, in % of the viewport height. */
const PIN_LENGTH = '+=100%'
/** Share of the pin spent at full bleed before the page takes over, so it never releases mid-expansion. */
const HOLD = 0.1

/** Edge feather of the compact media: two gradients intersected, so all four sides fade. */
const FEATHER_X =
  'linear-gradient(to right, transparent, #000 var(--feather), #000 calc(100% - var(--feather)), transparent)'
const FEATHER_Y =
  'linear-gradient(to bottom, transparent, #000 var(--feather), #000 calc(100% - var(--feather)), transparent)'

/** Dissolves the media's bottom edge; `--mist` (0 → 1 over the end of the scrub) grows it to 25%. */
const MIST_MASK = 'linear-gradient(to bottom, #000 calc(100% - 25% * var(--mist)), transparent 100%)'
/** Into the exact background of the first section, so nothing marks where the hero ends and the next section begins. */
const MIST_FADE =
  'linear-gradient(to bottom, rgba(235, 243, 240, 0) 0%, rgba(220, 232, 227, 0.25) 35%, rgba(235, 243, 240, 0.75) 70%, #EBF3F0 100%)'

/** Scroll position at which the media first fills the viewport (before the hold). */
const fullBleedAt = (st: ScrollTrigger | null) => (st ? st.start + (st.end - st.start) / (1 + HOLD) : null)

// ==========================================
// Vapour title | כותרת שמתאדה אות אחר אות
// ==========================================
/** Deterministic 0–1 noise, so every render (and reload) scatters the letters the same way. */
const noise = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Stagger span across a line: the outermost letters start at 0, the centre at this share of `--p`. */
const VAPOUR_STAGGER = 0.3
/** Share of `--p` each letter takes to fully dissolve. */
const VAPOUR_SPAN = 0.45

/**
 * Vapour dissolve (after @jatin-yadav05's 21st.dev "vapour text effect"), bound to the section's `--p`.
 * Each letter has its own local progress `--v`; it blurs, swells, rises and drifts outward on the wind
 * while fading. Edges go first, the centre last – like river mist carried off a line of text.
 */
function VapourLine({ text, seed, className }: { text: string; seed: number; className?: string }) {
  const words = text.split(' ')
  const total = text.replace(/ /g, '').length
  const centre = (total - 1) / 2
  let i = 0

  return (
    <span aria-hidden className={className}>
      {words.map((word, w) => (
        <Fragment key={w}>
          {w > 0 && ' '}
          {/* Letters stay inline-block inside a nowrap word, so Hebrew RTL order and line wrapping hold. */}
          <span className="inline-block whitespace-nowrap">
            {[...word].map((char) => {
              const idx = i++
              const fromCentre = centre ? (idx - centre) / centre : 0 // −1 … 1 (logical order)
              const r = noise(seed * 97 + idx)
              const delay = (1 - Math.abs(fromCentre)) * VAPOUR_STAGGER + r * 0.06
              // In RTL, logical start sits on the right, so it drifts right (+x) and the end drifts left.
              const dx = -fromCentre * 26 + (noise(seed * 31 + idx) - 0.5) * 30
              const dy = 26 + r * 34
              const swell = 0.1 + noise(seed * 53 + idx) * 0.15
              return (
                <span
                  key={idx}
                  className="inline-block"
                  style={
                    {
                      '--v': `clamp(0, calc((var(--p) - ${delay.toFixed(3)}) / ${VAPOUR_SPAN}), 1)`,
                      transform: `translate3d(calc(var(--v) * ${dx.toFixed(1)}px), calc(var(--v) * ${-dy.toFixed(1)}px), 0) scale(calc(1 + var(--v) * ${swell.toFixed(3)}))`,
                      filter: 'blur(calc(var(--v) * 16px))',
                      // Fade trails the blur slightly, so letters read as mist before they vanish.
                      opacity: 'calc(1 - var(--v) * var(--v))',
                      willChange: 'transform, filter, opacity',
                    } as CSSProperties
                  }
                >
                  {char}
                </span>
              )
            })}
          </span>
        </Fragment>
      ))}
    </span>
  )
}

// ==========================================
// Hero section | אזור הפתיחה - התמונה מתרחבת עם הגלילה
// ==========================================
export default function ScrollExpandMedia({
  mediaType = 'image',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  eyebrow,
  scrollToExpand,
  expandedCaption,
  textBlend = false,
  onExpandChange,
  children,
}: ScrollExpandMediaProps) {
  const reduceMotion = useReducedMotion()

  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // Reduced motion: no pin, no scrub – the hero simply starts expanded.
    if (reduceMotion) {
      gsap.set(section, { '--p': 1 })
      setMediaFullyExpanded(true)
      return
    }

    let expanded = false
    let scrubbed = false
    // Past the pin counts too: a reload further down the page restores the scroll after the first
    // refresh, jumping the scrub to its end without playing the tween's onUpdate.
    const syncExpanded = () => {
      const st = triggerRef.current
      const next = scrubbed || (st != null && window.scrollY >= st.end)
      if (next !== expanded) {
        expanded = next
        setMediaFullyExpanded(next)
      }
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: PIN_LENGTH,
          pin: true,
          scrub: 0.35, // just enough lag to smooth the media, without it trailing the scroll
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: syncExpanded,
        },
      })
      tl.fromTo(
        section,
        { '--p': 0 },
        {
          '--p': 1,
          ease: 'none',
          duration: 1,
          onUpdate() {
            scrubbed = this.progress() >= 0.999
            syncExpanded()
          },
        },
      )
      // Hold at full bleed so the pin always releases on a fully expanded frame.
      tl.to({}, { duration: HOLD })
      triggerRef.current = tl.scrollTrigger ?? null
    }, section)

    syncExpanded()
    window.addEventListener('scroll', syncExpanded, { passive: true })

    return () => {
      window.removeEventListener('scroll', syncExpanded)
      triggerRef.current = null
      ctx.revert()
    }
  }, [reduceMotion])

  useEffect(() => {
    onExpandChange?.(mediaFullyExpanded)
  }, [mediaFullyExpanded, onExpandChange])

  // In-page links: the glide passes through the pin, so the scrub plays on the way.
  useEffect(() => {
    const handleExpandRequest = (e: Event) => {
      const targetId = (e as CustomEvent<{ targetId?: string }>).detail?.targetId
      const el = targetId ? document.getElementById(targetId) : null
      if (el) scrollToTarget(el)
    }
    window.addEventListener(HERO_EXPAND_EVENT, handleExpandRequest)
    return () => window.removeEventListener(HERO_EXPAND_EVENT, handleExpandRequest)
  }, [])

  /** "Scroll to expand" button: glide to the moment the media reaches full bleed. */
  const expandNow = () => {
    const fullAt = fullBleedAt(triggerRef.current)
    if (fullAt != null) scrollToTarget(fullAt)
  }

  const [firstWord, ...rest] = title.trim().split(/\s+/)
  const restOfTitle = rest.join(' ')

  // Everything below reads `--p`, which GSAP scrubs on the section – no React render per frame.
  // Compact frame → exactly 100vw × 100dvh, interpolated in CSS so it is always viewport-true.
  const mediaStyle = {
    '--w0': 'min(340px, 78vw)',
    '--h0': 'min(440px, 58dvh)',
    width: 'calc(var(--w0) + (100vw - var(--w0)) * var(--p))',
    height: 'calc(var(--h0) + (100dvh - var(--h0)) * var(--p))',
  } as CSSProperties

  // The compact frame melts into the forest: feathered edges, a touch of translucency and softer
  // light. All of it eases out with `--p`, and is dropped at full bleed so the media renders untouched.
  const blendStyle = (
    mediaFullyExpanded
      ? {}
      : {
          '--feather': 'max(0px, calc(min(64px, 12vw) * (1 - var(--p) * 1.12)))',
          maskImage: `${FEATHER_X}, ${FEATHER_Y}`,
          WebkitMaskImage: `${FEATHER_X}, ${FEATHER_Y}`,
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
          opacity: 'calc(0.82 + var(--p) * 0.18)',
          filter: 'brightness(calc(0.95 + var(--p) * 0.05)) contrast(calc(0.95 + var(--p) * 0.05))',
        }
  ) as CSSProperties

  const driftOut = (dir: 1 | -1, fade = 'calc(1 - var(--p))'): CSSProperties => ({
    transform: `translate3d(calc(${dir * 110}vw * var(--p)), 0, 0)`,
    opacity: fade,
    willChange: 'transform, opacity',
  })

  return (
    <div className="overflow-x-clip">
      {/* Own wrapper so GSAP's pin-spacer never reshuffles nodes React manages. */}
      <div>
        <section
          ref={sectionRef}
          id="hero"
          aria-label="פתיחה"
          className="relative flex h-[100dvh] items-center justify-center overflow-hidden bg-forest-moss"
          style={
            {
              '--p': reduceMotion ? 1 : 0,
              '--mist': 'clamp(0, calc((var(--p) - 0.6) / 0.4), 1)',
            } as CSSProperties
          }
        >
          {/* Ambient atmospheric background */}
          <div aria-hidden className="absolute inset-0" style={{ opacity: 'calc(1 - var(--p))' }}>
            <img src={bgImageSrc} alt="" className="h-full w-full scale-105 object-cover" decoding="async" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-b from-forest-moss/30 via-forest-moss/10 to-forest-moss/50" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-river-mist/25 to-transparent" />
          </div>

          {/* Mist beneath the media, so its dissolving edge melts into the page rather than the moss backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[32dvh]"
            style={{ opacity: 'var(--mist)', background: 'linear-gradient(to bottom, transparent, #EBF3F0 60%)' }}
          />

          {/* Floating framed media */}
          <div className="relative z-10 will-change-[width,height,transform]" style={mediaStyle}>
            {/* Diffused ambient shadow – a blurred layer, since the feather mask would clip a box-shadow */}
            <div
              aria-hidden
              className="absolute inset-[6%] translate-y-3 bg-[rgba(20,35,25,0.18)] blur-[40px]"
              style={{ opacity: 'calc(1 - var(--p))' }}
            />
            <div
              className="absolute inset-0 overflow-hidden will-change-[opacity,filter]"
              style={{ borderRadius: 'calc(28px * (1 - var(--p)))', ...blendStyle }}
            >
              <div className="absolute inset-0" style={{ maskImage: MIST_MASK, WebkitMaskImage: MIST_MASK }}>
                {mediaType === 'video' ? (
                  <video
                    src={mediaSrc}
                    poster={posterSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="h-full w-full object-cover"
                    aria-hidden
                  />
                ) : (
                  <img src={mediaSrc} alt="" className="h-full w-full object-cover" decoding="async" />
                )}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-forest-moss"
                  style={{ opacity: 'calc(0.38 - var(--p) * 0.18)' }}
                />
              </div>

              {expandedCaption && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center px-6"
                  initial={false}
                  animate={mediaFullyExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                  style={{ pointerEvents: mediaFullyExpanded ? 'auto' : 'none' }}
                  aria-hidden={!mediaFullyExpanded}
                >
                  {expandedCaption}
                </motion.div>
              )}
            </div>
          </div>

          {/* Morning mist over the hero's bottom edge – under the headline, gone at the opening frame */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[32dvh]"
            style={{ opacity: 'var(--mist)', background: MIST_FADE }}
          />

          {/* Split headline – vaporises letter by letter as the media expands */}
          <h1
            aria-label={title}
            className={cn(
              'pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 text-center font-display font-light leading-[1.05] text-primary',
              textBlend && 'mix-blend-difference',
            )}
            style={{ textShadow: '0 2px 30px rgba(30,44,36,0.45)' }}
          >
            <VapourLine text={firstWord} seed={1} className="block text-[clamp(3.2rem,2rem+6vw,7.5rem)]" />
            <VapourLine text={restOfTitle} seed={2} className="block px-4 text-[clamp(2rem,1.2rem+3.6vw,4.6rem)]" />
          </h1>

          {/* Eyebrow + scroll prompt */}
          <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-3 text-center text-primary/90">
            {eyebrow && (
              <p className="text-sm tracking-wide sm:text-base" style={driftOut(-1)}>
                {eyebrow}
              </p>
            )}
            {scrollToExpand && (
              <button
                type="button"
                onClick={expandNow}
                className="pointer-events-auto glass inline-flex items-center gap-2 rounded-full !bg-white/15 px-4 py-2 text-sm font-medium text-primary"
                // The prompt is gone within the first few percent of the scrub.
                style={driftOut(1, 'calc(1 - var(--p) * 6)')}
                tabIndex={mediaFullyExpanded ? -1 : 0}
              >
                <span>{scrollToExpand}</span>
                <ChevronDown className="h-4 w-4 animate-drift" aria-hidden />
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Page content – flows straight on beneath the pinned hero */}
      {children}
    </div>
  )
}
