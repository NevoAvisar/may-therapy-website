import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Mail, MapPin, MessageCircleHeart } from 'lucide-react'
import Reveal from './Reveal'
import WhatsAppIcon from './WhatsAppIcon'
import { CONTACT, mailtoUrl, whatsappUrl } from '../config'

/** Hand-drawn roots that spread beneath the card – thick taproots tapering into fine rootlets. */
const ROOT_TIERS: { width: number; color: string; opacity: number; paths: string[] }[] = [
  {
    // Taproots fanning out from the trunk
    width: 7,
    color: '#7F6A58',
    opacity: 0.5,
    paths: [
      'M600 0 C596 70 548 120 480 150 C410 182 330 192 240 226 C190 246 150 270 96 300',
      'M600 0 C606 74 656 124 724 154 C794 186 872 196 960 230 C1010 250 1050 274 1104 302',
      'M600 0 C592 90 574 170 540 240 C524 274 520 296 522 320',
      'M600 0 C610 96 632 172 668 236 C688 272 690 298 684 320',
      'M600 0 C600 110 604 200 598 320',
    ],
  },
  {
    width: 3.6,
    color: '#7F6A58',
    opacity: 0.42,
    paths: [
      'M480 150 C450 190 420 220 360 246 C320 264 290 286 270 318',
      'M724 154 C756 194 786 224 846 250 C884 268 912 290 930 318',
      'M240 226 C200 222 150 230 92 220 C60 214 30 220 0 232',
      'M960 230 C1004 226 1052 234 1110 224 C1144 218 1172 224 1200 236',
      'M540 240 C510 262 470 276 430 300',
      'M668 236 C700 258 740 272 778 298',
    ],
  },
  {
    // Fine rootlets in river aqua
    width: 1.8,
    color: '#9AB6AB',
    opacity: 0.6,
    paths: [
      'M360 246 C350 270 336 288 312 304',
      'M846 250 C858 274 872 290 896 306',
      'M410 182 C396 200 372 210 344 212',
      'M794 186 C810 204 834 214 862 216',
      'M150 270 C130 280 112 296 104 318',
      'M1050 274 C1072 284 1090 298 1096 318',
      'M598 260 C584 280 572 296 566 318',
      'M598 240 C612 262 626 282 634 316',
    ],
  },
]

function RootsVisual() {
  let order = 0
  return (
    <>
      {/* Darker earth the roots sink into */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 mx-auto h-[300px] max-w-5xl bg-[radial-gradient(ellipse_at_top,rgba(127,106,88,0.2),rgba(127,106,88,0.08)_45%,transparent_72%)] blur-xl md:h-[340px]"
      />
      <svg
        aria-hidden
        viewBox="0 0 1200 320"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[280px] w-full md:h-[340px]"
        preserveAspectRatio="xMidYMax slice"
      >
        {ROOT_TIERS.map((tier, t) =>
          tier.paths.map((d) => {
            const delay = 0.2 + order++ * 0.08
            const draw = {
              initial: { pathLength: 0 },
              whileInView: { pathLength: 1 },
              viewport: { once: true },
              transition: { duration: 2.4 - t * 0.4, delay, ease: [0.22, 0.61, 0.36, 1] as const },
            }
            return (
              <g key={d}>
                {/* Soft halo gives each root body and weight */}
                {t < 2 && (
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={tier.color}
                    strokeOpacity={0.12}
                    strokeWidth={tier.width * 2.4}
                    strokeLinecap="round"
                    {...draw}
                  />
                )}
                <motion.path
                  d={d}
                  fill="none"
                  stroke={tier.color}
                  strokeOpacity={tier.opacity}
                  strokeWidth={tier.width}
                  strokeLinecap="round"
                  {...draw}
                />
              </g>
            )
          }),
        )}
      </svg>
    </>
  )
}

export default function ContactSection() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      /* clipboard unavailable – the mailto link still works */
    }
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative isolate overflow-x-clip bg-gradient-to-b from-primary via-flower-center/40 to-[#E9DCCB] pb-56 pt-24 md:pb-80 md:pt-32"
    >
      <RootsVisual />

      <div className="page-container max-w-4xl">
        <Reveal>
          <div className="glass relative rounded-[32px] p-8 text-center md:p-14">
            <span className="glass-mist inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-stream-blue">
              <MessageCircleHeart className="h-4 w-4" aria-hidden />
              בואו נדבר
            </span>
            <h2 id="contact-title" className="mt-5 font-serif text-4xl font-light text-forest-moss md:text-5xl">
              נשמע מתאים? בואו נדבר
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-forest-moss/75">
              אפשר לפנות אליי בוואטסאפ או במייל לכל שאלה, התייעצות או תיאום טיפול.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-stream-blue px-7 py-3.5 font-medium text-primary shadow-bloom transition hover:bg-forest-moss"
              >
                <WhatsAppIcon className="h-5 w-5" />
                שליחת הודעה בוואטסאפ
              </a>
              <a
                href={mailtoUrl}
                onClick={copyEmail}
                className="glass inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 font-medium text-forest-moss transition hover:!bg-white/70"
              >
                <Mail className="h-5 w-5 text-stream-blue" aria-hidden />
                שליחת מייל
              </a>
            </div>
            <p role="status" aria-live="polite" className="mt-3 h-5 text-sm text-stream-blue">
              {copied ? `הכתובת ${CONTACT.email} הועתקה` : ''}
            </p>

            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-forest-moss/70">
              <li className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-sage-leaf" aria-hidden /> קליניקה פרטית ושקטה
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-sage-leaf" aria-hidden /> א׳–ה׳ · בוקר וערב
              </li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
