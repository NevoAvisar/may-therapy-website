import type { MouseEvent } from 'react'
import { scrollToTarget } from '../lib/smoothScroll'

export const MAIN_ID = 'main-content'

// Skip link | קישור דילוג
/** The first stop for the Tab key, shown only once focused. Works on every page, as each has a #main-content. */
export default function SkipLink() {
  const skip = (e: MouseEvent) => {
    e.preventDefault()
    const main = document.getElementById(MAIN_ID)
    if (!main) return
    main.focus({ preventScroll: true })
    scrollToTarget(main)
  }

  return (
    <a
      href={`#${MAIN_ID}`}
      onClick={skip}
      data-surface
      className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-20 focus:z-[100] focus:rounded-full focus:bg-forest-moss focus:px-5 focus:py-2.5 focus:font-medium focus:text-primary"
    >
      דלג לתוכן העיקרי
    </a>
  )
}
