import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CalendarCheck, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import WhatsAppIcon from './WhatsAppIcon'
import { BOOKING, BOOKING_OPEN_EVENT } from '../config'
import {
  addDays,
  bookingWhatsappUrl,
  clinicToday,
  downloadIcs,
  firstBookableDate,
  formatLongDate,
  formatMonth,
  googleCalendarUrl,
  isBookable,
  monthGrid,
  openTimes,
  shiftMonth,
  type Slot,
} from '../lib/booking'
import { cn } from '../lib/cn'
import { lockPageScroll } from '../lib/smoothScroll'

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

function MonthCalendar({ now, selected, onSelect }: { now: Date; selected: string | null; onSelect: (date: string) => void }) {
  const today = clinicToday(now)
  const firstMonth = firstBookableDate(now).slice(0, 7)
  const lastMonth = addDays(today, BOOKING.daysAhead).slice(0, 7)
  const [month, setMonth] = useState(firstMonth)

  const monthButton = 'grid h-9 w-9 place-items-center rounded-full text-forest-moss transition hover:bg-river-mist disabled:opacity-25 disabled:hover:bg-transparent'

  return (
    <div>
      <div className="flex items-center justify-between">
        <button type="button" aria-label="לחודש הקודם" disabled={month <= firstMonth} onClick={() => setMonth(shiftMonth(month, -1))} className={monthButton}>
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <p aria-live="polite" className="font-medium text-forest-moss">
          {formatMonth(month)}
        </p>
        <button type="button" aria-label="לחודש הבא" disabled={month >= lastMonth} onClick={() => setMonth(shiftMonth(month, 1))} className={monthButton}>
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div aria-hidden className="mt-3 grid grid-cols-7 text-center text-xs text-forest-moss/60">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {monthGrid(month).map((date, i) =>
          date ? (
            <button
              key={date}
              type="button"
              disabled={!isBookable(date, now)}
              aria-pressed={date === selected}
              aria-label={formatLongDate(date)}
              onClick={() => onSelect(date)}
              className={cn(
                'mx-auto grid h-10 w-10 place-items-center rounded-full text-sm tabular-nums transition',
                date === selected
                  ? 'bg-stream-blue font-medium text-primary'
                  : 'text-forest-moss enabled:hover:bg-river-mist disabled:text-forest-moss/30',
                date === today && date !== selected && 'ring-1 ring-stream-aqua',
              )}
            >
              {Number(date.slice(8))}
            </button>
          ) : (
            <span key={`blank-${i}`} />
          ),
        )}
      </div>
    </div>
  )
}

