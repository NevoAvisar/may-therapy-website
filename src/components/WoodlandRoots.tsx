import { motion, useReducedMotion } from 'framer-motion'

/**
 * Woodland roots beneath the contact card: a painted image (see scripts/render-roots.ts) anchored by
 * earth, shade and mist layers, so it sits in the page rather than on it.
 */
export default function WoodlandRoots() {
  const reduceMotion = useReducedMotion()
  const spread = {
    hidden: { clipPath: 'circle(0% at 50% 0%)' },
    shown: {
      clipPath: 'circle(150% at 50% 0%)',
      transition: { duration: reduceMotion ? 0 : 3, ease: [0.22, 0.61, 0.36, 1] as const },
    },
  }

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 md:h-80"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true }}
    >
      {/* Earth the roots push through */}
      <div className="absolute inset-x-0 bottom-0 mx-auto h-full max-w-6xl bg-[radial-gradient(ellipse_at_50%_100%,rgba(74,59,44,0.26),rgba(110,90,71,0.1)_48%,transparent_72%)] blur-xl" />

      <motion.div className="absolute inset-0" variants={spread}>
        {/* Cropped like `xMidYMin slice`: the trunk stays under the card, the sides run off the page */}
        <img
          src="/roots.webp"
          alt=""
          width={3000}
          height={510}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top"
        />
      </motion.div>

      {/* Shade where the roots leave the card, with mist drifting off to the sides */}
      <div className="absolute inset-x-0 top-0 mx-auto h-28 max-w-2xl bg-[radial-gradient(ellipse_at_50%_0%,rgba(46,35,24,0.5),rgba(74,59,44,0.18)_45%,transparent_72%)] blur-md" />
      <div className="absolute inset-x-0 top-2 h-36 bg-[radial-gradient(ellipse_30%_50%_at_16%_50%,rgba(246,244,240,0.6),transparent),radial-gradient(ellipse_30%_50%_at_84%_50%,rgba(246,244,240,0.6),transparent)]" />

      {/* The roots sink into the earth above the footer */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-[#E9DCCB]/70 to-[#E9DCCB]" />
    </motion.div>
  )
}
