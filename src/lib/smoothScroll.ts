import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Smooth, continuous page scrolling: Lenis eases wheel / trackpad input and drives GSAP's ticker, so the
 * pinned hero scrub and every ScrollTrigger stay in lockstep. Nothing snaps, holds or absorbs input.
 * Touch keeps native momentum; reduced-motion users get plain native scrolling.
 */

/** Session key for the scroll position kept across a reload. */
const SCROLL_MEMORY_KEY = 'scroll-y'

let lenis: Lenis | null = null

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

/** Document scroll position that brings `el` to the top, honouring its `scroll-margin-top`. */
function sectionTop(el: Element) {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
  return el.getBoundingClientRect().top + window.scrollY - margin
}

/** Programmatic scroll (nav links, CTAs) – longer trips take a little longer. */
export function scrollToTarget(target: number | Element) {
  const y = typeof target === 'number' ? target : sectionTop(target)
  if (!lenis) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' })
    return
  }
  const screens = Math.abs(y - window.scrollY) / window.innerHeight
  lenis.scrollTo(y, { duration: Math.min(2.2, 0.8 + screens * 0.22), easing: easeInOutSine })
}

export function initSmoothScroll() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const instance = new Lenis({ lerp: 0.12, smoothWheel: true })
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

  return () => {
    window.removeEventListener('pagehide', rememberScroll)
    window.removeEventListener('load', restoreScroll)
    unsubscribeScroll()
    gsap.ticker.remove(tick)
    instance.destroy()
    if (lenis === instance) lenis = null
  }
}
