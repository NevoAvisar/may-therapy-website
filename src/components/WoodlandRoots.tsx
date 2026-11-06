import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

/* Photo by Jens Aber on Unsplash – to self-host, put it in /public and set ROOTS_SRC / ROOTS_SRCSET to its path. */
const ROOTS_PHOTO = 'https://images.unsplash.com/photo-1748602471338-e22a2e58dce6?auto=format&fit=crop&q=75'
const ROOTS_SRC = `${ROOTS_PHOTO}&w=2400`
const ROOTS_SRCSET = `${ROOTS_PHOTO}&w=1200 1200w, ${ROOTS_PHOTO}&w=2400 2400w`

// The sides melt into the page in soft steps, while the centre stays solid so the trunk reaches the card.
const MELT = [
  'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.06) 8%, rgba(0,0,0,0.24) 18%, rgba(0,0,0,0.56) 30%, rgba(0,0,0,0.86) 44%, #000 58%)',
  'radial-gradient(ellipse 34% 95% at 50% 0%, #000 42%, transparent 100%)',
].join(', ')

/** The photographed trunk and forest floor the contact card rests on, settling as you scroll down to it. */
export default function WoodlandRoots() {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const y = useTransform(scrollYProgress, [0, 1], [56, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1])

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 md:h-80">
      <div className="absolute inset-0 overflow-hidden" style={{ maskImage: MELT, WebkitMaskImage: MELT }}>
        <motion.img
          src={ROOTS_SRC}
          srcSet={ROOTS_SRCSET}
          sizes="100vw"
          alt=""
          width={2400}
          height={1200}
          loading="lazy"
          decoding="async"
          className="h-full w-full origin-bottom object-cover object-[50%_46%]"
          style={reduceMotion ? undefined : { y, scale }}
        />
      </div>

      {/* Shade where the card meets the trunk */}
      <div className="absolute inset-x-0 top-0 mx-auto h-20 max-w-xl bg-[radial-gradient(ellipse_at_50%_0%,rgba(27,19,13,0.6),rgba(46,35,24,0.22)_50%,transparent_75%)] blur-md" />

      {/* The forest floor carries straight on into the footer */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#2A211B]" />
    </div>
  )
}
