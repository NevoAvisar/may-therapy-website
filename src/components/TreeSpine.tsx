import { useEffect, useMemo, useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

// ==========================================
// Tree spine along the page edge | גזע העץ בצד הדף
// ==========================================
/**
 * Persistent right-side spine (RTL "start" edge).
 * A vine grows down with the scroll, a pastel bud blooms as each anchor section is
 * reached, and when the final section arrives its base fans out into roots.
 */
interface TreeSpineProps {
  /** Section / card ids that sprout a flower when reached. */
  bloomAt: string[]
  /** Id of the final section – reaching it grows the roots. */
  rootsAt: string
  visible?: boolean
}

// Vine geometry lives in a 60 × 1000 viewBox stretched to the spine's height.
const VB_W = 60
const VB_H = 1000
const BASE_X = 34

/** Gentle meander that settles back to BASE_X at the top and the base (for the roots). */
function vineX(y: number, phase = 0) {
  const t = y / VB_H
  const envelope = Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.6
  return BASE_X + envelope * (8 * Math.sin(t * Math.PI * 7 + phase) + 3 * Math.sin(t * Math.PI * 17 + phase * 2))
}

function vinePath(phase = 0, offset = 0) {
  let d = ''
  for (let y = 0; y <= VB_H; y += 8) {
    d += `${y === 0 ? 'M' : 'L'}${(vineX(y, phase) + offset).toFixed(2)} ${y} `
  }
  return d
}

const LEAVES = [0.07, 0.15, 0.24, 0.33, 0.42, 0.51, 0.6, 0.69, 0.78, 0.87, 0.94]

const ROOTS = [
  'M240 0 C236 34 222 58 196 78 C170 98 150 120 132 156',
  'M240 0 C230 26 204 38 172 46 C138 54 104 52 70 70',
  'M240 0 C244 40 240 82 226 118 C214 150 214 172 220 198',
  'M240 0 C228 18 206 22 182 22 C150 22 124 14 92 22 C66 28 42 24 14 34',
  'M240 0 C238 52 216 96 186 128 C166 150 168 176 158 196',
  'M196 78 C204 98 200 120 190 140',
  'M172 46 C162 70 140 82 116 92',
  'M132 156 C118 162 104 176 98 194',
  'M186 128 C176 150 160 166 140 176',
  'M70 70 C56 82 40 100 34 124',
  'M226 118 C206 128 192 146 188 170',
  'M70 70 C58 86 40 92 22 104',
  'M226 118 C240 130 248 148 252 170',
]

type Mark = { id: string; at: number }

export default function TreeSpine({ bloomAt, rootsAt, visible = true }: TreeSpineProps) {
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const eased = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.0005 })
  const progress = reduceMotion ? scrollYProgress : eased

  const [marks, setMarks] = useState<Mark[]>([])
  const rootsAtRef = useRef(1)

  // Map scroll progress so the vine reaches its base exactly when the final section arrives.
  const grow = useTransform(progress, (v) => Math.min(1, v / rootsAtRef.current))

  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      const progressFor = (id: string, viewportLine: number) => {
        const el = document.getElementById(id)
        if (!el) return null
        const top = el.getBoundingClientRect().top + window.scrollY
        return Math.min(1, Math.max(0.02, (top - window.innerHeight * viewportLine) / max))
      }

      const rootsP = progressFor(rootsAt, 0.6) ?? 1
      rootsAtRef.current = Math.max(0.2, rootsP)

      const next: Mark[] = []
      for (const id of bloomAt) {
        const p = progressFor(id, 0.6)
        if (p == null) continue
        const at = Math.min(0.92, p / rootsAtRef.current)
        // Cards side by side reach the same point – keep one flower per height.
        if (next.some((m) => Math.abs(m.at - at) < 0.05)) continue
        next.push({ id, at })
      }
      setMarks(next)
      grow.set(Math.min(1, progress.get() / rootsAtRef.current))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [bloomAt, rootsAt, grow, progress])

  // Only re-render when a threshold is crossed, not on every frame.
  const [reached, setReached] = useState(0)
  const [rooted, setRooted] = useState(false)
  useMotionValueEvent(grow, 'change', (v) => {
    setReached(marks.filter((m) => v >= m.at).length)
    setRooted(v >= 0.995)
  })
  useEffect(() => {
    const v = grow.get()
    setReached(marks.filter((m) => v >= m.at).length)
    setRooted(v >= 0.995)
  }, [marks, grow])

  const mainPath = useMemo(() => vinePath(), [])
  const shadowPath = useMemo(() => vinePath(1.4, -2), [])
  const tipTop = useTransform(grow, (v) => `${v * 100}%`)
  const tipLeft = useTransform(grow, (v) => `${(vineX(v * VB_H) / VB_W) * 100}%`)

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed right-0 top-0 z-30 flex h-full w-10 flex-col md:w-[60px]"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Vine */}
      <div className="relative flex-1 pt-20">
        <div className="relative h-full">
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="vine-ink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8EA691" />
                <stop offset="0.65" stopColor="#5E8079" />
                <stop offset="1" stopColor="#7F6A58" />
              </linearGradient>
            </defs>
            <path d={mainPath} fill="none" stroke="#9AB6AB" strokeOpacity={0.18} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <motion.path
              d={shadowPath}
              fill="none"
              stroke="#8EA691"
              strokeOpacity={0.55}
              strokeWidth={1}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength: grow }}
            />
            <motion.path
              d={mainPath}
              fill="none"
              stroke="url(#vine-ink)"
              strokeWidth={2.4}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength: grow }}
            />
          </svg>

          {LEAVES.map((at, i) => (
            <Leaf key={at} at={at} grow={grow} flip={i % 2 === 1} />
          ))}

          {marks.map((m, i) => (
            <Bloom key={m.id} at={m.at} open={i < reached} index={i} reduceMotion={!!reduceMotion} />
          ))}

          {/* Growing tip */}
          <motion.span
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage-leaf shadow-[0_0_12px_3px_rgba(142,166,145,0.6)]"
            style={{ top: tipTop, left: tipLeft, opacity: rooted ? 0 : 1 }}
          />
        </div>
      </div>

      {/* Roots finale */}
      <div className="relative h-[22vh] min-h-[110px]">
        <motion.div
          className="absolute -top-6 right-[30%] h-[140%] w-[300px] origin-top-right rounded-[50%] bg-[radial-gradient(ellipse_at_top_right,rgba(127,106,88,0.28),rgba(245,229,201,0.18)_45%,transparent_70%)] blur-md md:w-[420px]"
          initial={false}
          animate={{ opacity: rooted ? 1 : 0, scale: rooted ? 1 : 0.6 }}
          transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
        />
        <svg
          className="absolute top-0 h-full w-[160px] overflow-visible md:w-[240px]"
          style={{ right: `${((VB_W - BASE_X) / VB_W) * 100}%` }}
          viewBox="0 0 240 200"
          preserveAspectRatio="xMaxYMin meet"
        >
          {ROOTS.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              fill="none"
              stroke={i < 5 ? '#7F6A58' : '#9AB6AB'}
              strokeOpacity={i < 5 ? 0.85 : 0.65}
              strokeWidth={i < 5 ? 4.2 - i * 0.45 : 1.6}
              strokeLinecap="round"
              initial={false}
              animate={{ pathLength: rooted ? 1 : 0, opacity: rooted ? 1 : 0 }}
              transition={{
                duration: reduceMotion ? 0 : 1.6,
                delay: reduceMotion ? 0 : rooted ? (i < 5 ? i * 0.12 : 0.7 + (i - 5) * 0.12) : 0,
                ease: [0.22, 0.61, 0.36, 1],
              }}
            />
          ))}
        </svg>
      </div>
    </motion.div>
  )
}

