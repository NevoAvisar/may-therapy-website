import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { CalendarCheck, CalendarDays, CalendarPlus, Clock } from 'lucide-react'
import Field, { fieldClasses } from './Field'
import MonthCalendar from './MonthCalendar'
import Reveal from './Reveal'
import WhatsAppIcon from './WhatsAppIcon'
import { BOOKING, whatsappUrl } from '../config'
import {
  bookingWhatsappUrl,
  clinicToday,
  downloadIcs,
  firstBookableDate,
  formatLongDate,
  googleCalendarUrl,
  isBookable,
  openTimes,
  type Schedule,
  type Slot,
} from '../lib/booking'
import { cn } from '../lib/cn'
import { emailConfigured, sendInquiry } from '../lib/email'
import { holdSlot, loadSchedule, scheduleConfigured } from '../lib/scheduleApi'

/** Times before this sit under "morning", the rest under "evening". */
const EVENING_FROM = '14:00'

function ChoiceChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'rounded-full py-2 text-sm tabular-nums ring-1 transition',
        selected
          ? 'bg-stream-blue font-medium text-primary ring-stream-blue'
          : 'bg-primary/70 text-forest-moss ring-stream-aqua/40 hover:bg-river-mist',
      )}
    >
      {children}
    </button>
  )
}

function TimeGroup({ label, times, selected, onSelect }: { label: string; times: string[]; selected: string | null; onSelect: (time: string) => void }) {
  if (times.length === 0) return null
  return (
    <div>
      <p className="mb-2 text-xs text-forest-moss/60">{label}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {times.map((time) => (
          <ChoiceChip key={time} selected={time === selected} onClick={() => onSelect(time)}>
            {time}
          </ChoiceChip>
        ))}
      </div>
    </div>
  )
}

function SlotSummary({ date, time }: { date: string; time?: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-forest-moss">
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-4 w-4 text-sage-leaf" aria-hidden /> {formatLongDate(date)}
      </span>
      {time && (
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <Clock className="h-4 w-4 text-sage-leaf" aria-hidden /> {time} · {BOOKING.callMinutes} דק׳
        </span>
      )}
    </p>
  )
}

function CallInfo() {
  return (
    <div className="md:col-span-2 lg:col-span-1">
      <span className="glass-mist inline-block rounded-full px-4 py-1.5 text-sm text-stream-blue">שיחת היכרות</span>
      <h2 id="booking-title" className="mt-4 font-serif text-3xl font-light text-forest-moss md:text-4xl">
        בואו נמצא זמן
      </h2>
      <p className="mt-3 leading-relaxed text-forest-moss/75">בחרו מועד שנוח לכם, ואאשר אותו איתכם בוואטסאפ.</p>

      <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-stream-blue px-5 py-2 text-sm font-medium text-primary">
        <span className="tabular-nums">{BOOKING.callMinutes} דק׳</span> · ללא עלות
      </p>
      <p className="mt-3 text-sm leading-relaxed text-forest-moss/75">השיחה אינה כרוכה בתשלום, ונועדה להבין את הצרכים שלכם.</p>
      <p className="mt-4 text-xs text-forest-moss/60">כל השעות לפי שעון ישראל</p>
    </div>
  )
}

function PickStep({ schedule, onTaken, onHeld }: { schedule: Schedule; onTaken: () => void; onHeld: (slot: Slot, emailSent: Promise<boolean>) => void }) {
  const [now] = useState(() => new Date())
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [holding, setHolding] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const times = date ? openTimes(date, schedule, now) : []
  // A refreshed schedule can take the chosen time away.
  const slot = date && time && times.includes(time) ? { date, time, minutes: BOOKING.callMinutes } : null

  const chooseDate = (next: string) => {
    setDate(next)
    setTime(null)
    setProblem(null)
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!slot) return
    const data = new FormData(e.currentTarget)
    const field = (name: string) => String(data.get(name) ?? '').trim()
    const contact = { name: field('name'), phone: field('phone'), email: field('email') }

    setHolding(true)
    setProblem(null)
    try {
      if (await holdSlot(slot, contact)) {
        const message = `שיחת היכרות ב${formatLongDate(slot.date)} בשעה ${slot.time}`
        const emailSent = emailConfigured() ? sendInquiry({ ...contact, message }).catch(() => false) : Promise.resolve(false)
        onHeld(slot, emailSent)
        return
      }
      setTime(null)
      setProblem('המועד הזה נתפס הרגע. בחרו בבקשה שעה אחרת.')
      onTaken()
    } catch {
      setProblem('לא הצלחנו לשמור את המועד. נסו שוב בעוד רגע.')
    }
    setHolding(false)
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1.15fr]">
        <CallInfo />

        <MonthCalendar
          today={clinicToday(now)}
          initialDate={firstBookableDate(schedule, now)}
          selected={date}
          isEnabled={(day) => isBookable(day, schedule, now)}
          onSelect={chooseDate}
        />

        <div className="flex flex-col gap-4 lg:border-s lg:border-stream-aqua/30 lg:ps-8">
          {date ? (
            <>
              <SlotSummary date={date} />
              <TimeGroup label="בוקר" times={times.filter((t) => t < EVENING_FROM)} selected={time} onSelect={setTime} />
              <TimeGroup label="ערב" times={times.filter((t) => t >= EVENING_FROM)} selected={time} onSelect={setTime} />
              {times.length === 0 && <p className="text-sm text-forest-moss/60">אין יותר שעות פנויות ביום הזה</p>}
            </>
          ) : (
            <p className="m-auto py-6 text-center text-sm text-forest-moss/60">בחרו תאריך כדי לראות את השעות</p>
          )}
        </div>
      </div>

      {slot && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Field label="שם">
            <input name="name" required maxLength={100} autoComplete="name" className={fieldClasses} />
          </Field>
          <Field label="טלפון">
            <input name="phone" type="tel" required maxLength={30} dir="ltr" autoComplete="tel" className={fieldClasses} />
          </Field>
          <Field label="מייל">
            <input name="email" type="email" required maxLength={200} dir="ltr" autoComplete="email" className={fieldClasses} />
          </Field>
        </div>
      )}

      <p role="status" aria-live="polite" className="mt-4 min-h-5 text-sm text-bark-toned">
        {problem}
      </p>

      <button
        type="submit"
        disabled={!slot || holding}
        className={cn(
          'mt-2 flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-3.5 font-medium text-primary transition',
          slot && !holding ? 'bg-stream-blue shadow-bloom hover:bg-forest-moss' : 'bg-stream-blue/40',
        )}
      >
        <WhatsAppIcon className="h-5 w-5" />
        {holding ? 'שומרים את המועד…' : 'אישור ותיאום בוואטסאפ'}
      </button>
    </form>
  )
}