function TimeGroup({ label, times, selected, onSelect }: { label: string; times: string[]; selected: string | null; onSelect: (time: string) => void }) {
  if (times.length === 0) return null
  return (
    <div>
      <p className="mb-2 text-xs text-forest-moss/60">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {times.map((time) => (
          <button
            key={time}
            type="button"
            aria-pressed={time === selected}
            onClick={() => onSelect(time)}
            className={cn(
              'rounded-full py-2 text-sm tabular-nums ring-1 transition',
              time === selected
                ? 'bg-stream-blue font-medium text-primary ring-stream-blue'
                : 'bg-white/60 text-forest-moss ring-stream-aqua/40 hover:bg-river-mist',
            )}
          >
            {time}
          </button>
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
          <Clock className="h-4 w-4 text-sage-leaf" aria-hidden /> {time}
        </span>
      )}
    </p>
  )
}

function PickStep({ now, onConfirm }: { now: Date; onConfirm: (slot: Slot) => void }) {
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)

  const chooseDate = (next: string) => {
    setDate(next)
    setTime(null)
  }

  const slot = date && time ? { date, time } : null
  const confirmClasses = 'flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-3.5 font-medium transition'

  return (
    <>
      <h2 id="booking-title" className="font-serif text-3xl font-light text-forest-moss">
        תיאום שיחת היכרות
      </h2>
      <p className="mt-2 text-forest-moss/75">
        בחרו מועד שנוח לכם לשיחה של {BOOKING.callMinutes} דקות, ואאשר אותו איתכם בוואטסאפ.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
        <MonthCalendar now={now} selected={date} onSelect={chooseDate} />

        <div className="flex flex-col gap-4 md:border-s md:border-stream-aqua/30 md:ps-8">
          {date ? (
            <>
              <SlotSummary date={date} />
              <TimeGroup label="בוקר" times={openTimes(date, BOOKING.morningSlots, now)} selected={time} onSelect={setTime} />
              <TimeGroup label="ערב" times={openTimes(date, BOOKING.eveningSlots, now)} selected={time} onSelect={setTime} />
              <p className="text-xs text-forest-moss/60">כל השעות לפי שעון ישראל</p>
            </>
          ) : (
            <p className="m-auto py-6 text-center text-sm text-forest-moss/60">בחרו תאריך כדי לראות את השעות</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        {slot ? (
          // A real link, not window.open: mobile browsers block popups and hand wa.me straight to the app.
          <a
            href={bookingWhatsappUrl(slot)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onConfirm(slot)}
            className={cn(confirmClasses, 'bg-stream-blue text-primary shadow-bloom hover:bg-forest-moss')}
          >
            <WhatsAppIcon className="h-5 w-5" />
            אישור ותיאום בוואטסאפ
          </a>
        ) : (
          <button type="button" disabled className={cn(confirmClasses, 'bg-stream-blue/40 text-primary')}>
            <WhatsAppIcon className="h-5 w-5" />
            אישור ותיאום בוואטסאפ
          </button>
        )}
      </div>
    </>
  )
}

function CalendarStep({ slot, onBack }: { slot: Slot; onBack: () => void }) {
  const calendarButton = 'glass flex items-center justify-center gap-2.5 rounded-full px-5 py-3 text-sm font-medium text-forest-moss transition hover:!bg-white/70'

  return (
    <>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-river-mist text-stream-blue">
        <CalendarCheck className="h-6 w-6" aria-hidden />
      </span>
      <h2 id="booking-title" className="mt-4 font-serif text-3xl font-light text-forest-moss">
        ההודעה מוכנה בוואטסאפ
      </h2>
      <p className="mt-2 text-forest-moss/75">נשאר רק ללחוץ על שליחה, ואחזור אליכם לאישור המועד.</p>

      <div className="glass-mist mt-5 rounded-2xl px-4 py-3">
        <SlotSummary date={slot.date} time={slot.time} />
      </div>

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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-forest-moss/70 transition hover:text-forest-moss">
          <ArrowRight className="h-4 w-4" aria-hidden />
          בחירת מועד אחר
        </button>
        <a href={bookingWhatsappUrl(slot)} target="_blank" rel="noopener noreferrer" className="text-stream-blue underline underline-offset-4 transition hover:text-forest-moss">
          וואטסאפ לא נפתח? נסו שוב
        </a>
      </div>
    </>
  )
}

function BookingFlow({ onClose }: { onClose: () => void }) {
  // Fixed for the visit, so slots don't vanish mid-choice; the dialog remounts this on every open.
  const [now] = useState(() => new Date())
  const [confirmed, setConfirmed] = useState<Slot | null>(null)
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
      className="glass relative max-h-[100dvh] overflow-y-auto overscroll-contain rounded-t-[28px] !bg-primary/[0.96] p-6 sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] md:p-8"
    >
      <button
        type="button"
        aria-label="סגירה"
        onClick={onClose}
        className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full text-forest-moss/70 transition hover:bg-river-mist hover:text-forest-moss"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      {confirmed ? <CalendarStep slot={confirmed} onBack={() => setConfirmed(null)} /> : <PickStep now={now} onConfirm={setConfirmed} />}
    </motion.div>
  )
}

/** Native <dialog>, so focus trapping, Esc and the inert page behind come from the browser. */
export default function BookingDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener(BOOKING_OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(BOOKING_OPEN_EVENT, handleOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    dialog?.showModal()
    lockPageScroll(true)
    return () => {
      dialog?.close()
      lockPageScroll(false)
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="booking-title"
      data-lenis-prevent
      onClose={() => setOpen(false)}
      onClick={(e) => {
        if (e.target === dialogRef.current) setOpen(false)
      }}
      className="mb-0 max-h-none w-full max-w-none overflow-visible bg-transparent backdrop:bg-forest-moss/45 backdrop:backdrop-blur-sm sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-md md:max-w-3xl"
    >
      {open && <BookingFlow onClose={() => setOpen(false)} />}
    </dialog>
  )
}
