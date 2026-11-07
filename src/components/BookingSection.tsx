import { useState, type ReactNode } from 'react'
import { ArrowRight, CalendarCheck, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import Reveal from './Reveal'
import WhatsAppIcon from './WhatsAppIcon'
import { BOOKING } from '../config'
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
                  : 'text-forest-moss enabled:bg-river-mist/60 enabled:hover:bg-river-mist disabled:text-forest-moss/30',
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
      <div className="grid grid-cols-3 gap-2">
        {times.map((time) => (
          <ChoiceChip key={time} selected={time === selected} onClick={() => onSelect(time)}>
            {time}
          </ChoiceChip>
        ))}
      </div>
    </div>
  )
}

function SlotSummary({ date, time, minutes }: { date: string; time?: string; minutes?: number }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-forest-moss">
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-4 w-4 text-sage-leaf" aria-hidden /> {formatLongDate(date)}
      </span>
      {time && (
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <Clock className="h-4 w-4 text-sage-leaf" aria-hidden /> {time} · {minutes} דק׳
        </span>
      )}
    </p>
  )
}

function PickStep({ onConfirm }: { onConfirm: (slot: Slot) => void }) {
  const [now] = useState(() => new Date())
  const [minutes, setMinutes] = useState(BOOKING.callDurations[0])
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)

  const chooseDate = (next: string) => {
    setDate(next)
    setTime(null)
  }

  const slot = date && time ? { date, time, minutes } : null
  const confirmClasses = 'flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-3.5 font-medium transition'

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1.3fr_1fr]">
        <div className="md:col-span-2 lg:col-span-1">
          <span className="glass-mist inline-block rounded-full px-4 py-1.5 text-sm text-stream-blue">שיחת היכרות</span>
          <h2 id="booking-title" className="mt-4 font-serif text-3xl font-light text-forest-moss md:text-4xl">
            בואו נמצא זמן
          </h2>
          <p className="mt-3 leading-relaxed text-forest-moss/75">בחרו מועד שנוח לכם, ואאשר אותו איתכם בוואטסאפ.</p>

          <p className="mb-2 mt-6 text-xs text-forest-moss/60">משך השיחה</p>
          <div className="grid max-w-[14rem] grid-cols-2 gap-2">
            {BOOKING.callDurations.map((option) => (
              <ChoiceChip key={option} selected={option === minutes} onClick={() => setMinutes(option)}>
                {option} דק׳
              </ChoiceChip>
            ))}
          </div>
          <p className="mt-4 text-xs text-forest-moss/60">כל השעות לפי שעון ישראל</p>
        </div>

        <MonthCalendar now={now} selected={date} onSelect={chooseDate} />

        <div className="flex flex-col gap-4 lg:border-s lg:border-stream-aqua/30 lg:ps-8">
          {date ? (
            <>
              <SlotSummary date={date} />
              <TimeGroup label="בוקר" times={openTimes(date, BOOKING.morningSlots, now)} selected={time} onSelect={setTime} />
              <TimeGroup label="ערב" times={openTimes(date, BOOKING.eveningSlots, now)} selected={time} onSelect={setTime} />
            </>
          ) : (
            <p className="m-auto py-6 text-center text-sm text-forest-moss/60">בחרו תאריך כדי לראות את השעות</p>
          )}
        </div>
      </div>

      <div className="mt-8">
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
    <div role="status" className="mx-auto max-w-lg">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-river-mist text-stream-blue">
        <CalendarCheck className="h-6 w-6" aria-hidden />
      </span>
      <h2 id="booking-title" className="mt-4 font-serif text-3xl font-light text-forest-moss">
        ההודעה מוכנה בוואטסאפ
      </h2>
      <p className="mt-2 text-forest-moss/75">נשאר רק ללחוץ על שליחה, ואחזור אליכם לאישור המועד.</p>

      <div className="glass-mist mt-5 rounded-2xl px-4 py-3">
        <SlotSummary date={slot.date} time={slot.time} minutes={slot.minutes} />
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
    </div>
  )
}

export default function BookingSection() {
  const [confirmed, setConfirmed] = useState<Slot | null>(null)

  return (
    <section id="booking" aria-labelledby="booking-title" className="relative isolate pb-8 pt-24 md:pt-32">
      <div aria-hidden className="absolute start-[12%] top-24 -z-10 h-80 w-80 rounded-full bg-river-mist blur-3xl" />
      <div aria-hidden className="absolute bottom-0 end-[10%] -z-10 h-72 w-72 rounded-full bg-sage-leaf/30 blur-3xl" />

      <div className="page-container">
        <Reveal>
          <div className="glass rounded-[32px] !bg-primary/[0.55] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_30px_70px_-30px_rgba(62,84,69,0.4)] backdrop-blur-[16px] md:p-10">
            {confirmed ? <CalendarStep slot={confirmed} onBack={() => setConfirmed(null)} /> : <PickStep onConfirm={setConfirmed} />}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
