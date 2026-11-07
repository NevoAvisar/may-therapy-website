import { useState, type FormEvent, type ReactNode } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import WhatsAppIcon from './WhatsAppIcon'
import { whatsappLink } from '../config'
import { emailConfigured, sendInquiry, type Inquiry } from '../lib/email'

type Status = 'idle' | 'sending' | { sent: boolean; inquiry: Inquiry }

const fieldClasses =
  'w-full rounded-2xl border border-stream-aqua/40 bg-white/60 px-4 py-3 text-forest-moss placeholder:text-forest-moss/40 transition focus:bg-white/80'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-start text-sm text-forest-moss/80">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}

function inquiryAsWhatsapp({ name, phone, message }: Inquiry) {
  return whatsappLink([`היי מאי, כאן ${name}.`, message, phone && `טלפון: ${phone}`].filter(Boolean).join('\n'))
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [emailConfirmed, setEmailConfirmed] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    // Hidden from people, so only bots fill it in.
    if (data.get('website')) return
    const field = (name: string) => String(data.get(name) ?? '').trim()
    const inquiry = { name: field('name'), email: field('email'), phone: field('phone'), message: field('message') }

    if (!emailConfigured()) {
      setStatus({ sent: false, inquiry })
      return
    }
    setStatus('sending')
    try {
      setEmailConfirmed(await sendInquiry(inquiry))
      setStatus({ sent: true, inquiry })
    } catch {
      setStatus({ sent: false, inquiry })
    }
  }

  if (typeof status === 'object' && status.sent) {
    return (
      <div role="status" className="glass-mist mx-auto mt-8 max-w-xl rounded-3xl px-6 py-7">
        <CheckCircle2 className="mx-auto h-8 w-8 text-stream-blue" aria-hidden />
        <p className="mt-3 font-serif text-2xl font-light text-forest-moss">הפנייה התקבלה, תודה {status.inquiry.name}</p>
        <p className="mt-2 text-forest-moss/75">
          {emailConfirmed ? `שלחתי אישור לכתובת ${status.inquiry.email}. ` : ''}
          אחזור אליכם בהקדם.
        </p>
      </div>
    )
  }

  if (typeof status === 'object') {
    return (
      <div role="status" className="glass-mist mx-auto mt-8 max-w-xl rounded-3xl px-6 py-7">
        <p className="font-serif text-2xl font-light text-forest-moss">נשאר עוד צעד אחד</p>
        <p className="mt-2 text-forest-moss/75">הפנייה עדיין לא נשלחה. כדי שתגיע אליי, שלחו אותה בוואטסאפ – היא כבר כתובה ומוכנה.</p>
        <a
          href={inquiryAsWhatsapp(status.inquiry)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-stream-blue px-7 py-3.5 font-medium text-primary shadow-bloom transition hover:bg-forest-moss"
        >
          <WhatsAppIcon className="h-5 w-5" />
          שליחה בוואטסאפ
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
      <Field label="שם">
        <input name="name" required autoComplete="name" className={fieldClasses} />
      </Field>
      <Field label="מייל">
        <input name="email" type="email" required dir="ltr" autoComplete="email" className={fieldClasses} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="טלפון (לא חובה)">
          <input name="phone" type="tel" dir="ltr" autoComplete="tel" className={fieldClasses} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="איך אפשר לעזור?">
          <textarea name="message" required rows={4} className={`${fieldClasses} resize-none`} />
        </Field>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -start-[9999px] h-0 w-0 opacity-0" />
      <button
        type="submit"
        data-sun-beacon
        disabled={status === 'sending'}
        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-stream-blue px-7 py-3.5 font-medium text-primary shadow-bloom transition hover:bg-forest-moss disabled:opacity-60 sm:col-span-2"
      >
        <Send className="h-5 w-5" aria-hidden />
        {status === 'sending' ? 'שולחים…' : 'שליחת פנייה'}
      </button>
    </form>
  )
}
