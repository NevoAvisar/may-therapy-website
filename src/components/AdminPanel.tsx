import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { LogOut, Phone, Plus } from 'lucide-react'
import Field, { fieldClasses } from './Field'
import MonthCalendar from './MonthCalendar'
import WhatsAppIcon from './WhatsAppIcon'
import { BOOKING } from '../config'
import { addDays, adminSlots, clinicSlot, clinicToday, formatLongDate, isDayOpen, type Schedule, type TimeWindow } from '../lib/booking'
import { cn } from '../lib/cn'
import {
  clearOverride,
  isAdminSession,
  loadBookings,
  loadSchedule,
  releaseBooking,
  saveWeek,
  scheduleConfigured,
  setOverride,
  signIn,
  signOut,
  type Booking,
} from '../lib/scheduleApi'

const WEEKDAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

const card = 'glass rounded-[28px] !bg-primary/[0.6] p-6 md:p-8'
const heading = 'font-display text-2xl font-light text-forest-moss'
const primaryButton = 'rounded-full bg-stream-blue px-6 py-3 font-medium text-primary transition hover:bg-forest-moss disabled:opacity-60'
const quietButton = 'rounded-full bg-white/60 px-4 py-2 text-sm text-forest-moss ring-1 ring-stream-aqua/40 transition hover:bg-river-mist'

function Page({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-river-mist/50 to-primary px-4 py-8 text-forest-moss md:py-12">
      <main className="mx-auto max-w-4xl space-y-6">{children}</main>
    </div>
  )
}

function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setBusy(true)
    setProblem(null)
    try {
      if (await signIn(String(data.get('email')), String(data.get('password')))) {
        onSignedIn()
        return
      }
      await signOut()
      setProblem('למשתמש הזה אין הרשאת ניהול.')
    } catch {
      setProblem('המייל או הסיסמה לא נכונים.')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className={cn(card, 'mx-auto mt-16 max-w-sm space-y-4')}>
      <h1 className={heading}>כניסה לניהול היומן</h1>
      <Field label="מייל">
        <input name="email" type="email" required dir="ltr" autoComplete="username" className={fieldClasses} />
      </Field>
      <Field label="סיסמה">
        <input name="password" type="password" required dir="ltr" autoComplete="current-password" className={fieldClasses} />
      </Field>
      <p role="status" className="min-h-5 text-sm text-bark-toned">
        {problem}
      </p>
      <button type="submit" disabled={busy} className={cn(primaryButton, 'w-full')}>
        כניסה
      </button>
    </form>
  )
}

