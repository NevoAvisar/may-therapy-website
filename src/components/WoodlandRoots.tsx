import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

/* Photo by Jens Aber on Unsplash – to self-host, put it in /public and set ROOTS_SRC / ROOTS_SRCSET to its path. */
const ROOTS_PHOTO = 'https://images.unsplash.com/photo-1748602471338-e22a2e58dce6?auto=format&fit=crop&q=75'
const ROOTS_SRC = `${ROOTS_PHOTO}&w=2400`
const ROOTS_SRCSET = `${ROOTS_PHOTO}&w=1200 1200w, ${ROOTS_PHOTO}&w=2400 2400w`

// A long melt: the photo rises from nothing behind the card, so the page and forest never meet at a line.
const MELT =
  'linear-gradient(to bottom, transparent 0, rgba(0,0,0,0.05) 50px, rgba(0,0,0,0.15) 105px, rgba(0,0,0,0.5) 230px, rgba(0,0,0,0.85) 335px, #000 420px)'

/** The forest the booking card sits inside, rising behind it and running under the footer to the page bottom. */
export default function WoodlandRoots() {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const y = useTransform(scrollYProgress, [0, 1], [56, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1])

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-28 -z-10 h-[39rem] sm:-bottom-20 md:h-[47.5rem]">
      <div className="absolute inset-0 overflow-hidden" style={{ maskImage: MELT, WebkitMaskImage: MELT }}>
        <motion.img
          src={ROOTS_SRC}
          srcSet={ROOTS_SRCSET}
          sizes="max(100vw, 1520px)"
          alt=""
          width={2400}
          height={1200}
          loading="lazy"
          decoding="async"
          className="h-full w-full origin-bottom object-cover object-bottom"
          style={reduceMotion ? undefined : { y, scale }}
        />
      </div>
    </div>
  )
}
