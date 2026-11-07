import { useEffect, useState, type MouseEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Menu, X } from 'lucide-react'
import { goToSection } from '../config'
import { scrollToTarget } from '../lib/smoothScroll'
import { cn } from '../lib/cn'

// ==========================================
// Navigation links, in page order | קישורי התפריט לפי סדר הדף
// ==========================================
const LINKS = [
  { id: 'hero', label: 'ראשי' },
  { id: 'intro', label: 'המרחב' },
  { id: 'treatments', label: 'הטיפולים' },
  { id: 'faq', label: 'שאלות נפוצות' },
  { id: 'about', label: 'עליי' },
]
const BOOKING = { id: 'booking', label: 'בואו נמצא זמן' }

/** Tracks which section is mid-screen, to highlight its link | עוקב אחרי האזור שבמרכז המסך כדי להדגיש את הקישור שלו */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids])
  return active
}

const ids = [...LINKS, BOOKING].map((l) => l.id)

// ==========================================
// Booking button | כפתור בואו נמצא זמן
// ==========================================
function BookingLink({ onClick, active, className }: { onClick: (e: MouseEvent) => void; active: boolean; className?: string }) {
  return (
    <a
      href={`#${BOOKING.id}`}
      onClick={onClick}
      data-sun-beacon
      aria-current={active || undefined}
      className={cn(
        'group inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-forest-moss',
        active ? 'bg-forest-moss' : 'bg-stream-blue',
        className,
      )}
    >
      {BOOKING.label}
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
    </a>
  )
}

// ==========================================
// Floating navigation bar | סרגל הניווט הצף
// ==========================================
export default function Navbar() {
  const active = useActiveSection(ids)
  const [menuOpen, setMenuOpen] = useState(false)

  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    setMenuOpen(false)
    // The hero is pinned, so its own position can't be measured – it is simply the top of the page.
    if (id === 'hero') scrollToTarget(0)
    else goToSection(id)
  }

  return (
    <header className="fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <nav aria-label="ניווט ראשי" className="relative w-full max-w-4xl">
        <div className="glass flex items-center justify-between gap-2 rounded-full !bg-primary/60 py-1.5 pe-1.5 ps-5">
          <a href="#top" onClick={go('hero')} className="font-display text-2xl font-medium text-forest-moss">
            מאי
          </a>

          {/* Tablet and desktop: all links in a row | טאבלט ומחשב: כל הקישורים בשורה אחת */}
          <ul className="hidden items-center gap-0.5 md:flex">
            {LINKS.map((link) => (
              <li key={link.id} className="relative">
                <a
                  href={`#${link.id}`}
                  onClick={go(link.id)}
                  aria-current={active === link.id || undefined}
                  className={cn(
                    'relative z-10 block whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors lg:px-4',
                    active === link.id ? 'text-forest-moss' : 'text-forest-moss/70 hover:text-forest-moss',
                  )}
                >
                  {link.label}
                </a>
                {active === link.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-river-mist/80"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </li>
            ))}
            <li className="ms-1.5">
              <BookingLink onClick={go(BOOKING.id)} active={active === BOOKING.id} />
            </li>
          </ul>

          {/* Phone: booking button and a compact menu | טלפון: כפתור תיאום ותפריט מצומצם */}
          <div className="flex items-center gap-1.5 md:hidden">
            <BookingLink onClick={go(BOOKING.id)} active={active === BOOKING.id} className="px-4" />
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? 'סגירת התפריט' : 'פתיחת התפריט'}
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/50 text-forest-moss ring-1 ring-stream-aqua/40"
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <ul id="site-menu" className="glass mt-2 flex flex-col gap-1 rounded-3xl !bg-primary/90 p-2 md:hidden">
            {[...LINKS, BOOKING].map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={go(link.id)}
                  aria-current={active === link.id || undefined}
                  className={cn('block rounded-2xl px-4 py-2.5 text-forest-moss', active === link.id && 'bg-river-mist/80')}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  )
}
