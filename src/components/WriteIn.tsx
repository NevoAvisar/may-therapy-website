import { Fragment, useRef, type CSSProperties, type ElementType } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

interface WriteInProps {
  text: string
  as?: ElementType
  /** Letter by letter for headings, word by word for paragraphs. */
  by?: 'char' | 'word'
  id?: string
  className?: string
  delay?: number
}

/** Gap between tokens, in seconds – shortened on long text so it never takes more than `MAX_SPREAD` to start the last one. */
const STAGGER = { char: 0.03, word: 0.045 }
const MAX_SPREAD = 1

/**
 * Text that flows onto the page as it enters the viewport, right to left like handwriting, and then stays.
 * Each token is a CSS transition (see `.write-token`), so nothing renders per frame. Screen readers get the
 * plain sentence.
 */
export default function WriteIn({ text, as: Tag = 'p', by = 'word', id, className, delay = 0 }: WriteInProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' })
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <Tag id={id} className={className}>
        {text}
      </Tag>
    )
  }

  const words = text.split(' ')
  const count = by === 'char' ? text.replace(/ /g, '').length : words.length
  const stagger = Math.min(STAGGER[by], MAX_SPREAD / count)
  let i = 0

  const token = (content: string) => (
    <span key={i} className="write-token" style={{ '--delay': `${(delay + i++ * stagger).toFixed(3)}s` } as CSSProperties}>
      {content}
    </span>
  )

  return (
    <Tag id={id} className={className}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden data-written={inView || undefined}>
        {words.map((word, w) => (
          <Fragment key={w}>
            {w > 0 && ' '}
            {/* Letters stay inline-block inside a nowrap word, so Hebrew RTL order and line wrapping hold. */}
            {by === 'char' ? <span className="inline-block whitespace-nowrap">{[...word].map(token)}</span> : token(word)}
          </Fragment>
        ))}
      </span>
    </Tag>
  )
}
