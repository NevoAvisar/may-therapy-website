import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useMotionStopped } from '../lib/a11y'

// Scroll reveal | הופעה עדינה בגלילה
/** Soft rise-and-fade each time an element enters the viewport, in either scroll direction. */
export default function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useMotionStopped()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !!reduceMotion, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