function BookingsList({ bookings, onRelease }: { bookings: Booking[]; onRelease: (booking: Booking) => void }) {
  return (
    <section className={card}>
      <h2 className={heading}>שיחות קרובות</h2>
      {bookings.length === 0 && <p className="mt-3 text-forest-moss/70">אין כרגע שיחות שנקבעו.</p>}
      <ul className="mt-4 divide-y divide-stream-aqua/30">
        {bookings.map((booking) => {
          const { date, time } = clinicSlot(booking.start_at)
          return (
            <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">
                  {formatLongDate(date)} · <span className="tabular-nums">{time}</span>
                </p>
                <p className="text-sm text-forest-moss/75">
                  {booking.name} · <span dir="ltr">{booking.email}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a href={`tel:${booking.phone}`} aria-label={`התקשרות אל ${booking.name}`} className={cn(quietButton, 'inline-flex items-center gap-1.5')}>
                  <Phone className="h-4 w-4" aria-hidden />
                  <span dir="ltr">{booking.phone}</span>
                </a>
                <a href={whatsappNumberLink(booking.phone)} target="_blank" rel="noopener noreferrer" aria-label={`וואטסאפ אל ${booking.name}`} className={quietButton}>
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
                <button type="button" onClick={() => onRelease(booking)} className={quietButton}>
                  שחרור המועד
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** wa.me wants the international form, and clients type 050… */
function whatsappNumberLink(phone: string) {
  const digits = phone.replace(/\D/g, '').replace(/^0/, '972')
  return `https://wa.me/${digits}`
}

function DayManager({ schedule, today, run }: { schedule: Schedule; today: string; run: (change: () => Promise<void>) => void }) {
  const [date, setDate] = useState(today)
  const [customTime, setCustomTime] = useState('')
  const dayOpen = isDayOpen(date, schedule)
  const slots = adminSlots(date, schedule)

  const toggleSlot = (slot: (typeof slots)[number]) => {
    // A closed regular slot and a custom hour both exist only as an override, so removing it undoes the choice.
    run(() => (slot.isOpen && !slot.isCustom ? setOverride({ date, time: slot.time, is_open: false }) : clearOverride(date, slot.time)))
  }

  const addCustom = (e: FormEvent) => {
    e.preventDefault()
    if (!customTime) return
    run(() => setOverride({ date, time: customTime, is_open: true }))
    setCustomTime('')
  }

  return (
    <section className={card}>
      <h2 className={heading}>פתיחה וסגירה של ימים ושעות</h2>
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <MonthCalendar
          today={today}
          initialDate={today}
          selected={date}
          isEnabled={(day) => day >= today && day <= addDays(today, BOOKING.daysAhead)}
          onSelect={setDate}
        />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{formatLongDate(date)}</p>
            <button
              type="button"
              aria-pressed={dayOpen}
              onClick={() => run(() => setOverride({ date, time: '', is_open: !dayOpen }))}
              className={quietButton}
            >
              {dayOpen ? 'סגירת היום' : 'פתיחת היום'}
            </button>
          </div>

          {slots.length === 0 && <p className="text-sm text-forest-moss/70">{dayOpen ? 'אין שעות ביום הזה.' : 'היום הזה סגור.'}</p>}

          <div className="grid grid-cols-4 gap-1.5">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={slot.isBooked}
                aria-pressed={slot.isOpen}
                aria-label={`${slot.time} ${slot.isBooked ? 'תפוס' : slot.isOpen ? 'פתוח' : 'סגור'}`}
                onClick={() => toggleSlot(slot)}
                className={cn(
                  'rounded-full py-2 text-sm tabular-nums ring-1 transition',
                  slot.isBooked && 'bg-flower-bloom/70 text-forest-moss ring-flower-bloom',
                  !slot.isBooked && slot.isOpen && 'bg-stream-blue text-primary ring-stream-blue hover:bg-forest-moss',
                  !slot.isBooked && !slot.isOpen && 'bg-primary/70 text-forest-moss/50 line-through ring-stream-aqua/40 hover:bg-river-mist',
                )}
              >
                {slot.time}
              </button>
            ))}
          </div>

          {slots.length > 0 && <p className="text-xs text-forest-moss/60">ירוק: פתוח · מחוק: סגור · ורוד: תפוס. לחיצה על שעה מחליפה את המצב.</p>}

          <form onSubmit={addCustom} className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="הוספת שעה ביום הזה">
                <input type="time" required dir="ltr" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className={fieldClasses} />
              </Field>
            </div>
            <button type="submit" aria-label="הוספת השעה" className={cn(primaryButton, 'px-3.5')}>
              <Plus className="h-5 w-5" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

function WeekEditor({ schedule, run }: { schedule: Schedule; run: (change: () => Promise<void>) => void }) {
  const [workDays, setWorkDays] = useState(schedule.workDays)
  const [windows, setWindows] = useState(schedule.windows)

  const toggleDay = (day: number) =>
    setWorkDays(workDays.includes(day) ? workDays.filter((d) => d !== day) : [...workDays, day].sort())
  const editWindow = (index: number, change: Partial<TimeWindow>) =>
    setWindows(windows.map((w, i) => (i === index ? { ...w, ...change } : w)))

  const isValid = windows.every((w) => w.start < w.end)

  return (
    <section className={card}>
      <h2 className={heading}>השבוע הקבוע</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {WEEKDAY_NAMES.map((name, day) => (
          <button
            key={name}
            type="button"
            aria-pressed={workDays.includes(day)}
            onClick={() => toggleDay(day)}
            className={cn(
              'rounded-full px-4 py-2 text-sm ring-1 transition',
              workDays.includes(day) ? 'bg-stream-blue text-primary ring-stream-blue' : 'bg-primary/70 text-forest-moss ring-stream-aqua/40 hover:bg-river-mist',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {windows.map((window, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <Field label={i === 0 ? 'בוקר: התחלה' : 'ערב: התחלה'}>
              <input type="time" required dir="ltr" value={window.start} onChange={(e) => editWindow(i, { start: e.target.value })} className={fieldClasses} />
            </Field>
            <Field label="סיום">
              <input type="time" required dir="ltr" value={window.end} onChange={(e) => editWindow(i, { end: e.target.value })} className={fieldClasses} />
            </Field>
          </div>
        ))}
      </div>

      <button type="button" disabled={!isValid} onClick={() => run(() => saveWeek(workDays, windows))} className={cn(primaryButton, 'mt-5')}>
        שמירת השבוע
      </button>
    </section>
  )
}

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [problem, setProblem] = useState<string | null>(null)
  const [today] = useState(() => clinicToday(new Date()))

  const refresh = useCallback(async () => {
    const [nextSchedule, nextBookings] = await Promise.all([loadSchedule(), loadBookings()])
    setSchedule(nextSchedule)
    setBookings(nextBookings)
  }, [])

  const run = useCallback(
    async (change: () => Promise<void>) => {
      setProblem(null)
      try {
        await change()
        await refresh()
      } catch {
        setProblem('השינוי לא נשמר. נסו שוב.')
      }
    },
    [refresh],
  )

  useEffect(() => {
    refresh().catch(() => setProblem('לא הצלחנו לטעון את היומן.'))
  }, [refresh])

  const release = (booking: Booking) => {
    if (window.confirm(`לשחרר את המועד של ${booking.name}? השעה תיפתח שוב ללקוחות.`)) run(() => releaseBooking(booking.id))
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-light">ניהול היומן</h1>
        <div className="flex items-center gap-2">
          <a href="#top" className={quietButton}>
            לאתר
          </a>
          <button type="button" onClick={onSignOut} className={cn(quietButton, 'inline-flex items-center gap-1.5')}>
            <LogOut className="h-4 w-4" aria-hidden />
            יציאה
          </button>
        </div>
      </header>

      <p role="status" aria-live="polite" className="min-h-5 text-sm text-bark-toned">
        {problem}
      </p>

      {schedule && (
        <>
          <BookingsList bookings={bookings} onRelease={release} />
          <DayManager schedule={schedule} today={today} run={run} />
          <WeekEditor schedule={schedule} run={run} />
        </>
      )}
    </>
  )
}

export default function AdminPanel() {
  const [state, setState] = useState<'checking' | 'signedOut' | 'signedIn'>('checking')

  useEffect(() => {
    if (!scheduleConfigured()) return
    isAdminSession().then(
      (admin) => setState(admin ? 'signedIn' : 'signedOut'),
      () => setState('signedOut'),
    )
  }, [])

  if (!scheduleConfigured()) {
    return (
      <Page>
        <section className={cn(card, 'mx-auto mt-16 max-w-md')}>
          <h1 className={heading}>ניהול היומן עדיין לא מחובר</h1>
          <p className="mt-2 text-forest-moss/75">צריך לחבר את Supabase לפי ההוראות ב־README.</p>
        </section>
      </Page>
    )
  }

  return (
    <Page>
      {state === 'signedIn' && (
        <Dashboard
          onSignOut={() => {
            signOut()
            setState('signedOut')
          }}
        />
      )}
      {state === 'signedOut' && <LoginForm onSignedIn={() => setState('signedIn')} />}
    </Page>
  )
}