function CalendarStep({ slot, emailSent }: { slot: Slot; emailSent: Promise<boolean> }) {
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const calendarButton = 'glass flex items-center justify-center gap-2.5 rounded-full px-5 py-3 text-sm font-medium text-forest-moss transition hover:!bg-white/70'

  useEffect(() => {
    let current = true
    emailSent.then((sent) => current && setEmailConfirmed(sent))
    return () => {
      current = false
    }
  }, [emailSent])

  return (
    <div role="status" className="mx-auto max-w-lg">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-river-mist text-stream-blue">
        <CalendarCheck className="h-6 w-6" aria-hidden />
      </span>
      <h2 id="booking-title" className="mt-4 font-serif text-3xl font-light text-forest-moss">
        {scheduleConfigured() ? 'המועד נשמר עבורכם' : 'כמעט סיימנו'}
      </h2>
      <p className="mt-2 text-forest-moss/75">
        נשאר רק לשלוח לי הודעה בוואטסאפ, ואאשר את השיחה.
        {emailConfirmed && ' שלחתי גם אישור למייל שלכם.'}
      </p>

      <div className="glass-mist mt-5 rounded-2xl px-4 py-3">
        <SlotSummary date={slot.date} time={slot.time} />
      </div>

      <a
        href={bookingWhatsappUrl(slot)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-full bg-stream-blue px-6 py-3.5 font-medium text-primary shadow-bloom transition hover:bg-forest-moss"
      >
        <WhatsAppIcon className="h-5 w-5" />
        שליחת ההודעה בוואטסאפ
      </a>

      <p className="mt-6 font-medium text-forest-moss">לשמור את המועד ביומן?</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <a href={googleCalendarUrl(slot)} target="_blank" rel="noopener noreferrer" className={calendarButton}>
          <CalendarPlus className="h-5 w-5 text-stream-blue" aria-hidden />
          יומן Google
        </a>
        <button type="button" onClick={() => downloadIcs(slot)} className={calendarButton}>
          <CalendarPlus className="h-5 w-5 text-stream-blue" aria-hidden />
          יומן אפל / Outlook
        </button>
      </div>
    </div>
  )
}

export default function BookingSection() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [failed, setFailed] = useState(false)
  const [held, setHeld] = useState<{ slot: Slot; emailSent: Promise<boolean> } | null>(null)

  const refresh = useCallback(() => {
    loadSchedule().then(
      (next) => {
        setSchedule(next)
        setFailed(false)
      },
      () => setFailed(true),
    )
  }, [])

  // Coming back to the tab picks up anything May or another client changed.
  useEffect(() => {
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  return (
    <section id="booking" aria-labelledby="booking-title" className="relative isolate pb-8 pt-24 md:pt-32">
      <div aria-hidden className="absolute start-[12%] top-24 -z-10 h-80 w-80 rounded-full bg-river-mist blur-3xl" />
      <div aria-hidden className="absolute bottom-0 end-[10%] -z-10 h-72 w-72 rounded-full bg-sage-leaf/30 blur-3xl" />

      <div className="page-container">
        <Reveal>
          <div className="glass rounded-[32px] !bg-primary/[0.55] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_30px_70px_-30px_rgba(62,84,69,0.4)] backdrop-blur-[16px] md:p-10">
            {held ? (
              <CalendarStep slot={held.slot} emailSent={held.emailSent} />
            ) : schedule ? (
              <PickStep schedule={schedule} onTaken={refresh} onHeld={(slot, emailSent) => setHeld({ slot, emailSent })} />
            ) : failed ? (
              <div className="py-10 text-center">
                <h2 id="booking-title" className="font-serif text-3xl font-light text-forest-moss">
                  היומן לא נטען כרגע
                </h2>
                <p className="mt-2 text-forest-moss/75">אפשר לכתוב לי ישירות בוואטסאפ ונמצא זמן יחד.</p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-stream-blue px-7 py-3.5 font-medium text-primary shadow-bloom transition hover:bg-forest-moss"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  שליחת הודעה בוואטסאפ
                </a>
              </div>
            ) : (
              <div className="grid min-h-[26rem] place-items-center">
                <h2 id="booking-title" className="text-sm text-forest-moss/60">
                  טוענים את היומן…
                </h2>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
