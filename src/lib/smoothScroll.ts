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
 * - On the way there, wheel / trackpad scrolling that reaches a resting point is held there for a breath:
 *   input is absorbed, then eases back in. It is time-based, so it delays rather than blocks, and keyboard,
 *   scrollbar, nav links and reversing straight back out are never held.
 * - Touch keeps native momentum; reduced-motion users get plain native scrolling.
 */

/** Reach of a resting point in the scroll direction, as a share of the viewport height. */
const REST_REACH = 0.2
/** Reach against the scroll direction – pulling back should be rare and tiny. */
const REST_REACH_BACK = 0.07
/** How long the scroll must be still before it settles into a resting point. */
const IDLE_MS = 180
/** How long wheel input is fully absorbed on reaching a resting point – the glide in takes most of this. */
const HOLD_MS = 950
/** How long wheel input then takes to ease back to full strength. */
const HOLD_RELEASE_MS = 550
/** A point just rested at won't hold again until the scroll has travelled this share of the viewport away. */
const HOLD_REARM = 0.25
/** Session key for the scroll position kept across a reload. */
const SCROLL_MEMORY_KEY = 'scroll-y'

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

/** Nearest resting point the move `from` → `to` reaches, skipping `from` itself. */
function restPointReached(from: number, to: number, skip: number | null) {
  const direction = Math.sign(to - from)
  let nearest: number | null = null
  for (const getY of restPoints) {
    const point = getY()
    if (point == null || (skip != null && Math.abs(point - skip) < 2)) continue
    const ahead = (point - from) * direction
    if (ahead < 1 || ahead > Math.abs(to - from)) continue
    if (nearest == null || ahead < (nearest - from) * direction) nearest = point
  }
  return nearest
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

  let restingAt: number | null = null
  let restingSince = -Infinity

  // Runs before Lenis applies each wheel delta. Scaling it to 0 still lets Lenis swallow the event.
  const holdAtRestPoints = (data: { deltaY: number; event: Event }) => {
    if (data.event.type !== 'wheel' || (data.event as WheelEvent).ctrlKey) return true

    const now = performance.now()
    const released = (now - restingSince - HOLD_MS) / HOLD_RELEASE_MS
    if (released < 1) data.deltaY *= easeInOutSine(Math.max(0, released))

    const from = instance.targetScroll
    if (restingAt != null && Math.abs(from - restingAt) > window.innerHeight * HOLD_REARM) restingAt = null

    const reached = restPointReached(from, from + data.deltaY, restingAt)
    if (reached != null) {
      data.deltaY = reached - from
      restingAt = reached
      restingSince = now
    }
    return true
  }

  const instance = new Lenis({
    lerp: 0.07, // softer than the 0.1 default: momentum lingers and decelerates gently
    wheelMultiplier: 0.75, // each wheel notch / trackpad flick travels less
    smoothWheel: true,
    virtualScroll: holdAtRestPoints,
  })
  lenis = instance

  // The browser's own restore runs before the hero's pin adds its scroll length, so it lands too high.
  // Restore by hand instead, once ScrollTrigger has measured the page.
  history.scrollRestoration = 'manual'
  const rememberScroll = () => sessionStorage.setItem(SCROLL_MEMORY_KEY, String(window.scrollY))
  const restoreScroll = () => {
    const saved = Number(sessionStorage.getItem(SCROLL_MEMORY_KEY))
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (!saved || entry?.type === 'navigate') return
    ScrollTrigger.refresh()
    instance.scrollTo(saved, { immediate: true, force: true })
  }
  window.addEventListener('pagehide', rememberScroll)
  if (document.readyState === 'complete') restoreScroll()
  else window.addEventListener('load', restoreScroll, { once: true })

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
    window.removeEventListener('pagehide', rememberScroll)
    window.removeEventListener('load', restoreScroll)
    window.clearTimeout(idle)
    unsubscribeRest()
    unsubscribeScroll()
    gsap.ticker.remove(tick)
    instance.destroy()
    if (lenis === instance) lenis = null
  }
}
