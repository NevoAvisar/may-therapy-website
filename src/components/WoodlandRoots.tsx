import { motion, useReducedMotion } from 'framer-motion'

/**
 * Trunk, roots and forest floor beneath the contact card: a painted image (see scripts/render-roots.ts)
 * with shade and mist layers that seat it against the card and the footer.
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
      <div className="absolute inset-x-0 top-0 mx-auto h-28 max-w-2xl bg-[radial-gradient(ellipse_at_50%_0%,rgba(27,19,13,0.7),rgba(46,35,24,0.28)_45%,transparent_72%)] blur-md" />
      <div className="absolute inset-x-0 top-2 hidden h-36 bg-[radial-gradient(ellipse_30%_50%_at_16%_50%,rgba(246,244,240,0.6),transparent),radial-gradient(ellipse_30%_50%_at_84%_50%,rgba(246,244,240,0.6),transparent)] md:block" />

      {/* The forest floor carries straight on into the footer */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#2A211B]" />
    </motion.div>
  )
}
