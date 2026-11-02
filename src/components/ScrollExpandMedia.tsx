import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { animate, motion, useReducedMotion, type AnimationPlaybackControls } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { HERO_EXPAND_EVENT } from '../config'
import { cn } from '../lib/cn'

/**
 * Scroll Expansion Hero – adapted from 21st.dev `@arunachalam/scroll-expansion-hero`
 * for Vite + React, Hebrew RTL and keyboard / reduced-motion users.
 *
 * While collapsed, page scroll is locked and wheel / touch / keys scrub `progress`
 * from 0 → 1. At 1 the framed media fills 100vw × 100dvh and normal scrolling unlocks.
 * Scrolling back up at the very top collapses it again.
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

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const AT_TOP = 5

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

  const [scrollProgress, setScrollProgress] = useState(0)
  const [showContent, setShowContent] = useState(false)
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false)

  // Refs mirror state so the window listeners are bound once and never read stale values.
  const progressRef = useRef(0)
  const expandedRef = useRef(false)
  const touchStartY = useRef(0)
  const tween = useRef<AnimationPlaybackControls | null>(null)

  const setProgress = useCallback((value: number) => {
    const newProgress = clamp(value)
    progressRef.current = newProgress
    setScrollProgress(newProgress)

    if (newProgress >= 1) {
      expandedRef.current = true
      setMediaFullyExpanded(true)
      setShowContent(true)
    } else if (newProgress < 0.75) {
      setShowContent(false)
    }
  }, [])

  const collapse = useCallback(() => {
    expandedRef.current = false
    setMediaFullyExpanded(false)
  }, [])

  /** Smoothly scrub to a target (keyboard steps, "expand" clicks, nav links). */
  const glideTo = useCallback(
    (target: number, onComplete?: () => void) => {
      tween.current?.stop()
      tween.current = animate(progressRef.current, clamp(target), {
        duration: reduceMotion ? 0 : 0.45 + Math.abs(target - progressRef.current) * 0.8,
        ease: [0.22, 0.61, 0.36, 1],
        onUpdate: setProgress,
        onComplete,
      })
    },
    [reduceMotion, setProgress],
  )

  // Reduced motion: skip the scrub entirely.
  useEffect(() => {
    if (reduceMotion) setProgress(1)
  }, [reduceMotion, setProgress])

  useEffect(() => {
    onExpandChange?.(mediaFullyExpanded)
  }, [mediaFullyExpanded, onExpandChange])

  // Always start at the top – the hero owns the first screen.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (expandedRef.current) {
        if (e.deltaY < 0 && window.scrollY <= AT_TOP) {
          collapse()
          e.preventDefault()
        }
        return
      }
      e.preventDefault()
      tween.current?.stop()
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      setProgress(progressRef.current + delta * 0.0009)
    }

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY.current) return
      const touchY = e.touches[0].clientY
      const deltaY = touchStartY.current - touchY

      if (expandedRef.current) {
        if (deltaY < -20 && window.scrollY <= AT_TOP) {
          collapse()
          e.preventDefault()
        }
        return
      }
      e.preventDefault()
      tween.current?.stop()
      // Collapsing on touch feels better a little faster than expanding.
      const factor = deltaY < 0 ? 0.008 : 0.005
      setProgress(progressRef.current + deltaY * factor)
      touchStartY.current = touchY
    }

    const handleTouchEnd = () => {
      touchStartY.current = 0
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return

      const forward = { ArrowDown: 0.2, PageDown: 0.5, ' ': 0.5, End: 1 }[e.key]
      const backward = { ArrowUp: 0.2, PageUp: 0.5, Home: 1 }[e.key]

      if (!expandedRef.current) {
        if (forward) {
          e.preventDefault()
          glideTo(progressRef.current + forward)
        } else if (backward) {
          e.preventDefault()
          glideTo(progressRef.current - backward)
        }
      } else if (backward && window.scrollY <= AT_TOP) {
        e.preventDefault()
        collapse()
        glideTo(progressRef.current - backward)
      }
    }

    // While collapsed, pin the page at the top (catches scrollbar drags, focus jumps, etc.).
    const handleScroll = () => {
      if (!expandedRef.current) window.scrollTo(0, 0)
    }

    const handleExpandRequest = (e: Event) => {
      const targetId = (e as CustomEvent<{ targetId?: string }>).detail?.targetId
      const scrollToTarget = () =>
        requestAnimationFrame(() => {
          const el = targetId ? document.getElementById(targetId) : null
          el?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
        })

      if (expandedRef.current) scrollToTarget()
      else glideTo(1, scrollToTarget)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener(HERO_EXPAND_EVENT, handleExpandRequest)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener(HERO_EXPAND_EVENT, handleExpandRequest)
      tween.current?.stop()
    }
  }, [collapse, glideTo, reduceMotion, setProgress])

  const [firstWord, ...rest] = title.trim().split(/\s+/)
  const restOfTitle = rest.join(' ')

  // Compact frame → exactly 100vw × 100dvh, interpolated in CSS so it is always viewport-true.
  const p = scrollProgress
  const mediaStyle = {
    '--p': p,
    '--w0': 'min(340px, 78vw)',
    '--h0': 'min(440px, 58dvh)',
    width: 'calc(var(--w0) + (100vw - var(--w0)) * var(--p))',
    height: 'calc(var(--h0) + (100dvh - var(--h0)) * var(--p))',
    borderRadius: `${28 * (1 - p)}px`,
    boxShadow: `0 ${30 * (1 - p)}px ${80 * (1 - p)}px -20px rgba(30, 44, 36, ${0.55 * (1 - p)})`,
  } as CSSProperties

  const drift = p * 110 // vw

  return (
    <div className="overflow-x-clip">
      <section
        aria-label="פתיחה"
        className="relative flex h-[100dvh] items-center justify-center overflow-hidden bg-forest-moss"
      >
        {/* Ambient atmospheric background */}
        <motion.div
          aria-hidden
          className="absolute inset-0"
          animate={{ opacity: 1 - p }}
          transition={{ duration: 0.1 }}
        >
          <img src={bgImageSrc} alt="" className="h-full w-full scale-105 object-cover" decoding="async" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-moss/30 via-forest-moss/10 to-forest-moss/50" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-river-mist/25 to-transparent" />
        </motion.div>

        {/* Floating framed media */}
        <div
          className="relative z-10 overflow-hidden ring-1 ring-white/30 will-change-[width,height]"
          style={mediaStyle}
        >
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
            style={{ opacity: 0.38 - p * 0.18 }}
          />

          {expandedCaption && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center px-6"
              initial={false}
              animate={mediaFullyExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
              style={{ pointerEvents: mediaFullyExpanded ? 'auto' : 'none' }}
              aria-hidden={!mediaFullyExpanded}
            >
              {expandedCaption}
            </motion.div>
          )}
        </div>

        {/* Split headline */}
        <h1
          className={cn(
            'pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 text-center font-serif font-light leading-[1.05] text-primary',
            textBlend && 'mix-blend-difference',
          )}
          style={{ textShadow: '0 2px 30px rgba(30,44,36,0.45)' }}
        >
          <span
            className="block text-[clamp(3.2rem,2rem+6vw,7.5rem)]"
            style={{ transform: `translateX(-${drift}vw)` }}
          >
            {firstWord}
          </span>
          <span
            className="block px-4 text-[clamp(2rem,1.2rem+3.6vw,4.6rem)]"
            style={{ transform: `translateX(${drift}vw)` }}
          >
            {restOfTitle}
          </span>
        </h1>

        {/* Eyebrow + scroll prompt */}
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-3 text-center text-primary/90">
          {eyebrow && (
            <p className="text-sm tracking-wide sm:text-base" style={{ transform: `translateX(-${drift}vw)` }}>
              {eyebrow}
            </p>
          )}
          {scrollToExpand && (
            <button
              type="button"
              onClick={() => glideTo(1)}
              className="pointer-events-auto glass inline-flex items-center gap-2 rounded-full !bg-white/15 px-4 py-2 text-sm font-medium text-primary"
              style={{ transform: `translateX(${drift}vw)`, opacity: 1 - p }}
              tabIndex={mediaFullyExpanded ? -1 : 0}
            >
              <span>{scrollToExpand}</span>
              <ChevronDown className="h-4 w-4 animate-drift" aria-hidden />
            </button>
          )}
        </div>
      </section>

      {/* Page content – revealed once the media fills the viewport */}
      <motion.div
        initial={false}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 0.7 }}
        onFocusCapture={() => {
          if (!expandedRef.current) glideTo(1)
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
