import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ==========================================
// Smooth scroll & section pause | גלילה חלקה ועצירה עדינה בכל אזור
// ==========================================
/**
 * EN: Lenis eases wheel / trackpad input and drives GSAP's ticker, so the pinned hero scrub and every
 * ScrollTrigger stay in lockstep. On arrival at a section the page settles and pauses for about 1.5s:
 * - Wheel / trackpad: scrolling that reaches a section stops at it, and further input is absorbed for the pause.
 * - Touch: native momentum is left alone. When it dies out near a section the page glides into place, and
 *   swipes that carry on in the same direction wait out the pause.
 * - Never a trap: reversing direction is free at once, and the keyboard, scrollbar and nav links are never held.
 * - Reduced-motion users get plain native scrolling with no pause.
 *
 * HE: ‏Lenis מחליק את הגלילה בעכבר ובמשטח המגע ומפעיל את ה-ticker של GSAP, כך שאנימציית ה-Hero וכל
 * ה-ScrollTrigger נשארים מתואמים. בהגעה לאזור הדף מתיישב ועוצר לכשנייה וחצי:
 * - עכבר / משטח מגע: גלילה שמגיעה לאזור נעצרת בו, והמשך הגלילה נבלע למשך העצירה.
 * - מסך מגע: התנופה הטבעית נשמרת. כשהיא דועכת ליד אזור הדף גולש למקומו, והחלקות להמשך באותו כיוון ממתינות לסוף העצירה.
 * - בלי מלכודת: שינוי כיוון משחרר מיד, והמקלדת, פס הגלילה וקישורי התפריט לעולם לא נעצרים.
 * - למשתמשים שביקשו להפחית תנועה יש גלילה רגילה, בלי עצירות.
 */

/** Pause length from arrival, in ms; the glide in takes about 0.5s of it | משך העצירה מרגע ההגעה, כולל כחצי שנייה של גלישה */
const PAUSE_MS = 2000
/** How long wheel input takes to return to full strength after a pause | הזמן שבו הגלילה חוזרת בהדרגה לעוצמה מלאה */
const RELEASE_MS = 300
/** Reach of the settle, as a share of the viewport height, ahead of the scroll and behind it | טווח ההתיישבות כחלק מגובה המסך, קדימה ואחורה */
const SETTLE_REACH = 0.2
const SETTLE_REACH_BACK = 0.07
/** How long the scroll must be still before it settles | כמה זמן הגלילה צריכה לעמוד לפני ההתיישבות */
const IDLE_MS = 180
/** A section just paused at stays quiet until the scroll is this share of the viewport away | אזור שעצרנו בו לא יעצור שוב עד שהתרחקנו כחלק זה מהמסך */
const REARM = 0.25
/** Session key for the scroll position kept across a reload | מפתח לשמירת מיקום הגלילה בין רענונים */
const SCROLL_MEMORY_KEY = 'scroll-y'

let lenis: Lenis | null = null

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

/** Document scroll position that brings `el` to the top of the viewport | מיקום הגלילה שמביא את האלמנט לראש המסך */
const sectionTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY

/** Programmatic scroll (nav links, CTAs) – longer trips take a little longer | גלילה יזומה מהתפריט ומהכפתורים: מסלול ארוך לוקח מעט יותר זמן */
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

