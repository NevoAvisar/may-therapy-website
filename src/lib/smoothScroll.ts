import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Calm page scrolling for a wellness pace.
 *
 * - Lenis eases wheel / trackpad input (lower lerp + damped wheel delta) and drives GSAP's ticker,
 *   so the pinned hero scrub and every ScrollTrigger stay in lockstep.
 * - "Resting points" give each section a soft magnetic pause: once the scroll comes to a stop near a
 *   section's top, the page glides the last few pixels into place. It never fights an active scroll,
 *   reaches only a short distance, and reaches even less against the direction you were going – so it
 *   anchors attention without ever trapping anyone.
 * - Touch keeps native momentum; reduced-motion users get plain native scrolling.
 */

/** Reach of a resting point in the scroll direction, as a share of the viewport height. */
const REST_REACH = 0.2
/** Reach against the scroll direction – pulling back should be rare and tiny. */
const REST_REACH_BACK = 0.07
/** How long the scroll must be still before it settles into a resting point. */
const IDLE_MS = 180

let lenis: Lenis | null = null
const restPoints = new Set<() => number | null>()

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

/** Document scroll position that brings `el` to the top, honouring its `scroll-margin-top`. */
export function sectionTop(el: Element) {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
  return el.getBoundingClientRect().top + window.scrollY - margin
}

/** Register a scroll position the page may softly rest at. Returns an unregister function. */
export function addRestPoint(getY: () => number | null) {
  restPoints.add(getY)
  return () => {
    restPoints.delete(getY)
  }
}

/** Unhurried programmatic scroll (nav links, CTAs) – longer trips take a little longer. */
export function scrollToTarget(target: number | Element) {
  const y = typeof target === 'number' ? target : sectionTop(target)
  if (!lenis) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' })
    return
  }
  const screens = Math.abs(y - window.scrollY) / window.innerHeight
  lenis.scrollTo(y, { duration: Math.min(3.2, 1.2 + screens * 0.35), easing: easeInOutSine })
}

export function initSmoothScroll() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const instance = new Lenis({
    lerp: 0.07, // softer than the 0.1 default: momentum lingers and decelerates gently
    wheelMultiplier: 0.75, // each wheel notch / trackpad flick travels less
    smoothWheel: true,
  })
  lenis = instance

  const unsubscribeScroll = instance.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => instance.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  // Resting points only for wheel / trackpad – touch keeps the platform's own momentum.
  const finePointer = matchMedia('(pointer: fine)').matches
  let idle = 0
  let lastY = window.scrollY
  let direction = 0

  const settle = () => {
    if (instance.isScrolling) return
    const y = window.scrollY
    const vh = window.innerHeight
    let best: number | null = null
    let bestDistance = Infinity

    for (const getY of restPoints) {
      const point = getY()
      if (point == null) continue
      const delta = point - y
      const distance = Math.abs(delta)
      // A point ahead of the scroll direction may reach further than one behind it.
      const ahead = direction === 0 || Math.sign(delta) === direction
      if (distance > vh * (ahead ? REST_REACH : REST_REACH_BACK)) continue
      if (distance < bestDistance) {
        best = point
        bestDistance = distance
      }
    }

    if (best == null || bestDistance < 2) return
    instance.scrollTo(best, { duration: 0.8 + (bestDistance / vh) * 2.4, easing: easeInOutSine })
  }

  const unsubscribeRest = finePointer
    ? instance.on('scroll', () => {
        const y = window.scrollY
        if (Math.abs(y - lastY) > 0.5) direction = Math.sign(y - lastY)
        lastY = y
        window.clearTimeout(idle)
        idle = window.setTimeout(settle, IDLE_MS)
      })
    : () => {}

  return () => {
    window.clearTimeout(idle)
    unsubscribeRest()
    unsubscribeScroll()
    gsap.ticker.remove(tick)
    instance.destroy()
    if (lenis === instance) lenis = null
  }
}