// ==========================================
// Leaf | עלה
// ==========================================
function Leaf({ at, grow, flip }: { at: number; grow: MotionValue<number>; flip: boolean }) {
  const scale = useTransform(grow, [at - 0.015, at + 0.02], [0, 1], { clamp: true })
  const left = `${(vineX(at * VB_H) / VB_W) * 100}%`
  return (
    <motion.svg
      viewBox="0 0 20 12"
      className="absolute h-2 w-3.5 md:h-3 md:w-5"
      style={{
        top: `${at * 100}%`,
        left,
        scale,
        x: flip ? '0%' : '-100%',
        y: '-50%',
        rotate: flip ? -28 : 28,
        originX: flip ? 0 : 1,
        originY: 0.5,
      }}
    >
      <path
        d={flip ? 'M0 6 C6 -1 15 0 20 6 C15 12 6 13 0 6Z' : 'M20 6 C14 -1 5 0 0 6 C5 12 14 13 20 6Z'}
        fill="#8EA691"
        fillOpacity={0.75}
      />
    </motion.svg>
  )
}

// ==========================================
// Flower | פרח
// ==========================================
function Bloom({ at, open, index, reduceMotion }: { at: number; open: boolean; index: number; reduceMotion: boolean }) {
  const left = `${(vineX(at * VB_H) / VB_W) * 100}%`
  const tilt = index % 2 === 0 ? -12 : 14
  const spring = reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 140, damping: 13 }

  return (
    <div
      className="absolute h-9 w-9 md:h-12 md:w-12"
      style={{ top: `${at * 100}%`, left, transform: `translate(-100%, -50%) rotate(${tilt}deg)`, transformOrigin: '100% 50%' }}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full overflow-visible">
        {/* Twig from the vine */}
        <motion.path
          d="M48 24 C40 23 34 21 26 22"
          fill="none"
          stroke="#7F6A58"
          strokeWidth={1.4}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: open ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: 'easeOut' }}
        />
        <motion.path
          d="M38 23 C36 16 39 12 44 11 C44 17 42 21 38 23Z"
          fill="#8EA691"
          initial={false}
          animate={{ scale: open ? 1 : 0, opacity: open ? 1 : 0 }}
          style={{ originX: 0, originY: 1 }}
          transition={{ ...spring, delay: open && !reduceMotion ? 0.25 : 0 }}
        />

        {/* Bud → blossom */}
        <motion.g
          initial={false}
          animate={open ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0, rotate: -90, opacity: 0 }}
          transition={{ ...spring, delay: open && !reduceMotion ? 0.35 : 0 }}
        >
          {[0, 72, 144, 216, 288].map((deg, i) => (
            // Static rotation on the wrapper; Framer's transform would otherwise replace it.
            <g key={deg} transform={`rotate(${deg} 16 22)`}>
              <motion.ellipse
                cx={16}
                cy={13.5}
                rx={5.4}
                ry={8}
                fill="#E8C5C8"
                stroke="#d9a9ae"
                strokeWidth={0.6}
                initial={false}
                animate={{ scaleY: open ? 1 : 0.2 }}
                style={{ originX: 0.5, originY: 1 }}
                transition={{ ...spring, delay: open && !reduceMotion ? 0.45 + i * 0.06 : 0 }}
              />
            </g>
          ))}
          <circle cx={16} cy={22} r={4.2} fill="#F5E5C9" />
          <circle cx={14.8} cy={21} r={0.8} fill="#7F6A58" fillOpacity={0.6} />
          <circle cx={17.4} cy={21.6} r={0.8} fill="#7F6A58" fillOpacity={0.6} />
          <circle cx={16} cy={23.6} r={0.8} fill="#7F6A58" fillOpacity={0.6} />
        </motion.g>
      </svg>
    </div>
  )
}