/** Starts Lenis and the pause at each of `pauseAt` (section ids). Returns a cleanup | מפעיל את Lenis ואת העצירה באזורים שהועברו, ומחזיר פונקציית ניקוי */
export function initSmoothScroll(pauseAt: string[]) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  // ------------------------------------------
  // Pause state | מצב העצירה
  // ------------------------------------------
  let pausedAt: number | null = null
  let pausedUntil = -Infinity
  let pauseDirection = 0

  const beginPause = (point: number, direction: number) => {
    pausedAt = point
    pausedUntil = performance.now() + PAUSE_MS
    pauseDirection = direction
  }

  const sectionTops = () =>
    pauseAt.flatMap((id) => {
      const el = document.getElementById(id)
      return el ? [sectionTop(el)] : []
    })

  const isPausedAt = (point: number) => pausedAt != null && Math.abs(point - pausedAt) < 2

  /** Nearest section top the move `from` → `to` reaches, skipping the one just paused at | האזור הקרוב ביותר שהתנועה מגיעה אליו, מלבד זה שעצרנו בו זה עתה */
  const sectionReached = (from: number, to: number) => {
    const direction = Math.sign(to - from)
    let nearest: number | null = null
    for (const point of sectionTops()) {
      if (isPausedAt(point)) continue
      const ahead = (point - from) * direction
      if (ahead < 1 || ahead > Math.abs(to - from)) continue
      if (nearest == null || ahead < (nearest - from) * direction) nearest = point
    }
    return nearest
  }

  // ------------------------------------------
  // Wheel / trackpad | עכבר ומשטח מגע
  // ------------------------------------------
  // Runs before Lenis applies each wheel delta. Scaling it to 0 still lets Lenis swallow the event.
  // רץ לפני ש-Lenis מיישם כל תנועת גלגלת. הקטנה ל-0 עדיין מאפשרת ל-Lenis לבלוע את האירוע.
  const pauseWheel = (data: { deltaY: number; event: Event }) => {
    if (data.event.type !== 'wheel' || (data.event as WheelEvent).ctrlKey) return true

    const direction = Math.sign(data.deltaY)
    // Turning back ends the pause at once | שינוי כיוון מסיים את העצירה מיד
    if (direction && direction !== pauseDirection) pausedUntil = -Infinity

    const released = (performance.now() - pausedUntil) / RELEASE_MS
    if (released < 1) data.deltaY *= easeInOutSine(Math.max(0, released))

    const from = instance.targetScroll
    const reached = sectionReached(from, from + data.deltaY)
    if (reached != null) {
      data.deltaY = reached - from
      beginPause(reached, direction)
    }
    return true
  }

  const instance = new Lenis({ lerp: 0.12, smoothWheel: true, virtualScroll: pauseWheel })
  lenis = instance

  // ------------------------------------------
  // Reload position | שמירת המיקום ברענון
  // ------------------------------------------
  // The browser's own restore runs before the hero's pin adds its scroll length, so it lands too high.
  // Restore by hand instead, once ScrollTrigger has measured the page.
  // השחזור של הדפדפן רץ לפני שה-Hero מוסיף את אורך הגלילה שלו ולכן נוחת גבוה מדי, אז משחזרים ידנית.
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

  // ------------------------------------------
  // Settle into place when the scroll stops nearby | התיישבות למקום כשהגלילה נעצרת בקרבת אזור
  // ------------------------------------------
  let touching = false
  let touchY = 0
  let idle = 0
  let lastY = window.scrollY
  let direction = 0

  const settle = () => {
    // Never move the page under a finger, a running glide or someone typing.
    // לא מזיזים את הדף מתחת לאצבע, באמצע גלישה או בזמן הקלדה.
    if (touching || instance.isScrolling === 'smooth' || document.activeElement?.matches('input, textarea')) return

    const y = window.scrollY
    const vh = window.innerHeight
    if (pausedAt != null && Math.abs(y - pausedAt) > vh * REARM) pausedAt = null

    let best: number | null = null
    let bestDistance = Infinity
    for (const point of sectionTops()) {
      if (isPausedAt(point)) continue
      const delta = point - y
      const distance = Math.abs(delta)
      // A point ahead of the scroll direction may reach further than one behind it.
      // נקודה שנמצאת בכיוון הגלילה מושכת מרחוק יותר מנקודה שמאחוריה.
      const ahead = direction === 0 || Math.sign(delta) === direction
      if (distance > vh * (ahead ? SETTLE_REACH : SETTLE_REACH_BACK)) continue
      if (distance < bestDistance) {
        best = point
        bestDistance = distance
      }
    }

    if (best == null || bestDistance < 2) return
    beginPause(best, direction)
    instance.scrollTo(best, { duration: 0.5 + (bestDistance / vh) * 1.5, easing: easeInOutSine })
  }

  const onScroll = () => {
    const y = window.scrollY
    if (Math.abs(y - lastY) > 0.5) direction = Math.sign(y - lastY)
    lastY = y
    window.clearTimeout(idle)
    idle = window.setTimeout(settle, IDLE_MS)
  }

  // ------------------------------------------
  // Touch swipes | החלקות במסך מגע
  // ------------------------------------------
  const onTouchStart = (e: TouchEvent) => {
    touching = true
    touchY = e.touches[0].clientY
  }
  const onTouchEnd = () => {
    touching = false
    window.clearTimeout(idle)
    idle = window.setTimeout(settle, IDLE_MS)
  }
  // A swipe on in the paused direction waits; pinch zoom and swiping back are left alone.
  // החלקה להמשך באותו כיוון ממתינה; צביטה להגדלה והחלקה חזרה לא מושפעות.
  const onTouchMove = (e: TouchEvent) => {
    if (!e.cancelable || e.touches.length > 1 || performance.now() >= pausedUntil) return
    if (Math.sign(touchY - e.touches[0].clientY) === pauseDirection) e.preventDefault()
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('touchcancel', onTouchEnd, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false })

  return () => {
    window.removeEventListener('pagehide', rememberScroll)
    window.removeEventListener('load', restoreScroll)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchEnd)
    window.removeEventListener('touchmove', onTouchMove)
    window.clearTimeout(idle)
    unsubscribeScroll()
    gsap.ticker.remove(tick)
    instance.destroy()
    if (lenis === instance) lenis = null
  }
}
