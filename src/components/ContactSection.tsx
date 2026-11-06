import { useState } from 'react'
import { Clock, Mail, MapPin, MessageCircleHeart } from 'lucide-react'
import Reveal from './Reveal'
import WhatsAppIcon from './WhatsAppIcon'
import WoodlandRoots from './WoodlandRoots'
import { CONTACT, mailtoUrl, whatsappUrl } from '../config'

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
      <WoodlandRoots />

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
