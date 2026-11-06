import { useEffect, useState, type MouseEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { goToSection } from '../config'
import { scrollToTarget } from '../lib/smoothScroll'
import { cn } from '../lib/cn'

const LINKS = [
  { id: 'treatments', label: 'הטיפולים' },
  { id: 'faq', label: 'שאלות' },
  { id: 'about', label: 'עליי' },
]

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

const ids = LINKS.map((l) => l.id)

export default function Navbar() {
  const active = useActiveSection(ids)

  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    goToSection(id)
  }

  return (
    <header className="fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <nav
        aria-label="ניווט ראשי"
        className="glass flex w-full max-w-3xl items-center justify-between gap-2 rounded-full !bg-primary/60 py-1.5 pe-1.5 ps-5"
      >
        <a href="#top" onClick={(e) => { e.preventDefault(); scrollToTarget(0) }} className="font-serif text-2xl font-medium text-forest-moss">
          מאי
        </a>

        <ul className="hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => (
            <li key={link.id} className="relative">
              <a
                href={`#${link.id}`}
                onClick={go(link.id)}
                className={cn(
                  'relative z-10 block rounded-full px-4 py-2 text-sm transition-colors',
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
        </ul>

        <a
          href="#contact"
          onClick={go('contact')}
          className="group inline-flex items-center gap-2 rounded-full bg-stream-blue px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-forest-moss"
        >
          בואו נדבר
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        </a>
      </nav>
    </header>
  )
}
