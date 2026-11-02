import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Mail, MapPin, MessageCircleHeart } from 'lucide-react'
import Reveal from './Reveal'
import WhatsAppIcon from './WhatsAppIcon'
import { CONTACT, mailtoUrl, whatsappUrl } from '../config'

/** Hand-drawn roots that spread beneath the card. */
function RootsVisual() {
  const roots = [
    'M600 0 C598 60 560 110 500 140 C440 170 380 176 300 210',
    'M600 0 C604 70 640 120 700 150 C760 180 830 186 900 214',
    'M600 0 C596 80 590 150 560 210',
    'M600 0 C606 90 620 160 660 220',
    'M500 140 C470 170 430 186 380 196',
    'M700 150 C736 176 770 196 820 204',
    'M300 210 C250 222 200 220 140 236',
    'M900 214 C950 226 1010 224 1070 240',
  ]
  return (
    <svg aria-hidden viewBox="0 0 1200 260" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[220px] w-full" preserveAspectRatio="xMidYMax slice">
      {roots.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke={i < 4 ? '#7F6A58' : '#9AB6AB'}
          strokeOpacity={i < 4 ? 0.35 : 0.4}
          strokeWidth={i < 4 ? 2 : 1.2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.2, delay: 0.2 + i * 0.12, ease: [0.22, 0.61, 0.36, 1] }}
        />
      ))}
    </svg>
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
      className="relative isolate overflow-hidden bg-gradient-to-b from-primary via-flower-center/40 to-[#E9DCCB] pb-40 pt-24 md:pb-56 md:pt-32"
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

            <div id="about" className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 border-t border-stream-aqua/30 pt-8 sm:flex-row sm:text-start">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-flower-bloom to-flower-center font-serif text-3xl text-forest-moss ring-4 ring-white/70">
                מ
              </span>
              <div>
                <p className="font-serif text-xl text-forest-moss">
                  מאי <span className="text-base text-forest-moss/60">· מטפלת במגע ובאיזון גוף-נפש</span>
                </p>
                <p className="mt-2 leading-relaxed text-forest-moss/75">
                  הדרך שלי לטיפול התחילה כשהגוף שלי ביקש ממני לעצור ולהקשיב. היום אני מלווה אנשים לחזור לקרקע – בקצב
                  שלהם, בביטחון ובהקשבה מלאה.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
